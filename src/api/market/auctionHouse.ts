export interface SellerOrBuyer {
  id: number;
  name: string;
}

export interface ItemDetails {
  id: number;
  uid: number;
  name: string;
  type: string;
}

export interface WeaponArmorStats {
  damage: number | null;
  accuracy: number | null;
  armor: number | null;
  quality: number;
}

export interface ItemBonus {
  id: number;
  title: string;
  description: string;
  value: number;
}

export interface WeaponArmorDetails {
  uid: number;
  stats: WeaponArmorStats;
  bonuses: ItemBonus[];
  rarity: "yellow" | "orange" | "red" | null;
  id: number;
  name: string;
  type: string;
  sub_type: string | null;
}

export type AuctionHouseItem = ItemDetails | WeaponArmorDetails;

export interface AuctionHouseEntry {
  id: number;
  seller: SellerOrBuyer;
  buyer: SellerOrBuyer;
  timestamp: number;
  price: number;
  bids: number;
  item: AuctionHouseItem;
  page?: number;
}

export interface AuctionHouseResponse {
  auctionhouse: AuctionHouseEntry[];
  _metadata: {
    links: {
      next: string | null;
      prev: string | null;
    };
  };
}

export interface TornApiError {
  error: {
    code: number;
    error: string;
  };
}

export interface FetchAuctionHouseResult {
  data: AuctionHouseEntry[] | null;
  error: string | null;
}

const BASE_URL = 'https://api.torn.com/v2/market/auctionhouse';

/**
 * Fetches all auction house entries from the Torn API v2 with pagination
 * @param apiKey - Torn API key
 * @returns Promise containing the list of all auction house entries or error
 */
export async function fetchAuctionHouse(apiKey: string): Promise<FetchAuctionHouseResult> {
  if (!apiKey || apiKey.trim() === '') {
    return { data: null, error: 'API key is required' };
  }

  const allEntries: AuctionHouseEntry[] = [];
  let nextUrl: string | null = `${BASE_URL}?limit=100&sort=desc&key=${apiKey}`;
  let page = 1;

  try {
    while (nextUrl) {
      const response = await fetch(nextUrl);

      if (!response.ok) {
        return {
          data: null,
          error: `HTTP error! status: ${response.status}`,
        };
      }

      const data = await response.json();

      if ('error' in data && data.error) {
        const errorData = data as TornApiError;
        return {
          data: null,
          error: `Torn API Error (${errorData.error.code}): ${errorData.error.error}`,
        };
      }

      const auctionResponse = data as AuctionHouseResponse;
      const pageInternal = page;
      const entries = auctionResponse.auctionhouse.map((entry) => ({
        ...entry,
        page: pageInternal,
      }));

      allEntries.push(...entries);

      nextUrl = auctionResponse._metadata.links.next;
      if (nextUrl) {
        // Ensure the API key is present in the next URL if it's not already there
        const url = new URL(nextUrl);
        if (!url.searchParams.has('key')) {
          url.searchParams.append('key', apiKey);
          nextUrl = url.toString();
        }
      }
      page++;
    }

    return { data: allEntries, error: null };
  } catch (error) {
    if (error instanceof Error) {
      return {
        data: null,
        error: `Failed to fetch auction house data: ${error.message}`,
      };
    }
    return {
      data: null,
      error: 'Failed to fetch auction house data: Unknown error',
    };
  }
}
