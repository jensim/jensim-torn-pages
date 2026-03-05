export interface EliminationLeader {
  id: number;
  name: string;
  active: boolean;
}

export interface EliminationTeam {
  id: number;
  name: string;
  participants: number;
  position: number;
  score: number;
  lives: number;
  wins: number;
  losses: number;
  eliminated: boolean;
  eliminated_timestamp: number;
  leaders: EliminationLeader[];
}

export interface EliminationResponse {
  elimination: EliminationTeam[];
}

export interface FetchEliminationParams {
  apiKey: string;
}

export interface FetchEliminationResult {
  data: EliminationResponse | null;
  error: string | null;
}

export interface TornApiError {
  error: {
    code: number;
    error: string;
  };
}

const BASE_URL = 'https://api.torn.com/v2/torn/elimination';

/**
 * Fetches elimination data from the Torn API v2
 * @param params - Parameters including API key
 * @returns Promise containing the elimination data or error
 */
export async function fetchElimination(
  params: FetchEliminationParams
): Promise<FetchEliminationResult> {
  const { apiKey } = params;

  if (!apiKey || apiKey.trim() === '') {
    return {
      data: null,
      error: 'API key is required',
    };
  }

  try {
    const url = new URL(BASE_URL);
    url.searchParams.append('key', apiKey);

    const response = await fetch(url.toString());

    if (!response.ok) {
      return {
        data: null,
        error: `HTTP error! status: ${response.status}`,
      };
    }

    const data = await response.json();

    // Check if the response is an error
    if ('error' in data && data.error) {
      const errorData = data as TornApiError;
      return {
        data: null,
        error: `Torn API Error (${errorData.error.code}): ${errorData.error.error}`,
      };
    }

    return {
      data: data as EliminationResponse,
      error: null,
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        data: null,
        error: `Failed to fetch elimination data: ${error.message}`,
      };
    }
    return {
      data: null,
      error: 'Failed to fetch elimination data: Unknown error',
    };
  }
}
