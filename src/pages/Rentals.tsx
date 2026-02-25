import { useEffect, useState } from "react";
import { fetchProperties, fetchRentals, Properties, Property, Rental } from "../api";
import { usePassword } from "../hooks/usePassword";
import { PropertySelector } from "../components/property/propertySelector";

export default function Rentals() {
    const { password: apiKey } = usePassword('torn-api-key');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [properties, setProperties] = useState<Properties | null>(null);
    const [property, setProperty] = useState<string | null>(null);


    useEffect(() => {
        if(!apiKey) return;
        fetchProperties(apiKey)
            .then(setProperties)
            .catch(setError);
    }, [apiKey]);

    useEffect(() => {
        if(!apiKey) return;
        if(!property) return;
        setLoading(true);
        fetchRentals(apiKey, property)
            .then(setRentals)
            .catch(setError)
            .finally(() => setLoading(false));
    }, [apiKey, property]);

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

        {JSON.stringify(rentals, null, 2)}
    </div>;
}