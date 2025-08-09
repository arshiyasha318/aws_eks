import { useState, useEffect, useRef, useCallback } from 'react';
import type { RefObject } from 'react';

interface IntersectionObserverOptions extends IntersectionObserverInit {
  /**
   * The element that is used as the viewport for checking visibility of the target.
   * Must be the ancestor of the target. Defaults to the browser viewport if not
   * specified or if null.
   */
  root?: Element | Document | null;
  /**
   * Margin around the root. Can have values similar to the CSS margin property,
   * e.g. "10px 20px 30px 40px" (top, right, bottom, left).
   */
  rootMargin?: string;
  /**
   * Either a single number or an array of numbers which indicate at what percentage
   * of the target's visibility the observer's callback should be executed.
   */
  threshold?: number | number[];
  /**
   * If true, the observer will be disabled and won't observe the target.
   */
  disabled?: boolean;
  /**
   * The minimum amount of time in milliseconds that must pass between two callbacks.
   * This can be used to throttle the callback execution.
   */
  throttleMs?: number;
}

interface IntersectionObserverResult {
  /**
   * The ref that should be attached to the DOM element you want to observe.
   */
  ref: (node: Element | null) => void;
  /**
   * The current intersection ratio as a number between 0 and 1.
   */
  entry: IntersectionObserverEntry | null;
  /**
   * A boolean indicating whether the target element is intersecting with the root.
   */
  isIntersecting: boolean;
  /**
   * The current IntersectionObserver instance.
   */
  observer: IntersectionObserver | null;
  /**
   * A function to manually trigger an intersection check.
   */
  trigger: () => void;
  /**
   * A function to start observing the target element.
   */
  observe: () => void;
  /**
   * A function to stop observing the target element.
   */
  unobserve: () => void;
  /**
   * A function to disconnect the observer.
   */
  disconnect: () => void;
}

/**
 * A custom React hook that uses the Intersection Observer API to detect when an element
 * enters or leaves the viewport or a parent element.
 * 
 * @param callback - A callback function that will be called when the intersection changes.
 * @param options - Configuration options for the Intersection Observer.
 * @returns An object containing the ref and the current intersection state.
 * 
 * @example
 * // Basic usage
 * const { ref, isIntersecting } = useIntersectionObserver({
 *   threshold: 0.1,
 * });
 * 
 * return (
 *   <div ref={ref}>
 *     {isIntersecting ? 'Visible' : 'Not visible'}
 *   </div>
 * );
 * 
 * @example
 * // With callback
 * useIntersectionObserver(
 *   (entry, observer) => {
 *     if (entry.isIntersecting) {
 *       console.log('Element is visible!');
 *       // Optional: Stop observing after first intersection
 *       // observer.unobserve(entry.target);
 *     }
 *   },
 *   { threshold: 0.5 }
 * );
 */
function useIntersectionObserver(
  options?: IntersectionObserverOptions
): Omit<IntersectionObserverResult, 'ref'> & { ref: RefObject<Element | null> };

function useIntersectionObserver(
  callback?: (entry: IntersectionObserverEntry, observer: IntersectionObserver) => void,
  options?: IntersectionObserverOptions
): Omit<IntersectionObserverResult, 'ref'> & { ref: (node: Element | null) => void };

