import { useState, useEffect } from 'react';

/**
 * Persists filter state to localStorage. Reads the initial value on mount
 * and writes on every change. Generic over the filter shape T.
 */
export function usePersistedFilters<T>(key: string, defaults: T): [T, (f: T) => void] {
  const [filters, setFilters] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved) as T;
    } catch (error) {
      console.error(`Failed to load filters from localStorage (${key}):`, error);
    }
    return defaults;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(filters));
    } catch (error) {
      console.error(`Failed to save filters to localStorage (${key}):`, error);
    }
  }, [key, filters]);

  return [filters, setFilters];
}
