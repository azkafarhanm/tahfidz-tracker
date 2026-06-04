import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  checkRateLimit,
  clearRateLimit,
  registerRateLimitFailure,
} from "@/lib/rate-limit";

const OPTIONS = {
  limit: 3,
  windowMs: 60_000,
  blockMs: 120_000,
};

describe("rate-limit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
  });

  afterEach(async () => {
    await clearRateLimit("login:test");
    vi.useRealTimers();
  });

  it("blocks after the configured number of failures", async () => {
    expect((await checkRateLimit("login:test", OPTIONS)).allowed).toBe(true);
    expect((await registerRateLimitFailure("login:test", OPTIONS)).allowed).toBe(true);
    expect((await registerRateLimitFailure("login:test", OPTIONS)).allowed).toBe(true);

    const blocked = await registerRateLimitFailure("login:test", OPTIONS);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBe(OPTIONS.blockMs);
    expect((await checkRateLimit("login:test", OPTIONS)).allowed).toBe(false);
  });

  it("resets once the block window passes", async () => {
    await registerRateLimitFailure("login:test", OPTIONS);
    await registerRateLimitFailure("login:test", OPTIONS);
    await registerRateLimitFailure("login:test", OPTIONS);

    vi.advanceTimersByTime(OPTIONS.blockMs + 1);

    expect((await checkRateLimit("login:test", OPTIONS)).allowed).toBe(true);
  });
});
