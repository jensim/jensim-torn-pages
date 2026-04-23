import React from 'react';
import EmployeeTableRow, { EmployeeRowData } from './EmployeeTableRow';
import './EmployeeTable.css';

interface EmployeeTableProps {
  rows: EmployeeRowData[];
}

const EmployeeTable: React.FC<EmployeeTableProps> = ({ rows }) => {
  if (rows.length === 0) {
    return <div className="employee-table-empty">No employees found.</div>;
  }

  return (
    <div className="employee-table-wrapper">
      <table className="employee-table">
        <thead>
          <tr>
            <th className="employee-table-th">Name</th>
            <th className="employee-table-th">Last action</th>
            <th className="employee-table-th">Age</th>
            <th className="employee-table-th">Times trained</th>
            <th className="employee-table-th">Time played</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <EmployeeTableRow key={row.userId} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeeTable;
