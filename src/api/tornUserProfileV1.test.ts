import {
  fetchUserProfileV1,
  fetchUserProfileV1Cached,
  UserProfileV1,
  UserProfileV1Error,
} from './tornUserProfileV1';

global.fetch = jest.fn();

const CACHE_PREFIX = 'torn_user_profile_v1_';

function getCacheKey(userId: number | string): string {
  return `${CACHE_PREFIX}${String(userId)}`;
}

const mockProfile: UserProfileV1 = {
  rank: 'Average Hired Gun',
  level: 15,
  honor: 500,
  gender: 'Male',
  property: 'Private Island',
  signup: '2026-02-08 12:04:48',
  awards: 48,
  friends: 0,
  enemies: 1,
  forum_posts: 0,
  karma: 0,
  age: 11,
  role: 'Civilian',
  donator: 1,
  player_id: 4093819,
  name: 'Wulfven',
  property_id: 4477603,
  revivable: 1,
  profile_image: 'https://profileimages.torn.com/dbc42371-c267-4bd5-a0eb-866156d77cf2-4093819.png',
  life: { current: 656, maximum: 656 },
  status: {
    description: 'Okay',
    details: '',
    state: 'Okay',
    color: 'green',
    until: 0,
  },
  job: {
    job: 'Employee',
    position: 'Salesperson',
    company_id: 100823,
    company_name: 'WTF Whimsical Wicks',
    company_type: 8,
  },
  faction: {
    position: 'Reviver in Training',
    faction_id: 12863,
    days_in_faction: 8,
    faction_name: 'WTF Healers',
    faction_tag: 'WTFH',
    faction_tag_image: '12863-92015.png',
  },
  married: {
    spouse_id: 0,
    spouse_name: 'None',
    duration: 0,
  },
  basicicons: {
    icon72: 'Newbie',
    icon6: 'Male',
    icon4: 'Subscriber',
  },
  states: {
    hospital_timestamp: 0,
    jail_timestamp: 0,
  },
  last_action: {
    status: 'Online',
    timestamp: 1771514478,
    relative: '0 minutes ago',
  },
  competition: {
    name: 'Rock, Paper, Scissors',
    status: 'rock',
    current_hp: 10,
    max_hp: 10,
  },
};

