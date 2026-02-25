import { UserProfileV1 } from "../api/user/tornUserProfileV1";

const min = 60;
const hour = 60 * min;
let landing_times_seconds: Record<string, number[]> = {
  "Mexico": [
    26 * min,
    18 * min
  ],
  "Cayman Islands": [
    35 * min,
    25 * min
  ],
  "Canada": [
    41 * min,
    29 * min
  ],
  "Hawaii": [
    2 * hour + 14 * min,
    1 * hour + 34 * min
  ],
  "United Kingdom": [
    2 * hour + 39 * min,
    1 * hour + 51 * min
  ],
  "Argentina": [
    2 * hour + 47 * min,
    1 * hour + 57 * min
  ],
  "Switzerland": [
    2 * hour + 55 * min,
    2 * hour + 3 * min
  ],
  "Japan": [
    3 * hour + 45 * min,
    2 * hour + 38 * min
  ],
  "China": [
    4 * hour + 2 * min,
    2 * hour + 49 * min
  ],
  "UAE": [
    4 * hour + 31 * min,
    3 * hour + 10 * min
  ],
  "South Africa": [
    4 * hour + 57 * min,
    3 * hour + 28 * min
  ],
}
const returningToTornFrom = 'Returning to Torn from ';
const travelingString = 'Traveling to ';

export function getTimeUntil(userStatus?: UserProfileV1): number | undefined {
  console.log('userStatus', userStatus);
  if (!userStatus) return undefined;
  if (!userStatus.status.description) {
    return userStatus.status.until;
  }
  let country: string | undefined;
  if (userStatus.status.description.startsWith(travelingString)) {
    console.log('travelingString', travelingString);
    country = userStatus.status.description.substring(travelingString.length);
  } else if (userStatus.status.description.startsWith(returningToTornFrom)) {
    console.log('returningToTornFrom', returningToTornFrom);
    country = userStatus.status.description.substring(returningToTornFrom.length);
  }
  if (country) {
    const isPi = userStatus.property === 'Private Island';
    const lastAction = userStatus.last_action?.timestamp;
    if (!lastAction) return undefined;
    const flightTimeSeconds = landing_times_seconds[country][isPi ? 0 : 1];
    return flightTimeSeconds + lastAction;
  }
  if(!(userStatus?.status?.until)) {
    return undefined;
  }
  return userStatus.status.until;
}