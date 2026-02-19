/**
 * Torn API User Profile V1 Service
 * Fetches full user profile from Torn API v1 with retry, rate limit, and timeout.
 */

// Nested types for the Torn User Profile V1 API response
export interface UserProfileV1Life {
  current: number;
  maximum: number;
}

export interface UserProfileV1Status {
  description: string;
  details: string;
  state: string;
  color: string;
  until: number;
}

export interface UserProfileV1Job {
  job: string;
  position: string;
  company_id: number;
  company_name: string;
  company_type: number;
}

export interface UserProfileV1Faction {
  position: string;
  faction_id: number;
  days_in_faction: number;
  faction_name: string;
  faction_tag: string;
  faction_tag_image: string;
}

export interface UserProfileV1Married {
  spouse_id: number;
  spouse_name: string;
  duration: number;
}

export interface UserProfileV1LastAction {
  status: string;
  timestamp: number;
  relative: string;
}

export interface UserProfileV1Competition {
  name: string;
  status: string;
  current_hp: number;
  max_hp: number;
}

export interface UserProfileV1States {
  hospital_timestamp: number;
  jail_timestamp: number;
}

// Top-level profile type; nested objects optional where API may omit them
export interface UserProfileV1 {
  rank: string;
  level: number;
  honor: number;
  gender: string;
  property: string;
  signup: string;
  awards: number;
  friends: number;
  enemies: number;
  forum_posts: number;
  karma: number;
  age: number;
  role: string;
  donator: number;
  player_id: number;
  name: string;
  property_id: number;
  revivable: number;
  profile_image?: string;
  life: UserProfileV1Life;
  status: UserProfileV1Status;
  job?: UserProfileV1Job;
  faction?: UserProfileV1Faction;
  married?: UserProfileV1Married;
  basicicons?: Record<string, string>;
  states?: UserProfileV1States;
  last_action?: UserProfileV1LastAction;
  competition?: UserProfileV1Competition;
}

export interface UserProfileV1Error {
  error: {
    code: number;
    error: string;
  };
}

export interface FetchUserProfileV1Params {
  apiKey: string;
  userId: number | string;
}

export interface FetchUserProfileV1Result {
  data: UserProfileV1 | null;
  error: string | null;
}

/** Options for cached fetch. */
export interface FetchUserProfileV1CachedOptions {
  /** Max age of cache in ms. If the cached value is older, a fresh request is made. */
  maxAgeMs: number;
}

const BASE_URL = 'https://api.torn.com/user';
const CACHE_PREFIX = 'torn_user_profile_v1_';
const REQUEST_TIMEOUT_MS = 250;
const RATE_LIMIT_MS = 500;
const MAX_RETRIES = 3;

const DEFAULT_RETRY_CONFIG = {
  maxRetries: MAX_RETRIES,
  initialDelayMs: 500,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function shouldRetry(status?: number, error?: Error): boolean {
  if (error) {
    const name = (error as Error & { name?: string }).name;
    if (name === 'AbortError') return true;
    const message = (error.message || '').toLowerCase();
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
  if (status !== undefined) {
    return status === 429 || status === 500 || status === 502 || status === 503;
  }
  return false;
}

/**
 * Rate limiter: allows starting one request every 500ms.
 */
class ProfileV1RateLimiter {
  private lastStartTime = 0;

  async waitForSlot(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastStartTime;
    if (elapsed < RATE_LIMIT_MS) {
      await sleep(RATE_LIMIT_MS - elapsed);
    }
    this.lastStartTime = Date.now();
  }
}

const rateLimiter = new ProfileV1RateLimiter();

interface CachedProfileEntry {
  data: UserProfileV1;
  timestamp: number;
}

function getProfileCacheKey(userId: number | string): string {
  return `${CACHE_PREFIX}${String(userId)}`;
}

function getCachedProfile(
  userId: number | string,
  maxAgeMs: number
): UserProfileV1 | null {
  try {
    const key = getProfileCacheKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry: CachedProfileEntry = JSON.parse(raw);
    const now = Date.now();
    if (now - entry.timestamp > maxAgeMs) return null;
    return entry.data;
  } catch {
    return null;
  }
}

function setCachedProfile(userId: number | string, data: UserProfileV1): void {
  try {
    const key = getProfileCacheKey(userId);
    const entry: CachedProfileEntry = { data, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    console.error('Error writing user profile cache:', error);
  }
}

/**
 * Fetches user profile from Torn API v1.
 * Rate limited to 1 request every 500ms, 250ms timeout per attempt, up to 3 retries.
 */
export async function fetchUserProfileV1(
  params: FetchUserProfileV1Params
): Promise<FetchUserProfileV1Result> {
  const { apiKey, userId } = params;

  if (!apiKey || apiKey.trim() === '') {
    return { data: null, error: 'API key is required' };
  }

  if (userId === undefined || userId === null || userId === '') {
    return { data: null, error: 'User ID is required' };
  }

  const retryConfig = DEFAULT_RETRY_CONFIG;
  let lastError: string | null = null;
  let lastStatus: number | undefined;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      await rateLimiter.waitForSlot();

      const url = `${BASE_URL}/${userId}?key=${encodeURIComponent(apiKey)}`;
      const response = await fetch(url, { signal: controller.signal });

      clearTimeout(timeoutId);
      lastStatus = response.status;

      if (!response.ok) {
        lastError = `HTTP error! status: ${response.status}`;
        if (shouldRetry(response.status) && attempt < retryConfig.maxRetries) {
          const delay = Math.min(
            retryConfig.initialDelayMs * Math.pow(retryConfig.backoffMultiplier, attempt),
            retryConfig.maxDelayMs
          );
          await sleep(delay);
          continue;
        }
        return { data: null, error: lastError };
      }

      const data = await response.json();

      if ('error' in data && data.error) {
        const err = data as UserProfileV1Error;
        return {
          data: null,
          error: `Torn API Error (${err.error.code}): ${err.error.error}`,
        };
      }

      return { data: data as UserProfileV1, error: null };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        lastError = `Failed to fetch user profile: ${error.message}`;
        if (shouldRetry(lastStatus, error) && attempt < retryConfig.maxRetries) {
          const delay = Math.min(
            retryConfig.initialDelayMs * Math.pow(retryConfig.backoffMultiplier, attempt),
            retryConfig.maxDelayMs
          );
          await sleep(delay);
          continue;
        }
      } else {
        lastError = 'Failed to fetch user profile: Unknown error';
      }
      return {
        data: null,
        error: lastError || 'Failed to fetch user profile after retries',
      };
    }
  }

  return {
    data: null,
    error: lastError || 'Failed to fetch user profile after retries',
  };
}

/**
 * Fetches user profile with localStorage cache.
 * Returns cached data if present and younger than maxAgeMs; otherwise calls fetchUserProfileV1
 * and stores the result on success.
 */
export async function fetchUserProfileV1Cached(
  params: FetchUserProfileV1Params,
  options: FetchUserProfileV1CachedOptions
): Promise<FetchUserProfileV1Result> {
  const { apiKey, userId } = params;
  const { maxAgeMs } = options;

  if (!apiKey || apiKey.trim() === '') {
    return { data: null, error: 'API key is required' };
  }

  if (userId === undefined || userId === null || userId === '') {
    return { data: null, error: 'User ID is required' };
  }

  const cached = getCachedProfile(userId, maxAgeMs);
  if (cached) {
    return { data: cached, error: null };
  }

  const result = await fetchUserProfileV1(params);
  if (result.data) {
    setCachedProfile(userId, result.data);
  }
  return result;
}
