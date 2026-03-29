# Companies Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Companies page that lists Torn companies by type with filters for stars and employee activity, loading company detail on demand.

**Architecture:** Page component orchestrates state, delegates rendering to CompanyFilter (collapsible), CompanyTable, and CompanyTableRow. Two API modules handle fetching company types, companies by type, and company detail — all wrapped in httpWrapper with caching.

**Tech Stack:** React 19, TypeScript, react-router-dom 7 (HashRouter), httpWrapper/Cache/RateLimiter from `src/api/helpers/`

**Spec:** `docs/superpowers/specs/2026-03-29-companies-page-design.md`

---

### Task 1: API — Company Types

**Files:**
- Create: `src/api/company/companyTypes.ts`
- Modify: `src/api/index.ts`

- [ ] **Step 1: Create `companyTypes.ts` with types and fetch function**

```typescript
import { Cache } from '../helpers/cache';
import { httpWrapper, DataOrError } from '../helpers/httpWrapper';

export interface CompanyTypeInfo {
  name: string;
  cost: number;
  default_employees: number;
}

export interface CompanyTypesResponse {
  companies: Record<string, CompanyTypeInfo>;
}

const companyTypesCache = new Cache<CompanyTypesResponse>({
  storageKey: 'torn-company-types',
  maxStalenessMs: 86_400_000, // 24 hours
});

export async function fetchCompanyTypes(apiKey: string): Promise<DataOrError<CompanyTypesResponse>> {
  return httpWrapper<CompanyTypesResponse>(
    {
      cache: companyTypesCache,
      retry: { maxRetries: 2, isSuccess: (r) => r.error === null },
    },
    async () => {
      try {
        const response = await fetch(
          `https://api.torn.com/torn/?selections=companies&key=${apiKey}`
        );
        if (!response.ok) {
          return { data: null, error: `HTTP error: ${response.status}` };
        }
        const data = await response.json();
        if ('error' in data && data.error) {
          return { data: null, error: `Torn API Error (${data.error.code}): ${data.error.error}` };
        }
        return { data: data as CompanyTypesResponse, error: null };
      } catch (error) {
        return {
          data: null,
          error: `Failed to fetch company types: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }
  );
}
```

- [ ] **Step 2: Update barrel exports**

Add to `src/api/index.ts`:
```typescript
export * from './company/companyTypes';
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/api/company/companyTypes.ts src/api/index.ts
git commit -m "feat: add company types API module"
```

---

### Task 2: API — Companies by Type & Company Detail

**Files:**
- Create: `src/api/company/companies.ts`
- Modify: `src/api/index.ts`

- [ ] **Step 1: Create `companies.ts` with types and both fetch functions**

```typescript
import { Cache } from '../helpers/cache';
import { httpWrapper, DataOrError } from '../helpers/httpWrapper';
import { RateLimiter } from '../helpers/rateLimiter';

export interface CompanyBasic {
  ID: number;
  company_type: number;
  rating: number;
  name: string;
  director: number;
  employees_hired: number;
  employees_capacity: number;
  daily_income: number;
  daily_customers: number;
  weekly_income: number;
  weekly_customers: number;
  days_old: number;
}

export interface CompanyEmployee {
  name: string;
  position: string;
  days_in_company: number;
  last_action: {
    status: string;
    timestamp: number; // Unix timestamp in SECONDS
    relative: string;
  };
  status: {
    description: string;
    details: string;
    state: string;
    color: string;
    until: number;
  };
}

export interface CompanyDetail extends CompanyBasic {
  employees: Record<string, CompanyEmployee>;
}

interface CompaniesApiResponse {
  company: Record<string, CompanyBasic>;
}

interface CompanyDetailApiResponse {
  company: CompanyDetail;
}

const companyDetailLimiter = new RateLimiter({ cooldownMs: 250 });

export async function fetchCompaniesByType(
  apiKey: string,
  typeId: string
): Promise<DataOrError<CompanyBasic[]>> {
  const cache = new Cache<CompanyBasic[]>({
    storageKey: `torn-companies-type-${typeId}`,
    maxStalenessMs: 3_600_000, // 1 hour
  });
  return httpWrapper<CompanyBasic[]>(
    {
      cache,
      retry: { maxRetries: 2, isSuccess: (r) => r.error === null },
    },
    async () => {
      try {
        const response = await fetch(
          `https://api.torn.com/company/${typeId}?selections=companies&key=${apiKey}`
        );
        if (!response.ok) {
          return { data: null, error: `HTTP error: ${response.status}` };
        }
        const data = await response.json();
        if ('error' in data && data.error) {
          return { data: null, error: `Torn API Error (${data.error.code}): ${data.error.error}` };
        }
        const typed = data as CompaniesApiResponse;
        const companies = Object.values(typed.company);
        return { data: companies, error: null };
      } catch (error) {
        return {
          data: null,
          error: `Failed to fetch companies: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }
  );
}

export async function fetchCompanyDetail(
  apiKey: string,
  companyId: number
): Promise<DataOrError<CompanyDetail>> {
  const cache = new Cache<CompanyDetail>({
    storageKey: `torn-company-detail-${companyId}`,
    maxStalenessMs: 3_600_000, // 1 hour
  });
  return httpWrapper<CompanyDetail>(
    {
      cache,
      rateLimiter: companyDetailLimiter,
      retry: { maxRetries: 2, isSuccess: (r) => r.error === null },
    },
    async () => {
      try {
        const response = await fetch(
          `https://api.torn.com/company/${companyId}?selections=&key=${apiKey}`
        );
        if (!response.ok) {
          return { data: null, error: `HTTP error: ${response.status}` };
        }
        const data = await response.json();
        if ('error' in data && data.error) {
          return { data: null, error: `Torn API Error (${data.error.code}): ${data.error.error}` };
        }
        const typed = data as CompanyDetailApiResponse;
        return { data: typed.company, error: null };
      } catch (error) {
        return {
          data: null,
          error: `Failed to fetch company detail: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }
  );
}
```

- [ ] **Step 2: Update barrel exports**

Add to `src/api/index.ts`:
```typescript
export * from './company/companies';
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/api/company/companies.ts src/api/index.ts
git commit -m "feat: add companies and company detail API modules"
```

---

### Task 3: Shared Types & CompanyTableRow Component

**Files:**
- Create: `src/components/company/types.ts`
- Create: `src/components/company/CompanyTableRow.tsx`
- Create: `src/components/company/CompanyTableRow.css`

- [ ] **Step 1: Create shared types file `src/components/company/types.ts`**

```typescript
export interface CompanyFilterCriteria {
  companyTypeId: string | null;
  minStars: number | null;
  maxStars: number | null;
  excludeInactiveDirector: boolean;
  countInactiveAsFreeSpot: boolean;
  daysInactivity: number;
}

export const defaultCompanyFilters: CompanyFilterCriteria = {
  companyTypeId: null,
  minStars: null,
  maxStars: null,
  excludeInactiveDirector: false,
  countInactiveAsFreeSpot: false,
  daysInactivity: 3,
};
```

- [ ] **Step 2: Create `CompanyTableRow.css`**

```css
.company-table-row-name-link {
  color: #1a73e8;
  text-decoration: none;
}

.company-table-row-name-link:hover {
  text-decoration: underline;
}

.company-table-row-employees-link {
  color: #1a73e8;
  text-decoration: none;
}

.company-table-row-employees-link:hover {
  text-decoration: underline;
}
```

- [ ] **Step 3: Create `CompanyTableRow.tsx`**

```typescript
import React from 'react';
import { Link } from 'react-router-dom';
import { CompanyBasic, CompanyDetail } from '../../api/company/companies';
import { CompanyFilterCriteria } from './types';
import './CompanyTableRow.css';

interface CompanyTableRowProps {
  company: CompanyBasic;
  detail?: CompanyDetail;
  filters: CompanyFilterCriteria;
}

function getInactiveCount(detail: CompanyDetail, daysInactivity: number): number {
  const now = Date.now();
  return Object.values(detail.employees).filter((emp) => {
    const daysSinceAction = (now - emp.last_action.timestamp * 1000) / 86_400_000;
    return daysSinceAction > daysInactivity;
  }).length;
}

const CompanyTableRow: React.FC<CompanyTableRowProps> = ({ company, detail, filters }) => {
  let employeesDisplay: string;
  if (detail && filters.countInactiveAsFreeSpot) {
    const inactiveCount = getInactiveCount(detail, filters.daysInactivity);
    const adjustedHired = company.employees_hired - inactiveCount;
    employeesDisplay = `${adjustedHired}/${company.employees_capacity}`;
  } else {
    employeesDisplay = `${company.employees_hired}/${company.employees_capacity}`;
  }

  return (
    <tr>
      <td>
        <a
          className="company-table-row-name-link"
          href={`https://www.torn.com/joblist.php#!p=corpinfo&ID=${company.ID}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {company.name}
        </a>
      </td>
      <td>
        <Link
          className="company-table-row-employees-link"
          to={`/companies/${company.ID}/employees`}
        >
          {employeesDisplay}
        </Link>
      </td>
      <td>{company.rating}</td>
    </tr>
  );
};

