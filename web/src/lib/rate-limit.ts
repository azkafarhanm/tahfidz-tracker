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

const store = new Map<string, RateLimitState>();

function now() {
  return Date.now();
}

function getState(key: string, at = now()) {
  const state = store.get(key);

  if (!state) {
    return null;
  }

  if (state.blockedUntil <= at && at - state.windowStartedAt >= 24 * 60 * 60_000) {
    store.delete(key);
    return null;
  }

  return state;
}

function normalizeState(key: string, options: RateLimitOptions, at = now()) {
  const existing = getState(key, at);

  if (!existing) {
    const nextState: RateLimitState = {
      count: 0,
      windowStartedAt: at,
      blockedUntil: 0,
    };
    store.set(key, nextState);
    return nextState;
  }

  if (existing.blockedUntil > 0 && existing.blockedUntil <= at) {
    existing.count = 0;
    existing.windowStartedAt = at;
    existing.blockedUntil = 0;
    return existing;
  }

  if (at - existing.windowStartedAt >= options.windowMs) {
    existing.count = 0;
    existing.windowStartedAt = at;
  }

  return existing;
}

export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitStatus {
  const state = normalizeState(key, options);
  const at = now();

  if (state.blockedUntil > at) {
    return {
      allowed: false,
      retryAfterMs: state.blockedUntil - at,
    };
  }

  return {
    allowed: true,
    retryAfterMs: 0,
  };
}

export function registerRateLimitFailure(key: string, options: RateLimitOptions): RateLimitStatus {
  const state = normalizeState(key, options);
  const at = now();

  if (state.blockedUntil > at) {
    return {
      allowed: false,
      retryAfterMs: state.blockedUntil - at,
    };
  }

  state.count += 1;

  if (state.count >= options.limit) {
    state.blockedUntil = at + options.blockMs;
    return {
      allowed: false,
      retryAfterMs: options.blockMs,
    };
  }

  return {
    allowed: true,
    retryAfterMs: 0,
  };
}

export function clearRateLimit(key: string) {
  store.delete(key);
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

setInterval(() => {
  const at = now();
  for (const [key, state] of store) {
    if (state.blockedUntil > at) {
      continue;
    }

    if (at - state.windowStartedAt >= 24 * 60 * 60_000) {
      store.delete(key);
    }
  }
}, 10 * 60_000).unref();
