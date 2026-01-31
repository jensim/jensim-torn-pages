import {
  fetchStats,
  fetchSingleTargetStats,
  clearExpiredCache,
  clearAllCache,
  FFScouterStats,
} from './ffScouter';

// Mock fetch globally
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
    get length() {
      return Object.keys(store).length;
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('ffScouter API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  describe('fetchStats', () => {
    const mockResponse: FFScouterStats[] = [
      {
        player_id: 267456763,
        fair_fight: 5.39,
        bs_estimate: 2989885521,
        bs_estimate_human: '2.99b',
        last_updated: 1747333361,
      },
    ];

    it('should fetch stats successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchStats({
        apiKey: 'test-api-key',
        targetIds: [267456763],
      });

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://ffscouter.com/api/v1/get-stats')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('key=test-api-key')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('targets=267456763')
      );
    });

    it('should fetch stats for multiple targets', async () => {
      const multiResponse: FFScouterStats[] = [
        {
          player_id: 123,
          fair_fight: 3.0,
          bs_estimate: 1000000000,
          bs_estimate_human: '1.00b',
          last_updated: 1747333361,
        },
        {
          player_id: 456,
          fair_fight: 4.0,
          bs_estimate: 2000000000,
          bs_estimate_human: '2.00b',
          last_updated: 1747333362,
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => multiResponse,
      });

      const result = await fetchStats({
        apiKey: 'test-api-key',
        targetIds: [123, 456],
      });

      expect(result.error).toBeNull();
      expect(result.data).toEqual(multiResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('targets=123%2C456')
      );
    });

    it('should return error when API key is missing', async () => {
      const result = await fetchStats({
        apiKey: '',
        targetIds: [123],
      });

      expect(result.error).toBe('API key is required');
      expect(result.data).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return error when target IDs are missing', async () => {
      const result = await fetchStats({
        apiKey: 'test-api-key',
        targetIds: [],
      });

      expect(result.error).toBe('At least one target ID is required');
      expect(result.data).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle HTTP errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await fetchStats({
        apiKey: 'test-api-key',
        targetIds: [123],
      });

      expect(result.error).toBe('HTTP error! status: 404');
      expect(result.data).toBeNull();
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await fetchStats({
        apiKey: 'test-api-key',
        targetIds: [123],
      });

      expect(result.error).toBe('Failed to fetch stats: Network error');
      expect(result.data).toBeNull();
    });

    it('should handle invalid response format', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ error: 'not an array' }),
      });

      const result = await fetchStats({
        apiKey: 'test-api-key',
        targetIds: [123],
      });

      expect(result.error).toBe('Invalid response format: expected an array');
      expect(result.data).toBeNull();
    });
  });

  describe('fetchSingleTargetStats', () => {
    it('should fetch stats for a single target', async () => {
      const mockResponse: FFScouterStats[] = [
        {
          player_id: 123,
          fair_fight: 3.0,
          bs_estimate: 1000000000,
          bs_estimate_human: '1.00b',
          last_updated: 1747333361,
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchSingleTargetStats('test-api-key', 123);

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('targets=123')
      );
    });
  });

  describe('caching', () => {
    const mockResponse: FFScouterStats[] = [
      {
        player_id: 123,
        fair_fight: 3.0,
        bs_estimate: 1000000000,
        bs_estimate_human: '1.00b',
        last_updated: 1747333361,
      },
    ];

    it('should cache successful responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // First call should fetch from API
      await fetchStats({
        apiKey: 'test-api-key',
        targetIds: [123],
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(localStorageMock.length).toBe(1);

      // Second call should use cache
      const result = await fetchStats({
        apiKey: 'test-api-key',
        targetIds: [123],
      });

      expect(global.fetch).toHaveBeenCalledTimes(1); // Still 1
      expect(result.data).toEqual(mockResponse);
    });

    it('should use the same cache key regardless of target ID order', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      // Fetch with IDs in one order
      await fetchStats({
        apiKey: 'test-api-key',
        targetIds: [456, 123],
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Fetch with IDs in different order
      await fetchStats({
        apiKey: 'test-api-key',
        targetIds: [123, 456],
      });

      // Should use cache, not call fetch again
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should expire cache after 14 days', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      // First call
      await fetchStats({
        apiKey: 'test-api-key',
        targetIds: [123],
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Manually set cache timestamp to 15 days ago
      const cacheKey = 'ffscouter_cache_123';
      const cachedData = JSON.parse(localStorageMock.getItem(cacheKey) || '{}');
      cachedData.timestamp = Date.now() - 15 * 24 * 60 * 60 * 1000;
      localStorageMock.setItem(cacheKey, JSON.stringify(cachedData));

      // Second call should fetch again because cache expired
      await fetchStats({
        apiKey: 'test-api-key',
        targetIds: [123],
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle corrupted cache gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      // Set corrupted cache data
      localStorageMock.setItem('ffscouter_cache_123', 'invalid json');

      // Should fetch from API without throwing
      const result = await fetchStats({
        apiKey: 'test-api-key',
        targetIds: [123],
      });

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearExpiredCache', () => {
    it('should remove expired cache entries', () => {
      const now = Date.now();
      const expired = now - 15 * 24 * 60 * 60 * 1000;
      const valid = now - 7 * 24 * 60 * 60 * 1000;

      localStorageMock.setItem(
        'ffscouter_cache_123',
        JSON.stringify({ data: [], timestamp: expired })
      );
      localStorageMock.setItem(
        'ffscouter_cache_456',
        JSON.stringify({ data: [], timestamp: valid })
      );
      localStorageMock.setItem('other_key', 'other value');

      clearExpiredCache();

      expect(localStorageMock.getItem('ffscouter_cache_123')).toBeNull();
      expect(localStorageMock.getItem('ffscouter_cache_456')).not.toBeNull();
      expect(localStorageMock.getItem('other_key')).not.toBeNull();
    });

    it('should remove corrupted cache entries', () => {
      localStorageMock.setItem('ffscouter_cache_123', 'invalid json');
      localStorageMock.setItem(
        'ffscouter_cache_456',
        JSON.stringify({ data: [], timestamp: Date.now() })
      );

      clearExpiredCache();

      expect(localStorageMock.getItem('ffscouter_cache_123')).toBeNull();
      expect(localStorageMock.getItem('ffscouter_cache_456')).not.toBeNull();
    });
  });

  describe('clearAllCache', () => {
    it('should remove all FFScouter cache entries', () => {
      localStorageMock.setItem(
        'ffscouter_cache_123',
        JSON.stringify({ data: [], timestamp: Date.now() })
      );
      localStorageMock.setItem(
        'ffscouter_cache_456',
        JSON.stringify({ data: [], timestamp: Date.now() })
      );
      localStorageMock.setItem('other_key', 'other value');

      clearAllCache();

      expect(localStorageMock.getItem('ffscouter_cache_123')).toBeNull();
      expect(localStorageMock.getItem('ffscouter_cache_456')).toBeNull();
      expect(localStorageMock.getItem('other_key')).not.toBeNull();
    });

    it('should not throw on empty localStorage', () => {
      expect(() => clearAllCache()).not.toThrow();
    });
  });
});
