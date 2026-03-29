import React, { useState } from 'react';
import { CompanySpecialsFilterCriteria, StatType, defaultSpecialsFilters } from './types';
import BubbleSearch from '../BubbleSearch';
import './CompanySpecialsFilter.css';

interface CompanySpecialsFilterProps {
  filters: CompanySpecialsFilterCriteria;
  onFilterChange: (filters: CompanySpecialsFilterCriteria) => void;
}

const CompanySpecialsFilter: React.FC<CompanySpecialsFilterProps> = ({ filters, onFilterChange }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleStatToggle = (field: 'primaryGain' | 'secondaryGain', stat: StatType) => {
    const current = filters[field];
    const updated = current.includes(stat)
      ? current.filter((s) => s !== stat)
      : [...current, stat];
    onFilterChange({ ...filters, [field]: updated });
  };

  const handleNumberChange = (
    field: 'minStatPercentMan' | 'minStatPercentInt' | 'minStatPercentEnd',
    value: string
  ) => {
    onFilterChange({ ...filters, [field]: value === '' ? null : Number(value) });
  };

  const handleReset = () => {
    onFilterChange(defaultSpecialsFilters);
  };

  const statLabels: [StatType, string][] = [['man', 'MAN'], ['int', 'INT'], ['end', 'END']];

  return (
    <div className="company-specials-filter">
      <div className="company-specials-filter-header">
        <button
          className="company-specials-filter-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
        >
          <h3>Filters</h3>
          <svg
            className={`company-specials-filter-chevron${isExpanded ? '' : ' company-specials-filter-chevron--collapsed'}`}
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
          <button className="company-specials-filter-reset" onClick={handleReset}>
            Reset Filters
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="company-specials-filter-content">
          {/* Search */}
          <div className="company-specials-filter-group" style={{ marginBottom: '16px' }}>
            <strong>Search (specials or positions)</strong>
            <BubbleSearch
              values={filters.searchTerms}
              onChange={(searchTerms) => onFilterChange({ ...filters, searchTerms })}
              placeholder="Type and press Enter to search..."
            />
          </div>

          <div className="company-specials-filter-grid">
            {/* Primary Gain */}
            <div className="company-specials-filter-group">
              <strong>Primary Gain</strong>
              {statLabels.map(([stat, label]) => (
                <label key={stat} className="company-specials-filter-checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.primaryGain.includes(stat)}
                    onChange={() => handleStatToggle('primaryGain', stat)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>

            {/* Secondary Gain */}
            <div className="company-specials-filter-group">
              <strong>Secondary Gain</strong>
              {statLabels.map(([stat, label]) => (
                <label key={stat} className="company-specials-filter-checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.secondaryGain.includes(stat)}
                    onChange={() => handleStatToggle('secondaryGain', stat)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>

            {/* Min Stat % */}
            <div className="company-specials-filter-group">
              <strong>Min Stat % Fulfilled</strong>
              <label className="company-specials-filter-label">
                <span>MAN %</span>
                <input
                  className="company-specials-filter-input"
                  type="number"
                  value={filters.minStatPercentMan ?? ''}
                  onChange={(e) => handleNumberChange('minStatPercentMan', e.target.value)}
                  placeholder="%"
                  min="0"
                />
              </label>
              <label className="company-specials-filter-label">
                <span>INT %</span>
                <input
                  className="company-specials-filter-input"
                  type="number"
                  value={filters.minStatPercentInt ?? ''}
                  onChange={(e) => handleNumberChange('minStatPercentInt', e.target.value)}
                  placeholder="%"
                  min="0"
                />
              </label>
              <label className="company-specials-filter-label">
                <span>END %</span>
                <input
                  className="company-specials-filter-input"
                  type="number"
                  value={filters.minStatPercentEnd ?? ''}
                  onChange={(e) => handleNumberChange('minStatPercentEnd', e.target.value)}
                  placeholder="%"
                  min="0"
                />
              </label>
            </div>

            {/* Show Hidden */}
            <div className="company-specials-filter-group">
              <strong>Visibility</strong>
              <label className="company-specials-filter-checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.showHidden}
                  onChange={() => onFilterChange({ ...filters, showHidden: !filters.showHidden })}
                />
                <span>Show hidden companies</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanySpecialsFilter;
