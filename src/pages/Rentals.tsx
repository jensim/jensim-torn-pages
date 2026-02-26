import {useEffect, useState} from "react";
import {fetchProperties, fetchRentals, Properties, Rental} from "../api";
import {usePassword} from "../hooks/usePassword";
import {PropertySelector} from "../components/property/propertySelector";
import {RentalsTable, SortBy} from "../components/property/RentalsTable";
import {PropertyRequirementsSelector} from "../components/property/PropertyRequirementsSelector";
import {useNavigate} from "react-router-dom";

export default function Rentals() {
    const {password: apiKey} = usePassword('torn-api-key');
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [properties, setProperties] = useState<Properties | null>(null);
    const [property, setProperty] = useState<number | null>(null);
    const [requiredMods, setRequiredMods] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<SortBy>(SortBy.DAILY_COST_PER_HAPPY);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const [maxPrice, setMaxPrice] = useState<number | null>(null);
    const [minHappy, setMinHappy] = useState<number | null>(null);
    const [maxRentalPeriod, setMaxRentalPeriod] = useState<number | null>(null);
    const [minRentalPeriod, setMinRentalPeriod] = useState<number | null>(null);
    const [maxCostPerDay, setMaxCostPerDay] = useState<number | null>(null);

    useEffect(() => {
        if (!apiKey) return;
        setLoading(true);
        fetchProperties(apiKey)
            .then(setProperties)
            .finally(() => setLoading(false))
            .catch(setError);
    }, [apiKey]);

    useEffect(() => {
        if (!apiKey) return;
        if (!property) return;
        setLoading(true);
        setRequiredMods([]);
        setRentals([]);
        fetchRentals(apiKey, property)
            .then(setRentals)
            .catch(setError)
            .finally(() => setLoading(false));
    }, [apiKey, property]);

    if (!apiKey) {
        return (
            <div style={{padding: '20px'}}>
                <h2>Torn Rentals</h2>
                <p>Please set your Torn API key in the Settings page to view rentals.</p>
                <button
                    onClick={() => navigate('/settings')}
                    style={{
                        padding: '8px 16px',
                        cursor: 'pointer',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        opacity: 1,
                    }}
                >
                    Go to Settings
                </button>
            </div>
        );
    }


    return <div>
        <h1>Rentals</h1>
        <br/>
        {error && <p>{error}</p>}
        {loading && <p>Loading...</p>}
        {properties &&
            <PropertySelector
                properties={properties}
                onChange={setProperty}
                selectedProperty={property}
            />
        }
        {property && properties && <div
            style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
            <PropertyRequirementsSelector
                property={properties.properties[property]}
                selectedRequirements={requiredMods}
                onRequirementsChange={setRequiredMods}
            />
            <div>
                <label>Max Price: </label>
                <input id={"maxPrice"}
                       type="number"
                       step="100000"
                       value={maxPrice?.toString()}
                       onChange={(e) => setMaxPrice(e.target.value === '' ? null : parseInt(e.target.value))}
                />
            </div>
            <div>
                <label>Min Happy: </label>
                <input id={"minHappy"}
                       type="number"
                       step="100"
                       value={minHappy?.toString()}
                       onChange={(e) => setMinHappy(e.target.value === '' ? null : parseInt(e.target.value))}
                />
            </div>
            <div>
                <label>Max Rental Period: </label>
                <input id={"maxRentalPeriod"}
                       type="number"
                       value={maxRentalPeriod?.toString()}
                       onChange={(e) => setMaxRentalPeriod(e.target.value === '' ? null : parseInt(e.target.value))}
                />
            </div>
            <div>
                <label>Min Rental Period: </label>
                <input id={"minRentalPeriod"}
                       type="number"
                       value={minRentalPeriod?.toString()}
                       onChange={(e) => setMinRentalPeriod(e.target.value === '' ? null : parseInt(e.target.value))}
                />
            </div>
            <div>
                <label>Max Cost Per Day: </label>
                <input id={"maxCostPerDay"}
                       type="number"
                       step="100000"
                       value={maxCostPerDay?.toString()}
                       onChange={(e) => setMaxCostPerDay(e.target.value === '' ? null : parseInt(e.target.value))}
                />
            </div>
        </div>}

        {property && <RentalsTable
            rentals={rentals}
            propertyId={property ?? 0}
            requiredMods={requiredMods}
            sortBy={sortBy}
            setSort={setSortBy}
            sortDirection={sortDirection}
            setSortDirection={setSortDirection}
            maxPrice={maxPrice}
            minHappy={minHappy}
            maxRentalPeriod={maxRentalPeriod}
            minRentalPeriod={minRentalPeriod}
            maxCostPerDay={maxCostPerDay}
        />}
    </div>;
}