type CacheEntry = { data: any; timestamp: number };

const TTL = 60_000;
const MAX_ENTRIES = 50;
const cache = new Map<string, CacheEntry>();

export function catalogCacheGet(key: string): any | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > TTL) {
    cache.delete(key);
    return null;
  }
  cache.delete(key);
  cache.set(key, entry);
  return entry.data;
}

export function catalogCacheSet(key: string, data: any): void {
  cache.delete(key);
  cache.set(key, { data, timestamp: Date.now() });
  if (cache.size > MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value as string | undefined;
    if (oldestKey) cache.delete(oldestKey);
  }
}

export function catalogCacheInvalidate(): void {
  cache.clear();
}
