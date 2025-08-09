import React, { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';
import type { FieldError } from 'react-hook-form';
import { ChevronDownIcon } from '@heroicons/react/20/solid';

type SelectSize = 'sm' | 'md' | 'lg';

interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: FieldError | string;
  selectSize?: SelectSize;
  fullWidth?: boolean;
  options: SelectOption[];
  placeholder?: string;
  containerClassName?: string;
  leftIcon?: React.ReactNode;
}

const sizeClasses: Record<SelectSize, string> = {
  sm: 'py-1.5 pl-3 pr-8 text-xs',
  md: 'py-2 pl-3 pr-10 text-sm',
  lg: 'py-3 pl-4 pr-12 text-base',
};

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      selectSize = 'md',
      fullWidth = false,
      options = [],
      placeholder = 'Select an option',
      containerClassName = '',
      leftIcon,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || React.useId();
    const hasError = !!error;
    const isDisabled = props.disabled;

    const selectClasses = [
      'block w-full rounded-md shadow-sm',
      'focus:ring-1 focus:ring-opacity-50',
      'disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed',
      'appearance-none',
      sizeClasses[selectSize],
      hasError
        ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500'
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
      leftIcon ? 'pl-10' : '',
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
            htmlFor={selectId}
            className={`block text-sm font-medium ${
              hasError ? 'text-red-700' : 'text-gray-700'
            }`}
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">{leftIcon}</span>
            </div>
          )}
          <select
            ref={ref}
            id={selectId}
            className={selectClasses}
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={hasError ? `${selectId}-error` : undefined}
            disabled={isDisabled}
            {...props}
          >
            {placeholder && (
              <option value="" disabled={props.required}>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>
        {hasError && (
          <p className="mt-1 text-sm text-red-600" id={`${selectId}-error`}>
            {typeof error === 'string' ? error : error?.message}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
