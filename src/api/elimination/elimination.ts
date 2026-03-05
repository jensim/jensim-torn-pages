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

export interface EliminationTeamMemberLastAction {
  status: string;
  timestamp: number;
  relative: string;
}

export interface EliminationTeamMemberStatus {
  description: string;
  details: string;
  state: string;
  color: string;
  until: number;
  plane_image_type: string;
}

export interface EliminationTeamMember {
  id: number;
  name: string;
  level: number;
  last_action: EliminationTeamMemberLastAction;
  status: EliminationTeamMemberStatus;
  attacks: number;
  score: number;
}

export interface EliminationTeamMembersResponse {
  eliminationteam: EliminationTeamMember[];
}

export interface FetchEliminationParams {
  apiKey: string;
}

export interface FetchEliminationResult {
  data: EliminationResponse | null;
  error: string | null;
}

export interface FetchEliminationTeamMembersParams {
  apiKey: string;
  teamId: number;
  offset?: number;
}

export interface FetchEliminationTeamMembersResult {
  data: EliminationTeamMembersResponse | null;
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

/**
 * Fetches elimination team members from the Torn API v2
 * @param params - Parameters including API key, team ID, and optional offset
 * @returns Promise containing the elimination team members data or error
 */
export async function fetchEliminationTeamMembers(
  params: FetchEliminationTeamMembersParams
): Promise<FetchEliminationTeamMembersResult> {
  const { apiKey, teamId, offset = 0 } = params;

  if (!apiKey || apiKey.trim() === '') {
    return {
      data: null,
      error: 'API key is required',
    };
  }

  try {
    const url = new URL(`https://api.torn.com/v2/torn/${teamId}/eliminationteam`);
    url.searchParams.append('limit', '100');
    url.searchParams.append('offset', offset.toString());
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
      data: data as EliminationTeamMembersResponse,
      error: null,
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        data: null,
        error: `Failed to fetch elimination team members: ${error.message}`,
      };
    }
    return {
      data: null,
      error: 'Failed to fetch elimination team members: Unknown error',
    };
  }
}
