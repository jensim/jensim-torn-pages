import { CompanyPosition, CompanyTypeInfo } from '../../api/company/companyTypes';
import { WorkStats } from '../../api/user/workStats';

export type StatType = 'man' | 'int' | 'end';

export interface CompanySpecialsFilterCriteria {
  primaryGain: StatType[];
  secondaryGain: StatType[];
  minStatPercentMan: number | null;
  minStatPercentInt: number | null;
  minStatPercentEnd: number | null;
  showHidden: boolean;
  searchTerms: string[];
}

export const defaultSpecialsFilters: CompanySpecialsFilterCriteria = {
  primaryGain: ['man', 'int', 'end'],
  secondaryGain: ['man', 'int', 'end'],
  minStatPercentMan: null,
  minStatPercentInt: null,
  minStatPercentEnd: null,
  showHidden: false,
  searchTerms: [],
};

/**
 * Determine primary and secondary gain stat types for a position.
 * Tie-breaking: alphabetical order end < int < man (man wins ties).
 * Returns null for all-zero positions.
 */
export function getGainRanking(position: CompanyPosition): { primary: StatType; secondary: StatType } | null {
  const gains: [StatType, number][] = [
    ['man', position.man_gain],
    ['int', position.int_gain],
    ['end', position.end_gain],
  ];

  if (gains.every(([, v]) => v === 0)) return null;

  // Sort descending by value, then descending alphabetically (man > int > end) for ties
  gains.sort((a, b) => b[1] - a[1] || b[0].localeCompare(a[0]));

  return { primary: gains[0][0], secondary: gains[1][0] };
}

/**
 * Check if a company type matches the search terms (OR-search).
 * Matches against special names/effects and position names/descriptions.
 * Returns true if searchTerms is empty or any term matches.
 */
export function companyMatchesSearch(
  companyType: CompanyTypeInfo,
  searchTerms: string[]
): boolean {
  if (searchTerms.length === 0) return true;

  return searchTerms.some((term) => {
    const lower = term.toLowerCase();

    // Check specials (name or effect)
    for (const [name, special] of Object.entries(companyType.specials)) {
      if (name.toLowerCase().includes(lower)) return true;
      if (special.effect.toLowerCase().includes(lower)) return true;
    }

    // Check positions (name or description)
    for (const [posName, pos] of Object.entries(companyType.positions)) {
      if (posName.toLowerCase().includes(lower)) return true;
      if (pos.description.toLowerCase().includes(lower)) return true;
    }

    return false;
  });
}

/**
 * Check if a position matches all filter criteria.
 */
export function positionMatchesFilters(
  position: CompanyPosition,
  filters: CompanySpecialsFilterCriteria,
  workStats: WorkStats | null
): boolean {
  const ranking = getGainRanking(position);

  // All-zero positions auto-pass gain filters
  if (ranking !== null) {
    if (!filters.primaryGain.includes(ranking.primary)) return false;
    if (!filters.secondaryGain.includes(ranking.secondary)) return false;
  }

  // Stat % threshold (only if workStats loaded)
  if (workStats) {
    const checks: [number | null, number, number][] = [
      [filters.minStatPercentMan, workStats.manual_labor, position.man_required],
      [filters.minStatPercentInt, workStats.intelligence, position.int_required],
      [filters.minStatPercentEnd, workStats.endurance, position.end_required],
    ];
    for (const [threshold, playerStat, required] of checks) {
      if (threshold !== null && required > 0) {
        if ((playerStat / required) * 100 < threshold) return false;
      }
    }
  }

  return true;
}
