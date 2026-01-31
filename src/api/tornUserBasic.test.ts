import {
  fetchUserBasic,
  fetchMultipleUsersBasic,
  UserBasicResponse,
  UserBasicError,
} from './tornUserBasic';

// Mock fetch globally
global.fetch = jest.fn();

describe('tornUserBasic API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchUserBasic', () => {
    it('should fetch user basic info successfully', async () => {
      const mockResponse: UserBasicResponse = {
        profile: {
          id: 3969263,
          name: 'Sponch',
          level: 17,
          gender: 'Male',
          status: {
            description: 'In hospital for 82 hrs 51 mins ',
            details: 'Overdosed on Xanax',
            state: 'Hospital',
            color: 'red',
            until: 1770170325,
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchUserBasic({
        apiKey: 'test-api-key',
        targetId: 3969263,
      });

      expect(result.data).toEqual(mockResponse);
      expect(result.error).toBeNull();
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.torn.com/v2/user/3969263/basic?striptags=true',
        {
          headers: {
            Authorization: 'ApiKey test-api-key',
          },
        }
      );
    });

    it('should handle string target IDs', async () => {
      const mockResponse: UserBasicResponse = {
        profile: {
          id: 123456,
          name: 'TestUser',
          level: 50,
          gender: 'Female',
          status: {
            description: 'Okay',
            details: '',
            state: 'Okay',
            color: 'green',
            until: 0,
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchUserBasic({
        apiKey: 'test-api-key',
        targetId: '123456',
      });

      expect(result.data).toEqual(mockResponse);
      expect(result.error).toBeNull();
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.torn.com/v2/user/123456/basic?striptags=true',
        {
          headers: {
            Authorization: 'ApiKey test-api-key',
          },
        }
      );
    });

    it('should return error when API key is missing', async () => {
      const result = await fetchUserBasic({
        apiKey: '',
        targetId: 123456,
      });

      expect(result.data).toBeNull();
      expect(result.error).toBe('API key is required');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return error when target ID is missing', async () => {
      const result = await fetchUserBasic({
        apiKey: 'test-api-key',
        targetId: '',
      });

      expect(result.data).toBeNull();
      expect(result.error).toBe('Target user ID is required');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle HTTP errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await fetchUserBasic({
        apiKey: 'test-api-key',
        targetId: 123456,
      });

      expect(result.data).toBeNull();
      expect(result.error).toBe('HTTP error! status: 404');
    });

    it('should handle Torn API errors', async () => {
      const mockError: UserBasicError = {
        error: {
          code: 2,
          error: 'Incorrect key',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockError,
      });

      const result = await fetchUserBasic({
        apiKey: 'invalid-key',
        targetId: 123456,
      });

      expect(result.data).toBeNull();
      expect(result.error).toBe('Torn API Error (2): Incorrect key');
    });

    it('should handle network errors', async () => {
      // Network errors should be retried, so mock all retry attempts
      (global.fetch as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const result = await fetchUserBasic(
        {
          apiKey: 'test-api-key',
          targetId: 123456,
        },
        {
          maxRetries: 2,
          initialDelayMs: 10,
          maxDelayMs: 100,
          backoffMultiplier: 2,
        }
      );

      expect(result.data).toBeNull();
      expect(result.error).toBe('Failed to fetch user basic info: Network error');
      // With retry config (2 retries), should have 3 fetch calls total
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should handle unknown errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce('Unknown error');

      const result = await fetchUserBasic({
        apiKey: 'test-api-key',
        targetId: 123456,
      });

      expect(result.data).toBeNull();
      expect(result.error).toBe('Failed to fetch user basic info: Unknown error');
    });
  });

  describe('Retry Logic', () => {
    it('should retry on 500 server errors with exponential backoff', async () => {
      const mockResponse: UserBasicResponse = {
        profile: {
          id: 123456,
          name: 'TestUser',
          level: 50,
          gender: 'Male',
          status: {
            description: 'Okay',
            details: '',
            state: 'Okay',
            color: 'green',
            until: 0,
          },
        },
      };

      // First 2 calls fail with 500, third succeeds
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

      const result = await fetchUserBasic(
        {
          apiKey: 'test-api-key',
          targetId: 123456,
        },
        {
          maxRetries: 3,
          initialDelayMs: 10, // Use short delays for testing
          maxDelayMs: 100,
          backoffMultiplier: 2,
        }
      );

      expect(result.data).toEqual(mockResponse);
      expect(result.error).toBeNull();
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should retry on 429 rate limit errors', async () => {
      const mockResponse: UserBasicResponse = {
        profile: {
          id: 123456,
          name: 'TestUser',
          level: 50,
          gender: 'Male',
          status: {
            description: 'Okay',
            details: '',
            state: 'Okay',
            color: 'green',
            until: 0,
          },
        },
      };

      // First call fails with 429, second succeeds
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

      const result = await fetchUserBasic(
        {
          apiKey: 'test-api-key',
          targetId: 123456,
        },
        {
          maxRetries: 3,
          initialDelayMs: 10,
          maxDelayMs: 100,
          backoffMultiplier: 2,
        }
      );

      expect(result.data).toEqual(mockResponse);
      expect(result.error).toBeNull();
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should retry on network errors', async () => {
      const mockResponse: UserBasicResponse = {
        profile: {
          id: 123456,
          name: 'TestUser',
          level: 50,
          gender: 'Male',
          status: {
            description: 'Okay',
            details: '',
            state: 'Okay',
            color: 'green',
            until: 0,
          },
        },
      };

      // First call fails with network error, second succeeds
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

      const result = await fetchUserBasic(
        {
          apiKey: 'test-api-key',
          targetId: 123456,
        },
        {
          maxRetries: 3,
          initialDelayMs: 10,
          maxDelayMs: 100,
          backoffMultiplier: 2,
        }
      );

      expect(result.data).toEqual(mockResponse);
      expect(result.error).toBeNull();
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should not retry on 404 errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await fetchUserBasic(
        {
          apiKey: 'test-api-key',
          targetId: 123456,
        },
        {
          maxRetries: 3,
          initialDelayMs: 10,
          maxDelayMs: 100,
          backoffMultiplier: 2,
        }
      );

      expect(result.data).toBeNull();
      expect(result.error).toBe('HTTP error! status: 404');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should return error after max retries exhausted', async () => {
      // All calls fail with 500
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await fetchUserBasic(
        {
          apiKey: 'test-api-key',
          targetId: 123456,
        },
        {
          maxRetries: 2,
          initialDelayMs: 10,
          maxDelayMs: 100,
          backoffMultiplier: 2,
        }
      );

      expect(result.data).toBeNull();
      expect(result.error).toBe('HTTP error! status: 500');
      expect(global.fetch).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    });

    it('should use exponential backoff delays', async () => {
      const startTime = Date.now();

      // All calls fail with 500
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      await fetchUserBasic(
        {
          apiKey: 'test-api-key',
          targetId: 123456,
        },
        {
          maxRetries: 3,
          initialDelayMs: 100,
          maxDelayMs: 1000,
          backoffMultiplier: 2,
        }
      );

      const elapsed = Date.now() - startTime;

      // Expected delays: 100ms + 200ms + 400ms = 700ms
      // Add some buffer for execution time
      expect(elapsed).toBeGreaterThanOrEqual(600);
    });

    it('should respect max delay cap', async () => {
      const startTime = Date.now();

      // All calls fail with 500
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      await fetchUserBasic(
        {
          apiKey: 'test-api-key',
          targetId: 123456,
        },
        {
          maxRetries: 3,
          initialDelayMs: 1000,
          maxDelayMs: 500, // Cap at 500ms
          backoffMultiplier: 2,
        }
      );

      const elapsed = Date.now() - startTime;

      // Expected delays capped: 500ms + 500ms + 500ms = 1500ms
      // (initial would be 1000, but capped at 500)
      expect(elapsed).toBeGreaterThanOrEqual(1200);
      expect(elapsed).toBeLessThan(2000); // Should not take too long
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit calls to max 10 per second', async () => {
      const mockResponse: UserBasicResponse = {
        profile: {
          id: 123,
          name: 'User1',
          level: 10,
          gender: 'Male',
          status: {
            description: 'Okay',
            details: '',
            state: 'Okay',
            color: 'green',
            until: 0,
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const startTime = Date.now();
      
      // Make 15 calls - should take at least 500ms due to rate limiting
      // (10 calls in first second, 5 more calls requiring at least 500ms more)
      const promises = Array.from({ length: 15 }, (_, i) =>
        fetchUserBasic({ apiKey: 'test-api-key', targetId: i })
      );

      await Promise.all(promises);

      const elapsed = Date.now() - startTime;

      // With 15 calls at 10 calls/sec, we expect at least 500ms
      // (first 10 are immediate, next 5 need to wait)
      expect(elapsed).toBeGreaterThanOrEqual(400); // Some margin for test execution
    });

    it('should respect rate limit in fetchMultipleUsersBasic', async () => {
      const mockResponse: UserBasicResponse = {
        profile: {
          id: 123,
          name: 'User1',
          level: 10,
          gender: 'Male',
          status: {
            description: 'Okay',
            details: '',
            state: 'Okay',
            color: 'green',
            until: 0,
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const startTime = Date.now();
      const targetIds = Array.from({ length: 12 }, (_, i) => i);

      await fetchMultipleUsersBasic('test-api-key', targetIds);

      const elapsed = Date.now() - startTime;

      // With 12 calls at 10 calls/sec, we expect at least 200ms
      expect(elapsed).toBeGreaterThanOrEqual(100); // Some margin for test execution
    });
  });

  describe('fetchMultipleUsersBasic', () => {
    // Note: fetchMultipleUsersBasic internally calls fetchUserBasic which now has retry logic
    // The retry config is not exposed through fetchMultipleUsersBasic, so it uses defaults
    
    it('should fetch multiple users successfully', async () => {
      const mockResponse1: UserBasicResponse = {
        profile: {
          id: 123,
          name: 'User1',
          level: 10,
          gender: 'Male',
          status: {
            description: 'Okay',
            details: '',
            state: 'Okay',
            color: 'green',
            until: 0,
          },
        },
      };

      const mockResponse2: UserBasicResponse = {
        profile: {
          id: 456,
          name: 'User2',
          level: 20,
          gender: 'Female',
          status: {
            description: 'Okay',
            details: '',
            state: 'Okay',
            color: 'green',
            until: 0,
          },
        },
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse1,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse2,
        });

      const result = await fetchMultipleUsersBasic('test-api-key', [123, 456]);

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual(mockResponse1);
      expect(result.data[1]).toEqual(mockResponse2);
      expect(result.error).toBeNull();
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should call progress callback', async () => {
      const mockResponse: UserBasicResponse = {
        profile: {
          id: 123,
          name: 'User1',
          level: 10,
          gender: 'Male',
          status: {
            description: 'Okay',
            details: '',
            state: 'Okay',
            color: 'green',
            until: 0,
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const onProgress = jest.fn();
      await fetchMultipleUsersBasic('test-api-key', [123, 456, 789], onProgress);

      expect(onProgress).toHaveBeenCalledTimes(3);
      expect(onProgress).toHaveBeenNthCalledWith(1, 1, 3);
      expect(onProgress).toHaveBeenNthCalledWith(2, 2, 3);
      expect(onProgress).toHaveBeenNthCalledWith(3, 3, 3);
    });

    it('should handle partial errors', async () => {
      const mockResponse: UserBasicResponse = {
        profile: {
          id: 123,
          name: 'User1',
          level: 10,
          gender: 'Male',
          status: {
            description: 'Okay',
            details: '',
            state: 'Okay',
            color: 'green',
            until: 0,
          },
        },
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        });

      const result = await fetchMultipleUsersBasic('test-api-key', [123, 456]);

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(mockResponse);
      expect(result.error).toContain('User 456');
      expect(result.error).toContain('HTTP error! status: 404');
    });

    it('should return error when all requests fail', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await fetchMultipleUsersBasic(
        'test-api-key',
        [123, 456],
        undefined, // no progress callback
        {
          maxRetries: 2,
          initialDelayMs: 10,
          maxDelayMs: 100,
          backoffMultiplier: 2,
        }
      );

      expect(result.data).toHaveLength(0);
      expect(result.error).toContain('User 123');
      expect(result.error).toContain('User 456');
      // With retry config (2 retries), each user will have 3 fetch calls
      // 2 users * 3 calls each = 6 total calls
      expect(global.fetch).toHaveBeenCalledTimes(6);
    });
  });
});
