import React, { useState, useEffect, memo } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/solid';
import { clsx } from 'clsx';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info' | 'default';

interface ToastVariantColors {
  bg: string;
  text: string;
  title: string;
  message: string;
  icon: string;
  border: string;
}

export interface ToastProps {
  id: string | number;
  title?: string;
  message: string | React.ReactNode;
  variant?: ToastVariant;
  duration?: number;
  isOpen?: boolean;
  onClose?: (id: string | number) => void;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  className?: string;
  showIcon?: boolean;
  showCloseButton?: boolean;
  pauseOnHover?: boolean;
}

const variantIcons = {
  success: CheckCircleIcon,
  error: ExclamationCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon,
  default: InformationCircleIcon,
};

const variantColors = {
  success: {
    bg: 'bg-green-50 dark:bg-green-900',
    text: 'text-green-800 dark:text-green-200',
    title: 'text-green-800 dark:text-green-100',
    message: 'text-green-700 dark:text-green-200',
    icon: 'text-green-400',
    border: 'border-green-200 dark:border-green-800',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900',
    text: 'text-red-800 dark:text-red-200',
    title: 'text-red-800 dark:text-red-100',
    message: 'text-red-700 dark:text-red-200',
    icon: 'text-red-400',
    border: 'border-red-200 dark:border-red-800',
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900',
    text: 'text-yellow-800 dark:text-yellow-200',
    title: 'text-yellow-800 dark:text-yellow-100',
    message: 'text-yellow-700 dark:text-yellow-200',
    icon: 'text-yellow-400',
    border: 'border-yellow-200 dark:border-yellow-800',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900',
    text: 'text-blue-800 dark:text-blue-200',
    title: 'text-blue-800 dark:text-blue-100',
    message: 'text-blue-700 dark:text-blue-200',
    icon: 'text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
  },
  default: {
    bg: 'bg-gray-50 dark:bg-gray-800',
    text: 'text-gray-800 dark:text-gray-200',
    title: 'text-gray-800 dark:text-gray-100',
    message: 'text-gray-700 dark:text-gray-200',
    icon: 'text-gray-400',
    border: 'border-gray-200 dark:border-gray-700',
  },
};

const positionClasses = {
  'top-left': 'top-4 left-4',
  'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
  'top-right': 'top-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
  'bottom-right': 'bottom-4 right-4',
};

const Toast: React.FC<ToastProps> = ({
  id,
  title,
  message,
  variant = 'default',
  duration = 5000,
  isOpen: isOpenProp = true,
  onClose,
  position = 'top-right',
  className = '',
  showIcon = true,
  showCloseButton = true,
  pauseOnHover = true,
}) => {
  const [isOpen, setIsOpen] = useState(isOpenProp);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const colors: ToastVariantColors = variantColors[variant] || variantColors.default;
  const Icon = variantIcons[variant];

  const handleClose = React.useCallback(() => {
    setIsOpen(false);
    if (onClose) {
      onClose(id);
    }
  }, [id, onClose]);

  // Handle progress bar animation
  useEffect(() => {
    if (duration <= 0) return;
    
    let startTime: number | null = null;
    let animationFrameId: number;
    let lastProgress = 100;
    let lastUpdateTime = Date.now();

    const updateProgress = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      
      if (!isPaused) {
        const elapsed = timestamp - startTime;
        const newProgress = Math.max(0, 100 - (elapsed / duration) * 100);
        
        // Only update state at most once per frame to avoid excessive re-renders
        const now = Date.now();
        if (now - lastUpdateTime >= 16) { // ~60fps
          setProgress(newProgress);
          lastProgress = newProgress;
          lastUpdateTime = now;
        }

        if (newProgress > 0) {
          animationFrameId = requestAnimationFrame(updateProgress);
        } else {
          handleClose();
        }
      } else {
        // If paused, just keep the current progress
        setProgress(lastProgress);
        animationFrameId = requestAnimationFrame(updateProgress);
      }
    };

    animationFrameId = requestAnimationFrame(updateProgress);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [duration, isPaused, handleClose]);

  // Sync with parent controlled isOpen prop
  useEffect(() => {
    setIsOpen(!!isOpenProp);
  }, [isOpenProp]);

  // Handle auto-dismiss
  useEffect(() => {
    if (!isOpen || duration <= 0) return;

    const timer = setTimeout(() => {
      if (!isPaused) {
        handleClose();
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [isOpen, duration, isPaused, handleClose]);

  const handleMouseEnter = React.useCallback(() => {
    if (pauseOnHover) {
      setIsPaused(true);
    }
  }, [pauseOnHover]);

  const handleMouseLeave = React.useCallback(() => {
    if (pauseOnHover) {
      setIsPaused(false);
    }
  }, [pauseOnHover]);

  if (!isOpen) return null;

  return (
    <div 
      className={clsx(
        'fixed z-50 w-full max-w-sm',
        positionClasses[position],
        className
      )}
    >
      <div
        className={clsx(
          'rounded-lg shadow-lg overflow-hidden',
          'border',
          colors.bg,
          colors.border,
          colors.text,
          'w-full',
          'pointer-events-auto',
          'max-w-xs sm:max-w-sm md:max-w-md',
          'transition-all duration-300',
          {
            'opacity-0 translate-y-2': !isOpen,
            'opacity-100 translate-y-0': isOpen,
          }
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        role="alert"
        aria-live={variant === 'error' || variant === 'warning' ? 'assertive' : 'polite'}
        aria-atomic="true"
      >
        <div className="p-4">
          <div className="flex items-start">
            {showIcon && Icon && (
              <div className="flex-shrink-0">
                <Icon className={clsx('h-6 w-6', colors.icon)} aria-hidden="true" />
              </div>
            )}
            {duration > 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-black bg-opacity-10 overflow-hidden">
                <div
                  className={clsx(
                    'h-full transition-all duration-100 ease-linear',
                    {
                      'bg-green-400': variant === 'success',
                      'bg-red-400': variant === 'error',
                      'bg-yellow-400': variant === 'warning',
                      'bg-blue-400': variant === 'info',
                      'bg-gray-400': variant === 'default'
                    }
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
            <div className="ml-3 w-0 flex-1 pt-0.5">
              {title && (
                <h3 className={clsx('text-sm font-medium', colors.title)}>
                  {title}
                </h3>
              )}
              {typeof message === 'string' ? (
                <p className={clsx('mt-1 text-sm', colors.message)}>{message}</p>
              ) : (
                <div className={clsx('mt-1 text-sm', colors.message)}>{message}</div>
              )}
            </div>
            {showCloseButton && (
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  type="button"
                  className={clsx(
                    'inline-flex rounded-md',
                    'focus:outline-none focus:ring-2 focus:ring-offset-2',
                    'text-gray-400 hover:text-gray-500',
                    'focus:ring-gray-400',
                    'dark:text-gray-500 dark:hover:text-gray-400',
                    'dark:focus:ring-gray-500',
                  )}
                  onClick={handleClose}
                  aria-label="Close"
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        </div>
        {duration > 0 && (
          <div className={clsx('h-1 w-full', colors.bg)}>
            <div
              className={clsx('h-full', {
                'bg-green-500': variant === 'success',
                'bg-red-500': variant === 'error',
                'bg-yellow-500': variant === 'warning',
                'bg-blue-500': variant === 'info',
                'bg-gray-500': variant === 'default',
              })}
              style={{
                width: `${progress}%`,
                transition: 'width 0.1s linear',
              }}
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Create memoized component
const ToastComponent = memo(Toast);
ToastComponent.displayName = 'Toast';

export { ToastComponent as Toast };
export default ToastComponent;
