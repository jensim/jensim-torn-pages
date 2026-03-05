import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { usePassword } from '../hooks/usePassword';
import { useNavigate } from 'react-router-dom';
import {
  fetchElimination,
  fetchEliminationTeamMembers,
  EliminationTeam,
  EliminationTeamMember,
  fetchStats,
} from '../api';
import { TeamPicker } from '../components/elimination/TeamPicker';
import { PageSelector } from '../components/elimination/PageSelector';
import { TeamMemberFilter, Filters } from '../components/elimination/TeamMemberFilter';
import { TeamMemberTable } from '../components/elimination/TeamMemberTable';

export default function Elimination() {
  const { password: apiKey } = usePassword('torn-api-key');
  const navigate = useNavigate();

  const [teams, setTeams] = useState<EliminationTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedPages, setSelectedPages] = useState<number[]>([1]);
  const [filters, setFilters] = useState<Filters>({
    minLevel: '',
    maxLevel: '',
    minFairFight: '',
    maxFairFight: '',
    userStatus: '',
  });

  const [loadingTeams, setLoadingTeams] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [allMembers, setAllMembers] = useState<EliminationTeamMember[]>([]);
  const [ffData, setFfData] = useState<Record<number, number>>({});

  // Fetch teams on mount
  useEffect(() => {
    if (!apiKey) return;
    setLoadingTeams(true);
    fetchElimination({ apiKey })
      .then((res) => {
        if (res.error) {
          setError(res.error);
        } else if (res.data) {
          setTeams(res.data.elimination);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingTeams(false));
  }, [apiKey]);

  const loadData = useCallback(async () => {
    if (!apiKey || !selectedTeamId || selectedPages.length === 0) return;

    setLoadingMembers(true);
    setError(null);
    try {
      // 1. Load team members from all selected pages
      const memberPromises = selectedPages.map((page) =>
        fetchEliminationTeamMembers({
          apiKey,
          teamId: selectedTeamId,
          offset: (page - 1) * 50,
        })
      );

      const results = await Promise.all(memberPromises);
      let combinedMembers: EliminationTeamMember[] = [];
      for (const res of results) {
        if (res.error) {
          setError(res.error);
          return;
        }
        if (res.data) {
          combinedMembers = [...combinedMembers, ...res.data.eliminationteam];
        }
      }

      // De-duplicate if same member appears on multiple pages (shouldn't happen with offsets, but just in case)
      const uniqueMembersMap = new Map<number, EliminationTeamMember>();
      combinedMembers.forEach((m) => uniqueMembersMap.set(m.id, m));
      const uniqueMembers = Array.from(uniqueMembersMap.values());

      setAllMembers(uniqueMembers);

      // 2. Filter using level and status before fetching FF
      const preFilteredMembers = uniqueMembers.filter((m) => {
        if (filters.minLevel !== '' && m.level < filters.minLevel) return false;
        if (filters.maxLevel !== '' && m.level > filters.maxLevel) return false;
        if (filters.userStatus !== '' && !m.status.description.toLowerCase().includes(filters.userStatus.toLowerCase()))
          return false;
        return true;
      });

      if (preFilteredMembers.length > 0) {
        // 3. Fetch Fair Fight for only the filtered members
        const ffResult = await fetchStats({
          apiKey,
          targetIds: preFilteredMembers.map((m) => m.id),
        });

        if (ffResult.data) {
          const newFfData: Record<number, number> = {};
          ffResult.data.forEach((stat) => {
            newFfData[stat.player_id] = stat.fair_fight;
          });
          setFfData(newFfData);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading data');
    } finally {
      setLoadingMembers(false);
    }
  }, [apiKey, selectedTeamId, selectedPages, filters.minLevel, filters.maxLevel, filters.userStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Final filtering including Fair Fight
  const displayedMembers = useMemo(() => {
    return allMembers.filter((m) => {
      // Level and status filter (already done in loadData, but needed for immediate UI response if filters change)
      if (filters.minLevel !== '' && m.level < filters.minLevel) return false;
      if (filters.maxLevel !== '' && m.level > filters.maxLevel) return false;
      if (filters.userStatus !== '' && !m.status.description.toLowerCase().includes(filters.userStatus.toLowerCase()))
        return false;

      // Fair Fight filter
      const ff = ffData[m.id];
      if (filters.minFairFight !== '') {
        if (ff === undefined || ff < filters.minFairFight) return false;
      }
      if (filters.maxFairFight !== '') {
        if (ff === undefined || ff > filters.maxFairFight) return false;
      }

      return true;
    });
  }, [allMembers, ffData, filters]);

  if (!apiKey) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>Elimination</h2>
        <p>Please set your Torn API key in the Settings page to view elimination data.</p>
        <button
          onClick={() => navigate('/settings')}
          style={{
            padding: '8px 16px',
            cursor: 'pointer',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          Go to Settings
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Elimination</h1>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      <TeamPicker
        teams={teams}
        selectedTeamId={selectedTeamId}
        onSelectTeam={setSelectedTeamId}
        loading={loadingTeams}
      />

      <div style={{ marginTop: '20px' }}>
        <TeamMemberFilter
          filters={filters}
          onFilterChange={setFilters}
          onReload={loadData}
        />

        {selectedTeamId && <PageSelector
            selectedPages={selectedPages}
            onChange={setSelectedPages}
            maxPages={Math.ceil((teams[selectedTeamId]?.participants) ?? 0 / 100)}
        />}
      </div>

      <div style={{ marginTop: '20px' }}>
        {loadingMembers ? (
          <p>Loading member data...</p>
        ) : (
          <TeamMemberTable members={displayedMembers} ffData={ffData} />
        )}
      </div>
    </div>
  );
}
