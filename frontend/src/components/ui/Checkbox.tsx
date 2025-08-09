import React, { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import type { FieldError } from 'react-hook-form';

type CheckboxSize = 'sm' | 'md' | 'lg';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string | React.ReactNode;
  error?: FieldError | string;
  checkboxSize?: CheckboxSize;
  containerClassName?: string;
  labelClassName?: string;
  description?: string;
}

const sizeClasses: Record<CheckboxSize, string> = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

const textSizeClasses: Record<CheckboxSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      error,
      checkboxSize = 'md',
      className = '',
      containerClassName = '',
      labelClassName = '',
      description,
      id,
      ...props
    },
    ref
  ) => {
    const checkboxId = id || React.useId();
    const hasError = !!error;
    const isDisabled = props.disabled;

    const checkboxClasses = [
      'rounded',
      'focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      sizeClasses[checkboxSize],
      hasError
        ? 'border-red-300 text-red-600 focus:ring-red-500 focus:ring-offset-0'
        : 'border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0',
      className,
    ].filter(Boolean).join(' ');

    const containerClasses = [
      'relative flex items-start',
      containerClassName,
    ].filter(Boolean).join(' ');

    const labelClasses = [
      'font-medium',
      textSizeClasses[checkboxSize],
      hasError ? 'text-red-700' : 'text-gray-700',
      isDisabled ? 'opacity-50' : '',
      labelClassName,
    ].filter(Boolean).join(' ');

    const descriptionClasses = [
      'mt-1',
      textSizeClasses[checkboxSize],
      hasError ? 'text-red-600' : 'text-gray-500',
      isDisabled ? 'opacity-50' : '',
    ].filter(Boolean).join(' ');

    return (
      <div className={containerClasses}>
        <div className="flex items-center h-5">
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            className={checkboxClasses}
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={
              hasError
                ? `${checkboxId}-error`
                : description
                ? `${checkboxId}-description`
                : undefined
            }
            disabled={isDisabled}
            {...props}
          />
        </div>
        <div className="ml-3">
          {label && (
            <label
              htmlFor={checkboxId}
              className={labelClasses}
            >
              {label}
              {props.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          {description && (
            <p
              id={`${checkboxId}-description`}
              className={descriptionClasses}
            >
              {description}
            </p>
          )}
          {hasError && (
            <p
              className="mt-1 text-sm text-red-600"
              id={`${checkboxId}-error`}
            >
              {typeof error === 'string' ? error : error?.message}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