export default CompanyTableRow;
```

- [ ] **Step 4: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/components/company/types.ts src/components/company/CompanyTableRow.tsx src/components/company/CompanyTableRow.css
git commit -m "feat: add shared company types and CompanyTableRow component"
```

---

### Task 4: CompanyTable Component

**Files:**
- Create: `src/components/company/CompanyTable.tsx`
- Create: `src/components/company/CompanyTable.css`

- [ ] **Step 1: Create `CompanyTable.css`**

```css
.company-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
}

.company-table th {
  text-align: left;
  padding: 8px 12px;
  border-bottom: 2px solid #ddd;
  font-weight: 600;
}

.company-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #eee;
}

.company-table tbody tr:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.company-table-empty {
  text-align: center;
  padding: 24px;
  color: #666;
}
```

- [ ] **Step 2: Create `CompanyTable.tsx`**

```typescript
import React from 'react';
import { CompanyBasic, CompanyDetail } from '../../api/company/companies';
import { CompanyFilterCriteria } from './types';
import CompanyTableRow from './CompanyTableRow';
import './CompanyTable.css';

interface CompanyTableProps {
  companies: CompanyBasic[];
  companyDetails: Record<number, CompanyDetail>;
  filters: CompanyFilterCriteria;
}

const CompanyTable: React.FC<CompanyTableProps> = ({ companies, companyDetails, filters }) => {
  if (companies.length === 0) {
    return <div className="company-table-empty">No companies to display. Select a company type above.</div>;
  }

  return (
    <table className="company-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Employees</th>
          <th>Stars</th>
        </tr>
      </thead>
      <tbody>
        {companies.map((company) => (
          <CompanyTableRow
            key={company.ID}
            company={company}
            detail={companyDetails[company.ID]}
            filters={filters}
          />
        ))}
      </tbody>
    </table>
  );
};

export default CompanyTable;
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/company/CompanyTable.tsx src/components/company/CompanyTable.css
git commit -m "feat: add CompanyTable component"
```

