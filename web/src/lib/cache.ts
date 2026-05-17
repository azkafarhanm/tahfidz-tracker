type CacheEntry<T> = {
  data?: T;
  promise?: Promise<T>;
  expiresAt: number;
};

const store = new Map<string, CacheEntry<unknown>>();
const DEFAULT_MAX_ENTRIES = 500;

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
  for (const [key, entry] of store) {
    if (entry.expiresAt <= now) {
      store.delete(key);
    }
  }
}

setInterval(sweep, 60_000).unref();

function evictOldestEntries() {
  const maxEntries = getMaxEntries();
  while (store.size > maxEntries) {
    const oldestKey = store.keys().next().value;
    if (oldestKey === undefined) return;
    store.delete(oldestKey);
  }
}

export function cached<T>(key: string, ttlMs: number, factory: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const entry = store.get(key);

  if (entry && entry.expiresAt > now) {
    if ("data" in entry) {
      return Promise.resolve(entry.data as T);
    }

    if (entry.promise) {
      return entry.promise as Promise<T>;
    }
  } else if (entry) {
    store.delete(key);
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
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key);
    }
  }
}

export function clearCache() {
  store.clear();
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
