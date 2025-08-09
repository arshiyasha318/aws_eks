import { forwardRef, useId } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import type { FieldError } from 'react-hook-form';

type TextareaSize = 'sm' | 'md' | 'lg';

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label?: string;
  error?: FieldError | string;
  textareaSize?: TextareaSize;
  fullWidth?: boolean;
  containerClassName?: string;
  rows?: number;
}

const sizeClasses: Record<TextareaSize, string> = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-3 py-2 text-sm',
  lg: 'px-4 py-3 text-base',
};

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      textareaSize = 'md',
      fullWidth = false,
      className = '',
      containerClassName = '',
      id,
      rows = 3,
      ...props
    },
    ref
  ) => {
    const inputId = id || `textarea-${useId()}`;
    const hasError = !!error;
    const isDisabled = props.disabled;

    const textareaClasses = [
      'block w-full rounded-md shadow-sm',
      'focus:ring-1 focus:ring-opacity-50',
      'disabled:bg-gray-100 disabled:text-gray-500',
      sizeClasses[textareaSize],
      hasError
        ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500'
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
      className,
    ].filter(Boolean).join(' ');

    return (
      <div className={`${fullWidth ? 'w-full' : 'w-auto'} ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className={`block text-sm font-medium mb-1 ${
              hasError ? 'text-red-600' : 'text-gray-700'
            }`}
          >
            {label}
          </label>
        )}
        <div className="relative">
          <textarea
            id={inputId}
            ref={ref}
            className={textareaClasses}
            rows={rows}
            disabled={isDisabled}
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={hasError ? `${inputId}-error` : undefined}
            {...props}
          />
        </div>
        {hasError && (
          <p className="mt-1 text-sm text-red-600" id={`${inputId}-error`}>
            {typeof error === 'string' ? error : error?.message}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };
export type { TextareaProps, TextareaSize };
