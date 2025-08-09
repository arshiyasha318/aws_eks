import { useState, useEffect, useCallback, useRef } from 'react';

type KeyFilter = string | string[] | ((event: KeyboardEvent) => boolean);
type EventType = 'keydown' | 'keyup' | 'keypress';
type Options = {
  /**
   * The target element to attach the event listener to. Defaults to `document`.
   */
  target?: EventTarget | null;
  /**
   * The type of keyboard event to listen for. Defaults to `'keydown'`.
   */
  eventType?: EventType | EventType[];
  /**
   * A function that will be called when the key is pressed.
   */
  handler?: (event: KeyboardEvent) => void;
  /**
   * Whether the event listener is active. Defaults to `true`.
   */
  enabled?: boolean;
  /**
   * Whether to prevent the default behavior of the event. Defaults to `false`.
   */
  preventDefault?: boolean | ((event: KeyboardEvent) => boolean);
  /**
   * Whether to stop event propagation. Defaults to `false`.
   */
  stopPropagation?: boolean | ((event: KeyboardEvent) => boolean);
  /**
   * Whether to listen for the key only when the target element is focused.
   * If `true`, the event listener will be attached to the target element instead of `document`.
   * Defaults to `false`.
   */
  targetOnly?: boolean;
  /**
   * Whether to listen for the key only when combined with the `Alt` key.
   */
  altKey?: boolean;
  /**
   * Whether to listen for the key only when combined with the `Ctrl` key.
   */
  ctrlKey?: boolean;
  /**
   * Whether to listen for the key only when combined with the `Meta` (Command) key.
   */
  metaKey?: boolean;
  /**
   * Whether to listen for the key only when combined with the `Shift` key.
   */
  shiftKey?: boolean;
  /**
   * The exact combination of modifier keys that must be pressed.
   * If specified, this takes precedence over the individual modifier key options.
   */
  exactMatch?: {
    alt?: boolean;
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
  };
};

/**
 * A custom React hook that detects when a specific key or combination of keys is pressed.
 * 
 * @param keyFilter - The key or keys to listen for, or a function that returns a boolean.
 * @param options - Configuration options for the hook.
 * @returns A boolean indicating whether the key is currently pressed, or void if a handler is provided.
 * 
 * @example
 * // Basic usage
 * const isAPressed = useKeyPress('a');
 * 
 * // With handler
 * useKeyPress('Escape', {
 *   handler: () => console.log('Escape pressed'),
 * });
 * 
 * // With modifier keys
 * useKeyPress('s', {
 *   ctrlKey: true,
 *   handler: (event) => {
 *     event.preventDefault();
 *     console.log('Ctrl+S pressed');
 *   },
 * });
 * 
 * // With exact match
 * useKeyPress('k', {
 *   exactMatch: { meta: true, shift: true },
 *   handler: () => console.log('Cmd+Shift+K pressed'),
 * });
 * 
 * // With custom filter
 * useKeyPress(
 *   (event) => event.key === 'ArrowDown' && event.ctrlKey,
 *   { handler: () => console.log('Ctrl+Down pressed') }
 * );
 */
function useKeyPress(
  keyFilter: KeyFilter,
  options: Options & { handler: (event: KeyboardEvent) => void }
): void;
function useKeyPress(
  keyFilter: KeyFilter,
  options?: Omit<Options, 'handler'>
): boolean;
function useKeyPress(
  keyFilter: KeyFilter,
  options: Options = {}
): boolean | void {
  const {
    target = typeof window !== 'undefined' ? document : null,
    eventType = 'keydown',
    handler,
    enabled = true,
    preventDefault = false,
    stopPropagation = false,
    targetOnly = false,
    altKey = false,
    ctrlKey = false,
    metaKey = false,
    shiftKey = false,
    exactMatch,
  } = options;

  const [isKeyPressed, setIsKeyPressed] = useState(false);
  const isKeyPressedRef = useRef(false);
  const eventHandlerRef = useRef<((event: KeyboardEvent) => void) | null>(null);

  // Create a stable reference to the key filter
  const keyFilterRef = useRef(keyFilter);
  keyFilterRef.current = keyFilter;

  // Create a stable reference to the handler
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  // Check if the event matches the key filter
  const isKeyMatching = useCallback((event: KeyboardEvent): boolean => {
    const key = event.key.toLowerCase();
    const filter = keyFilterRef.current;
    
    // Handle function filter
    if (typeof filter === 'function') {
      return filter(event);
    }
    
    // Handle array of keys
    const keys = Array.isArray(filter) ? filter : [filter];
    const normalizedKeys = keys.map(k => k.toLowerCase());
    
    // Check if the pressed key matches any of the filtered keys
    return normalizedKeys.includes(key);
  }, []);

  // Check if the event matches the modifier keys
  const isModifierMatching = useCallback((event: KeyboardEvent): boolean => {
    if (exactMatch) {
      return (
        (exactMatch.alt === undefined || event.altKey === exactMatch.alt) &&
        (exactMatch.ctrl === undefined || event.ctrlKey === exactMatch.ctrl) &&
        (exactMatch.meta === undefined || event.metaKey === exactMatch.meta) &&
        (exactMatch.shift === undefined || event.shiftKey === exactMatch.shift)
      );
    }
    
    return (
      (!altKey || event.altKey) &&
      (!ctrlKey || event.ctrlKey) &&
      (!metaKey || event.metaKey) &&
      (!shiftKey || event.shiftKey)
    );
  }, [altKey, ctrlKey, metaKey, shiftKey, exactMatch]);

  // Handle the key event
  const handleKeyEvent = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    
    const isMatch = isKeyMatching(event) && isModifierMatching(event);
    
    if (!isMatch) return;
    
    // Handle preventDefault
    const shouldPreventDefault = typeof preventDefault === 'function' 
      ? preventDefault(event)
      : preventDefault;
      
    if (shouldPreventDefault) {
      event.preventDefault();
    }
    
    // Handle stopPropagation
    const shouldStopPropagation = typeof stopPropagation === 'function'
      ? stopPropagation(event)
      : stopPropagation;
      
    if (shouldStopPropagation) {
      event.stopPropagation();
    }
    
    // Update state or call handler
    if (handlerRef.current) {
      handlerRef.current(event);
    } else if (event.type === 'keydown') {
      setIsKeyPressed(true);
      isKeyPressedRef.current = true;
    } else if (event.type === 'keyup') {
      setIsKeyPressed(false);
      isKeyPressedRef.current = false;
    }
  }, [enabled, isKeyMatching, isModifierMatching, preventDefault, stopPropagation]);

  // Set up and clean up event listeners
  useEffect(() => {
    if (!target || !enabled) return;
    
    const eventTypes = Array.isArray(eventType) ? eventType : [eventType];
    const targetElement = targetOnly ? target : document;
    
    // Create a stable event handler
    eventHandlerRef.current = handleKeyEvent;
    
    // Add event listeners
    eventTypes.forEach(type => {
      targetElement.addEventListener(type, eventHandlerRef.current! as EventListener, {
        passive: !preventDefault,
      });
    });
    
    // Clean up
    return () => {
      eventTypes.forEach(type => {
        targetElement.removeEventListener(type, eventHandlerRef.current! as EventListener);
      });
    };
  }, [target, eventType, enabled, handleKeyEvent, preventDefault, targetOnly]);

  // If a handler is provided, return void, otherwise return the pressed state
  return handler ? undefined : isKeyPressed;
}

