import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { usePassword } from '../hooks/usePassword';
import { fetchCompanyDetail, CompanyDetail } from '../api/company/companies';
import { fetchUserProfileV1Cached, UserProfileV1 } from '../api/user/tornUserProfileV1';
import { fetchUserPersonalStats, UserPersonalStats } from '../api/user/userPersonalStats';
import EmployeeTable from '../components/company-employees/EmployeeTable';
import { EmployeeRowData } from '../components/company-employees/EmployeeTableRow';
import './CompanyEmployees.css';

const PROFILE_CACHE_MS = 3_600_000; // 1 hour

const CompanyEmployees: React.FC = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const { password: apiKey } = usePassword('torn-api-key');

  const [companyDetail, setCompanyDetail] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profiles, setProfiles] = useState<Record<string, UserProfileV1>>({});
  const [stats, setStats] = useState<Record<string, UserPersonalStats>>({});

  // Fetch company detail
  useEffect(() => {
    if (!apiKey) {
      setError('Please set your Torn API key in Settings.');
      setLoading(false);
      return;
    }
    if (!companyId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      const result = await fetchCompanyDetail(apiKey, Number(companyId));
      if (cancelled) return;
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      } else if (result.data) {
        setCompanyDetail(result.data);
      }
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [apiKey, companyId]);

  // Fetch profiles and stats for each employee
  useEffect(() => {
    if (!companyDetail || !apiKey) return;

    let cancelled = false;
    const employeeIds = Object.keys(companyDetail.employees);

    employeeIds.forEach((userId) => {
      fetchUserProfileV1Cached(
        { apiKey, userId },
        { maxAgeMs: PROFILE_CACHE_MS }
      ).then((result) => {
        if (cancelled) return;
        if (result.data) {
          setProfiles((prev) => ({ ...prev, [userId]: result.data! }));
        }
      });

      fetchUserPersonalStats(apiKey, userId).then((result) => {
        if (cancelled) return;
        if (result.data) {
          setStats((prev) => ({ ...prev, [userId]: result.data! }));
        }
      });
    });

    return () => { cancelled = true; };
  }, [companyDetail, apiKey]);

  const rows: EmployeeRowData[] = companyDetail
    ? Object.entries(companyDetail.employees).map(([userId, employee]) => ({
        userId,
        name: employee.name,
        profile: profiles[userId] ?? null,
        stats: stats[userId] ?? null,
      }))
    : [];

  if (loading) {
    return (
      <div className="company-employees-page">
        <div className="company-employees-loading">Loading employees…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="company-employees-page">
        <div className="company-employees-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="company-employees-page">
      {companyDetail && (
        <h1 className="company-employees-heading">
          <a
            href={`https://www.torn.com/joblist.php#!p=corpinfo&ID=${companyId}`}
            target="_blank"
            rel="noreferrer"
            className="company-employees-company-link"
          >
            {companyDetail.name}
          </a>
        </h1>
      )}
      <EmployeeTable rows={rows} />
    </div>
  );
};

export default CompanyEmployees;
