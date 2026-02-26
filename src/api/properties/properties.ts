export interface Property {
    name: string;
    cost: number;
    happy: number;
    upkeep: number;
    upgrades_available: string[];
    staff_available: string[];
}

export interface Properties {
    properties: Record<number, Property>;
}

export function fetchProperties(apiKey: string): Promise<Properties> {
    return fetch(`https://api.torn.com/torn/?selections=properties&key=${apiKey}`)
        .then(response => response.json())
        .then(data => data as Properties);
}

/* ********************************************************************************* */

export interface Rental {
    happy: number;
    cost: number;
    cost_per_day: number;
    rental_period: number;
    market_price: number;
    upkeep: number;
    modifications: string[];
    page: number | null;
}

export interface Rentals {
    listings: Rental[];
    property: {
        id: number;
        name: string;
    };
}

export interface RentalsResponse {
    rentals: Rentals;
    rentals_timestamp: number;
    _metadata: {
        links: {
            next: string;
            prev: string;
        };
    };
}


export async function fetchRentals(apiKey: string, propertyId: number): Promise<Rental[]> {
    let rentals: Rental[] = [];
    let offset = 0;
    while (true) {
        let url = `https://api.torn.com/v2/market/${propertyId}/rentals?offset=${offset}&limit=100&key=${apiKey}`;
        let response = await fetch(url);
        let data = await response.json();
        if(data.rentals.listings.length === 0) {
            break;
        }
        data.rentals.listings.forEach((l: Rental, index: number) => {
            const fullIndex = offset + index;
            l.page = fullIndex;
            rentals.push(l);
        });
        offset += 100;
    }
    return rentals;
}
