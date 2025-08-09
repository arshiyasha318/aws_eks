import { useRef, useEffect, useCallback } from 'react';

/**
 * A custom React hook that returns a function that returns a boolean indicating whether the component is mounted.
 * This is useful for avoiding state updates on unmounted components.
 * 
 * @returns A function that returns a boolean indicating whether the component is mounted.
 * 
 * @example
 * const isMounted = useIsMounted();
 * 
 * useEffect(() => {
 *   const fetchData = async () => {
 *     const data = await someAsyncOperation();
 *     if (isMounted()) {
 *       setData(data); // Only update state if component is still mounted
 *     }
 *   };
 *   
 *   fetchData();
 * }, [isMounted]);
 */
function useIsMounted(): () => boolean {
  const isMountedRef = useRef(false);
  
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Use useCallback to maintain referential equality
  return useCallback(() => isMountedRef.current, []);
}

export { useIsMounted };

export default useIsMounted;
