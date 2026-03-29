import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import { usePassword } from '../hooks/usePassword';
import { fetchCompanyTypes, CompanyTypesResponse, CompanyPosition } from '../api/company/companyTypes';
import { fetchWorkStats, WorkStats } from '../api/user/workStats';
import CompanySpecialsFilter from '../components/company-specials/CompanySpecialsFilter';
import CompanySpecialsTable, { CompanySpecialsEntry } from '../components/company-specials/CompanySpecialsTable';
import { CompanySpecialsFilterCriteria, defaultSpecialsFilters, positionMatchesFilters, companyMatchesSearch } from '../components/company-specials/types';
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
      .filter(([, companyType]) => companyMatchesSearch(companyType, filters.searchTerms))
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