---

### Task 5: CompanyFilter Component

**Files:**
- Create: `src/components/company/CompanyFilter.tsx`
- Create: `src/components/company/CompanyFilter.css`
- Modify: `src/components/index.ts`

- [ ] **Step 1: Create `CompanyFilter.css`**

Use same collapsible chevron pattern as `src/components/BountiesFilter.css`. All styling via CSS classes (not inline styles per CLAUDE.md).

```css
.company-filter {
  padding: 16px;
  background-color: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 20px;
}

.company-filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.company-filter-toggle {
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

.company-filter-toggle:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.company-filter-toggle h3 {
  margin: 0;
}

.company-filter-chevron {
  display: inline-block;
  width: 16px;
  height: 16px;
  transition: transform 0.2s ease;
}

.company-filter-chevron--collapsed {
  transform: rotate(-90deg);
}

.company-filter-content {
  margin-top: 16px;
}

.company-filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.company-filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.company-filter-label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
  font-weight: 500;
}

.company-filter-input {
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 100px;
  font-size: 14px;
}

.company-filter-select {
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 150px;
  font-size: 14px;
}

.company-filter-checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  cursor: pointer;
}

.company-filter-actions {
  margin-top: 16px;
  display: flex;
  gap: 8px;
}

.company-filter-button {
  padding: 6px 12px;
  font-size: 14px;
  cursor: pointer;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.company-filter-button:hover {
  background-color: #eee;
}

.company-filter-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.company-filter-reset {
  padding: 6px 12px;
  font-size: 14px;
  cursor: pointer;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
}
```

- [ ] **Step 2: Create `CompanyFilter.tsx`**

