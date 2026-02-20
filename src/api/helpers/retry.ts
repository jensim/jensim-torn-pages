/**
 * Retry mechanism for rate-limited API calls.
 * Wraps a function that goes through a rate limiter. On failure, the retry
 * calls the function again, so it acquires a new ticket and goes to the back
 * of the rate limiter queue.
 */

export interface RetryOptions<T> {
  /** Maximum number of retries (total attempts = maxRetries + 1). */
  maxRetries: number;
  /**
   * If provided, a result is considered success only when this returns true.
   * Otherwise any resolved value is success. Use for result types like
   * { data: T | null, error: string | null } with (r) => r.error == null.
   */
  isSuccess?: (value: T) => boolean;
}

/**
 * Runs fn up to maxRetries+1 times. On failure (throw or isSuccess false),
 * retries by calling fn again—so when fn is a rate-limited call, each retry
 * goes through the rate limiter and ends up last in line.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions<T>
): Promise<T> {
  const { maxRetries, isSuccess } = options;
  let lastResult: T | undefined;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      if (isSuccess && !isSuccess(result)) {
        lastResult = result;
        if (attempt < maxRetries) continue;
        return lastResult;
      }
      return result;
    } catch (e) {
      lastError = e;
      if (attempt >= maxRetries) throw e;
    }
  }

  throw lastError;
}
