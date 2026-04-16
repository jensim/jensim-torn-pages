import { useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import {
  fetchAllBounties,
  Bounty,
  FFScouterStats,
  fetchUserProfileV1Cached,
  UserProfileV1,
  fetchStats,
} from '../api';
import { FilterCriteria } from '../components/bounty/BountiesFilter';

const BATCH_SIZE = 50;

export interface BountiesData {
  bounties: Bounty[];
  fairFightData: Map<number, FFScouterStats>;
  userStatusData: Map<number, UserProfileV1>;
  loading: boolean;
  loadingProgress: number;
  loadingFairFight: boolean;
  loadingUserStatus: boolean;
  baseFilteredBounties: Bounty[];
  ffFilteredBounties: Bounty[];
  filteredBounties: Bounty[];
  ffLoadedCount: number;
  ffAllLoaded: boolean;
  userStatusLoadedCount: number;
  userStatusAllLoaded: boolean;
  loadBounties: () => Promise<void>;
  loadFairFightBatch: () => Promise<void>;
  loadUserStatusBatch: () => Promise<void>;
}

export function useBountiesData(
  apiKey: string,
  ffApiKey: string,
  filters: FilterCriteria
): BountiesData {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [fairFightData, setFairFightData] = useState<Map<number, FFScouterStats>>(new Map());
  const [userStatusData, setUserStatusData] = useState<Map<number, UserProfileV1>>(new Map());
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingFairFight, setLoadingFairFight] = useState(false);
  const [ffAttempted, setFfAttempted] = useState<Set<number>>(new Set());
  const [loadingUserStatus, setLoadingUserStatus] = useState(false);
  const [userStatusAttempted, setUserStatusAttempted] = useState<Set<number>>(new Set());

  // Layer 1: apply level + reward filters — no external data needed
  const baseFilteredBounties = useMemo(() => {
    return bounties.filter(bounty => {
      if (filters.minLevel !== null && bounty.target_level < filters.minLevel) return false;
      if (filters.maxLevel !== null && bounty.target_level > filters.maxLevel) return false;
      if (filters.minReward !== null && bounty.reward < filters.minReward) return false;
      if (filters.maxReward !== null && bounty.reward > filters.maxReward) return false;
      return true;
    });
  }, [bounties, filters]);

  // Layer 2: apply FF score filter — skips bounties without data yet
  const ffFilteredBounties = useMemo(() => {
    if (filters.minFairFight === null && filters.maxFairFight === null) {
      return baseFilteredBounties;
    }
    return baseFilteredBounties.filter(bounty => {
      const ffStats = fairFightData.get(bounty.target_id);
      if (!ffStats) return true; // keep if no data loaded yet
      if (filters.minFairFight !== null && ffStats.fair_fight < filters.minFairFight) return false;
      if (filters.maxFairFight !== null && ffStats.fair_fight > filters.maxFairFight) return false;
      return true;
    });
  }, [baseFilteredBounties, fairFightData, filters]);

  // Layer 3: apply user status + newbie filter — skips bounties without data yet
  const filteredBounties = useMemo(() => {
    const currentTime = Math.floor(Date.now() / 1000);
    return ffFilteredBounties.filter(bounty => {
      const userStatus = userStatusData.get(bounty.target_id);

      // Newbie filter (requires user status data)
      if (userStatus?.basicicons?.icon72 === 'Newbie') return false;

      // User Status filter (only if data is available)
      if (filters.userStatus !== null && userStatus) {
        if (userStatus.status.state !== filters.userStatus) return false;
      }

      // Max Time Remaining filter (only if data is available)
      if (filters.maxTimeRemaining !== null && userStatus) {
        const timeRemainingSeconds = userStatus.status.until - currentTime;
        const timeRemainingMinutes = timeRemainingSeconds / 60;
        if (timeRemainingSeconds > 0 && timeRemainingMinutes > filters.maxTimeRemaining) {
          // When no specific status filter is set, still include green-status users
          // (they are available to attack regardless of the time remaining value)
          if (filters.userStatus !== null || userStatus.status.color !== 'green') return false;
        }
      }

      return true;
    });
  }, [ffFilteredBounties, userStatusData, filters]);

  const ffLoadedCount = baseFilteredBounties.filter(b => ffAttempted.has(b.target_id)).length;
  const ffAllLoaded = baseFilteredBounties.length > 0 && ffLoadedCount >= baseFilteredBounties.length;
  const userStatusLoadedCount = ffFilteredBounties.filter(b => userStatusAttempted.has(b.target_id)).length;
  const userStatusAllLoaded =
    ffFilteredBounties.length > 0 && userStatusLoadedCount >= ffFilteredBounties.length;

  const loadBounties = async () => {
    if (!apiKey || loading) return;

    setLoading(true);
    setLoadingProgress(0);
    setBounties([]);
    // Reset user data but keep FF scores and ffAttempted
    setUserStatusData(new Map());
    setUserStatusAttempted(new Set());

    const minReward = filters.minReward;
    const result = await fetchAllBounties(
      apiKey,
      100,
      (current) => setLoadingProgress(current),
      // Stop fetching pages once the minimum reward on a page falls below minReward
      minReward !== null
        ? (page) => Math.min(...page.map(b => b.reward)) < minReward
        : undefined
    );

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

  // Load next batch of FF scores from layer-1 filtered bounties
  const loadFairFightBatch = async () => {
    if (!ffApiKey || baseFilteredBounties.length === 0 || loadingFairFight) return;

    const unloadedIds = baseFilteredBounties
      .map(b => b.target_id)
      .filter(id => !ffAttempted.has(id));

    if (unloadedIds.length === 0) return;

    setLoadingFairFight(true);
    const batch = unloadedIds.slice(0, BATCH_SIZE);

    // Mark attempted upfront
    setFfAttempted(prev => {
      const next = new Set(prev);
      batch.forEach(id => next.add(id));
      return next;
    });

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

    setLoadingFairFight(false);
  };

  // Load next batch of user statuses from layer-2 filtered bounties
  const loadUserStatusBatch = async () => {
    if (!apiKey || ffFilteredBounties.length === 0 || loadingUserStatus) return;

    const unloadedIds = ffFilteredBounties
      .map(b => b.target_id)
      .filter(id => !userStatusAttempted.has(id));

    if (unloadedIds.length === 0) return;

    setLoadingUserStatus(true);
    const batch = unloadedIds.slice(0, BATCH_SIZE);

    // Mark attempted upfront
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
      toast.error(
        `Failed to load some user status data: ${errors[0]}${errors.length > 1 ? ` (and ${errors.length - 1} more)` : ''}`
      );
    }

    setLoadingUserStatus(false);
  };

  return {
    bounties,
    fairFightData,
    userStatusData,
    loading,
    loadingProgress,
    loadingFairFight,
    loadingUserStatus,
    baseFilteredBounties,
    ffFilteredBounties,
    filteredBounties,
    ffLoadedCount,
    ffAllLoaded,
    userStatusLoadedCount,
    userStatusAllLoaded,
    loadBounties,
    loadFairFightBatch,
    loadUserStatusBatch,
  };
}