describe('tornUserProfileV1 API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchUserProfileV1', () => {
    it('should fetch user profile successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfile,
      });

      const result = await fetchUserProfileV1({
        apiKey: 'test-api-key',
        userId: 4093819,
      });

      expect(result.data).toEqual(mockProfile);
      expect(result.error).toBeNull();
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.torn.com/user/4093819?key=test-api-key',
        { signal: expect.any(AbortSignal) }
      );
    });

    it('should encode API key in URL', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfile,
      });

      await fetchUserProfileV1({
        apiKey: 'key+with/special=chars',
        userId: 123,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('key='),
        { signal: expect.any(AbortSignal) }
      );
      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain(encodeURIComponent('key+with/special=chars'));
    });

    it('should accept string userId', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfile,
      });

      const result = await fetchUserProfileV1({
        apiKey: 'test-key',
        userId: '4093819',
      });

      expect(result.data).toEqual(mockProfile);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.torn.com/user/4093819?key=test-key',
        { signal: expect.any(AbortSignal) }
      );
    });

    it('should return error when API key is missing', async () => {
      const result = await fetchUserProfileV1({
        apiKey: '',
        userId: 4093819,
      });

      expect(result.data).toBeNull();
      expect(result.error).toBe('API key is required');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return error when userId is missing', async () => {
      const result = await fetchUserProfileV1({
        apiKey: 'test-key',
        userId: '',
      });

      expect(result.data).toBeNull();
      expect(result.error).toBe('User ID is required');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle Torn API error response', async () => {
      const apiError: UserProfileV1Error = {
        error: { code: 2, error: 'Incorrect key' },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => apiError,
      });

      const result = await fetchUserProfileV1({
        apiKey: 'bad-key',
        userId: 4093819,
      });

      expect(result.data).toBeNull();
      expect(result.error).toBe('Torn API Error (2): Incorrect key');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should not retry on 404', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await fetchUserProfileV1({
        apiKey: 'test-key',
        userId: 999999,
      });

      expect(result.data).toBeNull();
      expect(result.error).toBe('HTTP error! status: 404');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should retry on 500 then succeed', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockProfile,
        });

      const result = await fetchUserProfileV1({
        apiKey: 'test-key',
        userId: 4093819,
      });

      expect(result.data).toEqual(mockProfile);
      expect(result.error).toBeNull();
      expect(global.fetch).toHaveBeenCalledTimes(2);
    }, 10000);

    it('should retry on AbortError (timeout) then succeed', async () => {
      const abortError = new Error('The operation was aborted');
      (abortError as Error & { name: string }).name = 'AbortError';

      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(abortError)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockProfile,
        });

      const result = await fetchUserProfileV1({
        apiKey: 'test-key',
        userId: 4093819,
      });

      expect(result.data).toEqual(mockProfile);
      expect(result.error).toBeNull();
      expect(global.fetch).toHaveBeenCalledTimes(2);
    }, 10000);

    it('should return error after max retries exhausted', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await fetchUserProfileV1({
        apiKey: 'test-key',
        userId: 4093819,
      });

      expect(result.data).toBeNull();
      expect(result.error).toBe('HTTP error! status: 500');
      expect(global.fetch).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
    }, 15000);
  });

  describe('Rate limiting', () => {
    it('should space requests at least 500ms apart', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockProfile,
      });

      const start = Date.now();
      const [r1, r2] = await Promise.all([
        fetchUserProfileV1({ apiKey: 'key', userId: 1 }),
        fetchUserProfileV1({ apiKey: 'key', userId: 2 }),
      ]);
      const elapsed = Date.now() - start;

      expect(r1.data).toEqual(mockProfile);
      expect(r2.data).toEqual(mockProfile);
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(elapsed).toBeGreaterThanOrEqual(490); // allow small variance
    }, 5000);
  });

  describe('fetchUserProfileV1Cached', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('should return cached profile when fresh', async () => {
      const key = getCacheKey(4093819);
      const entry = { data: mockProfile, timestamp: Date.now() };
      localStorage.setItem(key, JSON.stringify(entry));

      const result = await fetchUserProfileV1Cached(
        { apiKey: 'key', userId: 4093819 },
        { maxAgeMs: 60_000 }
      );

      expect(result.data).toEqual(mockProfile);
      expect(result.error).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should fetch and cache when cache is empty', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfile,
      });

      const result = await fetchUserProfileV1Cached(
        { apiKey: 'key', userId: 4093819 },
        { maxAgeMs: 60_000 }
      );

      expect(result.data).toEqual(mockProfile);
      expect(result.error).toBeNull();
      expect(global.fetch).toHaveBeenCalledTimes(1);

      const key = getCacheKey(4093819);
      const stored = JSON.parse(localStorage.getItem(key) ?? '');
      expect(stored.data).toEqual(mockProfile);
      expect(typeof stored.timestamp).toBe('number');
    });

    it('should fetch when cache is older than maxAgeMs', async () => {
      const key = getCacheKey(4093819);
      const entry = {
        data: { ...mockProfile, name: 'OldName' },
        timestamp: Date.now() - 120_000,
      };
      localStorage.setItem(key, JSON.stringify(entry));

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfile,
      });

      const result = await fetchUserProfileV1Cached(
        { apiKey: 'key', userId: 4093819 },
        { maxAgeMs: 60_000 }
      );

      expect(result.data).toEqual(mockProfile);
      expect(result.data?.name).toBe('Wulfven');
      expect(global.fetch).toHaveBeenCalledTimes(1);
      const stored = JSON.parse(localStorage.getItem(key) ?? '');
      expect(stored.data.name).toBe('Wulfven');
    });

    it('should not cache on fetch error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await fetchUserProfileV1Cached(
        { apiKey: 'key', userId: 4093819 },
        { maxAgeMs: 60_000 }
      );

      expect(result.data).toBeNull();
      expect(result.error).not.toBeNull();
      expect(localStorage.getItem(getCacheKey(4093819))).toBeNull();
    });

    it('should return error for invalid params without calling fetch', async () => {
      const result = await fetchUserProfileV1Cached(
        { apiKey: '', userId: 4093819 },
        { maxAgeMs: 60_000 }
      );

      expect(result.data).toBeNull();
      expect(result.error).toBe('API key is required');
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
