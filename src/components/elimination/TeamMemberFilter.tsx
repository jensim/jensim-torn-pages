import React from 'react';

export interface Filters {
  minLevel: number | '';
  maxLevel: number | '';
  minFairFight: number | '';
  maxFairFight: number | '';
  userStatus: string;
}

interface TeamMemberFilterProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  onReload: () => void;
}

export const TeamMemberFilter: React.FC<TeamMemberFilterProps> = ({
  filters,
  onFilterChange,
  onReload,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    onFilterChange({
      ...filters,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
    });
  };

  return (
    <div className="filter-area" style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <label htmlFor="minLevel">Min Level: </label>
          <input
            id="minLevel"
            name="minLevel"
            type="number"
            value={filters.minLevel}
            onChange={handleChange}
            style={{ width: '60px' }}
          />
        </div>
        <div>
          <label htmlFor="maxLevel">Max Level: </label>
          <input
            id="maxLevel"
            name="maxLevel"
            type="number"
            value={filters.maxLevel}
            onChange={handleChange}
            style={{ width: '60px' }}
          />
        </div>
        <div>
          <label htmlFor="minFairFight">Min FF: </label>
          <input
            id="minFairFight"
            name="minFairFight"
            type="number"
            step="0.1"
            value={filters.minFairFight}
            onChange={handleChange}
            style={{ width: '60px' }}
          />
        </div>
        <div>
          <label htmlFor="maxFairFight">Max FF: </label>
          <input
            id="maxFairFight"
            name="maxFairFight"
            type="number"
            step="0.1"
            value={filters.maxFairFight}
            onChange={handleChange}
            style={{ width: '60px' }}
          />
        </div>
        <div>
          <label htmlFor="userStatus">Status: </label>
          <input
            id="userStatus"
            name="userStatus"
            type="text"
            value={filters.userStatus}
            onChange={handleChange}
            placeholder="e.g. Okay, Jail..."
          />
        </div>
      </div>
      <button onClick={onReload} style={{ alignSelf: 'flex-start', padding: '5px 15px' }}>
        Reload Selected Pages
      </button>
    </div>
  );
};
