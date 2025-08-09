import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

type Event = MouseEvent | TouchEvent;

/**
 * A custom React hook that triggers a callback when a click or touch event occurs outside of the specified element(s).
 * 
 * @param ref - A ref object or an array of ref objects representing the element(s) to detect clicks outside of.
 * @param handler - A callback function that will be called when a click outside is detected.
 * @param enabled - A boolean to enable or disable the event listeners (default: true).
 * @param eventType - The type of events to listen for (default: 'mousedown' | 'touchstart').
 * 
 * @example
 * // Basic usage with a single ref
 * const ref = useRef<HTMLDivElement>(null);
 * useClickOutside(ref, () => {
 *   console.log('Clicked outside!');
 * });
 * 
 * // With multiple refs
 * const [ref1, ref2] = [useRef(null), useRef(null)];
 * useClickOutside([ref1, ref2], () => {
 *   console.log('Clicked outside both elements!');
 * });
 * 
 * // With custom event types
 * useClickOutside(ref, () => {
 *   console.log('Mouse up outside!');
 * }, true, 'mouseup');
 */
function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T> | RefObject<T>[],
  handler: (event: Event) => void,
  enabled: boolean = true,
  eventType: 'mousedown' | 'mouseup' | 'click' | 'touchstart' | 'touchend' = 'mousedown',
): void {
  const savedHandler = useRef(handler);

  // Update the handler ref if the handler changes
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const listener = (event: Event) => {
      // Get the target node from the event
      const target = event.target as Node;
      
      // If there's no target, do nothing
      if (!target || !target.isConnected) {
        return;
      }

      // Convert single ref to array for uniform handling
      const refs = Array.isArray(ref) ? ref : [ref];
      
      // Check if the click was outside all the referenced elements
      const isOutside = refs.every(
        (r) => r.current && !r.current.contains(target)
      );

      // If the click was outside, call the handler
      if (isOutside) {
        savedHandler.current(event);
      }
    };

    // Add event listeners
    const events: (keyof DocumentEventMap)[] = [];
    
    // Support both mouse and touch events based on the eventType
    if (eventType === 'mousedown' || eventType === 'mouseup' || eventType === 'click') {
      events.push(eventType);
      events.push(`touch${eventType}` as keyof DocumentEventMap);
    } else {
      // For touch events, we need to add the corresponding mouse event
      const mouseEvent = eventType === 'touchstart' ? 'mousedown' : 'mouseup';
      events.push(eventType, mouseEvent);
    }

    // Add each event listener
    events.forEach((event) => {
      document.addEventListener(event, listener as EventListener, { passive: true });
    });

    // Clean up event listeners
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, listener as EventListener);
      });
    };
  }, [ref, enabled, eventType]);
}

export default useClickOutside;

/**
 * A custom React hook that triggers a callback when the Escape key is pressed.
 * 
 * @param handler - A callback function that will be called when the Escape key is pressed.
 * @param enabled - A boolean to enable or disable the event listener (default: true).
 * 
 * @example
 * useEscapeKey(() => {
 *   console.log('Escape key pressed!');
 *   closeModal();
 * });
 */
export function useEscapeKey(handler: (event: KeyboardEvent) => void, enabled: boolean = true): void {
  const savedHandler = useRef(handler);

  // Update the handler ref if the handler changes
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        savedHandler.current(event);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled]);
}

/**
 * A custom React hook that combines both click outside and escape key detection.
 * 
 * @param ref - A ref object or an array of ref objects representing the element(s) to detect clicks outside of.
 * @param handler - A callback function that will be called when a click outside is detected or Escape is pressed.
 * @param options - Configuration options.
 * 
 * @example
 * const ref = useRef<HTMLDivElement>(null);
 * useDismissible(ref, () => {
 *   console.log('Dismissed!');
 * });
 */
export function useDismissible<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T> | RefObject<T>[],
  handler: (event: Event | KeyboardEvent) => void,
  options: {
    enabled?: boolean;
    clickOutside?: boolean;
    escapeKey?: boolean;
    eventType?: 'mousedown' | 'mouseup' | 'click' | 'touchstart' | 'touchend';
  } = {}
): void {
  const {
    enabled = true,
    clickOutside = true,
    escapeKey = true,
    eventType = 'mousedown',
  } = options;

  useClickOutside(ref, handler, enabled && clickOutside, eventType);
  useEscapeKey(handler as (event: KeyboardEvent) => void, enabled && escapeKey);
}
