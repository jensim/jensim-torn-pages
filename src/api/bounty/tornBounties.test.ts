import {
  fetchBounties,
  fetchAllBounties,
  fetchBountiesByLink,
  BountiesResponse,
  BountiesError,
} from './tornBounties';

// Mock fetch globally
global.fetch = jest.fn();

describe('tornBounties API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchBounties', () => {
    it('should fetch bounties successfully', async () => {
      const mockResponse: BountiesResponse = {
        bounties: [
          {
            target_id: 123,
            target_name: 'TestUser',
            target_level: 50,
            lister_id: 456,
            lister_name: 'Lister',
            reward: 1000000,
            reason: 'Test reason',
            quantity: 1,
            is_anonymous: false,
            valid_until: 1234567890,
          },
        ],
        _metadata: {
          links: {
            next: 'limit=100&offset=100',
            prev: null,
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchBounties({
        apiKey: 'test-api-key',
        limit: 100,
        offset: 0,
      });

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.torn.com/v2/torn/bounties')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('key=test-api-key')
      );
    });

    it('should return error when API key is missing', async () => {
      const result = await fetchBounties({
        apiKey: '',
        limit: 100,
        offset: 0,
      });

      expect(result.error).toBe('API key is required');
      expect(result.data).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle Torn API errors', async () => {
      const mockError: BountiesError = {
        error: {
          code: 2,
          error: 'Incorrect key',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockError,
      });

      const result = await fetchBounties({
        apiKey: 'invalid-key',
        limit: 100,
        offset: 0,
      });

      expect(result.error).toBe('Torn API Error (2): Incorrect key');
      expect(result.data).toBeNull();
    });

    it('should handle HTTP errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await fetchBounties({
        apiKey: 'test-api-key',
        limit: 100,
        offset: 0,
      });

      expect(result.error).toBe('HTTP error! status: 404');
      expect(result.data).toBeNull();
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await fetchBounties({
        apiKey: 'test-api-key',
        limit: 100,
        offset: 0,
      });

      expect(result.error).toBe('Failed to fetch bounties: Network error');
      expect(result.data).toBeNull();
    });

    it('should use default values for limit and offset', async () => {
      const mockResponse: BountiesResponse = {
        bounties: [],
        _metadata: {
          links: {
            next: null,
            prev: null,
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await fetchBounties({ apiKey: 'test-api-key' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=100')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('offset=0')
      );
    });
  });

  describe('fetchAllBounties', () => {
    it('should fetch all pages of bounties', async () => {
      const page1: BountiesResponse = {
        bounties: [
          {
            target_id: 1,
            target_name: 'User1',
            target_level: 50,
            lister_id: 100,
            lister_name: 'Lister1',
            reward: 1000000,
            reason: 'Reason 1',
            quantity: 1,
            is_anonymous: false,
            valid_until: 1234567890,
          },
        ],
        _metadata: {
          links: {
            next: 'limit=1&offset=1',
            prev: null,
          },
        },
      };

      const page2: BountiesResponse = {
        bounties: [
          {
            target_id: 2,
            target_name: 'User2',
            target_level: 60,
            lister_id: 200,
            lister_name: 'Lister2',
            reward: 2000000,
            reason: 'Reason 2',
            quantity: 1,
            is_anonymous: true,
            valid_until: 1234567891,
          },
        ],
        _metadata: {
          links: {
            next: null,
            prev: 'limit=1&offset=0',
          },
        },
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => page1,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => page2,
        });

      const result = await fetchAllBounties('test-api-key', 1);

      expect(result.error).toBeNull();
      expect(result.data?.bounties).toHaveLength(2);
      expect(result.data?.bounties[0].target_id).toBe(1);
      expect(result.data?.bounties[1].target_id).toBe(2);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should call onProgress callback', async () => {
      const mockResponse: BountiesResponse = {
        bounties: [
          {
            target_id: 1,
            target_name: 'User1',
            target_level: 50,
            lister_id: 100,
            lister_name: 'Lister1',
            reward: 1000000,
            reason: 'Reason',
            quantity: 1,
            is_anonymous: false,
            valid_until: 1234567890,
          },
        ],
        _metadata: {
          links: {
            next: null,
            prev: null,
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const onProgress = jest.fn();
      await fetchAllBounties('test-api-key', 100, onProgress);

      expect(onProgress).toHaveBeenCalledWith(1, expect.any(Array));
    });

    it('should stop on error', async () => {
      const mockError: BountiesError = {
        error: {
          code: 2,
          error: 'Incorrect key',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockError,
      });

      const result = await fetchAllBounties('invalid-key', 100);

      expect(result.error).toBe('Torn API Error (2): Incorrect key');
      expect(result.data).toBeNull();
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('fetchBountiesByLink', () => {
    it('should fetch bounties using metadata link', async () => {
      const mockResponse: BountiesResponse = {
        bounties: [],
        _metadata: {
          links: {
            next: null,
            prev: 'limit=100&offset=0',
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchBountiesByLink(
        'test-api-key',
        'limit=100&offset=100'
      );

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=100')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('offset=100')
      );
    });

    it('should return error when API key is missing', async () => {
      const result = await fetchBountiesByLink('', 'limit=100&offset=100');

      expect(result.error).toBe('API key is required');
      expect(result.data).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return error when metadata link is missing', async () => {
      const result = await fetchBountiesByLink('test-api-key', '');

      expect(result.error).toBe('Metadata link is required');
      expect(result.data).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle malformed metadata links', async () => {
      const result = await fetchBountiesByLink(
        'test-api-key',
        'invalid-link-format'
      );

      // Should return an error for malformed links
      expect(result.error).toBe('Invalid metadata link format: missing limit or offset');
      expect(result.data).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
