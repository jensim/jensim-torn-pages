import React from 'react';
import Button from '../Button';
import './BountiesFilter.css';

export type UserStatusState = 'Okay' | 'Hospital' | 'Jail' | 'Federal' | 'Traveling' | 'Abroad';

export interface FilterCriteria {
  minLevel: number | null;
  maxLevel: number | null;
  minReward: number | null;
  maxReward: number | null;
  minFairFight: number | null;
  maxFairFight: number | null;
  userStatus: UserStatusState | null;
  maxTimeRemaining: number | null;
}

interface BountiesFilterProps {
  filters: FilterCriteria;
  onFilterChange: (filters: FilterCriteria) => void;
}

const BountiesFilter: React.FC<BountiesFilterProps> = ({ filters, onFilterChange }) => {
  const handleInputChange = (field: keyof FilterCriteria, value: string) => {
    const numValue = value === '' ? null : Number(value);
    onFilterChange({ ...filters, [field]: numValue });
  };

  const handleStatusChange = (value: string) => {
    onFilterChange({
      ...filters,
      userStatus: value === '' ? null : (value as UserStatusState),
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

  return (
    <div className="bounties-filter">
      <div className="bounties-filter-header">
        <h3 className="bounties-filter-title">Filters</h3>
        <Button onClick={handleReset}>Reset Filters</Button>
      </div>

      <div className="bounties-filter-content">
        <div className="bounties-filter-grid">
          {/* Level Filter */}
          <div className="bounties-filter-group">
            <strong>Level</strong>
            <label className="bounties-filter-label">
              <span>Min</span>
              <input
                type="number"
                className="bounties-filter-input"
                value={filters.minLevel ?? ''}
                onChange={(e) => handleInputChange('minLevel', e.target.value)}
                placeholder="Min level"
                min="0"
              />
            </label>
            <label className="bounties-filter-label">
              <span>Max</span>
              <input
                type="number"
                className="bounties-filter-input"
                value={filters.maxLevel ?? ''}
                onChange={(e) => handleInputChange('maxLevel', e.target.value)}
                placeholder="Max level"
                min="0"
              />
            </label>
          </div>

          {/* Reward Filter */}
          <div className="bounties-filter-group">
            <strong>Reward</strong>
            <label className="bounties-filter-label">
              <span>Min ($)</span>
              <input
                type="number"
                className="bounties-filter-input"
                value={filters.minReward ?? ''}
                onChange={(e) => handleInputChange('minReward', e.target.value)}
                placeholder="Min reward"
                min="0"
              />
            </label>
            <label className="bounties-filter-label">
              <span>Max ($)</span>
              <input
                type="number"
                className="bounties-filter-input"
                value={filters.maxReward ?? ''}
                onChange={(e) => handleInputChange('maxReward', e.target.value)}
                placeholder="Max reward"
                min="0"
              />
            </label>
          </div>

          {/* Fair Fight Filter */}
          <div className="bounties-filter-group">
            <strong>Fair Fight</strong>
            <label className="bounties-filter-label">
              <span>Min</span>
              <input
                type="number"
                className="bounties-filter-input"
                value={filters.minFairFight ?? ''}
                onChange={(e) => handleInputChange('minFairFight', e.target.value)}
                placeholder="Min fair fight"
                min="0"
                step="0.1"
              />
            </label>
            <label className="bounties-filter-label">
              <span>Max</span>
              <input
                type="number"
                className="bounties-filter-input"
                value={filters.maxFairFight ?? ''}
                onChange={(e) => handleInputChange('maxFairFight', e.target.value)}
                placeholder="Max fair fight"
                min="0"
                step="0.1"
              />
            </label>
          </div>

          {/* User Status Filter */}
          <div className="bounties-filter-group">
            <strong>User Status</strong>
            <label className="bounties-filter-label">
              <span>Status</span>
              <select
                className="bounties-filter-select"
                value={filters.userStatus ?? ''}
                onChange={(e) => handleStatusChange(e.target.value)}
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
            <label className="bounties-filter-label">
              <span>Max Time Remaining (mins)</span>
              <input
                type="number"
                className="bounties-filter-input"
                value={filters.maxTimeRemaining ?? ''}
                onChange={(e) => handleInputChange('maxTimeRemaining', e.target.value)}
                placeholder="Max minutes"
                min="0"
                step="1"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BountiesFilter;
