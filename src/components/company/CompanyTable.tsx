import React, { useState, useMemo } from 'react';
import { CompanyBasic, CompanyDetail } from '../../api/company/companies';
import { CompanyFilterCriteria } from './types';
import CompanyTableRow from './CompanyTableRow';
import './CompanyTable.css';

type SortColumn = 'name' | 'employees' | 'stars' | 'weekly_income';
type SortDirection = 'asc' | 'desc';

interface CompanyTableProps {
  companies: CompanyBasic[];
  companyDetails: Record<number, CompanyDetail>;
  filters: CompanyFilterCriteria;
}

function getFreeSpots(
  company: CompanyBasic,
  detail: CompanyDetail | undefined,
  filters: CompanyFilterCriteria
): number {
  let hired = company.employees_hired;
  if (detail && filters.countInactiveAsFreeSpot) {
    const now = Date.now();
    const inactiveCount = Object.values(detail.employees).filter((emp) => {
      const daysSinceAction = (now - emp.last_action.timestamp * 1000) / 86_400_000;
      return daysSinceAction > filters.daysInactivity;
    }).length;
    hired = hired - inactiveCount;
  }
  return company.employees_capacity - hired;
}

const CompanyTable: React.FC<CompanyTableProps> = ({ companies, companyDetails, filters }) => {
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedCompanies = useMemo(() => {
    if (!sortColumn) return companies;

    return [...companies].sort((a, b) => {
      let cmp = 0;
      switch (sortColumn) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'employees':
          cmp = getFreeSpots(a, companyDetails[a.ID], filters)
              - getFreeSpots(b, companyDetails[b.ID], filters);
          break;
        case 'stars':
          cmp = a.rating - b.rating;
          break;
        case 'weekly_income':
          cmp = a.weekly_income - b.weekly_income;
          break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [companies, companyDetails, filters, sortColumn, sortDirection]);

  const renderSortIndicator = (column: SortColumn) => {
    if (sortColumn !== column) return null;
    return <span className="company-table-sort-indicator">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>;
  };

  if (companies.length === 0) {
    return <div className="company-table-empty">No companies to display. Select a company type above.</div>;
  }

  return (
    <table className="company-table">
      <thead>
        <tr>
          <th className="company-table-sortable" onClick={() => handleSort('name')}>
            Name{renderSortIndicator('name')}
          </th>
          <th className="company-table-sortable" onClick={() => handleSort('employees')}>
            Employees{renderSortIndicator('employees')}
          </th>
          <th className="company-table-sortable" onClick={() => handleSort('stars')}>
            Stars{renderSortIndicator('stars')}
          </th>
          <th className="company-table-sortable" onClick={() => handleSort('weekly_income')}>
            Weekly Income{renderSortIndicator('weekly_income')}
          </th>
        </tr>
      </thead>
      <tbody>
        {sortedCompanies.map((company) => (
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
