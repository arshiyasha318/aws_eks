import React, { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import type { FieldError } from 'react-hook-form';

type InputSize = 'sm' | 'md' | 'lg';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: FieldError | string;
  inputSize?: InputSize;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

const sizeClasses: Record<InputSize, string> = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-3 py-2 text-sm',
  lg: 'px-4 py-3 text-base',
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      inputSize = 'md',
      fullWidth = false,
      leftIcon,
      rightIcon,
      className = '',
      containerClassName = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || React.useId();
    const hasError = !!error;
    const isDisabled = props.disabled;

    const inputClasses = [
      'block w-full rounded-md shadow-sm',
      'focus:ring-1 focus:ring-opacity-50',
      'disabled:bg-gray-100 disabled:text-gray-500',
      sizeClasses[inputSize],
      hasError
        ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500'
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
      leftIcon ? 'pl-10' : '',
      rightIcon ? 'pr-10' : '',
      className,
    ].filter(Boolean).join(' ');

    const containerClasses = [
      'space-y-1',
      fullWidth ? 'w-full' : 'max-w-md',
      containerClassName,
    ].filter(Boolean).join(' ');

    return (
      <div className={containerClasses}>
        {label && (
          <label
            htmlFor={inputId}
            className={`block text-sm font-medium ${
              hasError ? 'text-red-700' : 'text-gray-700'
            }`}
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative rounded-md shadow-sm">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">{leftIcon}</span>
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={inputClasses}
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={hasError ? `${inputId}-error` : undefined}
            disabled={isDisabled}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <span className="text-gray-500 sm:text-sm">{rightIcon}</span>
            </div>
          )}
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

Input.displayName = 'Input';

export default Input;
