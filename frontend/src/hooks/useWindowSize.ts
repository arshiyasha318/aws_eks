import { useState, useEffect, useCallback, useRef } from 'react';

interface WindowSize {
  /** Width of the window in pixels */
  width: number;
  /** Height of the window in pixels */
  height: number;
  /** Indicates if the window is currently being resized */
  isResizing: boolean;
  /** The device pixel ratio */
  devicePixelRatio: number;
  /** The orientation of the device (landscape or portrait) */
  orientation: 'portrait' | 'landscape';
  /** Breakpoint indicators based on Tailwind's default breakpoints */
  breakpoints: {
    sm: boolean; // 640px
    md: boolean; // 768px
    lg: boolean; // 1024px
    xl: boolean; // 1280px
    '2xl': boolean; // 1536px
  };
  /** Check if the current viewport matches a custom media query */
  matches: (query: string) => boolean;
}

/**
 * A custom React hook that tracks the dimensions of the browser window.
 * It provides responsive breakpoints and device orientation information.
 * 
 * @param options - Configuration options
 * @param options.initialWidth - Initial width (useful for SSR, defaults to 0)
 * @param options.initialHeight - Initial height (useful for SSR, defaults to 0)
 * @param options.includeScrollbar - Whether to include scrollbar in dimensions (default: false)
 * @param options.throttleDelay - Throttle delay in milliseconds for resize events (default: 100)
 * @returns An object containing window size and related information
 * 
 * @example
 * // Basic usage
 * const { width, height } = useWindowSize();
 * 
 * // With responsive breakpoints
 * const { breakpoints } = useWindowSize();
 * const isMobile = !breakpoints.md; // true if width < 768px
 * 
 * // With custom media query
 * const { matches } = useWindowSize();
 * const isDarkMode = matches('(prefers-color-scheme: dark)');
 */
function useWindowSize(options: {
  initialWidth?: number;
  initialHeight?: number;
  includeScrollbar?: boolean;
  throttleDelay?: number;
} = {}): WindowSize {
  const {
    initialWidth = 0,
    initialHeight = 0,
    includeScrollbar = false,
    throttleDelay = 100,
  } = options;

  const [windowSize, setWindowSize] = useState<Omit<WindowSize, 'matches'>>(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : initialWidth,
    height: typeof window !== 'undefined' ? window.innerHeight : initialHeight,
    isResizing: false,
    devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
    orientation: typeof window !== 'undefined' 
      ? window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
      : 'portrait',
    breakpoints: {
      sm: typeof window !== 'undefined' ? window.innerWidth >= 640 : initialWidth >= 640,
      md: typeof window !== 'undefined' ? window.innerWidth >= 768 : initialWidth >= 768,
      lg: typeof window !== 'undefined' ? window.innerWidth >= 1024 : initialWidth >= 1024,
      xl: typeof window !== 'undefined' ? window.innerWidth >= 1280 : initialWidth >= 1280,
      '2xl': typeof window !== 'undefined' ? window.innerWidth >= 1536 : initialWidth >= 1536,
    },
  }));

  const resizeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Memoize the matches function to prevent unnecessary re-renders
  const matches = useCallback((query: string): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  }, []);

  // Handle window resize
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Set initial values
    const updateSize = () => {
      const width = includeScrollbar ? window.outerWidth : window.innerWidth;
      const height = includeScrollbar ? window.outerHeight : window.innerHeight;
      
      setWindowSize(prev => ({
        ...prev,
        width,
        height,
        devicePixelRatio: window.devicePixelRatio,
        orientation: width > height ? 'landscape' : 'portrait',
        breakpoints: {
          sm: width >= 640,
          md: width >= 768,
          lg: width >= 1024,
          xl: width >= 1280,
          '2xl': width >= 1536,
        },
      }));
    };

    // Throttled version of updateSize
    const handleResize = () => {
      // Set isResizing to true
      setWindowSize(prev => ({
        ...prev,
        isResizing: true,
      }));

      // Clear the timeout if it exists
      if (resizeTimeout.current) {
        clearTimeout(resizeTimeout.current);
      }

      // Set a new timeout
      resizeTimeout.current = setTimeout(() => {
        updateSize();
        setWindowSize(prev => ({
          ...prev,
          isResizing: false,
        }));
      }, throttleDelay);
    };

    // Add event listeners
    window.addEventListener('resize', handleResize, { passive: true });
    
    // Initial update
    updateSize();

    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeout.current) {
        clearTimeout(resizeTimeout.current);
      }
    };
  }, [includeScrollbar, throttleDelay]);

  return {
    ...windowSize,
    matches,
  };
}

export default useWindowSize;

/**
 * A simplified version of useWindowSize that only returns the width and height
 * 
 * @returns An object containing width and height of the window
 * 
 * @example
 * const { width, height } = useWindowDimensions();
 */
export function useWindowDimensions() {
  const { width, height } = useWindowSize();
  return { width, height };
}

/**
 * A hook that returns the current breakpoint based on Tailwind's default breakpoints
 * 
 * @returns The current breakpoint ('sm', 'md', 'lg', 'xl', '2xl')
 * 
 * @example
 * const breakpoint = useBreakpoint();
 * // Returns 'sm', 'md', 'lg', 'xl', or '2xl'
 */
export function useBreakpoint(): 'sm' | 'md' | 'lg' | 'xl' | '2xl' {
  const { breakpoints } = useWindowSize();
  
  if (breakpoints['2xl']) return '2xl';
  if (breakpoints.xl) return 'xl';
  if (breakpoints.lg) return 'lg';
  if (breakpoints.md) return 'md';
  return 'sm';
}

/**
 * A hook that returns true if the current viewport is mobile-sized
 * 
 * @returns Boolean indicating if the viewport is mobile-sized
 * 
 * @example
 * const isMobile = useIsMobile();
 */
export function useIsMobile(): boolean {
  const { breakpoints } = useWindowSize();
  return !breakpoints.md; // md breakpoint is 768px
}

/**
 * A hook that returns true if the current viewport is tablet-sized
 * 
 * @returns Boolean indicating if the viewport is tablet-sized
 * 
 * @example
 * const isTablet = useIsTablet();
 */
export function useIsTablet(): boolean {
  const { breakpoints } = useWindowSize();
  return breakpoints.md && !breakpoints.lg; // between md and lg breakpoints
}

/**
 * A hook that returns true if the current viewport is desktop-sized
 * 
 * @returns Boolean indicating if the viewport is desktop-sized
 * 
 * @example
 * const isDesktop = useIsDesktop();
 */
export function useIsDesktop(): boolean {
  const { breakpoints } = useWindowSize();
  return breakpoints.lg; // lg breakpoint is 1024px
}

/**
 * A hook that returns the current device orientation
 * 
 * @returns 'portrait' or 'landscape'
 * 
 * @example
 * const orientation = useOrientation();
 */
export function useOrientation(): 'portrait' | 'landscape' {
  const { width, height } = useWindowSize();
  return width > height ? 'landscape' : 'portrait';
}
