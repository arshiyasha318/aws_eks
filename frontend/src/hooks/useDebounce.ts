import { useState, useEffect, useRef, useCallback } from 'react';
import { useIsMounted } from './useIsMounted';

type CallbackFunction<T extends any[]> = (...args: T) => void | Promise<void>;

/**
 * A custom React hook that returns a debounced version of the callback function.
 * The debounced function will only be called after it hasn't been called for the specified delay.
 * 
 * @param callback - The function to debounce.
 * @param delay - The delay in milliseconds (default: 300ms).
 * @param options - Additional options:
 *   - `leading`: Call the function immediately on first invocation (default: false).
 *   - `trailing`: Call the function after the delay has passed (default: true).
 *   - `maxWait`: The maximum time the function is allowed to be delayed before it's invoked.
 * @returns A debounced version of the callback function.
 * 
 * @example
 * // Basic usage
 * const debouncedSearch = useDebounce((query) => {
 *   console.log(`Searching for: ${query}`);
 *   // Your search logic here
 * }, 500);
 * 
 * // With options
 * const debouncedSave = useDebounce(
 *   (data) => {
 *     console.log('Saving data:', data);
 *     // Your save logic here
 *   },
 *   1000,
 *   { leading: true, trailing: true, maxWait: 2000 }
 * );
 */
function useDebounce<T extends any[]>(
  callback: CallbackFunction<T>,
  delay: number = 300,
  options: {
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number;
  } = {}
): CallbackFunction<T> {
  const { leading = false, trailing = true, maxWait } = options;
  const isMounted = useIsMounted();
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxWaitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCallTimeRef = useRef<number | null>(null);
  const pendingArgsRef = useRef<T | null>(null);

  // Update the callback reference if it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Clear timeouts when the component unmounts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (maxWaitTimeoutRef.current) {
        clearTimeout(maxWaitTimeoutRef.current);
      }
    };
  }, []);

  // The debounced function that will be returned
  const debouncedFunction = useCallback((...args: T) => {
    const now = Date.now();
    const isLeading = leading && lastCallTimeRef.current === null;
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Set maxWait timeout if specified
    if (maxWait && !maxWaitTimeoutRef.current && trailing) {
      maxWaitTimeoutRef.current = setTimeout(() => {
        if (pendingArgsRef.current && isMounted()) {
          callbackRef.current(...pendingArgsRef.current);
          pendingArgsRef.current = null;
        }
        maxWaitTimeoutRef.current = null;
      }, maxWait);
    }
    
    // Handle leading edge
    if (isLeading) {
      if (isMounted()) {
        callbackRef.current(...args);
      }
    } else if (trailing) {
      // Store the arguments for the trailing call
      pendingArgsRef.current = args;
      
      // Set a new timeout
      timeoutRef.current = setTimeout(() => {
        if (pendingArgsRef.current && isMounted()) {
          callbackRef.current(...pendingArgsRef.current);
          pendingArgsRef.current = null;
        }
        if (maxWaitTimeoutRef.current) {
          clearTimeout(maxWaitTimeoutRef.current);
          maxWaitTimeoutRef.current = null;
        }
      }, delay);
    }
    
    lastCallTimeRef.current = now;
  }, [delay, leading, trailing, maxWait, isMounted]);

  // Add a cancel method to the debounced function
  const debounced = useCallback(
    Object.assign(debouncedFunction, {
      cancel: () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        if (maxWaitTimeoutRef.current) {
          clearTimeout(maxWaitTimeoutRef.current);
          maxWaitTimeoutRef.current = null;
        }
        pendingArgsRef.current = null;
        lastCallTimeRef.current = null;
      },
      flush: () => {
        if (pendingArgsRef.current) {
          const args = pendingArgsRef.current;
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          if (maxWaitTimeoutRef.current) {
            clearTimeout(maxWaitTimeoutRef.current);
            maxWaitTimeoutRef.current = null;
          }
          pendingArgsRef.current = null;
          lastCallTimeRef.current = null;
          return callbackRef.current(...args);
        }
        return undefined;
      },
      isPending: () => {
        return timeoutRef.current !== null || maxWaitTimeoutRef.current !== null;
      },
    }),
    [debouncedFunction]
  );

  return debounced;
}

/**
 * A custom React hook that returns a debounced version of the value.
 * The returned value will only update after the specified delay has passed without the value changing.
 * 
 * @param value - The value to debounce.
 * @param delay - The delay in milliseconds (default: 300ms).
 * @returns The debounced value.
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounceValue(searchTerm, 500);
 * 
 * // Use the debounced value in effects
 * useEffect(() => {
 *   if (debouncedSearchTerm) {
 *     console.log('Searching for:', debouncedSearchTerm);
 *     // Your search logic here
 *   }
 * }, [debouncedSearchTerm]);
 */
function useDebounceValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

export { useDebounce, useDebounceValue };
