import { Cache } from '../helpers/cache';
import { httpWrapper, DataOrError } from '../helpers/httpWrapper';
import { RateLimiter } from '../helpers/rateLimiter';

export interface UserPersonalStats {
  trainsreceived: number;
  useractivity: number;
}

interface PersonalStatsApiResponse {
  personalstats: Record<string, number>;
}

const personalStatsRateLimiter = new RateLimiter({ cooldownMs: 250 });

export async function fetchUserPersonalStats(
  apiKey: string,
  userId: number | string
): Promise<DataOrError<UserPersonalStats>> {
  const cache = new Cache<UserPersonalStats>({
    storageKey: `torn-user-personal-stats-${userId}`,
    maxStalenessMs: 3_600_000, // 1 hour
  });
  return httpWrapper<UserPersonalStats>(
    {
      cache,
      rateLimiter: personalStatsRateLimiter,
      retry: { maxRetries: 2, isSuccess: (r) => r.error === null },
    },
    async () => {
      try {
        const response = await fetch(
          `https://api.torn.com/user/${userId}?selections=personalstats&key=${encodeURIComponent(apiKey)}`
        );
        if (!response.ok) {
          return { data: null, error: `HTTP error: ${response.status}` };
        }
        const data = await response.json();
        if ('error' in data && data.error) {
          return {
            data: null,
            error: `Torn API Error (${data.error.code}): ${data.error.error}`,
          };
        }
        const typed = data as PersonalStatsApiResponse;
        return {
          data: {
            trainsreceived: typed.personalstats.trainsreceived ?? 0,
            useractivity: typed.personalstats.useractivity ?? 0,
          },
          error: null,
        };
      } catch (error) {
        return {
          data: null,
          error: `Failed to fetch personal stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }
  );
}
