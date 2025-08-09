import { useState, useEffect, useCallback } from 'react';

type SetValue<T> = (value: T | ((val: T) => T)) => void;

/**
 * A custom React hook that syncs state with localStorage.
 * 
 * @param key - The key under which to store the value in localStorage.
 * @param initialValue - The initial value to use if no value exists in localStorage.
 * @returns A stateful value and a function to update it.
 * 
 * @example
 * // Basic usage
 * const [name, setName] = useLocalStorage('username', 'Guest');
 * 
 * // With complex objects
 * const [user, setUser] = useLocalStorage('user', { id: 1, name: 'John' });
 * 
 * // With a function to initialize the value
 * const [preferences, setPreferences] = useLocalStorage('prefs', () => ({
 *   theme: 'light',
 *   notifications: true,
 * }));
 */
function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T)
): [T, SetValue<T>] {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window === 'undefined') {
        return typeof initialValue === 'function' 
          ? (initialValue as () => T)() 
          : initialValue;
      }

      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      
      // Parse stored json or if none return initialValue
      if (item === null) {
        return typeof initialValue === 'function' 
          ? (initialValue as () => T)() 
          : initialValue;
      }

      return JSON.parse(item) as T;
    } catch (error) {
      // If error also return initialValue
      console.warn(`Error reading localStorage key "${key}":`, error);
      return typeof initialValue === 'function' 
        ? (initialValue as () => T)() 
        : initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue: SetValue<T> = useCallback((value) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to local storage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Listen for changes to the localStorage key made from other tabs/windows
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== key || event.storageArea !== window.localStorage) {
        return;
      }

      try {
        const newValue = event.newValue ? JSON.parse(event.newValue) : null;
        setStoredValue(newValue);
      } catch (error) {
        console.warn(`Error parsing localStorage key "${key}":`, error);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);

  return [storedValue, setValue];
}

export default useLocalStorage;

/**
 * A custom React hook that syncs a boolean state with localStorage.
 * 
 * @param key - The key under which to store the boolean in localStorage.
 * @param initialValue - The initial boolean value.
 * @returns A stateful boolean and a function to toggle it.
 * 
 * @example
 * const [isDarkMode, toggleDarkMode] = useLocalStorageBoolean('darkMode', false);
 */
export function useLocalStorageBoolean(
  key: string,
  initialValue: boolean
): [boolean, (value?: boolean | ((val: boolean) => boolean)) => void] {
  const [value, setValue] = useLocalStorage<boolean>(key, initialValue);
  
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
 * A custom React hook that syncs a number state with localStorage.
 * 
 * @param key - The key under which to store the number in localStorage.
 * @param initialValue - The initial number value.
 * @returns A stateful number and a function to update it.
 * 
 * @example
 * const [count, setCount] = useLocalStorageNumber('counter', 0);
 */
export function useLocalStorageNumber(
  key: string,
  initialValue: number
): [number, (value: number | ((val: number) => number)) => void] {
  return useLocalStorage<number>(key, initialValue);
}

/**
 * A custom React hook that syncs a string state with localStorage.
 * 
 * @param key - The key under which to store the string in localStorage.
 * @param initialValue - The initial string value.
 * @returns A stateful string and a function to update it.
 * 
 * @example
 * const [name, setName] = useLocalStorageString('username', 'Guest');
 */
export function useLocalStorageString(
  key: string,
  initialValue: string
): [string, (value: string | ((val: string) => string)) => void] {
  return useLocalStorage<string>(key, initialValue);
}

/**
 * A custom React hook that syncs an object state with localStorage.
 * 
 * @param key - The key under which to store the object in localStorage.
 * @param initialValue - The initial object value.
 * @returns A stateful object and a function to update it.
 * 
 * @example
 * const [user, setUser] = useLocalStorageObject<User>('user', { id: 1, name: 'John' });
 */
export function useLocalStorageObject<T extends object>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  return useLocalStorage<T>(key, initialValue);
}
