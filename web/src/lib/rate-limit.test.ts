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
  });

  afterEach(() => {
    clearRateLimit("login:test");
    vi.useRealTimers();
  });

  it("blocks after the configured number of failures", () => {
    expect(checkRateLimit("login:test", OPTIONS).allowed).toBe(true);
    expect(registerRateLimitFailure("login:test", OPTIONS).allowed).toBe(true);
    expect(registerRateLimitFailure("login:test", OPTIONS).allowed).toBe(true);

    const blocked = registerRateLimitFailure("login:test", OPTIONS);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBe(OPTIONS.blockMs);
    expect(checkRateLimit("login:test", OPTIONS).allowed).toBe(false);
  });

  it("resets once the block window passes", () => {
    registerRateLimitFailure("login:test", OPTIONS);
    registerRateLimitFailure("login:test", OPTIONS);
    registerRateLimitFailure("login:test", OPTIONS);

    vi.advanceTimersByTime(OPTIONS.blockMs + 1);

    expect(checkRateLimit("login:test", OPTIONS).allowed).toBe(true);
  });
});
