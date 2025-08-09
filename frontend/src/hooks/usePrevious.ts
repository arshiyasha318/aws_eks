import { useRef, useEffect } from 'react';

/**
 * A custom React hook that tracks the previous value of a variable.
 * This is useful for comparing the current value with the previous value in effects.
 * 
 * @param value - The value to track.
 * @param initialValue - The initial value to return on the first render (optional).
 * @returns The previous value of the tracked variable.
 * 
 * @example
 * function Counter() {
 *   const [count, setCount] = useState(0);
 *   const prevCount = usePrevious(count);
 *   
 *   return (
 *     <div>
 *       <p>Current: {count}</p>
 *       <p>Previous: {prevCount}</p>
 *       <button onClick={() => setCount(c => c + 1)}>Increment</button>
 *     </div>
 *   );
 * }
 * 
 * @example
 * // With initial value
 * const prevValue = usePrevious(value, null);
 */
function usePrevious<T>(value: T): T | undefined;
function usePrevious<T, U>(value: T, initialValue: U): T | U;
function usePrevious<T, U = undefined>(
  value: T,
  initialValue?: U
): T | U | undefined {
  const ref = useRef<T | U | undefined>(initialValue);
  
  // Store current value in ref after each render
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  // Return previous value (happens before update in useEffect above)
  return ref.current;
}

export default usePrevious;

/**
 * A custom React hook that tracks multiple previous values of a variable.
 * 
 * @param value - The value to track.
 * @param count - The number of previous values to keep track of (default: 1).
 * @returns An array of previous values, with the most recent previous value first.
 * 
 * @example
 * function Counter() {
 *   const [count, setCount] = useState(0);
 *   const prevCounts = usePreviousValues(count, 3);
 *   
 *   return (
 *     <div>
 *       <p>Current: {count}</p>
 *       <p>Previous 3 values: {prevCounts.join(', ')}</p>
 *       <button onClick={() => setCount(c => c + 1)}>Increment</button>
 *     </div>
 *   );
 * }
 */
export function usePreviousValues<T>(
  value: T,
  count: number = 1
): T[] {
  const ref = useRef<T[]>([]);
  
  useEffect(() => {
    // Add current value to the beginning of the array
    ref.current = [value, ...ref.current].slice(0, count);
  }, [value, count]);
  
  // Return all previous values except the current one
  return ref.current.slice(1);
}

/**
 * A custom React hook that tracks the previous value of a variable and indicates if it has changed.
 * 
 * @param value - The value to track.
 * @param initialValue - The initial value to compare against (optional).
 * @returns An object containing the previous value and a boolean indicating if it has changed.
 * 
 * @example
 * function Counter() {
 *   const [count, setCount] = useState(0);
 *   const { value: prevCount, hasChanged } = usePreviousWithChange(count);
 *   
 *   return (
 *     <div>
 *       <p>Current: {count}</p>
 *       <p>Previous: {prevCount ?? 'N/A'}</p>
 *       <p>Changed: {hasChanged ? 'Yes' : 'No'}</p>
 *       <button onClick={() => setCount(c => c + 1)}>Increment</button>
 *     </div>
 *   );
 * }
 */
export function usePreviousWithChange<T>(
  value: T,
  initialValue?: T
): { value: T | undefined; hasChanged: boolean } {
  const ref = useRef<{ value: T | undefined; previous: T | undefined }>({
    value: initialValue,
    previous: undefined,
  });
  
  // Update the ref after the render is committed
  useEffect(() => {
    ref.current = {
      value: value,
      previous: ref.current.value,
    };
  }, [value]);
  
  return {
    value: ref.current.previous,
    hasChanged: ref.current.previous !== undefined && ref.current.previous !== value,
  };
}

/**
 * A custom React hook that tracks the previous value and returns it only if a condition is met.
 * 
 * @param value - The value to track.
 * @param condition - A function that determines whether to update the previous value.
 * @param initialValue - The initial value to return (optional).
 * @returns The previous value that meets the condition.
 * 
 * @example
 * function Counter() {
 *   const [count, setCount] = useState(0);
 *   // Only update previous value when count is even
 *   const prevEvenCount = usePreviousWhen(count, v => v % 2 === 0);
 *   
 *   return (
 *     <div>
 *       <p>Current: {count}</p>
 *       <p>Previous even: {prevEvenCount ?? 'N/A'}</p>
 *       <button onClick={() => setCount(c => c + 1)}>Increment</button>
 *     </div>
 *   );
 * }
 */
export function usePreviousWhen<T>(
  value: T,
  condition: (value: T) => boolean,
  initialValue?: T
): T | undefined {
  const ref = useRef<{ value: T | undefined; previous: T | undefined }>({
    value: initialValue,
    previous: undefined,
  });
  
  useEffect(() => {
    if (condition(value)) {
      ref.current = {
        value: value,
        previous: ref.current.value,
      };
    }
  }, [value, condition]);
  
  return ref.current.previous;
}
