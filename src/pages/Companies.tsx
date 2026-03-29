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

const STORAGE_KEY = 'companies-filters';

type PersistedFilters = Omit<CompanyFilterCriteria, 'companyTypeId'>;

function getInitialFilters(): CompanyFilterCriteria {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: PersistedFilters = JSON.parse(saved);
      return { ...defaultCompanyFilters, ...parsed, companyTypeId: null };
    }
  } catch (error) {
    console.error('Failed to load company filters from localStorage:', error);
  }
  return defaultCompanyFilters;
}

const Companies: React.FC = () => {
  const { password: apiKey } = usePassword('torn-api-key');

  const [companyTypes, setCompanyTypes] = useState<CompanyTypesResponse['companies']>({});
  const [typesLoading, setTypesLoading] = useState(true);
  const [typesError, setTypesError] = useState<string | null>(null);

  const [companies, setCompanies] = useState<CompanyBasic[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);

  const [companyDetails, setCompanyDetails] = useState<Record<number, CompanyDetail>>({});
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [filters, setFilters] = useState<CompanyFilterCriteria>(getInitialFilters);

  // Persist filter preferences (excluding companyTypeId) to localStorage
  useEffect(() => {
    try {
      const { companyTypeId, ...persisted } = filters;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    } catch (error) {
      console.error('Failed to save company filters to localStorage:', error);
    }
  }, [filters]);

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

      // Min open positions
      if (filters.minOpenPositions !== null) {
        let openPositions = c.employees_capacity - c.employees_hired;
        if (filters.countInactiveAsFreeSpot && companyDetails[c.ID]) {
          const detail = companyDetails[c.ID];
          const now = Date.now();
          const inactiveCount = Object.values(detail.employees).filter((emp) => {
            const daysSinceAction = (now - emp.last_action.timestamp * 1000) / 86_400_000;
            return daysSinceAction > filters.daysInactivity;
          }).length;
          openPositions += inactiveCount;
        }
        if (openPositions < filters.minOpenPositions) return false;
      }

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
