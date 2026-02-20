import React from 'react';
import { Bounty } from '../api';
import { FFScouterStats } from '../api/ffScouter';
import { UserProfileV1 } from '../api/tornUserProfileV1';
import TimeRemaining from './TimeRemaining';

export interface BountyListRowProps {
  bounty: Bounty;
  index: number;
  ffStats: FFScouterStats | undefined;
  userStatus: UserProfileV1 | undefined;
  loadingUserStatus: boolean;
  loadingFairFight: boolean;
  hasFfApiKey: boolean;
  formatCurrency: (amount: number) => string;
  formatDate: (timestamp: number) => string;
}

const BountyListRow: React.FC<BountyListRowProps> = ({
  bounty,
  index,
  ffStats,
  userStatus,
  loadingUserStatus,
  loadingFairFight,
  hasFfApiKey,
  formatCurrency,
  formatDate,
}) => {
  return (
    <tr style={{ borderBottom: '1px solid #eee' }}>
      <td style={{ padding: '8px' }}>
        <a
          href={`https://www.torn.com/profiles.php?XID=${bounty.target_id}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'inherit', textDecoration: 'underline' }}
        >
          {bounty.target_name} ({bounty.target_id})
        </a>
      </td>
      <td style={{ padding: '8px' }}>{bounty.target_level}</td>
      <td style={{ textAlign: 'center', padding: '8px' }}>
        {loadingUserStatus ? (
          <span style={{ fontSize: '0.9em', color: '#666' }}>Loading...</span>
        ) : userStatus ? (
          <span
            style={{
              fontWeight: 'bold',
              color:
                userStatus.status.color === 'red'
                  ? '#dc3545'
                  : userStatus.status.color === 'blue'
                    ? '#007bff'
                    : userStatus.status.color === 'green'
                      ? '#28a745'
                      : 'inherit',
            }}
          >
            {userStatus.status.state}
          </span>
        ) : (
          <span style={{ fontSize: '0.9em', color: '#999' }}>-</span>
        )}
      </td>
      <td style={{ textAlign: 'center', padding: '8px', fontSize: '0.9em' }}>
        {loadingUserStatus ? (
          <span style={{ color: '#666' }}>Loading...</span>
        ) : userStatus ? (
          <TimeRemaining until={userStatus.status.until} />
        ) : (
          <span style={{ color: '#999' }}>-</span>
        )}
      </td>
      <td style={{ textAlign: 'right', padding: '8px', fontWeight: 'bold' }}>
        {formatCurrency(bounty.reward)}
      </td>
      <td style={{ textAlign: 'center', padding: '8px' }}>
        {loadingFairFight ? (
          <span style={{ fontSize: '0.9em', color: '#666' }}>Loading...</span>
        ) : ffStats ? (
          <span style={{ fontWeight: 'bold' }}>{ffStats.fair_fight?.toFixed(2)}</span>
        ) : hasFfApiKey ? (
          <span style={{ fontSize: '0.9em', color: '#999' }}>N/A</span>
        ) : (
          <span style={{ fontSize: '0.9em', color: '#999' }}>-</span>
        )}
      </td>
      <td style={{ textAlign: 'center', padding: '8px' }}>{bounty.quantity}</td>
      <td style={{ padding: '8px', fontSize: '0.9em' }}>
        {formatDate(bounty.valid_until)}
      </td>
    </tr>
  );
};

export default BountyListRow;
