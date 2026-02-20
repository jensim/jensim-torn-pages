/**
 * localStorage-backed cache for API responses (or any JSON-serializable value).
 * Successful responses are stored with a timestamp; entries older than
 * maxStalenessMs are treated as stale. Use around retry + rate limiter so
 * cached responses are returned without going through the queue.
 */

export interface CacheOptions<T> {
  /** localStorage key for this cache. */
  storageKey: string;
  /** Max age in ms. Entries older than this are considered stale and not returned. */
  maxStalenessMs: number;
}

interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

export class Cache<T> {
  private readonly storageKey: string;
  private readonly maxStalenessMs: number;

  constructor(options: CacheOptions<T>) {
    this.storageKey = options.storageKey;
    this.maxStalenessMs = options.maxStalenessMs;
  }

  /**
   * Returns the cached value if present and not stale, otherwise null.
   */
  get(): T | null {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return null;
      const entry: CacheEntry<T> = JSON.parse(raw);
      const now = Date.now();
      if (now - entry.timestamp > this.maxStalenessMs) return null;
      return entry.value;
    } catch {
      return null;
    }
  }

  /**
   * Stores a value with the current timestamp. Call after a successful API response.
   */
  set(value: T): void {
    try {
      const entry: CacheEntry<T> = { value, timestamp: Date.now() };
      localStorage.setItem(this.storageKey, JSON.stringify(entry));
    } catch (error) {
      console.error(`Error writing cache "${this.storageKey}":`, error);
    }
  }

  /**
   * Returns cached value if fresh; otherwise runs the loader. On successful
   * load, stores the result. Use for result types like
   * { data: T | null, error: string | null }: only stores when data is non-null.
   */
  async getOrLoad(
    load: () => Promise<{ data: T | null; error: string | null }>
  ): Promise<{ data: T | null; error: string | null }> {
    const cached = this.get();
    if (cached !== null) {
      return { data: cached, error: null };
    }
    const result = await load();
    if (result.data !== null) {
      this.set(result.data);
    }
    return result;
  }
}
