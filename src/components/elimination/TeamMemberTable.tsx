import React from 'react';
import { EliminationTeamMember } from '../../api/elimination/elimination';
import { TeamMemberRow } from './TeamMemberRow';

interface TeamMemberTableProps {
  members: EliminationTeamMember[];
  ffData: Record<number, number>;
}

export const TeamMemberTable: React.FC<TeamMemberTableProps> = ({ members, ffData }) => {
  return (
    <div className="team-member-table">
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ddd' }}>
            <th>Name</th>
            <th>ID</th>
            <th>Level</th>
            <th>Status</th>
            <th>Fair Fight</th>
            <th>Profile</th>
            <th>Attack</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <TeamMemberRow
              key={member.id}
              member={member}
              fairFight={ffData[member.id] ?? null}
            />
          ))}
          {members.length === 0 && (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>
                No members found matching filters
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
