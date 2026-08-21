// Simple in-memory cache to avoid repeated RPC calls on navigation.
const cache = new Map<string, { data: unknown; timestamp: number }>();
const TTL = 30_000; // 30 seconds

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCache<T>(key: string, data: T) {
  cache.set(key, { data, timestamp: Date.now() });
}

export function clearCache(prefix?: string) {
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

const inflight = new Map<string, Promise<unknown>>();

/**
 * One request per key at a time, one result per TTL.
 *
 * The same figures are read by several components at once — six copies of the wallet
 * hook were live on one screen, each firing its own DAS call and its own price query.
 * The duplicates cost nothing useful and everything expensive: they are what pushes
 * the price API into rate-limiting us, and a rate-limited price round used to render
 * as "$0.00 free to use". Callers keep their own `useState`; this only makes sure the
 * network sees one of each.
 */
export function once<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = getCached<T>(key);
  if (hit !== null) return Promise.resolve(hit);

  const running = inflight.get(key) as Promise<T> | undefined;
  if (running) return running;

  const started = load()
    .then((data) => {
      setCache(key, data);
      return data;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, started);
  return started;
}
