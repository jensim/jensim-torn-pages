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
