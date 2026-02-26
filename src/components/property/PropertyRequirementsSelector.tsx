import { Property } from "../../api";

export interface PropertyRequirementsSelectorProps {
    property: Property;
    selectedRequirements: string[];
    onRequirementsChange: (requirements: string[]) => void;
}

export const PropertyRequirementsSelector = ({ onRequirementsChange, property, selectedRequirements }: PropertyRequirementsSelectorProps) => {
    const handleRequirementChange = (requirement: string) => {
        onRequirementsChange(selectedRequirements.includes(requirement) ? selectedRequirements.filter(r => r !== requirement) : [...selectedRequirements, requirement]);
    }
    return <div>
        <label>Requirements</label>
        <br />
        {property?.upgrades_available?.map((upgrade) => (
            <div key={upgrade}>
                <input type="checkbox" key={upgrade} value={upgrade} checked={selectedRequirements.includes(upgrade)} onChange={(e) => handleRequirementChange(e.target.value)} />
                <label>{upgrade}</label>
            </div>
        ))}
    </div>;
}