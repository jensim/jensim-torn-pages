import React from 'react';
import { Link } from 'react-router-dom';
import { CompanyBasic, CompanyDetail } from '../../api/company/companies';
import { CompanyFilterCriteria } from './types';
import { FormattedPrice } from '../FormattedNumber';
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
      <td><FormattedPrice price={company.weekly_income} /></td>
    </tr>
  );
};

export default CompanyTableRow;
