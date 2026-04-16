import React from 'react';
import { Bounty, FFScouterStats, UserProfileV1 } from '../../api';
import TimeRemaining from '../TimeRemaining';
import { getTimeUntil } from '../timeUntil';
import './BountyListRow.css';

export interface BountyListRowProps {
  bounty: Bounty;
  index: number;
  ffStats: FFScouterStats | undefined;
  userStatus: UserProfileV1 | undefined;
  loadingUserStatus: boolean;
  loadingFairFight: boolean;
  hasFfApiKey: boolean;
}

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString()}`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

const STATUS_COLOR_CLASS: Record<string, string> = {
  red: 'bounty-list-row-status--red',
  blue: 'bounty-list-row-status--blue',
  green: 'bounty-list-row-status--green',
};

const BountyListRow: React.FC<BountyListRowProps> = ({
  bounty,
  index,
  ffStats,
  userStatus,
  loadingUserStatus,
  loadingFairFight,
  hasFfApiKey,
}) => {
  return (
    <tr className="bounty-list-row">
      <td className="bounty-list-row-td">
        <a
          href={`https://www.torn.com/profiles.php?XID=${bounty.target_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bounty-list-row-link"
        >
          {bounty.target_name} ({bounty.target_id})
        </a>
      </td>
      <td className="bounty-list-row-td">{bounty.target_level}</td>
      <td className="bounty-list-row-td bounty-list-row-td--center">
        {loadingUserStatus ? (
          <span className="bounty-list-row-loading">Loading...</span>
        ) : userStatus ? (
          <span className={`bounty-list-row-status ${STATUS_COLOR_CLASS[userStatus.status.color] ?? ''}`}>
            {userStatus.status.state}
          </span>
        ) : (
          <span className="bounty-list-row-empty">-</span>
        )}
      </td>
      <td className="bounty-list-row-td bounty-list-row-td--center bounty-list-row-td--small">
        {loadingUserStatus ? (
          <span className="bounty-list-row-loading">Loading...</span>
        ) : userStatus ? (
          <TimeRemaining untilSeconds={getTimeUntil(userStatus)} />
        ) : (
          <span className="bounty-list-row-empty">-</span>
        )}
      </td>
      <td className="bounty-list-row-td bounty-list-row-td--right bounty-list-row-td--bold">
        {formatCurrency(bounty.reward)}
      </td>
      <td className="bounty-list-row-td bounty-list-row-td--center">
        {loadingFairFight ? (
          <span className="bounty-list-row-loading">Loading...</span>
        ) : ffStats ? (
          <span className="bounty-list-row-td--bold">{ffStats.fair_fight?.toFixed(2)}</span>
        ) : (
          <span className="bounty-list-row-empty">{hasFfApiKey ? 'N/A' : '-'}</span>
        )}
      </td>
      <td className="bounty-list-row-td bounty-list-row-td--center">{bounty.quantity}</td>
      <td className="bounty-list-row-td bounty-list-row-td--small">
        {formatDate(bounty.valid_until)}
      </td>
    </tr>
  );
};

export default BountyListRow;
