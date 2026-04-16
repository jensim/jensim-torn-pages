/**
 * Torn API Bounties Service
 * Provides functions for fetching bounty data from the Torn API v2
 */

import { httpWrapper } from '../helpers/httpWrapper';

// Type definitions for the Torn Bounties API response
export interface Bounty {
  target_id: number;
  target_name: string;
  target_level: number;
  lister_id: number;
  lister_name: string;
  reward: number;
  reason: string;
  quantity: number;
  is_anonymous: boolean;
  valid_until: number;
}

export interface BountiesMetadata {
  links: {
    next: string | null;
    prev: string | null;
  };
}

export interface BountiesResponse {
  bounties: Bounty[];
  _metadata: BountiesMetadata;
}

export interface BountiesError {
  error: {
    code: number;
    error: string;
  };
}

export interface FetchBountiesParams {
  apiKey: string;
  limit?: number;
  offset?: number;
}

export interface FetchBountiesResult {
  data: BountiesResponse | null;
  error: string | null;
}

const BASE_URL = 'https://api.torn.com/v2/torn/bounties';

/**
 * Fetches a single page of bounties from the Torn API.
 * Wrapped in httpWrapper for retries on transient failures.
 */
export async function fetchBounties(
  params: FetchBountiesParams
): Promise<FetchBountiesResult> {
  const { apiKey, limit = 100, offset = 0 } = params;

  if (!apiKey || apiKey.trim() === '') {
    return { data: null, error: 'API key is required' };
  }

  return httpWrapper<BountiesResponse>(
    {
      retry: {
        maxRetries: 2,
        isSuccess: (r) =>
          r.error === null ||
          (r.error !== null &&
            (r.error.startsWith('Torn API Error') ||
              r.error.startsWith('HTTP error! status: 4'))),
      },
    },
    async () => {
      try {
        const url = new URL(BASE_URL);
        url.searchParams.append('key', apiKey);
        url.searchParams.append('limit', limit.toString());
        url.searchParams.append('offset', offset.toString());

        const response = await fetch(url.toString());

        if (!response.ok) {
          return { data: null, error: `HTTP error! status: ${response.status}` };
        }

        const data = await response.json();

        if ('error' in data && data.error) {
          const errorData = data as BountiesError;
          return {
            data: null,
            error: `Torn API Error (${errorData.error.code}): ${errorData.error.error}`,
          };
        }

        return { data: data as BountiesResponse, error: null };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { data: null, error: `Failed to fetch bounties: ${message}` };
      }
    }
  );
}

/**
 * Fetches all bounties by automatically paginating through all pages.
 * @param apiKey - Torn API key
 * @param limit - Number of bounties per page (default: 100)
 * @param onProgress - Optional callback for progress updates
 * @param shouldStopAfterPage - Optional callback; return true to stop fetching further pages
 * @returns Promise containing all bounties or error
 */
export async function fetchAllBounties(
  apiKey: string,
  limit: number = 100,
  onProgress?: (current: number, total: Bounty[]) => void,
  shouldStopAfterPage?: (page: Bounty[]) => boolean
): Promise<FetchBountiesResult> {
  const allBounties: Bounty[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const result = await fetchBounties({ apiKey, limit, offset });

    if (result.error) {
      return { data: null, error: result.error };
    }

    if (result.data) {
      allBounties.push(...result.data.bounties);

      if (onProgress) {
        onProgress(offset + result.data.bounties.length, allBounties);
      }

      // Check if there's a next page, and allow caller to stop early
      hasMore = result.data._metadata.links.next !== null && result.data.bounties.length > 0;
      if (hasMore && shouldStopAfterPage && shouldStopAfterPage(result.data.bounties)) {
        hasMore = false;
      }
      offset += limit;
    } else {
      hasMore = false;
    }
  }

  return {
    data: {
      bounties: allBounties,
      _metadata: { links: { next: null, prev: null } },
    },
    error: null,
  };
}

/**
 * Fetches bounties using a metadata link (next or prev).
 * @param apiKey - Torn API key
 * @param metadataLink - The next or prev link from metadata (e.g., "limit=100&offset=100")
 * @returns Promise containing the bounties data or error
 */
export async function fetchBountiesByLink(
  apiKey: string,
  metadataLink: string
): Promise<FetchBountiesResult> {
  if (!apiKey || apiKey.trim() === '') {
    return { data: null, error: 'API key is required' };
  }

  if (!metadataLink || metadataLink.trim() === '') {
    return { data: null, error: 'Metadata link is required' };
  }

  try {
    // Parse the metadata link to extract limit and offset
    // The metadata link is in format: "limit=100&offset=100"
    const params = new URLSearchParams(metadataLink);
    const limitStr = params.get('limit');
    const offsetStr = params.get('offset');

    if (!limitStr || !offsetStr) {
      return { data: null, error: 'Invalid metadata link format: missing limit or offset' };
    }

    const limit = parseInt(limitStr, 10);
    const offset = parseInt(offsetStr, 10);

    if (isNaN(limit) || isNaN(offset)) {
      return { data: null, error: 'Invalid metadata link format: limit or offset not a number' };
    }

    return fetchBounties({ apiKey, limit, offset });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: `Failed to parse metadata link: ${message}` };
  }
}