export default useKeyPress;

/**
 * A custom React hook that detects when a specific key is currently pressed down.
 * 
 * @param key - The key to listen for.
 * @param options - Configuration options for the hook.
 * @returns A boolean indicating whether the key is currently pressed.
 * 
 * @example
 * const isSpacePressed = useKeyDown(' ');
 * const isEnterPressed = useKeyDown('Enter');
 */
export function useKeyDown(
  key: string,
  options: Omit<Options, 'eventType' | 'handler'> = {}
): boolean {
  return useKeyPress(key, {
    ...options,
    eventType: 'keydown',
  }) as boolean;
}

/**
 * A custom React hook that detects when a specific key is released.
 * 
 * @param key - The key to listen for.
 * @param options - Configuration options for the hook.
 * @returns A boolean indicating whether the key was released.
 * 
 * @example
 * const isSpaceReleased = useKeyUp(' ');
 */
export function useKeyUp(
  key: string,
  options: Omit<Options, 'eventType' | 'handler'> = {}
): boolean {
  return useKeyPress(key, {
    ...options,
    eventType: 'keyup',
  }) as boolean;
}

/**
 * A custom React hook that detects when the Escape key is pressed.
 * 
 * @param handler - A function to call when Escape is pressed.
 * @param options - Additional options.
 * 
 * @example
 * useEscapeKey(() => {
 *   console.log('Escape pressed!');
 *   closeModal();
 * });
 */
export function useEscapeKey(
  handler: (event: KeyboardEvent) => void,
  options: Omit<Options, 'keyFilter' | 'handler' | 'eventType'> = {}
): void {
  useKeyPress('Escape', {
    ...options,
    handler,
    eventType: 'keydown',
  });
}

/**
 * A custom React hook that detects when the Enter key is pressed.
 * 
 * @param handler - A function to call when Enter is pressed.
 * @param options - Additional options.
 * 
 * @example
 * useEnterKey((event) => {
 *   event.preventDefault();
 *   submitForm();
 * });
 */
export function useEnterKey(
  handler: (event: KeyboardEvent) => void,
  options: Omit<Options, 'keyFilter' | 'handler' | 'eventType'> = {}
): void {
  useKeyPress('Enter', {
    ...options,
    handler,
    eventType: 'keydown',
  });
}

/**
 * A custom React hook that detects keyboard shortcuts.
 * 
 * @param shortcut - The keyboard shortcut in the format "mod+k", "ctrl+shift+s", etc.
 * @param handler - A function to call when the shortcut is pressed.
 * @param options - Additional options.
 * 
 * @example
 * useShortcut('mod+s', (event) => {
 *   event.preventDefault();
 *   saveDocument();
 * });
 */
export function useShortcut(
  shortcut: string,
  handler: (event: KeyboardEvent) => void,
  options: Omit<Options, 'keyFilter' | 'handler' | 'eventType' | 'exactMatch'> = {}
): void {
  const keys = shortcut.toLowerCase().split('+');
  const key = keys.find(k => !['ctrl', 'shift', 'alt', 'meta', 'mod', 'cmd', 'command'].includes(k));
  
  if (!key) {
    throw new Error(`Invalid shortcut format: ${shortcut}`);
  }
  
  const isMod = keys.includes('mod') || keys.includes('cmd') || keys.includes('command');
  const normalizedKey = key === ' ' ? ' ' : key.toLowerCase();
  
  useKeyPress(
    (event) => event.key.toLowerCase() === normalizedKey,
    {
      ...options,
      handler,
      eventType: 'keydown',
      exactMatch: {
        ctrl: keys.includes('ctrl') || (isMod && !navigator.platform.includes('Mac')),
        meta: keys.includes('meta') || (isMod && navigator.platform.includes('Mac')),
        alt: keys.includes('alt'),
        shift: keys.includes('shift'),
      },
    }
  );
}
