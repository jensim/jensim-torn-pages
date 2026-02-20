/**
 * Torn API User Profile V1 Service
 * Fetches full user profile from Torn API v1 with retry, rate limit, and timeout.
 */

import { Cache } from './cache';
import { RateLimiter } from './rateLimiter';
import { withRetry } from './retry';

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
const RATE_LIMIT_COOLDOWN_MS = 500;
const MAX_RETRIES = 3;

const profileRateLimiter = new RateLimiter({ cooldownMs: RATE_LIMIT_COOLDOWN_MS });

/**
 * Single attempt to fetch user profile (no retry, no rate limit). Used inside rate limiter + retry.
 */
async function fetchUserProfileV1OneAttempt(
  apiKey: string,
  userId: number | string
): Promise<FetchUserProfileV1Result> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const url = `${BASE_URL}/${userId}?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) {
      return { data: null, error: `HTTP error! status: ${response.status}` };
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
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: `Failed to fetch user profile: ${message}` };
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

  return withRetry(
    () =>
      profileRateLimiter.run(() =>
        fetchUserProfileV1OneAttempt(apiKey, userId)
      ),
    {
      maxRetries: MAX_RETRIES,
      isSuccess: (r) => r.error === null,
    }
  );
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

  const cache = new Cache<UserProfileV1>({
    storageKey: `${CACHE_PREFIX}${String(userId)}`,
    maxStalenessMs: maxAgeMs,
  });
  return cache.getOrLoad(() => fetchUserProfileV1(params));
}
