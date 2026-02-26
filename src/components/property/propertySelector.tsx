import { Properties } from "../../api";

export interface PropertySelectorProps {
    properties: Properties;
    onChange: (property: number) => void;
    selectedProperty: number | null;
}

export const PropertySelector = ({ properties, onChange, selectedProperty }: PropertySelectorProps) => {
    const propertyOptions = Object.keys(properties.properties).map((propertyKey) => {
        const property = properties.properties[parseInt(propertyKey)];
        return <option key={propertyKey} value={parseInt(propertyKey)} selected={selectedProperty === parseInt(propertyKey)}>{property.name}</option>
    });
    return <div>
        <label>Property</label>
        <br />
        <select onChange={(e) => onChange(parseInt(e.target.value))}>
            {propertyOptions}
        </select>
    </div>
        ;
}