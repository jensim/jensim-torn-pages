/**
 * Torn API User Basic Service
 * Provides functions for fetching user basic data from the Torn API v2
 */

// Type definitions for the Torn User Basic API response
export interface UserStatus {
  description: string;
  details: string;
  state: string;
  color: string;
  until: number;
}

export interface UserProfile {
  id: number;
  name: string;
  level: number;
  gender: string;
  status: UserStatus;
}

export interface UserBasicResponse {
  profile: UserProfile;
}

export interface UserBasicError {
  error: {
    code: number;
    error: string;
  };
}

export interface FetchUserBasicParams {
  apiKey: string;
  targetId: number | string;
}

export interface FetchUserBasicResult {
  data: UserBasicResponse | null;
  error: string | null;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

const BASE_URL = 'https://api.torn.com/v2/user';

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

/**
 * Checks if an error should be retried
 * @param status - HTTP status code
 * @param error - Error object
 * @returns Whether the request should be retried
 */
function shouldRetry(status?: number, error?: Error): boolean {
  // Retry on network errors
  if (error && error.message) {
    const message = error.message.toLowerCase();
    if (
      message.includes('fetch') ||
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('econnrefused') ||
      message.includes('etimedout')
    ) {
      return true;
    }
  }

  // Retry on specific HTTP status codes
  if (status !== undefined) {
    // Retry on rate limit (429) and server errors (500-503)
    return status === 429 || status === 500 || status === 502 || status === 503;
  }

  return false;
}

/**
 * Sleeps for a specified duration
 * @param ms - Milliseconds to sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Rate limiter for Torn API calls
 * Implements a sliding window rate limiter with max 10 calls per second
 */
class RateLimiter {
  private callTimestamps: number[] = [];
  private readonly maxCallsPerSecond: number;
  private readonly windowMs: number;

  constructor(maxCallsPerSecond: number = 10) {
    this.maxCallsPerSecond = maxCallsPerSecond;
    this.windowMs = 1000; // 1 second window
  }

  /**
   * Waits if necessary to respect the rate limit before proceeding
   */
  async waitForSlot(): Promise<void> {
    const now = Date.now();
    
    // Remove timestamps older than 1 second
    this.callTimestamps = this.callTimestamps.filter(
      timestamp => now - timestamp < this.windowMs
    );

    // If we've made max calls in the last second, wait
    if (this.callTimestamps.length >= this.maxCallsPerSecond) {
      const oldestCall = this.callTimestamps[0];
      const waitTime = this.windowMs - (now - oldestCall) + 1; // +1ms buffer
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      // Clean up old timestamps again after waiting
      const afterWait = Date.now();
      this.callTimestamps = this.callTimestamps.filter(
        timestamp => afterWait - timestamp < this.windowMs
      );
    }

    // Record this call
    this.callTimestamps.push(Date.now());
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter(10);

/**
 * Fetches basic user information from the Torn API v2
 * @param params - Parameters including API key and target user ID
 * @returns Promise containing the user basic data or error
 */
export async function fetchUserBasic(
  params: FetchUserBasicParams,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<FetchUserBasicResult> {
  const { apiKey, targetId } = params;

  if (!apiKey || apiKey.trim() === '') {
    return {
      data: null,
      error: 'API key is required',
    };
  }

  if (!targetId) {
    return {
      data: null,
      error: 'Target user ID is required',
    };
  }

  let lastError: string | null = null;
  let lastStatus: number | undefined;
  
  // Attempt the request with retries
  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      // Wait for rate limiter before making the call
      await rateLimiter.waitForSlot();
      
      const url = `${BASE_URL}/${targetId}/basic?striptags=true`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `ApiKey ${apiKey}`,
        },
      });

      lastStatus = response.status;

      if (!response.ok) {
        lastError = `HTTP error! status: ${response.status}`;
        
        // Check if we should retry this error
        if (shouldRetry(response.status) && attempt < retryConfig.maxRetries) {
          const delay = Math.min(
            retryConfig.initialDelayMs * Math.pow(retryConfig.backoffMultiplier, attempt),
            retryConfig.maxDelayMs
          );
          await sleep(delay);
          continue;
        }
        
        return {
          data: null,
          error: lastError,
        };
      }

      const data = await response.json();

      // Check if the response is an error
      if ('error' in data && data.error) {
        const errorData = data as UserBasicError;
        return {
          data: null,
          error: `Torn API Error (${errorData.error.code}): ${errorData.error.error}`,
        };
      }

      return {
        data: data as UserBasicResponse,
        error: null,
      };
    } catch (error) {
      if (error instanceof Error) {
        lastError = `Failed to fetch user basic info: ${error.message}`;
        
        // Check if we should retry this error
        if (shouldRetry(lastStatus, error) && attempt < retryConfig.maxRetries) {
          const delay = Math.min(
            retryConfig.initialDelayMs * Math.pow(retryConfig.backoffMultiplier, attempt),
            retryConfig.maxDelayMs
          );
          await sleep(delay);
          continue;
        }
      } else {
        lastError = 'Failed to fetch user basic info: Unknown error';
      }
      
      // If we've exhausted retries or shouldn't retry, return the error
      if (attempt >= retryConfig.maxRetries || !shouldRetry(lastStatus, error as Error)) {
        return {
          data: null,
          error: lastError,
        };
      }
    }
  }

  return {
    data: null,
    error: lastError || 'Failed to fetch user basic info after retries',
  };
}

/**
 * Fetches basic information for multiple users
 * @param apiKey - Torn API key
 * @param targetIds - Array of target user IDs
 * @param onProgress - Optional callback for progress updates
 * @param retryConfig - Optional retry configuration
 * @returns Promise containing all user data or error
 */
export async function fetchMultipleUsersBasic(
  apiKey: string,
  targetIds: (number | string)[],
  onProgress?: (current: number, total: number) => void,
  retryConfig?: RetryConfig
): Promise<{ data: UserBasicResponse[]; error: string | null }> {
  const results: UserBasicResponse[] = [];
  const errors: string[] = [];

  for (let i = 0; i < targetIds.length; i++) {
    const result = await fetchUserBasic({ apiKey, targetId: targetIds[i] }, retryConfig);

    if (result.error) {
      errors.push(`User ${targetIds[i]}: ${result.error}`);
    } else if (result.data) {
      results.push(result.data);
    }

    // Call progress callback if provided
    if (onProgress) {
      onProgress(i + 1, targetIds.length);
    }
  }

  if (errors.length > 0 && results.length === 0) {
    return {
      data: [],
      error: errors.join('; '),
    };
  }

  return {
    data: results,
    error: errors.length > 0 ? errors.join('; ') : null,
  };
}
