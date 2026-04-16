import React from 'react';
import { Bounty, FFScouterStats, UserProfileV1 } from '../../api';
import BountyListRow from './BountyListRow';
import './BountyListTable.css';

interface BountyListTableProps {
  bounties: Bounty[];
  fairFightData: Map<number, FFScouterStats>;
  userStatusData: Map<number, UserProfileV1>;
  loadingFairFight: boolean;
  loadingUserStatus: boolean;
  hasFfApiKey: boolean;
}

const BountyListTable: React.FC<BountyListTableProps> = ({
  bounties,
  fairFightData,
  userStatusData,
  loadingFairFight,
  loadingUserStatus,
  hasFfApiKey,
}) => {
  return (
    <table className="bounty-list-table">
      <thead>
        <tr className="bounty-list-table-header-row">
          <th className="bounty-list-table-th bounty-list-table-th--left">Target</th>
          <th className="bounty-list-table-th bounty-list-table-th--left">Level</th>
          <th className="bounty-list-table-th bounty-list-table-th--center">Status</th>
          <th className="bounty-list-table-th bounty-list-table-th--center">Time Remaining</th>
          <th className="bounty-list-table-th bounty-list-table-th--right">Reward</th>
          <th className="bounty-list-table-th bounty-list-table-th--center">Fair Fight</th>
          <th className="bounty-list-table-th bounty-list-table-th--center">Quantity</th>
          <th className="bounty-list-table-th bounty-list-table-th--left">Valid Until</th>
        </tr>
      </thead>
      <tbody>
        {bounties.map((bounty, index) => (
          <BountyListRow
            key={`${bounty.target_id}-${index}`}
            bounty={bounty}
            index={index}
            ffStats={fairFightData.get(bounty.target_id)}
            userStatus={userStatusData.get(bounty.target_id)}
            loadingUserStatus={loadingUserStatus}
            loadingFairFight={loadingFairFight}
            hasFfApiKey={hasFfApiKey}
          />
        ))}
      </tbody>
    </table>
  );
};

export default BountyListTable;
