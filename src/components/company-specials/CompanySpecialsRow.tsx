import React, { useState } from 'react';
import { CompanyTypeInfo, CompanyPosition, CompanySpecial } from '../../api/company/companyTypes';
import './CompanySpecialsRow.css';

interface CompanySpecialsRowProps {
  typeId: string;
  companyType: CompanyTypeInfo;
  matchingPositions: [string, CompanyPosition][];
  isHidden: boolean;
  onToggleHidden: () => void;
}

const RATING_LEVELS = [1, 3, 5, 7, 10];

function getSpecialAtRating(
  specials: Record<string, CompanySpecial>,
  rating: number
): [string, CompanySpecial] | null {
  for (const [name, special] of Object.entries(specials)) {
    if (special.rating_required === rating) return [name, special];
  }
  return null;
}

const CompanySpecialsRow: React.FC<CompanySpecialsRowProps> = ({
  typeId,
  companyType,
  matchingPositions,
  isHidden,
  onToggleHidden,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const rowClass = isHidden ? 'company-specials-row--hidden' : '';

  return (
    <>
      <tr className={rowClass}>
        <td>
          <span
            className="company-specials-row-name"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <svg
              className={`company-specials-row-chevron${isExpanded ? '' : ' company-specials-row-chevron--collapsed'}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
            {companyType.name}
          </span>
        </td>
        {RATING_LEVELS.map((rating) => {
          const entry = getSpecialAtRating(companyType.specials, rating);
          if (!entry) return <td key={rating} className="company-specials-row-special" />;
          const [name, special] = entry;
          return (
            <td key={rating} className="company-specials-row-special">
              <div className="company-specials-row-special-name">{name}</div>
              <div>{special.effect}</div>
              <div className="company-specials-row-special-cost">
                {special.cost === 0 ? 'Passive' : `${special.cost} JP`}
              </div>
            </td>
          );
        })}
        <td>
          <button className="company-specials-row-hide-btn" onClick={onToggleHidden}>
            {isHidden ? 'Show' : 'Hide'}
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr className={rowClass}>
          <td colSpan={7}>
            <table className="company-specials-row-subtable">
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Man Req</th>
                  <th>Int Req</th>
                  <th>End Req</th>
                  <th>Man Gain</th>
                  <th>Int Gain</th>
                  <th>End Gain</th>
                  <th>Special</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {matchingPositions.map(([posName, pos]) => (
                  <tr key={posName}>
                    <td>{posName}</td>
                    <td>{pos.man_required.toLocaleString()}</td>
                    <td>{pos.int_required.toLocaleString()}</td>
                    <td>{pos.end_required.toLocaleString()}</td>
                    <td>{pos.man_gain}</td>
                    <td>{pos.int_gain}</td>
                    <td>{pos.end_gain}</td>
                    <td>{pos.special_ability}</td>
                    <td>{pos.description}</td>
                  </tr>
                ))}
                {matchingPositions.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', color: '#666' }}>
                      No positions match current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  );
};

export default CompanySpecialsRow;
