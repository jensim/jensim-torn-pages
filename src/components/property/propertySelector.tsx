import { Properties } from "../../api";

export interface PropertySelectorProps {
    properties: Properties;
    onChange: (property: string) => void;
    selectedProperty: string | null;
}

export const PropertySelector = ({ properties, onChange, selectedProperty }: PropertySelectorProps) => {
    const propertyOptions = Object.keys(properties.properties).map((propertyKey) => {
        const property = properties.properties[parseInt(propertyKey)];
        return <option key={propertyKey} value={propertyKey} selected={selectedProperty === propertyKey}>{property.name}</option>
    });
    return <div>
        <label>Property</label>
        <br />
        <select onChange={(e) => onChange(e.target.value)}>
            {propertyOptions}
        </select>
    </div>
        ;
}