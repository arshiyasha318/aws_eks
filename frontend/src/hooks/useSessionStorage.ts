import { useState, useEffect, useCallback } from 'react';

type SetValue<T> = (value: T | ((val: T) => T)) => void;

/**
 * A custom React hook that syncs state with sessionStorage.
 * Similar to useLocalStorage but uses sessionStorage which is cleared when the page session ends.
 * 
 * @param key - The key under which to store the value in sessionStorage.
 * @param initialValue - The initial value to use if no value exists in sessionStorage.
 * @returns A stateful value and a function to update it.
 * 
 * @example
 * // Basic usage
 * const [name, setName] = useSessionStorage('session-username', 'Guest');
 * 
 * // With complex objects
 * const [filters, setFilters] = useSessionStorage('filters', { 
 *   category: 'all', 
 *   sortBy: 'newest' 
 * });
 * 
 * // With a function to initialize the value
 * const [settings, setSettings] = useSessionStorage('settings', () => ({
 *   theme: 'light',
 *   notifications: true,
 * }));
 */
function useSessionStorage<T>(
  key: string,
  initialValue: T | (() => T)
): [T, SetValue<T>] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window === 'undefined') {
        return typeof initialValue === 'function' 
          ? (initialValue as () => T)() 
          : initialValue;
      }

      // Get from session storage by key
      const item = window.sessionStorage.getItem(key);
      
      // Parse stored json or if none return initialValue
      if (item === null) {
        return typeof initialValue === 'function' 
          ? (initialValue as () => T)() 
          : initialValue;
      }

      return JSON.parse(item) as T;
    } catch (error) {
      // If error also return initialValue
      console.warn(`Error reading sessionStorage key "${key}":`, error);
      return typeof initialValue === 'function' 
        ? (initialValue as () => T)() 
        : initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to sessionStorage
  const setValue: SetValue<T> = useCallback((value) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to session storage
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting sessionStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Listen for changes to the sessionStorage key made from other tabs/windows
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== key || event.storageArea !== window.sessionStorage) {
        return;
      }

      try {
        const newValue = event.newValue ? JSON.parse(event.newValue) : null;
        setStoredValue(newValue);
      } catch (error) {
        console.warn(`Error parsing sessionStorage key "${key}":`, error);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);

  return [storedValue, setValue];
}

export default useSessionStorage;

/**
 * A custom React hook that syncs a boolean state with sessionStorage.
 * 
 * @param key - The key under which to store the boolean in sessionStorage.
 * @param initialValue - The initial boolean value.
 * @returns A stateful boolean and a function to toggle it.
 * 
 * @example
 * const [isPreview, togglePreview] = useSessionStorageBoolean('preview-mode', false);
 */
export function useSessionStorageBoolean(
  key: string,
  initialValue: boolean
): [boolean, (value?: boolean | ((val: boolean) => boolean)) => void] {
  const [value, setValue] = useSessionStorage<boolean>(key, initialValue);
  
  const toggle = useCallback((newValue?: boolean | ((val: boolean) => boolean)) => {
    if (typeof newValue === 'undefined') {
      setValue(prev => !prev);
    } else {
      setValue(newValue);
    }
  }, [setValue]);
  
  return [value, toggle];
}

/**
 * A custom React hook that syncs a number state with sessionStorage.
 * 
 * @param key - The key under which to store the number in sessionStorage.
 * @param initialValue - The initial number value.
 * @returns A stateful number and a function to update it.
 * 
 * @example
 * const [step, setStep] = useSessionStorageNumber('wizard-step', 0);
 */
export function useSessionStorageNumber(
  key: string,
  initialValue: number
): [number, (value: number | ((val: number) => number)) => void] {
  return useSessionStorage<number>(key, initialValue);
}

/**
 * A custom React hook that syncs a string state with sessionStorage.
 * 
 * @param key - The key under which to store the string in sessionStorage.
 * @param initialValue - The initial string value.
 * @returns A stateful string and a function to update it.
 * 
 * @example
 * const [token, setToken] = useSessionStorageString('auth-token', '');
 */
export function useSessionStorageString(
  key: string,
  initialValue: string
): [string, (value: string | ((val: string) => string)) => void] {
  return useSessionStorage<string>(key, initialValue);
}

/**
 * A custom React hook that syncs an object state with sessionStorage.
 * 
 * @param key - The key under which to store the object in sessionStorage.
 * @param initialValue - The initial object value.
 * @returns A stateful object and a function to update it.
 * 
 * @example
 * const [formData, setFormData] = useSessionStorageObject<FormData>('form-data', { 
 *   name: '', 
 *   email: '' 
 * });
 */
export function useSessionStorageObject<T extends object>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  return useSessionStorage<T>(key, initialValue);
}

/**
 * A custom React hook that syncs state with either localStorage or sessionStorage.
 * 
 * @param type - The type of storage to use ('local' or 'session').
 * @param key - The key under which to store the value.
 * @param initialValue - The initial value to use if no value exists in storage.
 * @returns A stateful value and a function to update it.
 * 
 * @example
 * // Using localStorage
 * const [theme, setTheme] = useStorage('local', 'theme', 'light');
 * 
 * // Using sessionStorage
 * const [sessionId, setSessionId] = useStorage('session', 'session-id', '');
 */
export function useStorage<T>(
  type: 'local' | 'session',
  key: string,
  initialValue: T | (() => T)
): [T, (value: T | ((val: T) => T)) => void] {
  return type === 'local' 
    ? useLocalStorage(key, initialValue)
    : useSessionStorage(key, initialValue);
}

// Import useLocalStorage for use in the useStorage function
import useLocalStorage from './useLocalStorage';

// Re-export useLocalStorage for convenience
export { useLocalStorage };
