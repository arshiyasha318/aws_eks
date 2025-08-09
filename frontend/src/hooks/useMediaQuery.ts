import { useState, useEffect } from 'react';

/**
 * A custom React hook that tracks the state of a CSS media query.
 * @param query - The media query string (e.g., '(min-width: 768px)').
 * @returns A boolean indicating if the media query matches.
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
 */
function useMediaQuery(query: string): boolean {
  // State to store whether the media query matches
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    // Check if window is defined (for SSR)
    if (typeof window === 'undefined') {
      return;
    }

    // Create a MediaQueryList object
    const mediaQueryList = window.matchMedia(query);
    
    // Set the initial value
    setMatches(mediaQueryList.matches);
    
    // Create a callback to handle changes
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };
    
    // Add the listener for changes
    // Note: addEventListener is preferred over addListener for broader browser support
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', listener);
    } else {
      // Fallback for older browsers
      mediaQueryList.addListener(listener);
    }
    
    // Clean up the listener when the component unmounts
    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener('change', listener);
      } else {
        // Fallback for older browsers
        mediaQueryList.removeListener(listener);
      }
    };
  }, [query]);

  return matches;
}

export default useMediaQuery;

/**
 * Predefined media query hooks for common breakpoints
 */

// Mobile devices (portrait and landscape)
export const useIsMobile = (): boolean => 
  useMediaQuery('(max-width: 767px)');

// Tablets (portrait and landscape)
export const useIsTablet = (): boolean => 
  useMediaQuery('(min-width: 768px) and (max-width: 1023px)');

// Laptops and desktops
export const useIsDesktop = (): boolean => 
  useMediaQuery('(min-width: 1024px)');

// Large desktops
export const useIsLargeDesktop = (): boolean => 
  useMediaQuery('(min-width: 1280px)');

// Extra large desktops
export const useIsXLargeDesktop = (): boolean => 
  useMediaQuery('(min-width: 1536px)');

// Dark mode preference
export const usePrefersDarkMode = (): boolean => 
  useMediaQuery('(prefers-color-scheme: dark)');

// Reduced motion preference
export const usePrefersReducedMotion = (): boolean => 
  useMediaQuery('(prefers-reduced-motion: reduce)');

// Touch device detection (not 100% reliable but works for most cases)
export const useIsTouchDevice = (): boolean => 
  useMediaQuery('(hover: none) and (pointer: coarse)');

// High DPI/Retina displays
export const useIsRetina = (): boolean => 
  useMediaQuery('(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)');

// Print mode
export const useIsPrintMode = (): boolean => 
  useMediaQuery('print');

// Orientation
export const useIsPortrait = (): boolean => 
  useMediaQuery('(orientation: portrait)');

export const useIsLandscape = (): boolean => 
  useMediaQuery('(orientation: landscape)');

// Custom hook for responsive design with breakpoints
export const useBreakpoint = (breakpoint: number): boolean => 
  useMediaQuery(`(min-width: ${breakpoint}px)`);
