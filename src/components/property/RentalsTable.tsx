import { useMemo } from "react";
import { Rental } from "../../api";
import { FormattedNumber, FormattedPrice } from "../FormattedNumber";
import './RentalsTable.css';

export enum SortBy {
    COST = 'cost',
    COST_PER_DAY = 'cost_per_day',
    RENTAL_PERIOD = 'rental_period',
    MARKET_PRICE = 'market_price',
    UPKEEP = 'upkeep',
    HAPPY = 'happy',
}

export interface RentalsTableProps {
    propertyId: number;
    rentals: Rental[];
    requiredMods: string[];
    maxPrice: number | null;
    minHappy: number | null;
    maxRentalPeriod: number | null;
    minRentalPeriod: number | null;
    maxCostPerDay: number | null;
    sortBy: SortBy;
    setSort: (sortBy: SortBy) => void;
    sortDirection: 'asc' | 'desc';
    setSortDirection: (sortDirection: 'asc' | 'desc') => void;
}

export const RentalsTable = ({ propertyId, rentals, requiredMods, maxPrice, minHappy, maxRentalPeriod, minRentalPeriod, maxCostPerDay, sortBy, setSort, sortDirection, setSortDirection }: RentalsTableProps) => {
    const filteredRentals = useMemo(() => {
        return rentals.filter((rental) => {
            return (requiredMods.length === 0 || requiredMods.every(mod => rental.modifications.includes(mod))) &&
                (maxPrice === null || rental.cost <= maxPrice) &&
                (minHappy === null || rental.happy >= minHappy) &&
                (maxRentalPeriod === null || rental.rental_period <= maxRentalPeriod) &&
                (minRentalPeriod === null || rental.rental_period >= minRentalPeriod) &&
                (maxCostPerDay === null || rental.cost_per_day <= maxCostPerDay);
        });
    }, [rentals, maxPrice, minHappy, maxRentalPeriod, minRentalPeriod, maxCostPerDay, requiredMods]);
    const sortedRentals = useMemo(() => {
        return filteredRentals.sort((a, b) => {
            return sortDirection === 'asc' ? a[sortBy] - b[sortBy] : b[sortBy] - a[sortBy];
        });
    }, [filteredRentals, sortBy, sortDirection]);
    const handleSort = (sortBy: SortBy) => {
        setSort(sortBy);
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    }

    return <table>
        <thead>
            <tr>
                <th onClick={() => handleSort(SortBy.COST)}>
                    Cost {sortBy === SortBy.COST ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th onClick={() => handleSort(SortBy.COST_PER_DAY)}>
                    Cost per day {sortBy === SortBy.COST_PER_DAY ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th onClick={() => handleSort(SortBy.UPKEEP)}>
                    Upkeep {sortBy === SortBy.UPKEEP ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th>Upkeep+CostPerDay</th>
                <th onClick={() => handleSort(SortBy.RENTAL_PERIOD)}>
                    Rental period {sortBy === SortBy.RENTAL_PERIOD ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th onClick={() => handleSort(SortBy.MARKET_PRICE)}>
                    Market price {sortBy === SortBy.MARKET_PRICE ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th onClick={() => handleSort(SortBy.HAPPY)}>
                    Happy {sortBy === SortBy.HAPPY ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th>Page</th>
                <th>Modifications</th>
            </tr>
        </thead>
        <tbody>
            {sortedRentals.map((rental, index) => (
                <tr key={index} className={index % 2 === 0 ? 'even' : 'odd'}>
                    <td><FormattedPrice price={rental.cost} /></td>
                    <td><FormattedPrice price={rental.cost_per_day} /></td>
                    <td><FormattedPrice price={rental.upkeep} /></td>
                    <td><FormattedPrice price={rental.upkeep + rental.cost_per_day} /></td>
                    <td>{rental.rental_period}</td>
                    <td><FormattedPrice price={rental.market_price} /></td>
                    <td><FormattedNumber number={rental.happy} /></td>
                    <td>
                        <a href={'https://www.torn.com/properties.php?step=rentalmarket#/property=' + propertyId + '&start=' + rental.page}
                            target="_blank"
                            rel="noopener noreferrer"
                        >{rental.page}</a>
                    </td>
                    <td>{rental.modifications.join(', ')}</td>
                </tr>
            ))}
        </tbody>
    </table>;
}
