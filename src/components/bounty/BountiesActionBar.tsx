import React from 'react';
import Button from '../Button';
import './BountiesActionBar.css';

interface BountiesActionBarProps {
  loading: boolean;
  loadingProgress: number;
  loadingFairFight: boolean;
  loadingUserStatus: boolean;
  totalBounties: number;
  filteredBounties: number;
  ffLoadedCount: number;
  ffTotalCount: number;
  ffAllLoaded: boolean;
  userStatusLoadedCount: number;
  userStatusTotalCount: number;
  userStatusAllLoaded: boolean;
  hasFfApiKey: boolean;
  onLoadBounties: () => void;
  onLoadFairFight: () => void;
  onLoadUserStatus: () => void;
}

const BountiesActionBar: React.FC<BountiesActionBarProps> = ({
  loading,
  loadingProgress,
  loadingFairFight,
  loadingUserStatus,
  totalBounties,
  filteredBounties,
  ffLoadedCount,
  ffTotalCount,
  ffAllLoaded,
  userStatusLoadedCount,
  userStatusTotalCount,
  userStatusAllLoaded,
  hasFfApiKey,
  onLoadBounties,
  onLoadFairFight,
  onLoadUserStatus,
}) => {
  return (
    <div className="bounties-action-bar">
      <Button onClick={onLoadBounties} disabled={loading}>
        {loading
          ? `Loading bounties${loadingProgress > 0 ? ` (${loadingProgress}...)` : '...'}`
          : 'Load Bounties'}
      </Button>

      {totalBounties > 0 && (
        <>
          <span className="bounties-action-bar-count">
            <strong>{filteredBounties}</strong> of <strong>{totalBounties}</strong> bounties shown
          </span>
          {hasFfApiKey && (
            <Button
              onClick={onLoadFairFight}
              disabled={loadingFairFight || ffAllLoaded || ffTotalCount === 0}
            >
              {loadingFairFight
                ? 'Loading FF...'
                : `Load FF Scores (${ffLoadedCount}/${ffTotalCount})`}
            </Button>
          )}
          <Button
            onClick={onLoadUserStatus}
            disabled={loadingUserStatus || userStatusTotalCount === 0 || userStatusAllLoaded}
          >
            {loadingUserStatus
              ? 'Loading Status...'
              : `Load User Status (${userStatusLoadedCount}/${userStatusTotalCount})`}
          </Button>
        </>
      )}
    </div>
  );
};

export default BountiesActionBar;
