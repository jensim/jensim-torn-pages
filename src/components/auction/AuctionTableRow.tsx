import React from 'react';
import { AuctionHouseEntry, WeaponArmorDetails } from '../../api/market/auctionHouse';
import TimeRemaining from '../TimeRemaining';
import { FormattedPrice } from '../FormattedNumber';

interface AuctionTableRowProps {
  entry: AuctionHouseEntry;
}

const AuctionTableRow: React.FC<AuctionTableRowProps> = ({ entry }) => {
  const isWeaponOrArmor = 'stats' in entry.item;
  const item = entry.item;
  const weaponArmor = isWeaponOrArmor ? item as WeaponArmorDetails : null;

  const cellStyle: React.CSSProperties = {
    padding: '8px',
    borderBottom: '1px solid #eee',
    textAlign: 'left',
    fontSize: '13px',
  };

  const rarityColors: Record<string, string> = {
    yellow: '#d4af37',
    orange: '#ffa500',
    red: '#ff4500',
  };

  const getRarityColor = (rarity: string | null) => {
    if (!rarity) return 'inherit';
    return rarityColors[rarity.toLowerCase()] || 'inherit';
  };

  return (
    <tr>
      <td style={cellStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img
            src={`https://www.torn.com/images/items/${entry.item.id}/small.png`}
            alt={entry.item.name}
            style={{ width: '32px', height: '32px', objectFit: 'contain' }}
          />
          <span>{entry.item.name}</span>
        </div>
      </td>
      <td style={{ ...cellStyle, color: getRarityColor(weaponArmor?.rarity || null), fontWeight: 'bold' }}>
        {weaponArmor?.rarity || '-'}
      </td>
      <td style={cellStyle}>
        <FormattedPrice price={entry.price} />
      </td>
      <td style={cellStyle}>
        {weaponArmor && weaponArmor.bonuses.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {weaponArmor.bonuses.map((b) => (
              <span key={b.id} title={b.description} style={{ backgroundColor: '#f0f0f0', padding: '2px 4px', borderRadius: '4px', fontSize: '11px' }}>
                {b.title} ({b.value}%)
              </span>
            ))}
          </div>
        ) : '-'}
      </td>
      <td style={cellStyle}>
        {weaponArmor ? weaponArmor.stats.accuracy ?? '-' : '-'}
      </td>
      <td style={cellStyle}>
        {weaponArmor ? weaponArmor.stats.damage ?? '-' : '-'}
      </td>
      <td style={cellStyle}>
        {weaponArmor ? weaponArmor.stats.armor ?? '-' : '-'}
      </td>
      <td style={cellStyle}>
        {weaponArmor ? `${weaponArmor.stats.quality}%` : '-'}
      </td>
      <td style={cellStyle}>
        <TimeRemaining untilSeconds={entry.timestamp} />
      </td>
    </tr>
  );
};

export default AuctionTableRow;
