# Torn User Profile V1 API

API module for fetching full user profile from the Torn API v1.

## Overview

This module fetches the full user profile from the Torn API v1 `user/{userId}` endpoint. Authentication is via the `key` query parameter. The client enforces a 500ms rate limit between request starts, a 250ms timeout per attempt, and up to 3 retries with exponential backoff.

## Features

- Single-user profile fetch with full response typing
- Cached variant: `fetchUserProfileV1Cached` with configurable max age (localStorage)
- Rate limiting: 1 request start every 500ms (concurrent calls serialized)
- Request timeout: 250ms per attempt
- Retry: up to 3 retries (4 attempts total) on timeout, network errors, 429, and 5xx
- TypeScript interfaces for profile, nested objects, and API errors

## API Endpoint

- **User Profile**: `GET https://api.torn.com/user/{userId}?key={apiKey}`

## Usage

### Importing

```typescript
import {
  fetchUserProfileV1,
  fetchUserProfileV1Cached,
  UserProfileV1,
  FetchUserProfileV1Params,
  FetchUserProfileV1Result,
  FetchUserProfileV1CachedOptions,
} from './api/tornUserProfileV1';
```

### Fetch User Profile

```typescript
const result = await fetchUserProfileV1({
  apiKey: 'your-api-key',
  userId: 4093819,  // or userId: '4093819'
});

if (result.error) {
  console.error('Error:', result.error);
} else if (result.data) {
  console.log('Name:', result.data.name);
  console.log('Level:', result.data.level);
  console.log('Status:', result.data.status.state);
  console.log('Life:', result.data.life.current, '/', result.data.life.maximum);
  if (result.data.job) {
    console.log('Job:', result.data.job.position, 'at', result.data.job.company_name);
  }
}
```

### Fetch User Profile (cached)

Uses localStorage. If a cached profile for the user exists and is newer than `maxAgeMs`, it is returned without a request. Otherwise `fetchUserProfileV1` is called and the result is cached on success.

```typescript
const result = await fetchUserProfileV1Cached(
  { apiKey: 'your-api-key', userId: 4093819 },
  { maxAgeMs: 5 * 60 * 1000 }  // 5 minutes
);

if (result.error) {
  console.error('Error:', result.error);
} else if (result.data) {
  console.log('Name:', result.data.name);
}
```

## Behavior

- **Rate limit**: Only one request may **start** every 500ms. Multiple concurrent callers are queued and run with at least 500ms between starts.
- **Timeout**: Each attempt is aborted after 250ms. Timeouts are treated as retriable.
- **Retries**: On retriable errors (timeout, network, 429, 500–503), the client retries up to 3 times with exponential backoff before returning an error.

## Types

- `UserProfileV1` – Full profile (rank, level, life, status, job, faction, etc.; some nested fields optional).
- `FetchUserProfileV1Params` – `{ apiKey: string; userId: number | string }`.
- `FetchUserProfileV1Result` – `{ data: UserProfileV1 | null; error: string | null }`.
- `FetchUserProfileV1CachedOptions` – `{ maxAgeMs: number }` for cache freshness.

## Errors

- Invalid input (missing API key or user ID) returns immediately with no request.
- HTTP 4xx (except 429) and Torn API error payloads are not retried.
- After 4 failed attempts (1 initial + 3 retries), the last error message is returned.