function useIntersectionObserver(
  callbackOrOptions?: ((entry: IntersectionObserverEntry, observer: IntersectionObserver) => void) | IntersectionObserverOptions,
  options?: IntersectionObserverOptions
): any {
  // Handle function or object as first argument
  const callback = typeof callbackOrOptions === 'function' ? callbackOrOptions : undefined;
  const opts = (typeof callbackOrOptions === 'object' ? callbackOrOptions : options) || {};
  
  const {
    root = null,
    rootMargin = '0px',
    threshold = 0,
    disabled = false,
    throttleMs = 0,
  } = opts;
  
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [node, setNode] = useState<Element | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastCallbackTime = useRef<number>(0);
  const throttleTimeout = useRef<number | null>(null);
  const isMounted = useRef(true);
  
  // Handle cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (throttleTimeout.current) {
        clearTimeout(throttleTimeout.current);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);
  
  // Create or update the observer when options change
  useEffect(() => {
    if (disabled || !node) {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      return;
    }
    
    let observer: IntersectionObserver;
    
    const handleIntersect: IntersectionObserverCallback = (entries, observer) => {
      const [entry] = entries;
      
      if (!isMounted.current) return;
      
      // Throttle the callback if needed
      if (throttleMs > 0) {
        const now = Date.now();
        const timeSinceLastCall = now - lastCallbackTime.current;
        
        if (timeSinceLastCall < throttleMs) {
          if (throttleTimeout.current) {
            clearTimeout(throttleTimeout.current);
          }
          
          throttleTimeout.current = window.setTimeout(() => {
            lastCallbackTime.current = Date.now();
            setEntry(entry);
            if (callback) callback(entry, observer);
          }, throttleMs - timeSinceLastCall);
          
          return;
        }
        
        lastCallbackTime.current = now;
      }
      
      setEntry(entry);
      if (callback) callback(entry, observer);
    };
    
    // Create a new observer
    observer = new IntersectionObserver(handleIntersect, {
      root,
      rootMargin,
      threshold,
    });
    
    // Start observing the target
    observer.observe(node);
    observerRef.current = observer;
    
    return () => {
      if (throttleTimeout.current) {
        clearTimeout(throttleTimeout.current);
        throttleTimeout.current = null;
      }
      observer.disconnect();
      if (observerRef.current === observer) {
        observerRef.current = null;
      }
    };
  }, [node, root, rootMargin, threshold, disabled, callback, throttleMs]);
  
  // Create a ref callback to set the target node
  const ref = useCallback((node: Element | null) => {
    if (node === null) {
      // If the node is being removed, clean up the observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    }
    setNode(node);
  }, []);
  
  // Create a ref object for the imperative handle
  const refObject = useRef<Element | null>(null);
  const setRef = useCallback((node: Element | null) => {
    refObject.current = node;
    ref(node);
  }, [ref]);
  
  // Create the result object with methods
  const result = {
    ref: setRef,
    entry,
    isIntersecting: entry?.isIntersecting ?? false,
    observer: observerRef.current,
    trigger: () => {
      if (node && observerRef.current) {
        // Create a synthetic entry for the current state
        const rect = node.getBoundingClientRect();
        const isIntersecting = (
          rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
          rect.bottom >= 0 &&
          rect.left <= (window.innerWidth || document.documentElement.clientWidth) &&
          rect.right >= 0
        );
        
        const syntheticEntry: IntersectionObserverEntry = {
          boundingClientRect: rect,
          intersectionRatio: isIntersecting ? 1 : 0,
          intersectionRect: isIntersecting ? rect : {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            width: 0,
            height: 0,
            x: 0,
            y: 0,
            toJSON: () => ({}),
          },
          isIntersecting,
          rootBounds: null,
          target: node,
          time: performance.now(),
        };
        
        setEntry(syntheticEntry);
        if (callback) callback(syntheticEntry, observerRef.current!);
      }
    },
    observe: () => {
      if (node && observerRef.current) {
        observerRef.current.observe(node);
      }
    },
    unobserve: () => {
      if (node && observerRef.current) {
        observerRef.current.unobserve(node);
      }
    },
    disconnect: () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    },
  };
  
  // Return the appropriate result based on the overload
  if (typeof callbackOrOptions !== 'function') {
    // If the first argument is options, return an object with a ref object
    const { ref: _, ...rest } = result;
    return {
      ...rest,
      ref: refObject,
    };
  }
  
  // Otherwise, return the result with a ref callback
  return result;
}

export default useIntersectionObserver;

/**
 * A custom React hook that returns a boolean indicating whether the target element is visible in the viewport.
 * 
 * @param options - Configuration options for the Intersection Observer.
 * @returns A boolean indicating whether the target element is visible.
 * 
 * @example
 * const isVisible = useInViewport({ threshold: 0.1 });
 * return <div ref={isVisible.ref}>{isVisible.isInViewport ? 'Visible' : 'Not visible'}</div>;
 */
export function useInViewport(options?: Omit<IntersectionObserverOptions, 'disabled'>) {
  const [isInViewport, setIsInViewport] = useState(false);
  const { ref, entry } = useIntersectionObserver((entry) => {
    setIsInViewport(entry.isIntersecting);
  }, options);
  
  return { ref, isInViewport, entry };
}

/**
 * A custom React hook that triggers a callback when the target element becomes visible in the viewport.
 * The observer is automatically disconnected after the first intersection.
 * 
 * @param onIntersect - A callback function that will be called when the target becomes visible.
 * @param options - Configuration options for the Intersection Observer.
 * @returns A ref callback to attach to the target element.
 * 
 * @example
 * const ref = useOnViewportEnter(() => {
 *   console.log('Element is now visible!');
 * });
 * 
 * return <div ref={ref}>Scroll to see me</div>;
 */
export function useOnViewportEnter(
  onIntersect: () => void,
  options?: Omit<IntersectionObserverOptions, 'disabled'>
) {
  const { ref } = useIntersectionObserver((entry, observer) => {
    if (entry.isIntersecting) {
      onIntersect();
      observer.unobserve(entry.target);
    }
  }, {
    ...options,
    threshold: options?.threshold ?? 0.1,
  });
  
  return ref;
}

/**
 * A custom React hook that triggers a callback when the target element leaves the viewport.
 * 
 * @param onLeave - A callback function that will be called when the target leaves the viewport.
 * @param options - Configuration options for the Intersection Observer.
 * @returns A ref callback to attach to the target element.
 * 
 * @example
 * const ref = useOnViewportLeave(() => {
 *   console.log('Element left the viewport!');
 * });
 * 
 * return <div ref={ref}>Scroll away from me</div>;
 */
export function useOnViewportLeave(
  onLeave: () => void,
  options?: Omit<IntersectionObserverOptions, 'disabled'>
) {
  const wasVisible = useRef(false);
  
  const { ref } = useIntersectionObserver((entry) => {
    if (entry.isIntersecting) {
      wasVisible.current = true;
    } else if (wasVisible.current) {
      onLeave();
      wasVisible.current = false;
    }
  }, {
    ...options,
    threshold: options?.threshold ?? 0,
  });
  
  return ref;
}
