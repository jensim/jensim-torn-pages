import { Cache } from '../helpers/cache';
import { httpWrapper, DataOrError } from '../helpers/httpWrapper';

export interface CompanyTypeInfo {
  name: string;
  cost: number;
  default_employees: number;
}

export interface CompanyTypesResponse {
  companies: Record<string, CompanyTypeInfo>;
}

const companyTypesCache = new Cache<CompanyTypesResponse>({
  storageKey: 'torn-company-types',
  maxStalenessMs: 86_400_000, // 24 hours
});

export async function fetchCompanyTypes(apiKey: string): Promise<DataOrError<CompanyTypesResponse>> {
  return httpWrapper<CompanyTypesResponse>(
    {
      cache: companyTypesCache,
      retry: { maxRetries: 2, isSuccess: (r) => r.error === null },
    },
    async () => {
      try {
        const response = await fetch(
          `https://api.torn.com/torn/?selections=companies&key=${apiKey}`
        );
        if (!response.ok) {
          return { data: null, error: `HTTP error: ${response.status}` };
        }
        const data = await response.json();
        if ('error' in data && data.error) {
          return { data: null, error: `Torn API Error (${data.error.code}): ${data.error.error}` };
        }
        return { data: data as CompanyTypesResponse, error: null };
      } catch (error) {
        return {
          data: null,
          error: `Failed to fetch company types: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }
  );
}
