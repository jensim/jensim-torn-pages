import React from 'react';
import { EliminationTeamMember } from '../../api/elimination/elimination';

interface TeamMemberRowProps {
  member: EliminationTeamMember;
  fairFight: number | null;
}

export const TeamMemberRow: React.FC<TeamMemberRowProps> = ({ member, fairFight }) => {
  return (
    <tr>
      <td>{member.name}</td>
      <td>{member.id}</td>
      <td>{member.level}</td>
      <td>{member.status.description}</td>
      <td>{fairFight !== null ? fairFight.toFixed(2) : '-'}</td>
      <td>
        <a
          href={`https://www.torn.com/profiles.php?XID=${member.id}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Profile
        </a>
      </td>
      <td>
        <a
          href={`https://www.torn.com/loader.php?sid=attack&user2ID=${member.id}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Attack
        </a>
      </td>
    </tr>
  );
};
