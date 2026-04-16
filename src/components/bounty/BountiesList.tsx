import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePassword } from '../../hooks';
import { usePersistedFilters } from '../../hooks/usePersistedFilters';
import { useBountiesData } from '../../hooks/useBountiesData';
import BountiesFilter, { FilterCriteria } from './BountiesFilter';
import BountiesActionBar from './BountiesActionBar';
import BountyListTable from './BountyListTable';
import Button from '../Button';
import './BountiesList.css';

const DEFAULT_FILTERS: FilterCriteria = {
  minLevel: null,
  maxLevel: null,
  minReward: null,
  maxReward: null,
  minFairFight: null,
  maxFairFight: null,
  userStatus: null,
  maxTimeRemaining: null,
};

const BountiesList: React.FC = () => {
  const { password: apiKey } = usePassword('torn-api-key');
  const { password: ffApiKey } = usePassword('ff-api-key');
  const navigate = useNavigate();
  const [filters, setFilters] = usePersistedFilters<FilterCriteria>('bounties-filters', DEFAULT_FILTERS);
  const {
    bounties,
    fairFightData,
    userStatusData,
    loading,
    loadingProgress,
    loadingFairFight,
    loadingUserStatus,
    filteredBounties,
    baseFilteredBounties,
    ffFilteredBounties,
    ffLoadedCount,
    ffAllLoaded,
    userStatusLoadedCount,
    userStatusAllLoaded,
    loadBounties,
    loadFairFightBatch,
    loadUserStatusBatch,
  } = useBountiesData(apiKey, ffApiKey, filters);

  if (!apiKey) {
    return (
      <div className="bounties-list-page">
        <h2>Torn Bounties</h2>
        <p>Please set your Torn API key in the Settings page to view bounties.</p>
        <Button onClick={() => navigate('/settings')}>Go to Settings</Button>
      </div>
    );
  }

  return (
    <div className="bounties-list-page">
      <h2>Torn Bounties</h2>

      <BountiesFilter filters={filters} onFilterChange={setFilters} />

      <BountiesActionBar
        loading={loading}
        loadingProgress={loadingProgress}
        loadingFairFight={loadingFairFight}
        loadingUserStatus={loadingUserStatus}
        totalBounties={bounties.length}
        filteredBounties={filteredBounties.length}
        ffLoadedCount={ffLoadedCount}
        ffTotalCount={baseFilteredBounties.length}
        ffAllLoaded={ffAllLoaded}
        userStatusLoadedCount={userStatusLoadedCount}
        userStatusTotalCount={ffFilteredBounties.length}
        userStatusAllLoaded={userStatusAllLoaded}
        hasFfApiKey={!!ffApiKey}
        onLoadBounties={loadBounties}
        onLoadFairFight={loadFairFightBatch}
        onLoadUserStatus={loadUserStatusBatch}
      />

      {!loading && bounties.length === 0 && (
        <p>No bounties loaded. Set your filters and press Load Bounties.</p>
      )}

      {bounties.length > 0 && (
        <BountyListTable
          bounties={filteredBounties}
          fairFightData={fairFightData}
          userStatusData={userStatusData}
          loadingFairFight={loadingFairFight}
          loadingUserStatus={loadingUserStatus}
          hasFfApiKey={!!ffApiKey}
        />
      )}
    </div>
  );
};

export default BountiesList;
