# Torn User Basic API

API module for fetching user basic information from the Torn API v2.

## Overview

This module provides functions to fetch basic user profile information from the Torn API v2 `user/{target_id}/basic` endpoint. It handles authentication via API key headers and provides comprehensive error handling.

## Features

- Fetch basic profile information for a single user
- Fetch basic information for multiple users with progress tracking
- TypeScript type definitions for all API responses
- Comprehensive error handling
- Full test coverage

## API Endpoints Used

- **User Basic Info**: `GET https://api.torn.com/v2/user/{target_id}/basic?striptags=true`

## Authentication

The Torn API v2 uses header-based authentication:

```
Authorization: ApiKey {your-torn-api-key}
```

## Usage

### Importing

```typescript
import {
  fetchUserBasic,
  fetchMultipleUsersBasic,
  UserBasicResponse,
  FetchUserBasicResult,
} from './api/tornUserBasic';
```

### Fetch Single User

```typescript
const result = await fetchUserBasic({
  apiKey: 'your-api-key',
  targetId: 3969263,
});

if (result.error) {
  console.error('Error:', result.error);
} else {
  console.log('User:', result.data?.profile.name);
  console.log('Level:', result.data?.profile.level);
  console.log('Status:', result.data?.profile.status.state);
}
```

### Fetch Multiple Users

```typescript
const result = await fetchMultipleUsersBasic(
  'your-api-key',
  [123456, 789012, 345678],
  (current, total) => {
    console.log(`Fetching user ${current} of ${total}`);
  }
);

if (result.error) {
  console.warn('Some errors occurred:', result.error);
}

result.data.forEach(userData => {
  console.log(`${userData.profile.name} - Level ${userData.profile.level}`);
});
```

## Type Definitions

### UserBasicResponse

```typescript
interface UserBasicResponse {
  profile: UserProfile;
}
```

### UserProfile

```typescript
interface UserProfile {
  id: number;
  name: string;
  level: number;
  gender: string;
  status: UserStatus;
}
```

### UserStatus

```typescript
interface UserStatus {
  description: string;
  details: string;
  state: string;
  color: string;
  until: number; // Unix timestamp
}
```

### FetchUserBasicResult

```typescript
interface FetchUserBasicResult {
  data: UserBasicResponse | null;
  error: string | null;
}
```

## Common Status States

The `status.state` field can include:

- `"Okay"` - User is online and available
- `"Hospital"` - User is in hospital
- `"Jail"` - User is in jail
- `"Traveling"` - User is traveling
- `"Abroad"` - User is abroad
- `"Federal"` - User is in federal jail

## Common Status Colors

The `status.color` field indicates urgency:

- `"green"` - Normal state
- `"red"` - Hospital/Jail/Federal
- `"blue"` - Traveling/Abroad

## Error Handling

The module provides comprehensive error handling for:

1. **Validation Errors**: Missing API key or target ID
2. **HTTP Errors**: Network issues, 404s, 500s, etc.
3. **Torn API Errors**: Invalid API key, user not found, rate limiting
4. **Unknown Errors**: Unexpected failures

All errors are returned in the `error` field of the result object:

```typescript
interface FetchUserBasicResult {
  data: UserBasicResponse | null;
  error: string | null;
}
```

### Common Torn API Error Codes

- `2` - Incorrect API key
- `6` - Incorrect ID value
- `8` - IP block (rate limited)
- `16` - Access level of this key is not high enough

## Example Response

```json
{
  "profile": {
    "id": 3969263,
    "name": "Sponch",
    "level": 17,
    "gender": "Male",
    "status": {
      "description": "In hospital for 82 hrs 51 mins ",
      "details": "Overdosed on Xanax",
      "state": "Hospital",
      "color": "red",
      "until": 1770170325
    }
  }
}
```

## Testing

The module includes comprehensive unit tests covering:

- Successful API calls
- String and numeric target IDs
- Missing required parameters
- HTTP errors
- Torn API errors
- Network failures
- Multiple user fetching
- Progress callbacks

Run tests with:

```bash
npm test tornUserBasic.test.ts
```

## Best Practices

1. **API Key Security**: Never hardcode API keys in your source code
2. **Rate Limiting**: Be mindful of Torn API rate limits when fetching multiple users
3. **Error Handling**: Always check the `error` field before accessing `data`
4. **Progress Tracking**: Use progress callbacks for better UX when fetching multiple users

## Related Modules

- `tornBounties.ts` - Fetches bounty listings from Torn
- `ffScouter.ts` - FF scouting functionality

## References

- [Torn API Documentation](https://www.torn.com/api.html)
- [Torn API v2 Documentation](https://www.torn.com/api.html#v2)
