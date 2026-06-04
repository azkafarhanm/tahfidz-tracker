import assert from "node:assert/strict";
import { afterEach, test } from "vitest";
import {
  cached,
  clearCache,
  getCacheSize,
  invalidateStudentRelatedCaches,
} from "./cache";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

afterEach(() => {
  delete process.env.APP_MEMORY_CACHE_MAX_ENTRIES;
  clearCache();
});

test("cached de-duplicates concurrent misses", async () => {
  let calls = 0;

  const [first, second] = await Promise.all([
    cached("same-key", 1_000, async () => {
      calls += 1;
      await delay(10);
      return calls;
    }),
    cached("same-key", 1_000, async () => {
      calls += 1;
      return calls;
    }),
  ]);

  assert.equal(first, 1);
  assert.equal(second, 1);
  assert.equal(calls, 1);
});

test("cached refreshes expired entries", async () => {
  let calls = 0;

  const first = await cached("short-lived", 1, async () => {
    calls += 1;
    return calls;
  });

  await delay(5);

  const second = await cached("short-lived", 1_000, async () => {
    calls += 1;
    return calls;
  });

  assert.equal(first, 1);
  assert.equal(second, 2);
});

test("cached treats undefined values as cache hits", async () => {
  let calls = 0;

  await cached("undefined-value", 1_000, async () => {
    calls += 1;
    return undefined;
  });
  await cached("undefined-value", 1_000, async () => {
    calls += 1;
    return undefined;
  });

  assert.equal(calls, 1);
});

test("cached evicts oldest entries when the cache reaches its limit", async () => {
  process.env.APP_MEMORY_CACHE_MAX_ENTRIES = "2";

  await cached("one", 1_000, async () => 1);
  await cached("two", 1_000, async () => 2);
  await cached("three", 1_000, async () => 3);

  assert.equal(getCacheSize(), 2);
});

test("cached does not restore stale data after an invalidated pending fill resolves", async () => {
  let resolvePending!: (value: number) => void;
  const pending = cached(
    "formative-detail:student-1:teacher:GANJIL:2025/2026:id",
    1_000,
    () => new Promise<number>((resolve) => {
      resolvePending = resolve;
    }),
  );

  invalidateStudentRelatedCaches("student-1");
  resolvePending(1);

  assert.equal(await pending, 1);
  assert.equal(getCacheSize(), 0);

  const fresh = await cached(
    "formative-detail:student-1:teacher:GANJIL:2025/2026:id",
    1_000,
    async () => 2,
  );

  assert.equal(fresh, 2);
});

test("invalidateStudentRelatedCaches clears student and quick-log caches", async () => {
  await cached("students:list:teacher:id::1:12", 1_000, async () => 1);
  await cached("quick-log-students:teacher", 1_000, async () => 2);
  await cached("summative-detail:student-1:teacher:GENAP:2025/2026:id", 1_000, async () => 3);
  await cached("unrelated", 1_000, async () => 3);

  invalidateStudentRelatedCaches("student-1");

  assert.equal(getCacheSize(), 1);
});
