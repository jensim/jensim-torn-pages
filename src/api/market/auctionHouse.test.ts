import { fetchAuctionHouse, AuctionHouseResponse } from './auctionHouse';

// Mock fetch globally
global.fetch = jest.fn();

describe('auctionHouse API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch all pages and add page number to entries', async () => {
    const page1Response: AuctionHouseResponse = {
      auctionhouse: [
        {
          id: 1,
          seller: { id: 101, name: 'Seller 1' },
          buyer: { id: 201, name: 'Buyer 1' },
          timestamp: 1625097600,
          price: 100000,
          bids: 5,
          item: { id: 1, uid: 1001, name: 'Item 1', type: 'Other' }
        }
      ],
      _metadata: {
        links: {
          next: 'https://api.torn.com/v2/market/auctionhouse?limit=20&offset=20',
          prev: null
        }
      }
    };

    const page2Response: AuctionHouseResponse = {
      auctionhouse: [
        {
          id: 2,
          seller: { id: 102, name: 'Seller 2' },
          buyer: { id: 202, name: 'Buyer 2' },
          timestamp: 1625097700,
          price: 200000,
          bids: 10,
          item: { id: 2, uid: 1002, name: 'Item 2', type: 'Other' }
        }
      ],
      _metadata: {
        links: {
          next: null,
          prev: 'https://api.torn.com/v2/market/auctionhouse?limit=20&offset=0'
        }
      }
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => page1Response,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => page2Response,
      });

    const result = await fetchAuctionHouse('test-api-key');

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(2);
    expect(result.data![0]).toEqual({
      ...page1Response.auctionhouse[0],
      page: 1
    });
    expect(result.data![1]).toEqual({
      ...page2Response.auctionhouse[0],
      page: 2
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenNthCalledWith(1, expect.stringContaining('limit=20'));
    expect(global.fetch).toHaveBeenNthCalledWith(1, expect.stringContaining('key=test-api-key'));
    expect(global.fetch).toHaveBeenNthCalledWith(2, expect.stringContaining('offset=20'));
    expect(global.fetch).toHaveBeenNthCalledWith(2, expect.stringContaining('key=test-api-key'));
  });

  it('should return error when API key is missing', async () => {
    const result = await fetchAuctionHouse('');
    expect(result.error).toBe('API key is required');
    expect(result.data).toBeNull();
  });

  it('should handle API errors', async () => {
    const mockError = {
      error: {
        code: 2,
        error: 'Incorrect key'
      }
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockError,
    });

    const result = await fetchAuctionHouse('invalid-key');
    expect(result.error).toBe('Torn API Error (2): Incorrect key');
    expect(result.data).toBeNull();
  });

  it('should handle HTTP errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const result = await fetchAuctionHouse('test-key');
    expect(result.error).toBe('HTTP error! status: 500');
    expect(result.data).toBeNull();
  });
});
