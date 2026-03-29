# Company Specials Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Company Specials page listing all company types with their specials, expandable position subtables, and filters for stat gains and player work stat coverage.

**Architecture:** Page orchestrates state and filtering. CompanySpecialsFilter handles the collapsible filter UI. CompanySpecialsTable renders the main table. CompanySpecialsRow handles each company type row with expand/collapse for positions. Reuses existing `fetchCompanyTypes`, extends its types, and adds a new `fetchWorkStats` API module.

**Tech Stack:** React 19, TypeScript, react-router-dom 7 (HashRouter), httpWrapper/Cache from `src/api/helpers/`

**Spec:** `docs/superpowers/specs/2026-03-29-company-specials-design.md`

---

### Task 1: Extend CompanyTypeInfo & Add Work Stats API

**Files:**
- Modify: `src/api/company/companyTypes.ts`
- Create: `src/api/user/workStats.ts`
- Modify: `src/api/index.ts`

- [ ] **Step 1: Extend `CompanyTypeInfo` in `src/api/company/companyTypes.ts`**

Add `CompanyPosition` and `CompanySpecial` interfaces before `CompanyTypeInfo`, then add `positions` and `specials` fields to `CompanyTypeInfo`:

```typescript
export interface CompanyPosition {
  man_required: number;
  int_required: number;
  end_required: number;
  man_gain: number;
  int_gain: number;
  end_gain: number;
  special_ability: string;
  description: string;
}

export interface CompanySpecial {
  effect: string;
  cost: number;
  rating_required: number;
}

export interface CompanyTypeInfo {
  name: string;
  cost: number;
  default_employees: number;
  positions: Record<string, CompanyPosition>;
  specials: Record<string, CompanySpecial>;
}
```

- [ ] **Step 2: Create `src/api/user/workStats.ts`**

