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
