/**
 * HTTP wrapper that composes cache, retry, rate limit, and optional timeout
 * in a best-practice order:
 *
 * 1. Check cache first — return immediately if response is fresh (no rate limit or request).
 * 2. Retry wrapper — on failure, retry (each attempt goes through rate limit again).
 * 3. Rate limit (optional) — take a ticket and wait; when it's our turn, proceed.
 * 4. Before executing the run function — check cache again (may have been updated while waiting).
 * 5. Run — execute the actual request; on success, store in cache.
 *
 * Timeout (if set) applies only to the actual `run()` call, not cache checks or queue wait.
 */

import { Cache, CacheOptions } from './cache';
import { RateLimiter } from './rateLimiter';
import { RetryOptions, withRetry } from './retry';

function withTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error(`HTTP wrapper call timed out after ${timeoutMs}ms`)),
      timeoutMs
    );
    fn().then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

/** Result shape used by API calls: either data or error. */
export interface DataOrError<T> {
  data: T | null;
  error: string | null;
}

/** Options for creating an http wrapper. */
export interface HttpWrapperOptions<T> {
  /** Cache instance or options to create one. If omitted, no caching (still retries). */
  cache?: Cache<T> | CacheOptions;
  /** Rate limiter instance. If omitted, attempts run immediately (timeout still applies if set). */
  rateLimiter?: RateLimiter;
  /** Retry options. */
  retry: RetryOptions<DataOrError<T>>;
  /** Optional timeout in ms for each `run()` invocation. */
  timeoutMs?: number;
}

/**
 * Builds a wrapped function that:
 * - Returns cached data if fresh
 * - Retries on failure (each attempt goes through rate limit)
 * - Optionally respects rate limit (one slot per run)
 * - Re-checks cache before running (in case cache was filled while waiting)
 * - Runs the given loader and caches successful results
 *
 * @param options - Cache, optional rate limiter, retry, and optional timeout
 * @param run - The actual request: () => Promise<{ data: T | null; error: string | null }>
 * @returns Promise with data or error
 */
export async function httpWrapper<T>(
  options: HttpWrapperOptions<T>,
  run: () => Promise<DataOrError<T>>
): Promise<DataOrError<T>> {
  const { rateLimiter, retry, timeoutMs } = options;
  const cache: Cache<T> | null =
    options.cache instanceof Cache
      ? options.cache
      : options.cache != null
        ? new Cache<T>(options.cache)
        : null;

  // 1. First cache check — avoid rate limit and request if we have fresh data
  if (cache) {
    const cached = cache.get();
    if (cached !== null) {
      return { data: cached, error: null };
    }
  }

  const executeAttempt = async (): Promise<DataOrError<T>> => {
    // 4. Before executing: check cache again (may have been updated while waiting)
    if (cache) {
      const cachedAgain = cache.get();
      if (cachedAgain !== null) {
        return { data: cachedAgain, error: null };
      }
    }

    // 5. Run the actual request (timeout applies only to this call)
    const result =
      timeoutMs != null
        ? await withTimeout(run, timeoutMs)
        : await run();
    if (result.data !== null && cache) {
      cache.set(result.data);
    }
    return result;
  };

  const runAttempt = (): Promise<DataOrError<T>> =>
    rateLimiter ? rateLimiter.run(executeAttempt) : executeAttempt();

  // 2. Retry wraps 3–5; each retry gets a new rate-limit ticket when a limiter is used
  return withRetry(runAttempt, retry);
}

/**
 * Creates a reusable wrapper with fixed cache, rate limiter, and retry options.
 * Use when making many calls with the same options (e.g. same API rate limiter and retry policy).
 *
 * @example
 * const wrapped = createHttpWrapper({
 *   cache: new Cache({ storageKey: 'my-key', maxStalenessMs: 60_000 }),
 *   rateLimiter: myLimiter,
 *   retry: { maxRetries: 3, isSuccess: r => r.error === null },
 * });
 * const result = await wrapped(() => fetchFromApi(params));
 */
export function createHttpWrapper<T>(
  options: HttpWrapperOptions<T>
): (run: () => Promise<DataOrError<T>>) => Promise<DataOrError<T>> {
  return (run) => httpWrapper(options, run);
}
