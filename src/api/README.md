# Torn API Service

This module provides TypeScript API clients for interacting with the Torn API v2 and other related services.

## Available Modules

### 1. Torn Bounties (`tornBounties.ts`)
Fetch bounty listings from the Torn API v2.

[📖 View tornBounties Documentation](./tornBounties.ts)

### 2. Torn User Basic (`tornUserBasic.ts`)
Fetch basic user profile information including name, level, gender, and status.

[📖 View tornUserBasic Documentation](./tornUserBasic.README.md)

### 3. FF Scouter (`ffScouter.ts`)
FF scouting functionality for the game.

[📖 View ffScouter Documentation](./ffScouter.README.md)

## Features

- ✅ Full TypeScript support with proper type definitions
- ✅ Paginated API calls with automatic pagination support
- ✅ Error handling for API and network errors
- ✅ Support for metadata-based navigation (next/prev links)
- ✅ Progress callbacks for long-running operations
- ✅ Comprehensive test coverage

## Installation

The API services are located in `src/api/` and can be imported from `src/api`.

## Usage

### Basic Usage - Fetch Single Page

```typescript
import { fetchBounties } from './api';

async function getBounties() {
  const result = await fetchBounties({
    apiKey: 'your-torn-api-key',
    limit: 100,
    offset: 0,
  });

  if (result.error) {
    console.error('Error fetching bounties:', result.error);
    return;
  }

  console.log('Bounties:', result.data?.bounties);
  console.log('Next page link:', result.data?._metadata.links.next);
}
```

### Fetch All Bounties (Auto-pagination)

```typescript
import { fetchAllBounties } from './api';

async function getAllBounties() {
  const result = await fetchAllBounties(
    'your-torn-api-key',
    100,
    (current, allBounties) => {
      console.log(`Fetched ${current} bounties so far...`);
    }
  );

  if (result.error) {
    console.error('Error:', result.error);
    return;
  }

  console.log(`Total bounties fetched: ${result.data?.bounties.length}`);
}
```

### Navigate Using Metadata Links

```typescript
import { fetchBounties, fetchBountiesByLink } from './api';

async function navigateBounties() {
  // Fetch first page
  const firstPage = await fetchBounties({
    apiKey: 'your-torn-api-key',
    limit: 50,
    offset: 0,
  });

  if (firstPage.data?._metadata.links.next) {
    // Fetch next page using metadata link
    const nextPage = await fetchBountiesByLink(
      'your-torn-api-key',
      firstPage.data._metadata.links.next
    );
    
    console.log('Next page bounties:', nextPage.data?.bounties);
  }
}
```

### React Component Example

```typescript
import React, { useState, useEffect } from 'react';
import { fetchBounties, Bounty } from '../api';
import { usePassword } from '../hooks/usePassword';

const BountiesComponent: React.FC = () => {
  const { password: apiKey } = usePassword('torn-api-key');
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const limit = 100;

  useEffect(() => {
    const loadBounties = async () => {
      if (!apiKey) return;

      setLoading(true);
      setError(null);

      const result = await fetchBounties({ apiKey, limit, offset });

      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setBounties(result.data.bounties);
      }

      setLoading(false);
    };

    loadBounties();
  }, [apiKey, offset]);

  if (loading) return <div>Loading bounties...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Torn Bounties</h2>
      <ul>
        {bounties.map((bounty) => (
          <li key={bounty.target_id}>
            {bounty.target_name} - ${bounty.reward.toLocaleString()}
          </li>
        ))}
      </ul>
      <button onClick={() => setOffset(offset - limit)} disabled={offset === 0}>
        Previous
      </button>
      <button onClick={() => setOffset(offset + limit)}>
        Next
      </button>
    </div>
  );
};

export default BountiesComponent;
```

## API Reference

### Types

#### `Bounty`
```typescript
interface Bounty {
  target_id: number;
  target_name: string;
  target_level: number;
  lister_id: number;
  lister_name: string;
  reward: number;
  reason: string;
  quantity: number;
  is_anonymous: boolean;
  valid_until: number;
}
```

#### `BountiesResponse`
```typescript
interface BountiesResponse {
  bounties: Bounty[];
  _metadata: {
    links: {
      next: string | null;
      prev: string | null;
    };
  };
}
```

#### `FetchBountiesResult`
```typescript
interface FetchBountiesResult {
  data: BountiesResponse | null;
  error: string | null;
}
```

### Functions

#### `fetchBounties(params: FetchBountiesParams): Promise<FetchBountiesResult>`

Fetches a single page of bounties.

**Parameters:**
- `params.apiKey` (string, required): Your Torn API key
- `params.limit` (number, optional): Number of bounties per page (default: 100)
- `params.offset` (number, optional): Offset for pagination (default: 0)

**Returns:** Promise with either data or error

#### `fetchAllBounties(apiKey: string, limit?: number, onProgress?: Function): Promise<FetchBountiesResult>`

Fetches all bounties by automatically paginating through all pages.

**Parameters:**
- `apiKey` (string, required): Your Torn API key
- `limit` (number, optional): Number of bounties per page (default: 100)
- `onProgress` (function, optional): Callback function `(current: number, allBounties: Bounty[]) => void`

**Returns:** Promise with all bounties combined or error

#### `fetchBountiesByLink(apiKey: string, metadataLink: string): Promise<FetchBountiesResult>`

Fetches bounties using a metadata link from a previous response.

**Parameters:**
- `apiKey` (string, required): Your Torn API key
- `metadataLink` (string, required): The next or prev link from `_metadata.links`

**Returns:** Promise with either data or error

## Error Handling

All functions return a result object with either `data` or `error`:

```typescript
const result = await fetchBounties({ apiKey: 'key' });

if (result.error) {
  // Handle error
  console.error(result.error);
} else if (result.data) {
  // Use data
  console.log(result.data.bounties);
}
```

Common errors:
- `"API key is required"` - No API key provided
- `"HTTP error! status: X"` - HTTP error from the server
- `"Torn API Error (code): message"` - Error returned by Torn API
- `"Failed to fetch bounties: message"` - Network or other errors

## Testing

Run the test suite:

```bash
npm test src/api/tornBounties.test.ts
```

## API Endpoints

### Torn Bounties
Base URL: `https://api.torn.com/v2/torn/bounties`

Query Parameters:
- `key` - Your Torn API key (required)
- `limit` - Number of results per page (default: 100)
- `offset` - Offset for pagination (default: 0)

### Torn User Basic
Base URL: `https://api.torn.com/v2/user/{target_id}/basic`

Query Parameters:
- `striptags` - Strip HTML tags (default: true)

Headers:
- `Authorization: ApiKey {your-api-key}` (required)

## Quick Start

### Fetch Bounties
```typescript
import { fetchBounties } from './api';

const result = await fetchBounties({
  apiKey: 'your-key',
  limit: 100,
});
```

### Fetch User Info
```typescript
import { fetchUserBasic } from './api';

const result = await fetchUserBasic({
  apiKey: 'your-key',
  targetId: 123456,
});
```

## License

Part of the jensim-torn-pages project.
