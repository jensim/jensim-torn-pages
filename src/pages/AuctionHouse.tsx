import React, { useEffect, useState, useMemo } from 'react';
import { fetchAuctionHouse, AuctionHouseEntry, WeaponArmorDetails } from '../api/market/auctionHouse';
import { usePassword } from '../hooks/usePassword';
import AuctionFilter, { FilterCriteria } from '../components/auction/AuctionFilter';
import AuctionTable, { SortField, SortDirection } from '../components/auction/AuctionTable';

const AuctionHouse: React.FC = () => {
  const { password: apiKey } = usePassword('torn-api-key');
  const [entries, setEntries] = useState<AuctionHouseEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterCriteria>({
    minPrice: null,
    maxPrice: null,
    rarity: [],
    minAccuracy: null,
    maxAccuracy: null,
    minDamage: null,
    maxDamage: null,
    minArmor: null,
    maxArmor: null,
    minQuality: null,
    maxQuality: null,
    bonus: [],
    minBonusValue: null,
    maxBonusValue: null,
    name: '',
    minTimeLeft: null,
    maxTimeLeft: null,
    type: [],
    subType: [],
  });

  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    if (!apiKey) return;

    setLoading(true);
    fetchAuctionHouse(apiKey)
      .then((res) => {
        if (res.error) {
          setError(res.error);
        } else if (res.data) {
          setEntries(res.data);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [apiKey]);

  const options = useMemo(() => {
    const rarities = new Set<string>();
    const bonuses = new Set<string>();
    const types = new Set<string>();
    const subTypes = new Set<string>();

    entries.forEach((entry) => {
      const isWeaponOrArmor = 'stats' in entry.item;
      const item = entry.item;
      
      if (isWeaponOrArmor) {
          const waItem = item as WeaponArmorDetails;
          if (waItem.rarity) rarities.add(waItem.rarity);
          waItem.bonuses.forEach(b => bonuses.add(b.title));
          if (waItem.sub_type) subTypes.add(waItem.sub_type);
      }
      if (item.type) types.add(item.type);
    });

    return {
      rarities: Array.from(rarities).sort(),
      bonuses: Array.from(bonuses).sort(),
      types: Array.from(types).sort(),
      subTypes: Array.from(subTypes).sort(),
    };
  }, [entries]);

  const filteredAndSortedEntries = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    
    return entries
      .filter((entry) => {
        const isWeaponOrArmor = 'stats' in entry.item;
        const item = entry.item;
        const waItem = isWeaponOrArmor ? (item as WeaponArmorDetails) : null;

        if (filters.name && !item.name.toLowerCase().includes(filters.name.toLowerCase())) return false;
        if (filters.minPrice !== null && entry.price < filters.minPrice) return false;
        if (filters.maxPrice !== null && entry.price > filters.maxPrice) return false;
        
        if (filters.rarity.length > 0 && (!waItem || !waItem.rarity || !filters.rarity.includes(waItem.rarity))) return false;
        if (filters.type.length > 0 && !filters.type.includes(item.type)) return false;
        if (filters.subType.length > 0 && (!waItem || !waItem.sub_type || !filters.subType.includes(waItem.sub_type))) return false;

        if (waItem) {
          if (filters.minAccuracy !== null && (waItem.stats.accuracy ?? 0) < filters.minAccuracy) return false;
          if (filters.maxAccuracy !== null && (waItem.stats.accuracy ?? 0) > filters.maxAccuracy) return false;
          if (filters.minDamage !== null && (waItem.stats.damage ?? 0) < filters.minDamage) return false;
          if (filters.maxDamage !== null && (waItem.stats.damage ?? 0) > filters.maxDamage) return false;
          if (filters.minArmor !== null && (waItem.stats.armor ?? 0) < filters.minArmor) return false;
          if (filters.maxArmor !== null && (waItem.stats.armor ?? 0) > filters.maxArmor) return false;
          if (filters.minQuality !== null && waItem.stats.quality < filters.minQuality) return false;
          if (filters.maxQuality !== null && waItem.stats.quality > filters.maxQuality) return false;

          if (filters.bonus.length > 0) {
            const hasBonus = waItem.bonuses.some(b => filters.bonus.includes(b.title));
            if (!hasBonus) return false;
          }

          if (filters.minBonusValue !== null || filters.maxBonusValue !== null) {
            const hasMatchingBonusValue = waItem.bonuses.some(b => {
                if (filters.minBonusValue !== null && b.value < filters.minBonusValue) return false;
                if (filters.maxBonusValue !== null && b.value > filters.maxBonusValue) return false;
                return true;
            });
            if (!hasMatchingBonusValue) return false;
          }
        } else {
            // If filtering by weapon/armor stats but it's not a weapon/armor, exclude it
            if (filters.minAccuracy !== null || filters.maxAccuracy !== null || 
                filters.minDamage !== null || filters.maxDamage !== null || 
                filters.minArmor !== null || filters.maxArmor !== null || 
                filters.minQuality !== null || filters.maxQuality !== null ||
                filters.bonus.length > 0 || filters.minBonusValue !== null || filters.maxBonusValue !== null) {
                return false;
            }
        }

        const timeLeftMin = (entry.timestamp - now) / 60;
        if (filters.minTimeLeft !== null && timeLeftMin < filters.minTimeLeft) return false;
        if (filters.maxTimeLeft !== null && timeLeftMin > filters.maxTimeLeft) return false;

        return true;
      })
      .sort((a, b) => {
        let valA: any;
        let valB: any;

        const isWA_A = 'stats' in a.item;
        const isWA_B = 'stats' in b.item;
        const waA = isWA_A ? (a.item as WeaponArmorDetails) : null;
        const waB = isWA_B ? (b.item as WeaponArmorDetails) : null;

        switch (sortField) {
          case 'name':
            valA = a.item.name.toLowerCase();
            valB = b.item.name.toLowerCase();
            break;
          case 'rarity':
            valA = waA?.rarity || '';
            valB = waB?.rarity || '';
            break;
          case 'price':
            valA = a.price;
            valB = b.price;
            break;
          case 'accuracy':
            valA = waA?.stats.accuracy ?? 0;
            valB = waB?.stats.accuracy ?? 0;
            break;
          case 'damage':
            valA = waA?.stats.damage ?? 0;
            valB = waB?.stats.damage ?? 0;
            break;
          case 'armor':
            valA = waA?.stats.armor ?? 0;
            valB = waB?.stats.armor ?? 0;
            break;
          case 'quality':
            valA = waA?.stats.quality ?? 0;
            valB = waB?.stats.quality ?? 0;
            break;
          case 'timestamp':
            valA = a.timestamp;
            valB = b.timestamp;
            break;
          default:
            return 0;
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [entries, filters, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Auction House Listings (ENDED)</h2>
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      {loading ? (
        <p>Loading listings...</p>
      ) : (
        <>
          <AuctionFilter
            filters={filters}
            options={options}
            onFilterChange={setFilters}
          />
          <AuctionTable
            entries={filteredAndSortedEntries}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        </>
      )}
    </div>
  );
};

export default AuctionHouse;
