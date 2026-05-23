type CacheEntry<T> = {
  data?: T;
  promise?: Promise<T>;
  expiresAt: number;
};

const store = new Map<string, CacheEntry<unknown>>();
const DEFAULT_MAX_ENTRIES = 500;

const isDebug = process.env.NODE_ENV === "development" || process.env.APP_CACHE_DEBUG === "true";

function getMaxEntries() {
  const configured = Number.parseInt(
    process.env.APP_MEMORY_CACHE_MAX_ENTRIES ?? "",
    10,
  );
  return Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_MAX_ENTRIES;
}

function sweep() {
  const now = Date.now();
  let count = 0;
  for (const [key, entry] of store) {
    if (entry.expiresAt <= now) {
      store.delete(key);
      count++;
    }
  }
  if (isDebug && count > 0) {
    console.log(`[Cache SWEEP] Swept and evicted ${count} expired entries. (Current size: ${store.size})`);
  }
}

setInterval(sweep, 60_000).unref();

function evictOldestEntries() {
  const maxEntries = getMaxEntries();
  while (store.size > maxEntries) {
    const oldestKey = store.keys().next().value;
    if (oldestKey === undefined) return;
    store.delete(oldestKey);
    if (isDebug) {
      console.log(`[Cache EVICT] Evicted oldest entry: "${oldestKey}" to maintain max entries limit (${maxEntries})`);
    }
  }
}

export function cached<T>(key: string, ttlMs: number, factory: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const entry = store.get(key);

  if (entry && entry.expiresAt > now) {
    if (isDebug) {
      console.log(`[Cache HIT] key: "${key}"`);
    }
    if ("data" in entry) {
      return Promise.resolve(entry.data as T);
    }

    if (entry.promise) {
      return entry.promise as Promise<T>;
    }
  } else if (entry) {
    if (isDebug) {
      console.log(`[Cache EXPIRED] key: "${key}"`);
    }
    store.delete(key);
  } else {
    if (isDebug) {
      console.log(`[Cache MISS] key: "${key}"`);
    }
  }

  const promise = factory().then((data) => {
    store.set(key, { data, expiresAt: Date.now() + ttlMs });
    evictOldestEntries();
    return data;
  }).catch((error) => {
    const current = store.get(key);
    if (current?.promise === promise) {
      store.delete(key);
    }
    throw error;
  });

  store.set(key, { promise, expiresAt: now + ttlMs });
  evictOldestEntries();
  return promise;
}

export function invalidateCache(prefix: string) {
  let count = 0;
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key);
      count++;
    }
  }
  if (isDebug && count > 0) {
    console.log(`[Cache INVALIDATE] prefix: "${prefix}" matched and deleted ${count} entries. (Current size: ${store.size})`);
  }
}

export function clearCache() {
  const count = store.size;
  store.clear();
  if (isDebug) {
    console.log(`[Cache CLEAR] Cleared all ${count} cache entries.`);
  }
}

export function getCacheSize() {
  return store.size;
}

/**
 * Invalidates all caches that depend on student activity data.
 * Call this after any mutation that affects records, targets, or student state.
 */
export function invalidateStudentRelatedCaches(studentId?: string) {
  invalidateCache("admin-dashboard");
  invalidateCache("dashboard");
  invalidateCache("students");
  invalidateCache("formative-");
  invalidateCache("summative-");
  invalidateCache("report-admin");
  invalidateCache("report-teacher");
  if (studentId) {
    invalidateCache(`report-student:${studentId}`);
    invalidateCache(`summative-history:${studentId}`);
  } else {
    invalidateCache("report-student");
    invalidateCache("summative-history:");
  }
}
