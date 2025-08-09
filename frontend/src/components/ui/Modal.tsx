import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import Button from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  overlayClassName?: string;
  contentClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  footer?: React.ReactNode;
  hideFooter?: boolean;
  hideHeader?: boolean;
  disableScrollLock?: boolean;
  initialFocusRef?: React.RefObject<HTMLElement>;
  finalFocusRef?: React.RefObject<HTMLElement>;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
};

const paddingClasses = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  padding = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = '',
  overlayClassName = '',
  contentClassName = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  footer,
  hideFooter = false,
  hideHeader = false,
  disableScrollLock = false,
  initialFocusRef,
  finalFocusRef,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const lastFocusedElementRef = useRef<Element | null>(null);

  // Handle initial focus when modal opens
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element to return focus when modal closes
      lastFocusedElementRef.current = document.activeElement;
      
      // Set initial focus
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else if (modalRef.current) {
        // Find the first focusable element in the modal
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        } else {
          modalRef.current.focus();
        }
      }
      
      // Disable body scroll when modal is open
      if (!disableScrollLock) {
        document.body.style.overflow = 'hidden';
      }
      
      // Add event listener for Escape key
      if (closeOnEscape) {
        const handleEscape = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
            onClose();
          }
        };
        
        document.addEventListener('keydown', handleEscape);
        return () => {
          document.removeEventListener('keydown', handleEscape);
        };
      }
    } else {
      // Restore body scroll when modal is closed
      if (!disableScrollLock) {
        document.body.style.overflow = '';
      }
      
      // Return focus to the element that was focused before the modal opened
      if (lastFocusedElementRef.current instanceof HTMLElement) {
        lastFocusedElementRef.current.focus();
      } else if (finalFocusRef?.current) {
        finalFocusRef.current.focus();
      }
    }
    
    return () => {
      // Cleanup function to ensure we don't leak event listeners
      if (!disableScrollLock) {
        document.body.style.overflow = '';
      }
    };
  }, [isOpen, onClose, closeOnEscape, initialFocusRef, finalFocusRef, disableScrollLock]);

  // Handle overlay click
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className={clsx(
        'fixed inset-0 z-50 overflow-y-auto',
        'flex items-center justify-center',
        'px-4 py-12',
        overlayClassName
      )}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" aria-hidden="true" />
      
      <div className={clsx(
        'relative z-10',
        'w-full mx-auto',
        size !== 'full' && 'max-h-[calc(100vh-6rem)]',
        sizeClasses[size],
        className
      )}>
        <div
          ref={modalRef}
          className={clsx(
            'bg-white rounded-lg shadow-xl',
            'flex flex-col',
            'max-h-full',
            'transform transition-all',
            contentClassName
          )}
          tabIndex={-1}
        >
          {!hideHeader && (
            <div
              className={clsx(
                'flex items-center justify-between',
                'px-6 py-4',
                'border-b border-gray-200',
                headerClassName
              )}
            >
              {title && (
                <h3
                  id="modal-title"
                  className="text-lg font-medium text-gray-900"
                >
                  {title}
                </h3>
              )}
              {showCloseButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="ml-auto -mr-2"
                  aria-label="Close"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
                </Button>
              )}
            </div>
          )}
          
          <div
            className={clsx(
              'flex-1 overflow-y-auto',
              paddingClasses[padding],
              bodyClassName
            )}
          >
            {children}
          </div>
          
          {!hideFooter && (footer || showCloseButton) && (
            <div
              className={clsx(
                'flex items-center justify-end',
                'px-6 py-4',
                'bg-gray-50',
                'rounded-b-lg',
                'space-x-3',
                footerClassName
              )}
            >
              {footer || (
                <Button onClick={onClose} variant="secondary">
                  Close
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default Modal;
