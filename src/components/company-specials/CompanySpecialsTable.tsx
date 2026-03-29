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
