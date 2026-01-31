import { useState, useEffect, useCallback } from 'react';

const STORAGE_PREFIX = 'password_';

/**
 * Custom hook for managing passwords in local storage
 * @param name - The name/key for the password
 * @returns An object containing the password value and a setter function
 */
export const usePassword = (name: string) => {
  const storageKey = `${STORAGE_PREFIX}${name}`;

  const getStoredPassword = useCallback((): string => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored || '';
    } catch (error) {
      console.error(`Error reading password '${name}' from localStorage:`, error);
      return '';
    }
  }, [storageKey, name]);

  const [password, setPasswordState] = useState<string>(getStoredPassword);

  const setPassword = useCallback((value: string) => {
    try {
      localStorage.setItem(storageKey, value);
      setPasswordState(value);
    } catch (error) {
      console.error(`Error saving password '${name}' to localStorage:`, error);
    }
  }, [storageKey, name]);

  const clearPassword = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setPasswordState('');
    } catch (error) {
      console.error(`Error clearing password '${name}' from localStorage:`, error);
    }
  }, [storageKey, name]);

  // Sync with localStorage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue !== null) {
        setPasswordState(e.newValue);
      } else if (e.key === storageKey && e.newValue === null) {
        setPasswordState('');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [storageKey]);

  return {
    password,
    setPassword,
    clearPassword,
  };
};
