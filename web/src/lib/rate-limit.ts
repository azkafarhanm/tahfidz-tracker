import { Redis } from "@upstash/redis";

type RateLimitOptions = {
  limit: number;
  windowMs: number;
  blockMs: number;
};

type RateLimitState = {
  count: number;
  windowStartedAt: number;
  blockedUntil: number;
};

type RateLimitStatus = {
  allowed: boolean;
  retryAfterMs: number;
};

const PREFIX = "rl:";

function getRedis(): Redis | null {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const localStore = new Map<string, RateLimitState>();

function now() {
  return Date.now();
}

function keyWithPrefix(key: string) {
  return `${PREFIX}${key}`;
}

function normalizeState(state: RateLimitState | null, options: RateLimitOptions, at: number): RateLimitState {
  if (!state) {
    return { count: 0, windowStartedAt: at, blockedUntil: 0 };
  }

  if (state.blockedUntil > 0 && state.blockedUntil <= at) {
    state.count = 0;
    state.windowStartedAt = at;
    state.blockedUntil = 0;
    return state;
  }

  if (at - state.windowStartedAt >= options.windowMs) {
    state.count = 0;
    state.windowStartedAt = at;
  }

  return state;
}

export async function checkRateLimit(key: string, options: RateLimitOptions): Promise<RateLimitStatus> {
  const at = now();
  const redis = getRedis();
  const fullKey = keyWithPrefix(key);

  if (redis) {
    try {
      const raw = await redis.get<RateLimitState>(fullKey);
      const state = normalizeState(raw, options, at);
      if (state.blockedUntil > at) {
        return { allowed: false, retryAfterMs: state.blockedUntil - at };
      }
      return { allowed: true, retryAfterMs: 0 };
    } catch {
      // fall through to local
    }
  }

  const local = localStore.get(fullKey);
  if (local && local.blockedUntil <= at && at - local.windowStartedAt >= 24 * 60 * 60_000) {
    localStore.delete(fullKey);
    return { allowed: true, retryAfterMs: 0 };
  }

  const state = normalizeState(local ?? null, options, at);
  if (!local) localStore.set(fullKey, state);

  if (state.blockedUntil > at) {
    return { allowed: false, retryAfterMs: state.blockedUntil - at };
  }
  return { allowed: true, retryAfterMs: 0 };
}

export async function registerRateLimitFailure(key: string, options: RateLimitOptions): Promise<RateLimitStatus> {
  const at = now();
  const redis = getRedis();
  const fullKey = keyWithPrefix(key);

  if (redis) {
    try {
      const raw = await redis.get<RateLimitState>(fullKey);
      const state = normalizeState(raw, options, at);

      state.count += 1;

      if (state.count >= options.limit) {
        state.blockedUntil = at + options.blockMs;
        await redis.set(fullKey, state, { ex: Math.ceil(options.blockMs / 1000) + 60 });
        return { allowed: false, retryAfterMs: options.blockMs };
      }

      await redis.set(fullKey, state, { ex: Math.ceil(options.windowMs / 1000) + 60 });
      return { allowed: true, retryAfterMs: 0 };
    } catch {
      // fall through to local
    }
  }

  let local = localStore.get(fullKey);
  if (local && local.blockedUntil <= at && at - local.windowStartedAt >= 24 * 60 * 60_000) {
    localStore.delete(fullKey);
    local = undefined;
  }

  const state = normalizeState(local ?? null, options, at);
  if (!local) localStore.set(fullKey, state);

  state.count += 1;

  if (state.count >= options.limit) {
    state.blockedUntil = at + options.blockMs;
    return { allowed: false, retryAfterMs: options.blockMs };
  }

  return { allowed: true, retryAfterMs: 0 };
}

export async function clearRateLimit(key: string) {
  const fullKey = keyWithPrefix(key);
  localStore.delete(fullKey);

  const redis = getRedis();
  if (redis) {
    try {
      await redis.del(fullKey);
    } catch {
      // ignore
    }
  }
}

export function getClientAddress(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstAddress = forwardedFor.split(",")[0]?.trim();
    if (firstAddress) {
      return firstAddress;
    }
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

if (typeof globalThis !== "undefined" && typeof (globalThis as Record<string, unknown>)._rateLimitInterval === "undefined") {
  (globalThis as Record<string, unknown>)._rateLimitInterval = setInterval(() => {
    const at = now();
    for (const [key, state] of localStore) {
      if (state.blockedUntil > at) continue;
      if (at - state.windowStartedAt >= 24 * 60 * 60_000) {
        localStore.delete(key);
      }
    }
  }, 10 * 60_000);

  ((globalThis as Record<string, unknown>)._rateLimitInterval as NodeJS.Timeout).unref?.();
}