```typescript
import { Cache } from '../helpers/cache';
import { httpWrapper, DataOrError } from '../helpers/httpWrapper';

export interface WorkStats {
  manual_labor: number;
  intelligence: number;
  endurance: number;
}

const workStatsCache = new Cache<WorkStats>({
  storageKey: 'torn-user-workstats',
  maxStalenessMs: 7_200_000, // 2 hours
});

export async function fetchWorkStats(apiKey: string): Promise<DataOrError<WorkStats>> {
  return httpWrapper<WorkStats>(
    {
      cache: workStatsCache,
      retry: { maxRetries: 2, isSuccess: (r) => r.error === null },
    },
    async () => {
      try {
        const response = await fetch(
          `https://api.torn.com/user/?selections=workstats&key=${apiKey}`
        );
        if (!response.ok) {
          return { data: null, error: `HTTP error: ${response.status}` };
        }
        const data = await response.json();
        if ('error' in data && data.error) {
          return { data: null, error: `Torn API Error (${data.error.code}): ${data.error.error}` };
        }
        return { data: data as WorkStats, error: null };
      } catch (error) {
        return {
          data: null,
          error: `Failed to fetch work stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }
  );
}
```

- [ ] **Step 3: Update `src/api/index.ts` barrel**

Add at end:
```typescript
export * from './user/workStats';
```

- [ ] **Step 4: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/api/company/companyTypes.ts src/api/user/workStats.ts src/api/index.ts
git commit -m "feat: extend CompanyTypeInfo with positions/specials, add workStats API"
```

---

### Task 2: Shared Types & Filter Helpers

**Files:**
- Create: `src/components/company-specials/types.ts`

- [ ] **Step 1: Create `src/components/company-specials/types.ts`**

```typescript
import { CompanyPosition } from '../../api/company/companyTypes';
import { WorkStats } from '../../api/user/workStats';

export type StatType = 'man' | 'int' | 'end';

export interface CompanySpecialsFilterCriteria {
  primaryGain: StatType[];
  secondaryGain: StatType[];
  minStatPercentMan: number | null;
  minStatPercentInt: number | null;
  minStatPercentEnd: number | null;
  showHidden: boolean;
}

export const defaultSpecialsFilters: CompanySpecialsFilterCriteria = {
  primaryGain: ['man', 'int', 'end'],
  secondaryGain: ['man', 'int', 'end'],
  minStatPercentMan: null,
  minStatPercentInt: null,
  minStatPercentEnd: null,
  showHidden: false,
};

/**
 * Determine primary and secondary gain stat types for a position.
 * Tie-breaking: alphabetical order end < int < man (man wins ties).
 * Returns null for all-zero positions.
 */
export function getGainRanking(position: CompanyPosition): { primary: StatType; secondary: StatType } | null {
  const gains: [StatType, number][] = [
    ['man', position.man_gain],
    ['int', position.int_gain],
    ['end', position.end_gain],
  ];

  if (gains.every(([, v]) => v === 0)) return null;

  // Sort descending by value, then descending alphabetically (man > int > end) for ties
  gains.sort((a, b) => b[1] - a[1] || b[0].localeCompare(a[0]));

  return { primary: gains[0][0], secondary: gains[1][0] };
}

/**
 * Check if a position matches all filter criteria.
 */
export function positionMatchesFilters(
  position: CompanyPosition,
  filters: CompanySpecialsFilterCriteria,
  workStats: WorkStats | null
): boolean {
  const ranking = getGainRanking(position);

  // All-zero positions auto-pass gain filters
  if (ranking !== null) {
    if (!filters.primaryGain.includes(ranking.primary)) return false;
    if (!filters.secondaryGain.includes(ranking.secondary)) return false;
  }

  // Stat % threshold (only if workStats loaded)
  if (workStats) {
    const checks: [number | null, number, number][] = [
      [filters.minStatPercentMan, workStats.manual_labor, position.man_required],
      [filters.minStatPercentInt, workStats.intelligence, position.int_required],
      [filters.minStatPercentEnd, workStats.endurance, position.end_required],
    ];
    for (const [threshold, playerStat, required] of checks) {
      if (threshold !== null && required > 0) {
        if ((playerStat / required) * 100 < threshold) return false;
      }
    }
  }

  return true;
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/company-specials/types.ts
git commit -m "feat: add company specials shared types and filter helpers"
```

---

### Task 3: CompanySpecialsRow Component

**Files:**
- Create: `src/components/company-specials/CompanySpecialsRow.tsx`
- Create: `src/components/company-specials/CompanySpecialsRow.css`

- [ ] **Step 1: Create `CompanySpecialsRow.css`**

```css
.company-specials-row-name {
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 8px;
}

.company-specials-row-chevron {
  display: inline-block;
  width: 14px;
  height: 14px;
  transition: transform 0.2s ease;
}

.company-specials-row-chevron--collapsed {
  transform: rotate(-90deg);
}

.company-specials-row--hidden {
  opacity: 0.4;
}

.company-specials-row-special {
  font-size: 13px;
  line-height: 1.3;
  vertical-align: top;
}

.company-specials-row-special-name {
  font-weight: 600;
}

.company-specials-row-special-cost {
  color: #666;
  font-size: 12px;
}

.company-specials-row-hide-btn {
  background: none;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 2px 8px;
  cursor: pointer;
  font-size: 12px;
}

.company-specials-row-hide-btn:hover {
  background-color: #eee;
}

.company-specials-row-subtable {
  width: 100%;
  border-collapse: collapse;
  margin: 8px 0;
  font-size: 13px;
}

.company-specials-row-subtable th {
  text-align: left;
  padding: 4px 8px;
  border-bottom: 1px solid #ddd;
  font-weight: 600;
  font-size: 12px;
}

.company-specials-row-subtable td {
  padding: 4px 8px;
  border-bottom: 1px solid #eee;
}
```

- [ ] **Step 2: Create `CompanySpecialsRow.tsx`**

```typescript
import React, { useState } from 'react';
import { CompanyTypeInfo, CompanyPosition, CompanySpecial } from '../../api/company/companyTypes';
import './CompanySpecialsRow.css';

interface CompanySpecialsRowProps {
  typeId: string;
  companyType: CompanyTypeInfo;
  matchingPositions: [string, CompanyPosition][];
  isHidden: boolean;
  onToggleHidden: () => void;
}

const RATING_LEVELS = [1, 3, 5, 7, 10];

function getSpecialAtRating(
  specials: Record<string, CompanySpecial>,
  rating: number
): [string, CompanySpecial] | null {
  for (const [name, special] of Object.entries(specials)) {
    if (special.rating_required === rating) return [name, special];
  }
  return null;
}

const CompanySpecialsRow: React.FC<CompanySpecialsRowProps> = ({
  typeId,
  companyType,
  matchingPositions,
  isHidden,
  onToggleHidden,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const rowClass = isHidden ? 'company-specials-row--hidden' : '';

  return (
    <>
      <tr className={rowClass}>
        <td>
          <span
            className="company-specials-row-name"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <svg
              className={`company-specials-row-chevron${isExpanded ? '' : ' company-specials-row-chevron--collapsed'}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
            {companyType.name}
          </span>
        </td>
        {RATING_LEVELS.map((rating) => {
          const entry = getSpecialAtRating(companyType.specials, rating);
          if (!entry) return <td key={rating} className="company-specials-row-special" />;
          const [name, special] = entry;
          return (
            <td key={rating} className="company-specials-row-special">
              <div className="company-specials-row-special-name">{name}</div>
              <div>{special.effect}</div>
              <div className="company-specials-row-special-cost">
                {special.cost === 0 ? 'Passive' : `${special.cost} JP`}
              </div>
            </td>
          );
        })}
        <td>
          <button className="company-specials-row-hide-btn" onClick={onToggleHidden}>
            {isHidden ? 'Show' : 'Hide'}
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr className={rowClass}>
          <td colSpan={7}>
            <table className="company-specials-row-subtable">
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Man Req</th>
                  <th>Int Req</th>
                  <th>End Req</th>
                  <th>Man Gain</th>
                  <th>Int Gain</th>
                  <th>End Gain</th>
                  <th>Special</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {matchingPositions.map(([posName, pos]) => (
                  <tr key={posName}>
                    <td>{posName}</td>
                    <td>{pos.man_required.toLocaleString()}</td>
                    <td>{pos.int_required.toLocaleString()}</td>
                    <td>{pos.end_required.toLocaleString()}</td>
                    <td>{pos.man_gain}</td>
                    <td>{pos.int_gain}</td>
                    <td>{pos.end_gain}</td>
                    <td>{pos.special_ability}</td>
                    <td>{pos.description}</td>
                  </tr>
                ))}
                {matchingPositions.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', color: '#666' }}>
                      No positions match current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  );
};

export default CompanySpecialsRow;
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/company-specials/CompanySpecialsRow.tsx src/components/company-specials/CompanySpecialsRow.css
git commit -m "feat: add CompanySpecialsRow component"
```

---

### Task 4: CompanySpecialsTable Component

**Files:**
- Create: `src/components/company-specials/CompanySpecialsTable.tsx`
- Create: `src/components/company-specials/CompanySpecialsTable.css`

- [ ] **Step 1: Create `CompanySpecialsTable.css`**

```css
.company-specials-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
}

.company-specials-table > thead > tr > th {
  text-align: left;
  padding: 8px 12px;
  border-bottom: 2px solid #ddd;
  font-weight: 600;
}

.company-specials-table > tbody > tr > td {
  padding: 8px 12px;
  border-bottom: 1px solid #eee;
}

.company-specials-table > tbody > tr:hover > td {
  background-color: rgba(0, 0, 0, 0.03);
}

.company-specials-table-empty {
  text-align: center;
  padding: 24px;
  color: #666;
}
```

- [ ] **Step 2: Create `CompanySpecialsTable.tsx`**

```typescript
import React from 'react';
import { CompanyTypeInfo, CompanyPosition } from '../../api/company/companyTypes';
import CompanySpecialsRow from './CompanySpecialsRow';
import './CompanySpecialsTable.css';

export interface CompanySpecialsEntry {
  typeId: string;
  companyType: CompanyTypeInfo;
  matchingPositions: [string, CompanyPosition][];
  isHidden: boolean;
}

interface CompanySpecialsTableProps {
  entries: CompanySpecialsEntry[];
  onToggleHidden: (typeId: string) => void;
}

const CompanySpecialsTable: React.FC<CompanySpecialsTableProps> = ({
  entries,
  onToggleHidden,
}) => {
  if (entries.length === 0) {
    return <div className="company-specials-table-empty">No company types match current filters.</div>;
  }

  return (
    <table className="company-specials-table">
      <thead>
        <tr>
          <th>Company Type</th>
          <th>★ 1</th>
          <th>★ 3</th>
          <th>★ 5</th>
          <th>★ 7</th>
          <th>★ 10</th>
          <th>Hide</th>
        </tr>
      </thead>
      <tbody>
        {entries.map(({ typeId, companyType, matchingPositions, isHidden }) => (
          <CompanySpecialsRow
            key={typeId}
            typeId={typeId}
            companyType={companyType}
            matchingPositions={matchingPositions}
            isHidden={isHidden}
            onToggleHidden={() => onToggleHidden(typeId)}
          />
        ))}
      </tbody>
    </table>
  );
};

export default CompanySpecialsTable;
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/company-specials/CompanySpecialsTable.tsx src/components/company-specials/CompanySpecialsTable.css
git commit -m "feat: add CompanySpecialsTable component"
```

---

### Task 5: CompanySpecialsFilter Component

**Files:**
- Create: `src/components/company-specials/CompanySpecialsFilter.tsx`
- Create: `src/components/company-specials/CompanySpecialsFilter.css`
- Modify: `src/components/index.ts`

- [ ] **Step 1: Create `CompanySpecialsFilter.css`**

Same collapsible chevron pattern as other filters:

```css
.company-specials-filter {
  padding: 16px;
  background-color: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 20px;
}

.company-specials-filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.company-specials-filter-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  padding: 4px 8px;
  margin: -4px -8px;
  cursor: pointer;
  border-radius: 4px;
  font: inherit;
}

.company-specials-filter-toggle:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.company-specials-filter-toggle h3 {
  margin: 0;
}

.company-specials-filter-chevron {
  display: inline-block;
  width: 16px;
  height: 16px;
  transition: transform 0.2s ease;
}

.company-specials-filter-chevron--collapsed {
  transform: rotate(-90deg);
}

.company-specials-filter-content {
  margin-top: 16px;
}

.company-specials-filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.company-specials-filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.company-specials-filter-label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
  font-weight: 500;
}

.company-specials-filter-input {
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 100px;
  font-size: 14px;
}

.company-specials-filter-checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  cursor: pointer;
}

.company-specials-filter-reset {
  padding: 6px 12px;
  font-size: 14px;
  cursor: pointer;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
}
```

- [ ] **Step 2: Create `CompanySpecialsFilter.tsx`**

```typescript
import React, { useState } from 'react';
import { CompanySpecialsFilterCriteria, StatType, defaultSpecialsFilters } from './types';
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
```

- [ ] **Step 3: Update `src/components/index.ts` barrel**

Add at end:
```typescript
export { default as CompanySpecialsFilter } from './company-specials/CompanySpecialsFilter';
export { default as CompanySpecialsTable } from './company-specials/CompanySpecialsTable';
export { default as CompanySpecialsRow } from './company-specials/CompanySpecialsRow';
export type { CompanySpecialsFilterCriteria } from './company-specials/types';
```

- [ ] **Step 4: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/components/company-specials/CompanySpecialsFilter.tsx src/components/company-specials/CompanySpecialsFilter.css src/components/index.ts
git commit -m "feat: add CompanySpecialsFilter component and update barrel exports"
```

---

### Task 6: CompanySpecials Page

**Files:**
- Create: `src/pages/CompanySpecials.tsx`
- Create: `src/pages/CompanySpecials.css`

- [ ] **Step 1: Create `CompanySpecials.css`**

```css
.company-specials-page {
  padding: 20px;
}

.company-specials-page h1 {
  margin-bottom: 16px;
}

.company-specials-loading {
  text-align: center;
  padding: 24px;
  color: #666;
}

.company-specials-error {
  color: #d32f2f;
  padding: 12px;
  background-color: #fdecea;
  border-radius: 4px;
  margin-bottom: 16px;
}
```

- [ ] **Step 2: Create `CompanySpecials.tsx`**

```typescript
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import { usePassword } from '../hooks/usePassword';
import { fetchCompanyTypes, CompanyTypesResponse, CompanyPosition } from '../api/company/companyTypes';
import { fetchWorkStats, WorkStats } from '../api/user/workStats';
import CompanySpecialsFilter from '../components/company-specials/CompanySpecialsFilter';
import CompanySpecialsTable, { CompanySpecialsEntry } from '../components/company-specials/CompanySpecialsTable';
import { CompanySpecialsFilterCriteria, defaultSpecialsFilters, positionMatchesFilters } from '../components/company-specials/types';
import './CompanySpecials.css';

const FILTERS_STORAGE_KEY = 'company-specials-filters';
const HIDDEN_STORAGE_KEY = 'company-specials-hidden';

function getInitialFilters(): CompanySpecialsFilterCriteria {
  try {
    const saved = localStorage.getItem(FILTERS_STORAGE_KEY);
    if (saved) {
      return { ...defaultSpecialsFilters, ...JSON.parse(saved) };
    }
  } catch (error) {
    console.error('Failed to load company specials filters from localStorage:', error);
  }
  return defaultSpecialsFilters;
}

function getInitialHidden(): string[] {
  try {
    const saved = localStorage.getItem(HIDDEN_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (error) {
    console.error('Failed to load hidden companies from localStorage:', error);
  }
  return [];
}

const CompanySpecials: React.FC = () => {
  const { password: apiKey } = usePassword('torn-api-key');

  const [companyTypes, setCompanyTypes] = useState<CompanyTypesResponse['companies']>({});
  const [typesLoading, setTypesLoading] = useState(true);
  const [typesError, setTypesError] = useState<string | null>(null);

  const [workStats, setWorkStats] = useState<WorkStats | null>(null);
  const [workStatsError, setWorkStatsError] = useState<string | null>(null);

  const [filters, setFilters] = useState<CompanySpecialsFilterCriteria>(getInitialFilters);
  const [hiddenCompanyTypes, setHiddenCompanyTypes] = useState<string[]>(getInitialHidden);

  // Persist filters to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
    } catch (error) {
      console.error('Failed to save company specials filters to localStorage:', error);
    }
  }, [filters]);

  // Persist hidden companies to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(HIDDEN_STORAGE_KEY, JSON.stringify(hiddenCompanyTypes));
    } catch (error) {
      console.error('Failed to save hidden companies to localStorage:', error);
    }
  }, [hiddenCompanyTypes]);

  // Fetch company types and work stats on mount (in parallel)
  useEffect(() => {
    if (!apiKey) {
      setTypesLoading(false);
      setTypesError('Please set your Torn API key in Settings.');
      return;
    }
    let cancelled = false;

    (async () => {
      setTypesLoading(true);

      const [typesResult, statsResult] = await Promise.all([
        fetchCompanyTypes(apiKey),
        fetchWorkStats(apiKey),
      ]);

      if (cancelled) return;

      if (typesResult.error) {
        setTypesError(typesResult.error);
        toast.error(typesResult.error);
      } else if (typesResult.data) {
        setCompanyTypes(typesResult.data.companies);
        setTypesError(null);
      }

      if (statsResult.error) {
        setWorkStatsError(statsResult.error);
        toast.error(`Work stats: ${statsResult.error}`);
      } else if (statsResult.data) {
        setWorkStats(statsResult.data);
        setWorkStatsError(null);
      }

      setTypesLoading(false);
    })();

    return () => { cancelled = true; };
  }, [apiKey]);

  // Filter company types and positions client-side
  const filteredEntries = useMemo<CompanySpecialsEntry[]>(() => {
    return Object.entries(companyTypes)
      .map(([typeId, companyType]) => {
        const matchingPositions: [string, CompanyPosition][] = Object.entries(companyType.positions)
          .filter(([, pos]) => positionMatchesFilters(pos, filters, workStats));
        const isHidden = hiddenCompanyTypes.includes(typeId);
        return { typeId, companyType, matchingPositions, isHidden };
      })
      .filter(({ matchingPositions, isHidden }) => {
        if (matchingPositions.length === 0) return false;
        if (isHidden && !filters.showHidden) return false;
        return true;
      })
      .sort((a, b) => a.companyType.name.localeCompare(b.companyType.name));
  }, [companyTypes, filters, workStats, hiddenCompanyTypes]);

  const handleToggleHidden = useCallback((typeId: string) => {
    setHiddenCompanyTypes((prev) =>
      prev.includes(typeId) ? prev.filter((id) => id !== typeId) : [...prev, typeId]
    );
  }, []);

  if (typesLoading) {
    return (
      <div className="company-specials-page">
        <h1>Company Specials</h1>
        <div className="company-specials-loading">Loading company types...</div>
      </div>
    );
  }

  if (typesError) {
    return (
      <div className="company-specials-page">
        <h1>Company Specials</h1>
        <div className="company-specials-error">{typesError}</div>
      </div>
    );
  }

  return (
    <div className="company-specials-page">
      <h1>Company Specials</h1>
      {workStatsError && (
        <div className="company-specials-error">
          Work stats unavailable — stat % filters disabled. {workStatsError}
        </div>
      )}
      <CompanySpecialsFilter
        filters={filters}
        onFilterChange={setFilters}
      />
      <CompanySpecialsTable
        entries={filteredEntries}
        onToggleHidden={handleToggleHidden}
      />
    </div>
  );
};

export default CompanySpecials;
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/pages/CompanySpecials.tsx src/pages/CompanySpecials.css
git commit -m "feat: add CompanySpecials page"
```

---

### Task 7: Routing & Menu Integration

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/Menu.tsx`

- [ ] **Step 1: Update `src/App.tsx`**

Add import after the CompanyEmployees import:
```typescript
import CompanySpecials from './pages/CompanySpecials';
```

Add route after the `/companies/:companyId/employees` route:
```typescript
<Route path="/company-specials" element={<CompanySpecials />} />
```

- [ ] **Step 2: Update `src/Menu.tsx`**

Add the Company Specials entry to `defaultItems`, after the Companies entry:
```typescript
{ label: 'Company Specials', onClick: () => navigate('/company-specials') },
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Smoke test**

Run: `npm start`
- Verify "Company Specials" appears in the menu
- Verify the page loads and shows company types with specials
- Verify expanding a row shows the positions subtable
- Verify primary/secondary gain filters work
- Verify hide/show toggle works
- Verify filters persist on page reload

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/Menu.tsx
git commit -m "feat: wire up Company Specials page routing and menu"
```

---

### Task 8: Build & Final Verification

- [ ] **Step 1: Run existing tests**

Run: `npm test -- --watchAll=false`
Expected: No new test failures (pre-existing failures are known)

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit if any fixups needed**

```bash
git add -A
git commit -m "fix: address build issues from company specials page"
```
