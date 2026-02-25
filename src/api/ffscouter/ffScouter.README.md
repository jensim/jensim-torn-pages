# FFScouter API

This module provides functions for fetching battle stats from the FFScouter API with automatic localStorage caching.

## Features

- Fetch battle stats for single or multiple targets
- Automatic caching in localStorage with 14-day TTL
- Cache key normalization (order-independent target IDs)
- Expired cache cleanup utilities
- Comprehensive error handling

## API Reference

### Types

#### `FFScouterStats`

```typescript
interface FFScouterStats {
  player_id: number;
  fair_fight: number;
  bs_estimate: number;
  bs_estimate_human: string;
  last_updated: number;
}
```

#### `FetchStatsParams`

```typescript
interface FetchStatsParams {
  apiKey: string;
  targetIds: number[];
}
```

#### `FetchStatsResult`

```typescript
interface FetchStatsResult {
  data: FFScouterStats[] | null;
  error: string | null;
}
```

### Functions

#### `fetchStats(params: FetchStatsParams): Promise<FetchStatsResult>`

Fetches stats from FFScouter API with automatic caching.

**Parameters:**
- `params.apiKey` - FFScouter API key
- `params.targetIds` - Array of target player IDs

**Returns:** Promise with stats data or error

**Example:**
```typescript
const result = await fetchStats({
  apiKey: 'your-api-key',
  targetIds: [267456763, 123456789]
});

if (result.error) {
  console.error(result.error);
} else {
  console.log(result.data);
}
```

#### `fetchSingleTargetStats(apiKey: string, targetId: number): Promise<FetchStatsResult>`

Convenience function to fetch stats for a single target.

**Parameters:**
- `apiKey` - FFScouter API key
- `targetId` - Target player ID

**Returns:** Promise with stats data or error

**Example:**
```typescript
const result = await fetchSingleTargetStats('your-api-key', 267456763);
```

#### `clearExpiredCache(): void`

Removes expired cache entries from localStorage. Cache entries older than 14 days are removed.

**Example:**
```typescript
clearExpiredCache();
```

#### `clearAllCache(): void`

Removes all FFScouter cache entries from localStorage, regardless of expiration.

**Example:**
```typescript
clearAllCache();
```

## Caching Behavior

- Successful API responses are cached in localStorage
- Cache TTL: 14 days (1,209,600,000 milliseconds)
- Cache keys are normalized (sorted target IDs) for consistency
- Expired cache entries are automatically removed on read
- Corrupted cache entries are handled gracefully

### Cache Key Format

Cache keys follow the pattern: `ffscouter_cache_{sorted_target_ids}`

Examples:
- Single target: `ffscouter_cache_123`
- Multiple targets: `ffscouter_cache_123_456_789`

## Error Handling

The API returns errors in the following cases:

1. **Missing API Key**: `"API key is required"`
2. **Empty Target IDs**: `"At least one target ID is required"`
3. **HTTP Errors**: `"HTTP error! status: {status}"`
4. **Network Errors**: `"Failed to fetch stats: {error message}"`
5. **Invalid Response**: `"Invalid response format: expected an array"`

## Testing

Run tests with:

```bash
npm test -- src/api/ffScouter.test.ts
```

## Usage Example

```typescript
import { fetchStats, clearExpiredCache } from './api/ffScouter';

// Fetch stats
const result = await fetchStats({
  apiKey: 'your-api-key',
  targetIds: [267456763, 123456789]
});

if (result.data) {
  result.data.forEach(stats => {
    console.log(`Player ${stats.player_id}:`);
    console.log(`  Fair Fight: ${stats.fair_fight}`);
    console.log(`  BS Estimate: ${stats.bs_estimate_human}`);
  });
}

// Clean up expired cache periodically
clearExpiredCache();
```

## Notes

- The API automatically handles cache expiration
- Multiple requests for the same target IDs (in any order) will use the cache
- localStorage quota errors are handled gracefully
- Consider calling `clearExpiredCache()` periodically to free up localStorage space
