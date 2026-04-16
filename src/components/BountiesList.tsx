import React, { useState, useEffect, useMemo } from 'react';
import { fetchAllBounties, Bounty, FFScouterStats, fetchUserProfileV1Cached, UserProfileV1, fetchStats} from '../api';
import { usePassword } from '../hooks';
import { toast } from 'react-toastify';
import BountiesFilter, { FilterCriteria } from './BountiesFilter';
import { useNavigate } from 'react-router-dom';
import BountyListRow from './BountyListRow';
import Button from './Button';

const BATCH_SIZE = 50;

const BountiesList: React.FC = () => {
  const { password: apiKey } = usePassword('torn-api-key');
  const { password: ffApiKey } = usePassword('ff-api-key');
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [fairFightData, setFairFightData] = useState<Map<number, FFScouterStats>>(new Map());
  const [userStatusData, setUserStatusData] = useState<Map<number, UserProfileV1>>(new Map());
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingFairFight, setLoadingFairFight] = useState(false);
  const [ffLoadOffset, setFfLoadOffset] = useState(0);
  const [loadingUserStatus, setLoadingUserStatus] = useState(false);
  const [userStatusAttempted, setUserStatusAttempted] = useState<Set<number>>(new Set());

  // Load initial filters from localStorage
  const getInitialFilters = (): FilterCriteria => {
    try {
      const savedFilters = localStorage.getItem('bounties-filters');
      if (savedFilters) {
        return JSON.parse(savedFilters);
      }
    } catch (error) {
      console.error('Failed to load filters from localStorage:', error);
    }
    return {
      minLevel: null,
      maxLevel: null,
      minReward: null,
      maxReward: null,
      minFairFight: null,
      maxFairFight: null,
      userStatus: null,
      maxTimeRemaining: null,
    };
  };

  const navigate = useNavigate();

  const [filters, setFilters] = useState<FilterCriteria>(getInitialFilters);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('bounties-filters', JSON.stringify(filters));
    } catch (error) {
      console.error('Failed to save filters to localStorage:', error);
    }
  }, [filters]);

  // Load ALL bounties upfront, deduplicate by target_id
  useEffect(() => {
    const loadAllBounties = async () => {
      if (!apiKey) {
        return;
      }

      setLoading(true);
      setLoadingProgress(0);
      setBounties([]);
      setFfLoadOffset(0);
      setUserStatusAttempted(new Set());

      const result = await fetchAllBounties(apiKey, 100, (current) => {
        setLoadingProgress(current);
      });

      if (result.error) {
        toast.error(`Failed to load bounties: ${result.error}`);
        setBounties([]);
      } else if (result.data) {
        // Deduplicate: keep only the first row per target_id
        const seen = new Set<number>();
        const unique = result.data.bounties.filter(bounty => {
          if (seen.has(bounty.target_id)) return false;
          seen.add(bounty.target_id);
          return true;
        });
        setBounties(unique);
      }

      setLoading(false);
    };

    loadAllBounties();
  }, [apiKey]);

  const filteredBounties = useMemo(() => {
    const currentTime = Math.floor(Date.now() / 1000); // Current Unix timestamp in seconds

    return bounties.filter(bounty => {
      const ffStats = fairFightData.get(bounty.target_id);
      const userStatus = userStatusData.get(bounty.target_id);

      if (userStatusData.get(bounty.target_id)?.basicicons?.icon72 === 'Newbie') {
        return false;
      }

      // Level filter
      if (filters.minLevel !== null && bounty.target_level < filters.minLevel) {
        return false;
      }
      if (filters.maxLevel !== null && bounty.target_level > filters.maxLevel) {
        return false;
      }

      // Reward filter
      if (filters.minReward !== null && bounty.reward < filters.minReward) {
        return false;
      }
      if (filters.maxReward !== null && bounty.reward > filters.maxReward) {
        return false;
      }

      // Fair Fight filter (only if data is available)
      if (ffStats) {
        if (filters.minFairFight !== null && ffStats.fair_fight < filters.minFairFight) {
          return false;
        }
        if (filters.maxFairFight !== null && ffStats.fair_fight > filters.maxFairFight) {
          return false;
        }
      }

      // User Status filter (only if data is available)
      if (filters.userStatus !== null && userStatus) {
        if (userStatus.status.state !== filters.userStatus) {
          return false;
        }
      }

      // Max Time Remaining filter (only if data is available)
      if (filters.maxTimeRemaining !== null && userStatus) {
        const timeRemainingSeconds = userStatus.status.until - currentTime;
        const timeRemainingMinutes = timeRemainingSeconds / 60;

        // Only filter if the status has a future "until" timestamp
        if (timeRemainingSeconds > 0 && timeRemainingMinutes > filters.maxTimeRemaining) {
          return false;
        }
      }

      return true;
    });
  }, [bounties, fairFightData, userStatusData, filters]);

  const loadFairFightBatch = async () => {
    if (!ffApiKey || bounties.length === 0 || loadingFairFight || ffLoadOffset >= bounties.length) {
      return;
    }

    setLoadingFairFight(true);

    const batch = bounties.slice(ffLoadOffset, ffLoadOffset + BATCH_SIZE).map(b => b.target_id);
    const result = await fetchStats({ apiKey: ffApiKey, targetIds: batch });

    if (result.error) {
      toast.error(`Failed to load fair fight data: ${result.error}`);
    } else if (result.data) {
      setFairFightData(prevMap => {
        const newMap = new Map<number, FFScouterStats>(prevMap);
        result.data?.forEach(stats => {
          newMap.set(stats.player_id, stats);
        });
        return newMap;
      });
    }

    setFfLoadOffset(prev => prev + batch.length);
    setLoadingFairFight(false);
  };

  const loadUserStatusBatch = async () => {
    if (!apiKey || filteredBounties.length === 0 || loadingUserStatus) {
      return;
    }

    const unloadedIds = filteredBounties
      .map(b => b.target_id)
      .filter(id => !userStatusAttempted.has(id));

    if (unloadedIds.length === 0) return;

    setLoadingUserStatus(true);

    const batch = unloadedIds.slice(0, BATCH_SIZE);

    // Mark all batch IDs as attempted upfront
    setUserStatusAttempted(prev => {
      const next = new Set(prev);
      batch.forEach(id => next.add(id));
      return next;
    });

    const errors: string[] = [];
    for (const targetId of batch) {
      const result = await fetchUserProfileV1Cached(
        { apiKey, userId: targetId },
        { maxAgeMs: 5 * 60 * 1000 }
      );

      if (result.error) {
        errors.push(`User ${targetId}: ${result.error}`);
      } else if (result.data) {
        // Update state immediately as each user's data arrives
        setUserStatusData(prevMap => {
          const newMap = new Map(prevMap);
          newMap.set(result.data!.player_id, result.data!);
          return newMap;
        });
      }
    }

    if (errors.length > 0) {
      toast.error(`Failed to load some user status data: ${errors[0]}${errors.length > 1 ? ` (and ${errors.length - 1} more)` : ''}`);
    }

    setLoadingUserStatus(false);
  };

  const formatCurrency = (amount: number): string => {
    return `$${amount.toLocaleString()}`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  if (!apiKey) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>Torn Bounties</h2>
        <p>Please set your Torn API key in the Settings page to view bounties.</p>
        <button
          onClick={() => navigate('/settings')}
          style={{
            padding: '8px 16px',
            cursor: 'pointer',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            opacity: 1,
          }}
        >
          Go to Settings
        </button>
      </div>
    );
  }

  const userStatusLoadedInFiltered = filteredBounties.filter(b => userStatusAttempted.has(b.target_id)).length;
  const ffAllLoaded = bounties.length > 0 && ffLoadOffset >= bounties.length;
  const userStatusAllLoaded = filteredBounties.length > 0 && userStatusLoadedInFiltered >= filteredBounties.length;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Torn Bounties</h2>

      {loading && (
        <p>Loading bounties{loadingProgress > 0 ? ` (${loadingProgress} loaded...)` : '...'}</p>
      )}

      {!loading && bounties.length === 0 && (
        <p>No bounties found.</p>
      )}

      {!loading && bounties.length > 0 && (
        <>
          <BountiesFilter filters={filters} onFilterChange={setFilters} />

          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
            <div>
              <strong>{filteredBounties.length}</strong> of <strong>{bounties.length}</strong> bounties shown
            </div>
            {ffApiKey && (
              <Button
                onClick={loadFairFightBatch}
                disabled={loadingFairFight || ffAllLoaded || bounties.length === 0}
              >
                {loadingFairFight ? 'Loading FF...' : `Load FF Scores (${ffLoadOffset}/${bounties.length})`}
              </Button>
            )}
            <Button
              onClick={loadUserStatusBatch}
              disabled={loadingUserStatus || filteredBounties.length === 0 || userStatusAllLoaded}
            >
              {loadingUserStatus ? 'Loading Status...' : `Load User Status (${userStatusLoadedInFiltered}/${filteredBounties.length})`}
            </Button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Target</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Level</th>
                <th style={{ textAlign: 'center', padding: '8px' }}>Status</th>
                <th style={{ textAlign: 'center', padding: '8px' }}>Time Remaining</th>
                <th style={{ textAlign: 'right', padding: '8px' }}>Reward</th>
                <th style={{ textAlign: 'center', padding: '8px' }}>Fair Fight</th>
                <th style={{ textAlign: 'center', padding: '8px' }}>Quantity</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Valid Until</th>
              </tr>
            </thead>
            <tbody>
              {filteredBounties.map((bounty, index) => (
                <BountyListRow
                  key={`${bounty.target_id}-${index}`}
                  bounty={bounty}
                  index={index}
                  ffStats={fairFightData.get(bounty.target_id)}
                  userStatus={userStatusData.get(bounty.target_id)}
                  loadingUserStatus={loadingUserStatus}
                  loadingFairFight={loadingFairFight}
                  hasFfApiKey={!!ffApiKey}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                />
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default BountiesList;
