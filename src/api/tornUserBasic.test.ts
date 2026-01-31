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
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await fetchUserBasic({
        apiKey: 'test-api-key',
        targetId: 123456,
      });

      expect(result.data).toBeNull();
      expect(result.error).toBe('Failed to fetch user basic info: Network error');
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

  describe('fetchMultipleUsersBasic', () => {
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

      const result = await fetchMultipleUsersBasic('test-api-key', [123, 456]);

      expect(result.data).toHaveLength(0);
      expect(result.error).toContain('User 123');
      expect(result.error).toContain('User 456');
    });
  });
});