```typescript
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

  const handleNumberChange = (field: 'minStars' | 'maxStars' | 'daysInactivity', value: string) => {
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
```

- [ ] **Step 3: Update barrel exports**

Add to `src/components/index.ts`:
```typescript
export { default as CompanyFilter } from './company/CompanyFilter';
export { default as CompanyTable } from './company/CompanyTable';
export { default as CompanyTableRow } from './company/CompanyTableRow';
export type { CompanyFilterCriteria } from './company/types';
```

- [ ] **Step 4: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/components/company/CompanyFilter.tsx src/components/company/CompanyFilter.css src/components/index.ts
git commit -m "feat: add CompanyFilter component and update barrel exports"
```

---

### Task 6: Companies Page & CompanyEmployees Placeholder

**Files:**
- Create: `src/pages/Companies.tsx`
- Create: `src/pages/Companies.css`
- Create: `src/pages/CompanyEmployees.tsx`

- [ ] **Step 1: Create `Companies.css`**

```css
.companies-page {
  padding: 20px;
}

.companies-page h1 {
  margin-bottom: 16px;
}

.companies-loading {
  text-align: center;
  padding: 24px;
  color: #666;
}

.companies-error {
  color: #d32f2f;
  padding: 12px;
  background-color: #fdecea;
  border-radius: 4px;
  margin-bottom: 16px;
}
```

- [ ] **Step 2: Create `CompanyEmployees.tsx` (TODO placeholder)**

```typescript
import React from 'react';
import { useParams } from 'react-router-dom';

const CompanyEmployees: React.FC = () => {
  const { companyId } = useParams<{ companyId: string }>();

  return (
    <div className="App-header">
      <h1>Employee List</h1>
      <p>Company #{companyId} — coming soon.</p>
    </div>
  );
};

export default CompanyEmployees;
```

- [ ] **Step 3: Create `Companies.tsx`**

Note: uses `useRef` to track the current company type ID so the `handleLoadDetails` callback can correctly discard stale results when the user changes type mid-load.

```typescript
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { usePassword } from '../hooks/usePassword';
import { fetchCompanyTypes, CompanyTypesResponse } from '../api/company/companyTypes';
import {
  fetchCompaniesByType,
  fetchCompanyDetail,
  CompanyBasic,
  CompanyDetail,
} from '../api/company/companies';
import CompanyFilter from '../components/company/CompanyFilter';
import CompanyTable from '../components/company/CompanyTable';
import { CompanyFilterCriteria, defaultCompanyFilters } from '../components/company/types';
import './Companies.css';

