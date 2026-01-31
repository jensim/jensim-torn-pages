import React from 'react';

export interface FilterCriteria {
  minLevel: number | null;
  maxLevel: number | null;
  minReward: number | null;
  maxReward: number | null;
  minFairFight: number | null;
  maxFairFight: number | null;
  userStatus: string | null;
  maxTimeRemaining: number | null;
}

interface BountiesFilterProps {
  filters: FilterCriteria;
  onFilterChange: (filters: FilterCriteria) => void;
}

const BountiesFilter: React.FC<BountiesFilterProps> = ({ filters, onFilterChange }) => {
  const handleInputChange = (field: keyof FilterCriteria, value: string) => {
    const numValue = value === '' ? null : Number(value);
    onFilterChange({
      ...filters,
      [field]: numValue,
    });
  };

  const handleReset = () => {
    onFilterChange({
      minLevel: null,
      maxLevel: null,
      minReward: null,
      maxReward: null,
      minFairFight: null,
      maxFairFight: null,
      userStatus: null,
      maxTimeRemaining: null,
    });
  };

  const handleStatusChange = (value: string) => {
    onFilterChange({
      ...filters,
      userStatus: value === '' ? null : value,
    });
  };

  const inputStyle: React.CSSProperties = {
    padding: '6px 8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    width: '100px',
    fontSize: '14px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '14px',
    fontWeight: '500',
  };

  const filterGroupStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  };

  return (
    <div style={{
      padding: '16px',
      backgroundColor: '#f5f5f5',
      borderRadius: '8px',
      marginBottom: '20px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0 }}>Filters</h3>
        <button
          onClick={handleReset}
          style={{
            padding: '6px 12px',
            fontSize: '14px',
            cursor: 'pointer',
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        >
          Reset Filters
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {/* Level Filter */}
        <div style={filterGroupStyle}>
          <strong>Level</strong>
          <label style={labelStyle}>
            <span>Min</span>
            <input
              type="number"
              value={filters.minLevel ?? ''}
              onChange={(e) => handleInputChange('minLevel', e.target.value)}
              placeholder="Min level"
              style={inputStyle}
              min="0"
            />
          </label>
          <label style={labelStyle}>
            <span>Max</span>
            <input
              type="number"
              value={filters.maxLevel ?? ''}
              onChange={(e) => handleInputChange('maxLevel', e.target.value)}
              placeholder="Max level"
              style={inputStyle}
              min="0"
            />
          </label>
        </div>

        {/* Reward Filter */}
        <div style={filterGroupStyle}>
          <strong>Reward</strong>
          <label style={labelStyle}>
            <span>Min ($)</span>
            <input
              type="number"
              value={filters.minReward ?? ''}
              onChange={(e) => handleInputChange('minReward', e.target.value)}
              placeholder="Min reward"
              style={inputStyle}
              min="0"
            />
          </label>
          <label style={labelStyle}>
            <span>Max ($)</span>
            <input
              type="number"
              value={filters.maxReward ?? ''}
              onChange={(e) => handleInputChange('maxReward', e.target.value)}
              placeholder="Max reward"
              style={inputStyle}
              min="0"
            />
          </label>
        </div>

        {/* Fair Fight Filter */}
        <div style={filterGroupStyle}>
          <strong>Fair Fight</strong>
          <label style={labelStyle}>
            <span>Min</span>
            <input
              type="number"
              value={filters.minFairFight ?? ''}
              onChange={(e) => handleInputChange('minFairFight', e.target.value)}
              placeholder="Min fair fight"
              style={inputStyle}
              min="0"
              step="0.1"
            />
          </label>
          <label style={labelStyle}>
            <span>Max</span>
            <input
              type="number"
              value={filters.maxFairFight ?? ''}
              onChange={(e) => handleInputChange('maxFairFight', e.target.value)}
              placeholder="Max fair fight"
              style={inputStyle}
              min="0"
              step="0.1"
            />
          </label>
        </div>

        {/* User Status Filter */}
        <div style={filterGroupStyle}>
          <strong>User Status</strong>
          <label style={labelStyle}>
            <span>Status</span>
            <select
              value={filters.userStatus ?? ''}
              onChange={(e) => handleStatusChange(e.target.value)}
              style={{
                ...inputStyle,
                width: 'auto',
                minWidth: '150px',
              }}
            >
              <option value="">All Statuses</option>
              <option value="Okay">Okay</option>
              <option value="Hospital">Hospital</option>
              <option value="Jail">Jail</option>
              <option value="Federal">Federal</option>
              <option value="Traveling">Traveling</option>
              <option value="Abroad">Abroad</option>
            </select>
          </label>
          <label style={labelStyle}>
            <span>Max Time Remaining (mins)</span>
            <input
              type="number"
              value={filters.maxTimeRemaining ?? ''}
              onChange={(e) => handleInputChange('maxTimeRemaining', e.target.value)}
              placeholder="Max minutes"
              style={inputStyle}
              min="0"
              step="1"
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default BountiesFilter;
