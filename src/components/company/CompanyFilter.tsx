import React, { useState } from 'react';
import { CompanyFilterCriteria, defaultCompanyFilters } from './types';
import './CompanyFilter.css';

interface CompanyFilterProps {
  companyTypes: Record<string, { name: string }>;
  filters: CompanyFilterCriteria;
  onFilterChange: (filters: CompanyFilterCriteria) => void;
  onLoadDetails: () => void;
  detailsLoading: boolean;
}

const CompanyFilter: React.FC<CompanyFilterProps> = ({
  companyTypes,
  filters,
  onFilterChange,
  onLoadDetails,
  detailsLoading,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleTypeChange = (value: string) => {
    onFilterChange({
      ...filters,
      companyTypeId: value === '' ? null : value,
    });
  };

  const handleNumberChange = (field: 'minStars' | 'maxStars' | 'minOpenPositions' | 'daysInactivity', value: string) => {
    if (field === 'daysInactivity') {
      onFilterChange({ ...filters, [field]: value === '' ? 3 : Number(value) });
    } else {
      onFilterChange({ ...filters, [field]: value === '' ? null : Number(value) });
    }
  };

  const handleCheckboxChange = (field: 'excludeInactiveDirector' | 'countInactiveAsFreeSpot') => {
    onFilterChange({ ...filters, [field]: !filters[field] });
  };

  const handleReset = () => {
    onFilterChange(defaultCompanyFilters);
  };

  const sortedTypeEntries = Object.entries(companyTypes).sort((a, b) =>
    a[1].name.localeCompare(b[1].name)
  );

  return (
    <div className="company-filter">
      <div className="company-filter-header">
        <button
          className="company-filter-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
        >
          <h3>Filters</h3>
          <svg
            className={`company-filter-chevron${isExpanded ? '' : ' company-filter-chevron--collapsed'}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {isExpanded && (
          <button className="company-filter-reset" onClick={handleReset}>
            Reset Filters
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="company-filter-content">
          <div className="company-filter-grid">
            {/* Company Type */}
            <div className="company-filter-group">
              <strong>Company Type</strong>
              <label className="company-filter-label">
                <span>Type</span>
                <select
                  className="company-filter-select"
                  value={filters.companyTypeId ?? ''}
                  onChange={(e) => handleTypeChange(e.target.value)}
                >
                  <option value="">Select a type...</option>
                  {sortedTypeEntries.map(([id, info]) => (
                    <option key={id} value={id}>
                      {info.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Stars */}
            <div className="company-filter-group">
              <strong>Stars</strong>
              <label className="company-filter-label">
                <span>Min</span>
                <input
                  className="company-filter-input"
                  type="number"
                  value={filters.minStars ?? ''}
                  onChange={(e) => handleNumberChange('minStars', e.target.value)}
                  placeholder="Min"
                  min="0"
                  max="10"
                />
              </label>
              <label className="company-filter-label">
                <span>Max</span>
                <input
                  className="company-filter-input"
                  type="number"
                  value={filters.maxStars ?? ''}
                  onChange={(e) => handleNumberChange('maxStars', e.target.value)}
                  placeholder="Max"
                  min="0"
                  max="10"
                />
              </label>
            </div>

            {/* Positions */}
            <div className="company-filter-group">
              <strong>Positions</strong>
              <label className="company-filter-label">
                <span>Min open positions</span>
                <input
                  className="company-filter-input"
                  type="number"
                  value={filters.minOpenPositions ?? ''}
                  onChange={(e) => handleNumberChange('minOpenPositions', e.target.value)}
                  placeholder="Min"
                  min="0"
                />
              </label>
            </div>

            {/* Activity Filters */}
            <div className="company-filter-group">
              <strong>Activity</strong>
              <label className="company-filter-label">
                <span>Days inactivity</span>
                <input
                  className="company-filter-input"
                  type="number"
                  value={filters.daysInactivity}
                  onChange={(e) => handleNumberChange('daysInactivity', e.target.value)}
                  placeholder="Days"
                  min="1"
                />
              </label>
              <label className="company-filter-checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.excludeInactiveDirector}
                  onChange={() => handleCheckboxChange('excludeInactiveDirector')}
                />
                <span>Exclude inactive director</span>
              </label>
              <label className="company-filter-checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.countInactiveAsFreeSpot}
                  onChange={() => handleCheckboxChange('countInactiveAsFreeSpot')}
                />
                <span>Count inactive as free spot</span>
              </label>
            </div>
          </div>

          {/* Load Details button */}
          <div className="company-filter-actions">
            <button
              className="company-filter-button"
              onClick={onLoadDetails}
              disabled={detailsLoading || !filters.companyTypeId}
            >
              {detailsLoading ? 'Loading Details...' : 'Load Company Details'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyFilter;
