import React from 'react';
import { EliminationTeam } from '../../api/elimination/elimination';

interface TeamPickerProps {
  teams: EliminationTeam[];
  selectedTeamId: number | null;
  onSelectTeam: (teamId: number) => void;
  loading: boolean;
}

export const TeamPicker: React.FC<TeamPickerProps> = ({
  teams,
  selectedTeamId,
  onSelectTeam,
  loading,
}) => {
  return (
    <div className="team-picker">
      <label htmlFor="team-select">Select Team: </label>
      <select
        id="team-select"
        value={selectedTeamId || ''}
        onChange={(e) => onSelectTeam(Number(e.target.value))}
        disabled={loading}
      >
        <option value="" disabled>
          Select a team
        </option>
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name} ({team.id})
          </option>
        ))}
      </select>
      {loading && <span> Loading teams...</span>}
    </div>
  );
};
