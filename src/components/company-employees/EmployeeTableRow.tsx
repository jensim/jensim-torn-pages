import React from 'react';
import { UserProfileV1 } from '../../api/user/tornUserProfileV1';
import { UserPersonalStats } from '../../api/user/userPersonalStats';

export interface EmployeeRowData {
  userId: string;
  name: string;
  profile: UserProfileV1 | null;
  stats: UserPersonalStats | null;
}

function formatAge(days: number): string {
  const years = Math.floor(days / 365);
  const remainder = days % 365;
  if (years > 0) return `${years}y ${remainder}d`;
  return `${days}d`;
}

function formatActivity(minutes: number): string {
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

interface EmployeeTableRowProps {
  row: EmployeeRowData;
}

const EmployeeTableRow: React.FC<EmployeeTableRowProps> = ({ row }) => {
  const { userId, name, profile, stats } = row;

  return (
    <tr className="employee-table-row">
      <td className="employee-table-cell employee-table-cell-name">
        <a
          href={`https://www.torn.com/profiles.php?XID=${userId}`}
          target="_blank"
          rel="noreferrer"
          className="employee-table-profile-link"
        >
          {name} [{userId}]
        </a>
      </td>
      <td className="employee-table-cell">
        {profile ? (profile.last_action?.relative ?? '—') : '…'}
      </td>
      <td className="employee-table-cell">
        {profile ? formatAge(profile.age) : '…'}
      </td>
      <td className="employee-table-cell">
        {stats ? stats.trainsreceived.toLocaleString() : '…'}
      </td>
      <td className="employee-table-cell">
        {stats ? formatActivity(stats.useractivity) : '…'}
      </td>
    </tr>
  );
};

export default EmployeeTableRow;
