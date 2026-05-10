type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

const store = new Map<string, CacheEntry<unknown>>();

export function cached<T>(key: string, ttlMs: number, factory: () => Promise<T>): Promise<T> {
  const entry = store.get(key);
  if (entry && entry.expiresAt > Date.now()) {
    return Promise.resolve(entry.data as T);
  }

  return factory().then((data) => {
    store.set(key, { data, expiresAt: Date.now() + ttlMs });
    return data;
  });
}

export function invalidateCache(prefix: string) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key);
    }
  }
}
