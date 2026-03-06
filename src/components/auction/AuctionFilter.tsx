import React from 'react';

export interface FilterCriteria {
  minPrice: number | null;
  maxPrice: number | null;
  rarity: string[];
  minAccuracy: number | null;
  maxAccuracy: number | null;
  minDamage: number | null;
  maxDamage: number | null;
  minArmor: number | null;
  maxArmor: number | null;
  minQuality: number | null;
  maxQuality: number | null;
  bonus: string[];
  minBonusValue: number | null;
  maxBonusValue: number | null;
  name: string;
  minTimeLeft: number | null;
  maxTimeLeft: number | null;
  type: string[];
  subType: string[];
}

interface FilterOptions {
  rarities: string[];
  bonuses: string[];
  types: string[];
  subTypes: string[];
}

interface AuctionFilterProps {
  filters: FilterCriteria;
  options: FilterOptions;
  onFilterChange: (filters: FilterCriteria) => void;
}

const AuctionFilter: React.FC<AuctionFilterProps> = ({ filters, options, onFilterChange }) => {
  const handleInputChange = (field: keyof FilterCriteria, value: string | number | null) => {
    onFilterChange({
      ...filters,
      [field]: value,
    });
  };

  const handleMultiSelectChange = (field: 'rarity' | 'bonus' | 'type' | 'subType', value: string) => {
    const currentValues = filters[field];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];
    onFilterChange({
      ...filters,
      [field]: newValues,
    });
  };

  const handleReset = () => {
    onFilterChange({
      minPrice: null,
      maxPrice: null,
      rarity: [],
      minAccuracy: null,
      maxAccuracy: null,
      minDamage: null,
      maxDamage: null,
      minArmor: null,
      maxArmor: null,
      minQuality: null,
      maxQuality: null,
      bonus: [],
      minBonusValue: null,
      maxBonusValue: null,
      name: '',
      minTimeLeft: null,
      maxTimeLeft: null,
      type: [],
      subType: [],
    });
  };

  const inputStyle: React.CSSProperties = {
    padding: '4px 8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    width: '100%',
    fontSize: '12px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    fontSize: '12px',
    fontWeight: '500',
  };

  const multiSelectContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    maxHeight: '100px',
    overflowY: 'auto',
    border: '1px solid #ddd',
    padding: '4px',
    borderRadius: '4px',
    backgroundColor: '#fff',
  };

  const checkboxLabelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    whiteSpace: 'nowrap',
  };

  return (
    <div style={{
      padding: '12px',
      backgroundColor: '#f9f9f9',
      borderRadius: '8px',
      marginBottom: '16px',
      border: '1px solid #eee',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h4 style={{ margin: 0 }}>Filter Listings</h4>
        <button
          onClick={handleReset}
          style={{
            padding: '4px 8px',
            fontSize: '12px',
            cursor: 'pointer',
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        >
          Reset
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        {/* Name Filter */}
        <div style={labelStyle}>
          <span>Name</span>
          <input
            type="text"
            value={filters.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Search name..."
            style={inputStyle}
          />
        </div>

        {/* Price Filter */}
        <div style={labelStyle}>
          <span>Price</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <input
              type="number"
              value={filters.minPrice ?? ''}
              onChange={(e) => handleInputChange('minPrice', e.target.value === '' ? null : Number(e.target.value))}
              placeholder="Min"
              style={inputStyle}
            />
            <input
              type="number"
              value={filters.maxPrice ?? ''}
              onChange={(e) => handleInputChange('maxPrice', e.target.value === '' ? null : Number(e.target.value))}
              placeholder="Max"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Accuracy Filter */}
        <div style={labelStyle}>
          <span>Accuracy</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <input
              type="number"
              value={filters.minAccuracy ?? ''}
              onChange={(e) => handleInputChange('minAccuracy', e.target.value === '' ? null : Number(e.target.value))}
              placeholder="Min"
              style={inputStyle}
            />
            <input
              type="number"
              value={filters.maxAccuracy ?? ''}
              onChange={(e) => handleInputChange('maxAccuracy', e.target.value === '' ? null : Number(e.target.value))}
              placeholder="Max"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Damage Filter */}
        <div style={labelStyle}>
          <span>Damage</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <input
              type="number"
              value={filters.minDamage ?? ''}
              onChange={(e) => handleInputChange('minDamage', e.target.value === '' ? null : Number(e.target.value))}
              placeholder="Min"
              style={inputStyle}
            />
            <input
              type="number"
              value={filters.maxDamage ?? ''}
              onChange={(e) => handleInputChange('maxDamage', e.target.value === '' ? null : Number(e.target.value))}
              placeholder="Max"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Armor Filter */}
        <div style={labelStyle}>
          <span>Armor</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <input
              type="number"
              value={filters.minArmor ?? ''}
              onChange={(e) => handleInputChange('minArmor', e.target.value === '' ? null : Number(e.target.value))}
              placeholder="Min"
              style={inputStyle}
            />
            <input
              type="number"
              value={filters.maxArmor ?? ''}
              onChange={(e) => handleInputChange('maxArmor', e.target.value === '' ? null : Number(e.target.value))}
              placeholder="Max"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Quality Filter */}
        <div style={labelStyle}>
          <span>Quality</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <input
              type="number"
              value={filters.minQuality ?? ''}
              onChange={(e) => handleInputChange('minQuality', e.target.value === '' ? null : Number(e.target.value))}
              placeholder="Min"
              style={inputStyle}
            />
            <input
              type="number"
              value={filters.maxQuality ?? ''}
              onChange={(e) => handleInputChange('maxQuality', e.target.value === '' ? null : Number(e.target.value))}
              placeholder="Max"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Bonus Value Filter */}
        <div style={labelStyle}>
          <span>Bonus Value</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <input
              type="number"
              value={filters.minBonusValue ?? ''}
              onChange={(e) => handleInputChange('minBonusValue', e.target.value === '' ? null : Number(e.target.value))}
              placeholder="Min"
              style={inputStyle}
            />
            <input
              type="number"
              value={filters.maxBonusValue ?? ''}
              onChange={(e) => handleInputChange('maxBonusValue', e.target.value === '' ? null : Number(e.target.value))}
              placeholder="Max"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Time Left Filter */}
        <div style={labelStyle}>
          <span>Time Left (min)</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <input
              type="number"
              value={filters.minTimeLeft ?? ''}
              onChange={(e) => handleInputChange('minTimeLeft', e.target.value === '' ? null : Number(e.target.value))}
              placeholder="Min"
              style={inputStyle}
            />
            <input
              type="number"
              value={filters.maxTimeLeft ?? ''}
              onChange={(e) => handleInputChange('maxTimeLeft', e.target.value === '' ? null : Number(e.target.value))}
              placeholder="Max"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Rarity Multi-select */}
        <div style={labelStyle}>
          <span>Rarity</span>
          <div style={multiSelectContainerStyle}>
            {options.rarities.map((r) => (
              <label key={r} style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={filters.rarity.includes(r)}
                  onChange={() => handleMultiSelectChange('rarity', r)}
                />
                {r}
              </label>
            ))}
          </div>
        </div>

        {/* Type Multi-select */}
        <div style={labelStyle}>
          <span>Type</span>
          <div style={multiSelectContainerStyle}>
            {options.types.map((t) => (
              <label key={t} style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={filters.type.includes(t)}
                  onChange={() => handleMultiSelectChange('type', t)}
                />
                {t}
              </label>
            ))}
          </div>
        </div>

        {/* Sub-Type Multi-select */}
        <div style={labelStyle}>
          <span>Sub-Type</span>
          <div style={multiSelectContainerStyle}>
            {options.subTypes.map((st) => (
              <label key={st} style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={filters.subType.includes(st)}
                  onChange={() => handleMultiSelectChange('subType', st)}
                />
                {st}
              </label>
            ))}
          </div>
        </div>

        {/* Bonus Multi-select */}
        <div style={labelStyle}>
          <span>Bonuses</span>
          <div style={multiSelectContainerStyle}>
            {options.bonuses.map((b) => (
              <label key={b} style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={filters.bonus.includes(b)}
                  onChange={() => handleMultiSelectChange('bonus', b)}
                />
                {b}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionFilter;
