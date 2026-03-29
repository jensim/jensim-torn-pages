export interface CompanyFilterCriteria {
  companyTypeId: string | null;
  minStars: number | null;
  maxStars: number | null;
  excludeInactiveDirector: boolean;
  countInactiveAsFreeSpot: boolean;
  daysInactivity: number;
}

export const defaultCompanyFilters: CompanyFilterCriteria = {
  companyTypeId: null,
  minStars: 7,
  maxStars: null,
  excludeInactiveDirector: false,
  countInactiveAsFreeSpot: false,
  daysInactivity: 3,
};