const Companies: React.FC = () => {
  const { password: apiKey } = usePassword('torn-api-key');

  const [companyTypes, setCompanyTypes] = useState<CompanyTypesResponse['companies']>({});
  const [typesLoading, setTypesLoading] = useState(true);
  const [typesError, setTypesError] = useState<string | null>(null);

  const [companies, setCompanies] = useState<CompanyBasic[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);

  const [companyDetails, setCompanyDetails] = useState<Record<number, CompanyDetail>>({});
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [filters, setFilters] = useState<CompanyFilterCriteria>(defaultCompanyFilters);

  // Ref to track current type ID for stale-request detection in handleLoadDetails
  const currentTypeIdRef = useRef<string | null>(filters.companyTypeId);
  useEffect(() => {
    currentTypeIdRef.current = filters.companyTypeId;
  }, [filters.companyTypeId]);

  // Fetch company types on mount
  useEffect(() => {
    if (!apiKey) {
      setTypesLoading(false);
      setTypesError('Please set your Torn API key in Settings.');
      return;
    }
    let cancelled = false;
    (async () => {
      setTypesLoading(true);
      const result = await fetchCompanyTypes(apiKey);
      if (cancelled) return;
      if (result.error) {
        setTypesError(result.error);
        toast.error(result.error);
      } else if (result.data) {
        setCompanyTypes(result.data.companies);
        setTypesError(null);
      }
      setTypesLoading(false);
    })();
    return () => { cancelled = true; };
  }, [apiKey]);

  // Fetch companies when type changes
  useEffect(() => {
    if (!filters.companyTypeId || !apiKey) {
      setCompanies([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setCompaniesLoading(true);
      setCompanyDetails({}); // clear details when type changes
      const result = await fetchCompaniesByType(apiKey, filters.companyTypeId!);
      if (cancelled) return;
      if (result.error) {
        toast.error(result.error);
        setCompanies([]);
      } else if (result.data) {
        setCompanies(result.data);
      }
      setCompaniesLoading(false);
    })();
    return () => { cancelled = true; };
  }, [apiKey, filters.companyTypeId]);

  // Filter companies client-side
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      if (filters.minStars !== null && c.rating < filters.minStars) return false;
      if (filters.maxStars !== null && c.rating > filters.maxStars) return false;

      // Exclude inactive director (requires detail)
      if (filters.excludeInactiveDirector && companyDetails[c.ID]) {
        const detail = companyDetails[c.ID];
        const director = Object.values(detail.employees).find(
          (emp) => emp.position === 'Director'
        );
        if (director) {
          const daysSinceAction =
            (Date.now() - director.last_action.timestamp * 1000) / 86_400_000;
          if (daysSinceAction > filters.daysInactivity) return false;
        }
      }

      return true;
    });
  }, [companies, companyDetails, filters]);

  // Load details for all visible companies
  const handleLoadDetails = useCallback(async () => {
    if (!apiKey || filteredCompanies.length === 0) return;
    const typeIdAtStart = currentTypeIdRef.current;
    setDetailsLoading(true);

    const promises = filteredCompanies.map(async (company) => {
      const result = await fetchCompanyDetail(apiKey, company.ID);
      // Discard if type changed while loading (checked via ref, not stale closure)
      if (currentTypeIdRef.current !== typeIdAtStart) return;
      if (result.data) {
        setCompanyDetails((prev) => ({ ...prev, [company.ID]: result.data! }));
      }
    });

    await Promise.allSettled(promises);
    setDetailsLoading(false);
  }, [apiKey, filteredCompanies]);

  if (typesLoading) {
    return (
      <div className="companies-page">
        <h1>Companies</h1>
        <div className="companies-loading">Loading company types...</div>
      </div>
    );
  }

  if (typesError) {
    return (
      <div className="companies-page">
        <h1>Companies</h1>
        <div className="companies-error">{typesError}</div>
      </div>
    );
  }

  return (
    <div className="companies-page">
      <h1>Companies</h1>
      <CompanyFilter
        companyTypes={companyTypes}
        filters={filters}
        onFilterChange={setFilters}
        onLoadDetails={handleLoadDetails}
        detailsLoading={detailsLoading}
      />
      {companiesLoading ? (
        <div className="companies-loading">Loading companies...</div>
      ) : (
        <CompanyTable
          companies={filteredCompanies}
          companyDetails={companyDetails}
          filters={filters}
        />
      )}
    </div>
  );
};

export default Companies;
```

- [ ] **Step 4: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/pages/Companies.tsx src/pages/Companies.css src/pages/CompanyEmployees.tsx
git commit -m "feat: add Companies page and CompanyEmployees placeholder"
```

---

### Task 7: Routing & Menu Integration

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/Menu.tsx`

- [ ] **Step 1: Update `src/App.tsx`**

Add imports at top (after the AuctionHouse import):
```typescript
import Companies from './pages/Companies';
import CompanyEmployees from './pages/CompanyEmployees';
```

Add routes inside `<Routes>`, after the `/auctionhouse` route:
```typescript
<Route path="/companies" element={<Companies />} />
<Route path="/companies/:companyId/employees" element={<CompanyEmployees />} />
```

- [ ] **Step 2: Update `src/Menu.tsx`**

Add the Companies entry to the `defaultItems` array, after the Auction House entry (line 17):
```typescript
{ label: 'Companies', onClick: () => navigate('/companies') },
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Run the app and smoke test**

Run: `npm start`
- Verify "Companies" appears in the hamburger menu
- Verify clicking it navigates to the Companies page
- Verify the company type dropdown populates
- Verify selecting a type loads and displays companies in the table
- Verify "Load Company Details" button works
- Verify filters (stars, inactive director) function correctly

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/Menu.tsx
git commit -m "feat: wire up Companies page routing and menu"
```

---

### Task 8: Run Tests & Final Verification

- [ ] **Step 1: Run existing tests**

Run: `npm test -- --watchAll=false`
Expected: All existing tests pass (no regressions)

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 3: Commit if any fixups needed**

If any test or build fixes were required, commit them:
```bash
git add -A
git commit -m "fix: address test/build issues from companies page"
```
