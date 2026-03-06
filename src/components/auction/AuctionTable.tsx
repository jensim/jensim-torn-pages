import React from 'react';
import { AuctionHouseEntry } from '../../api/market/auctionHouse';
import AuctionTableRow from './AuctionTableRow';

export type SortField = 'name' | 'rarity' | 'price' | 'accuracy' | 'damage' | 'armor' | 'quality' | 'timestamp';
export type SortDirection = 'asc' | 'desc';

interface AuctionTableProps {
  entries: AuctionHouseEntry[];
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

const AuctionTable: React.FC<AuctionTableProps> = ({ entries, sortField, sortDirection, onSort }) => {
  const headers: { field: SortField; label: string }[] = [
    { field: 'name', label: 'Name' },
    { field: 'rarity', label: 'Rarity' },
    { field: 'price', label: 'Price' },
    { field: 'name', label: 'Bonuses' }, // Not sortable by specific bonus easily
    { field: 'accuracy', label: 'Accuracy' },
    { field: 'damage', label: 'Damage' },
    { field: 'armor', label: 'Armor' },
    { field: 'quality', label: 'Quality' },
    { field: 'timestamp', label: 'Time left' },
  ];

  const headerStyle: React.CSSProperties = {
    padding: '12px 8px',
    backgroundColor: '#f5f5f5',
    borderBottom: '2px solid #ddd',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  };

  const renderSortArrow = (field: SortField) => {
    if (sortField !== field) return null;
    return <span>{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>;
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
        <thead>
          <tr>
            {headers.map(({ field, label }) => (
              <th
                key={label}
                style={headerStyle}
                onClick={() => label !== 'Bonuses' && onSort(field)}
              >
                {label}
                {label !== 'Bonuses' && renderSortArrow(field)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.length > 0 ? (
            entries.map((entry) => (
              <AuctionTableRow key={entry.id} entry={entry} />
            ))
          ) : (
            <tr>
              <td colSpan={headers.length} style={{ textAlign: 'center', padding: '24px', color: '#666' }}>
                No listings found matching the filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AuctionTable;
