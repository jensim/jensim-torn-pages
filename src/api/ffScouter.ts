/**
 * FFScouter API Service
 * Provides functions for fetching battle stats from FFScouter API
 * Includes localStorage caching with 14-day TTL
 */

// Type definitions for the FFScouter API response
export interface FFScouterStats {
  player_id: number;
  fair_fight: number;
  bs_estimate: number;
  bs_estimate_human: string;
  last_updated: number;
}

export interface FetchStatsParams {
  apiKey: string;
  targetIds: number[];
}

export interface FetchStatsResult {
  data: FFScouterStats[] | null;
  error: string | null;
}

interface CachedData {
  data: FFScouterStats[];
  timestamp: number;
}

const BASE_URL = 'https://ffscouter.com/api/v1/get-stats';
const CACHE_PREFIX = 'ffscouter_cache_';
const CACHE_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days in milliseconds

/**
 * Generates a cache key for the given target IDs
 * @param targetIds - Array of target player IDs
 * @returns Cache key string
 */
function getCacheKey(targetIds: number[]): string {
  // Sort IDs to ensure consistent cache keys regardless of order
  const sortedIds = [...targetIds].sort((a, b) => a - b);
  return `${CACHE_PREFIX}${sortedIds.join('_')}`;
}

/**
 * Retrieves cached data from localStorage if available and not expired
 * @param targetIds - Array of target player IDs
 * @returns Cached data or null if not found/expired
 */
function getCachedData(targetIds: number[]): FFScouterStats[] | null {
  try {
    const cacheKey = getCacheKey(targetIds);
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) {
      return null;
    }

    const cachedData: CachedData = JSON.parse(cached);
    const now = Date.now();
    
    // Check if cache has expired
    if (now - cachedData.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    return cachedData.data;
  } catch (error) {
    // If there's any error reading/parsing cache, return null
    console.error('Error reading cache:', error);
    return null;
  }
}

/**
 * Stores data in localStorage cache
 * @param targetIds - Array of target player IDs
 * @param data - Data to cache
 */
function setCachedData(targetIds: number[], data: FFScouterStats[]): void {
  try {
    const cacheKey = getCacheKey(targetIds);
    const cachedData: CachedData = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(cacheKey, JSON.stringify(cachedData));
  } catch (error) {
    // If storage fails (e.g., quota exceeded), just log and continue
    console.error('Error writing to cache:', error);
  }
}

/**
 * Clears expired cache entries from localStorage
 */
export function clearExpiredCache(): void {
  try {
    const now = Date.now();
    const keysToRemove: string[] = [];

    // Find all cache keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        const cached = localStorage.getItem(key);
        if (cached) {
          try {
            const cachedData: CachedData = JSON.parse(cached);
            if (now - cachedData.timestamp > CACHE_TTL_MS) {
              keysToRemove.push(key);
            }
          } catch {
            // If we can't parse it, remove it
            keysToRemove.push(key);
          }
        }
      }
    }

    // Remove expired entries
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing expired cache:', error);
  }
}

/**
 * Clears all FFScouter cache entries from localStorage
 */
export function clearAllCache(): void {
  try {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing all cache:', error);
  }
}

/**
 * Fetches stats from FFScouter API with caching
 * @param params - Parameters including API key and target IDs
 * @returns Promise containing the stats data or error
 */
export async function fetchStats(
  params: FetchStatsParams
): Promise<FetchStatsResult> {
  const { apiKey, targetIds } = params;

  if (!apiKey || apiKey.trim() === '') {
    return {
      data: null,
      error: 'API key is required',
    };
  }

  if (!targetIds || targetIds.length === 0) {
    return {
      data: null,
      error: 'At least one target ID is required',
    };
  }

  // Check cache first
  const cachedData = getCachedData(targetIds);
  if (cachedData) {
    return {
      data: cachedData,
      error: null,
    };
  }

  try {
    const url = new URL(BASE_URL);
    url.searchParams.append('key', apiKey);
    url.searchParams.append('targets', targetIds.join(','));

    const response = await fetch(url.toString());

    if (!response.ok) {
      return {
        data: null,
        error: `HTTP error! status: ${response.status}`,
      };
    }

    const data: FFScouterStats[] = await response.json();

    // Validate response is an array
    if (!Array.isArray(data)) {
      return {
        data: null,
        error: 'Invalid response format: expected an array',
      };
    }

    // Cache the successful response
    setCachedData(targetIds, data);

    return {
      data,
      error: null,
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        data: null,
        error: `Failed to fetch stats: ${error.message}`,
      };
    }
    return {
      data: null,
      error: 'Failed to fetch stats: Unknown error',
    };
  }
}

/**
 * Fetches stats for a single target ID
 * @param apiKey - FFScouter API key
 * @param targetId - Target player ID
 * @returns Promise containing the stats data or error
 */
export async function fetchSingleTargetStats(
  apiKey: string,
  targetId: number
): Promise<FetchStatsResult> {
  return fetchStats({ apiKey, targetIds: [targetId] });
}
