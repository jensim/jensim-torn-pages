import { Cache } from '../helpers/cache';
import { httpWrapper, DataOrError } from '../helpers/httpWrapper';
import { RateLimiter } from '../helpers/rateLimiter';

export interface CompanyBasic {
  ID: number;
  company_type: number;
  rating: number;
  name: string;
  director: number;
  employees_hired: number;
  employees_capacity: number;
  daily_income: number;
  daily_customers: number;
  weekly_income: number;
  weekly_customers: number;
  days_old: number;
}

export interface CompanyEmployee {
  name: string;
  position: string;
  days_in_company: number;
  last_action: {
    status: string;
    timestamp: number; // Unix timestamp in SECONDS
    relative: string;
  };
  status: {
    description: string;
    details: string;
    state: string;
    color: string;
    until: number;
  };
}

export interface CompanyDetail extends CompanyBasic {
  employees: Record<string, CompanyEmployee>;
}

interface CompaniesApiResponse {
  company: Record<string, CompanyBasic>;
}

interface CompanyDetailApiResponse {
  company: CompanyDetail;
}

const companyDetailLimiter = new RateLimiter({ cooldownMs: 250 });

export async function fetchCompaniesByType(
  apiKey: string,
  typeId: string
): Promise<DataOrError<CompanyBasic[]>> {
  const cache = new Cache<CompanyBasic[]>({
    storageKey: `torn-companies-type-${typeId}`,
    maxStalenessMs: 3_600_000, // 1 hour
  });
  return httpWrapper<CompanyBasic[]>(
    {
      cache,
      retry: { maxRetries: 2, isSuccess: (r) => r.error === null },
    },
    async () => {
      try {
        const response = await fetch(
          `https://api.torn.com/company/${typeId}?selections=companies&key=${apiKey}`
        );
        if (!response.ok) {
          return { data: null, error: `HTTP error: ${response.status}` };
        }
        const data = await response.json();
        if ('error' in data && data.error) {
          return { data: null, error: `Torn API Error (${data.error.code}): ${data.error.error}` };
        }
        const typed = data as CompaniesApiResponse;
        const companies = Object.values(typed.company);
        return { data: companies, error: null };
      } catch (error) {
        return {
          data: null,
          error: `Failed to fetch companies: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }
  );
}

export async function fetchCompanyDetail(
  apiKey: string,
  companyId: number
): Promise<DataOrError<CompanyDetail>> {
  const cache = new Cache<CompanyDetail>({
    storageKey: `torn-company-detail-${companyId}`,
    maxStalenessMs: 3_600_000, // 1 hour
  });
  return httpWrapper<CompanyDetail>(
    {
      cache,
      rateLimiter: companyDetailLimiter,
      retry: { maxRetries: 2, isSuccess: (r) => r.error === null },
    },
    async () => {
      try {
        const response = await fetch(
          `https://api.torn.com/company/${companyId}?selections=&key=${apiKey}`
        );
        if (!response.ok) {
          return { data: null, error: `HTTP error: ${response.status}` };
        }
        const data = await response.json();
        if ('error' in data && data.error) {
          return { data: null, error: `Torn API Error (${data.error.code}): ${data.error.error}` };
        }
        const typed = data as CompanyDetailApiResponse;
        return { data: typed.company, error: null };
      } catch (error) {
        return {
          data: null,
          error: `Failed to fetch company detail: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }
  );
}
