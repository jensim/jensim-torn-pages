import { useEffect, useState } from "react";
import { fetchProperties, fetchRentals, Properties, Rental } from "../api";
import { usePassword } from "../hooks/usePassword";
import { PropertySelector } from "../components/property/propertySelector";
import { RentalsTable, SortBy } from "../components/property/RentalsTable";
import { PropertyRequirementsSelector } from "../components/property/PropertyRequirementsSelector";
import { useNavigate } from "react-router-dom";

export default function Rentals() {
    const { password: apiKey } = usePassword('torn-api-key');
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [properties, setProperties] = useState<Properties | null>(null);
    const [property, setProperty] = useState<number | null>(null);
    const [requiredMods, setRequiredMods] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<SortBy>(SortBy.COST_PER_DAY);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    useEffect(() => {
        if(!apiKey) return;
        setLoading(true);
        fetchProperties(apiKey)
            .then(setProperties)
            .finally(() => setLoading(false))
            .catch(setError);
    }, [apiKey]);

    useEffect(() => {
        if(!apiKey) return;
        if(!property) return;
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
          <div style={{ padding: '20px' }}>
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
        <br />
        {error && <p>{error}</p>}
        {loading && <p>Loading...</p>}
        {properties && 
          <PropertySelector 
            properties={properties} 
            onChange={setProperty} 
            selectedProperty={property} 
          />
        }
        {property && properties &&<PropertyRequirementsSelector 
          property={properties.properties[property]} 
          selectedRequirements={requiredMods} 
          onRequirementsChange={setRequiredMods} 
        />}

        {property && <RentalsTable 
          rentals={rentals} 
          propertyId={property ?? 0} 
          requiredMods={requiredMods} 
          sortBy={sortBy}
          setSort={setSortBy}
          sortDirection={sortDirection}
          setSortDirection={setSortDirection}
          maxPrice={null} 
          minHappy={null} 
          maxRentalPeriod={null} 
          minRentalPeriod={null} 
          maxCostPerDay={null} 
        />}
    </div>;
}