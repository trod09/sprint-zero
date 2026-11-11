/**
 * A small least-recently-used cache. Server code that keeps anything per
 * request parameter (a case id, a client) must use a bounded cache: ids such
 * as `gen-<module>-<industry>-<level>-<seed>` are chosen by the browser, so an
 * unbounded Map would let anyone fill the server's memory.
 */
export interface LruCache<K, V> {
  get(key: K): V | undefined;
  set(key: K, value: V): void;
  readonly size: number;
}

export function createLruCache<K, V>(maxEntries: number): LruCache<K, V> {
  if (!Number.isInteger(maxEntries) || maxEntries < 1) {
    throw new Error("An LRU cache needs room for at least one entry");
  }
  // A Map iterates in insertion order, so the first key is the oldest one.
  const entries = new Map<K, V>();
  return {
    get(key) {
      if (!entries.has(key)) return undefined;
      const value = entries.get(key) as V;
      entries.delete(key);
      entries.set(key, value);
      return value;
    },
    set(key, value) {
      entries.delete(key);
      entries.set(key, value);
      while (entries.size > maxEntries) {
        entries.delete(entries.keys().next().value as K);
      }
    },
    get size() {
      return entries.size;
    },
  };
}
