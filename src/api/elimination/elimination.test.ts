import {
  fetchElimination,
  EliminationResponse,
  TornApiError,
} from './elimination';

// Mock fetch globally
global.fetch = jest.fn();

describe('elimination API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchElimination', () => {
    it('should fetch elimination data successfully', async () => {
      const mockResponse: EliminationResponse = {
        elimination: [
          {
            id: 1,
            name: 'Team 1',
            participants: 100,
            position: 1,
            score: 1000,
            lives: 10,
            wins: 50,
            losses: 20,
            eliminated: false,
            eliminated_timestamp: 0,
            leaders: [
              {
                id: 123,
                name: 'Leader 1',
                active: true,
              },
            ],
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchElimination({
        apiKey: 'test-api-key',
      });

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.torn.com/v2/torn/elimination')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('key=test-api-key')
      );
    });

    it('should return error when API key is missing', async () => {
      const result = await fetchElimination({
        apiKey: '',
      });

      expect(result.error).toBe('API key is required');
      expect(result.data).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle Torn API errors', async () => {
      const mockError: TornApiError = {
        error: {
          code: 2,
          error: 'Incorrect key',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockError,
      });

      const result = await fetchElimination({
        apiKey: 'invalid-key',
      });

      expect(result.error).toBe('Torn API Error (2): Incorrect key');
      expect(result.data).toBeNull();
    });

    it('should handle HTTP errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await fetchElimination({
        apiKey: 'test-api-key',
      });

      expect(result.error).toBe('HTTP error! status: 404');
      expect(result.data).toBeNull();
    });

    it('should handle fetch exceptions', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchElimination({
        apiKey: 'test-api-key',
      });

      expect(result.error).toBe('Failed to fetch elimination data: Network error');
      expect(result.data).toBeNull();
    });
  });
});
