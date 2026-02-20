/**
 * Ticket-based rate limiter for API calls.
 * One request is processed at a time; after it finishes, a cooldown (default 250ms)
 * must pass before the next request may start. Each call to run() takes a ticket
 * and is processed in order. Instantiate per API so different APIs can have
 * independent limits.
 */

export interface RateLimiterOptions {
  /** Milliseconds that must pass after a request completes before the next may start. Default 250. */
  cooldownMs?: number;
}

export class RateLimiter {
  private readonly cooldownMs: number;
  private queue: Array<() => Promise<unknown>> = [];
  private cooldownUntil = 0;
  private isProcessing = false;

  constructor(options: RateLimiterOptions = {}) {
    this.cooldownMs = options.cooldownMs ?? 250;
  }

  /**
   * Run a single request through the limiter. Takes a ticket; when it's your turn,
   * the function is run. After it completes (success or failure), the cooldown
   * runs before the next request in line may start.
   */
  run<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const thunk = async (): Promise<T> => {
        try {
          const result = await fn();
          resolve(result);
          return result;
        } catch (e) {
          reject(e);
          throw e;
        }
      };
      this.queue.push(thunk);
      this.processQueue();
    });
  }

  private processQueue(): void {
    if (this.queue.length === 0) return;
    if (this.isProcessing) return;
    const now = Date.now();
    if (now < this.cooldownUntil) {
      const waitMs = this.cooldownUntil - now;
      setTimeout(() => this.processQueue(), waitMs);
      return;
    }
    this.isProcessing = true;
    const next = this.queue.shift()!;
    next().finally(() => {
      this.cooldownUntil = Date.now() + this.cooldownMs;
      this.isProcessing = false;
      setTimeout(() => this.processQueue(), this.cooldownMs);
    });
  }
}
