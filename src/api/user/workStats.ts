import { Cache } from '../helpers/cache';
import { httpWrapper, DataOrError } from '../helpers/httpWrapper';

export interface WorkStats {
  manual_labor: number;
  intelligence: number;
  endurance: number;
}

const workStatsCache = new Cache<WorkStats>({
  storageKey: 'torn-user-workstats',
  maxStalenessMs: 7_200_000, // 2 hours
});

export async function fetchWorkStats(apiKey: string): Promise<DataOrError<WorkStats>> {
  return httpWrapper<WorkStats>(
    {
      cache: workStatsCache,
      retry: { maxRetries: 2, isSuccess: (r) => r.error === null },
    },
    async () => {
      try {
        const response = await fetch(
          `https://api.torn.com/user/?selections=workstats&key=${apiKey}`
        );
        if (!response.ok) {
          return { data: null, error: `HTTP error: ${response.status}` };
        }
        const data = await response.json();
        if ('error' in data && data.error) {
          return { data: null, error: `Torn API Error (${data.error.code}): ${data.error.error}` };
        }
        return { data: data as WorkStats, error: null };
      } catch (error) {
        return {
          data: null,
          error: `Failed to fetch work stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }
  );
}
