import React, { forwardRef } from 'react';
import clsx from 'clsx';

type CardVariant = 'elevated' | 'outlined' | 'filled';
type CardSize = 'sm' | 'md' | 'lg';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  size?: CardSize;
  className?: string;
  as?: React.ElementType;
  hoverable?: boolean;
  clickable?: boolean;
  fullWidth?: boolean;
  fullHeight?: boolean;
}

const variantClasses: Record<CardVariant, string> = {
  elevated: 'bg-white shadow-sm hover:shadow-md',
  outlined: 'bg-white border border-gray-200',
  filled: 'bg-gray-50',
};

const sizeClasses: Record<CardSize, string> = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'elevated',
      size = 'md',
      className = '',
      as: Component = 'div',
      hoverable = false,
      clickable = false,
      fullWidth = false,
      fullHeight = false,
      ...props
    },
    ref
  ) => {
    const classes = clsx(
      'rounded-lg transition-all duration-200',
      variantClasses[variant],
      sizeClasses[size],
      {
        'w-full': fullWidth,
        'h-full': fullHeight,
        'hover:shadow-lg': hoverable && variant === 'elevated',
        'hover:border-gray-300': hoverable && variant === 'outlined',
        'hover:bg-gray-100': hoverable && variant === 'filled',
        'cursor-pointer': clickable,
        'transform hover:-translate-y-0.5': hoverable,
      },
      className
    );

    return <Component ref={ref} className={classes} {...props} />;
  }
);

Card.displayName = 'Card';

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  withBorder?: boolean;
}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className = '', withBorder = false, ...props }, ref) => {
    const classes = clsx(
      'px-6 py-4',
      { 'border-b border-gray-100': withBorder },
      className
    );

    return <div ref={ref} className={classes} {...props} />;
  }
);

CardHeader.displayName = 'CardHeader';

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  className?: string;
}

const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ as: Component = 'h3', className = '', ...props }, ref) => {
    const classes = clsx('text-lg font-semibold text-gray-900', className);
    return <Component ref={ref} className={classes} {...props} />;
  }
);

CardTitle.displayName = 'CardTitle';

interface CardSubtitleProps extends React.HTMLAttributes<HTMLParagraphElement> {
  className?: string;
}

const CardSubtitle = forwardRef<HTMLParagraphElement, CardSubtitleProps>(
  ({ className = '', ...props }, ref) => {
    const classes = clsx('mt-1 text-sm text-gray-500', className);
    return <p ref={ref} className={classes} {...props} />;
  }
);

CardSubtitle.displayName = 'CardSubtitle';

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const contentPaddingClasses = {
  none: '',
  sm: 'px-4 py-2',
  md: 'px-6 py-4',
  lg: 'px-8 py-6',
};

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className = '', padding = 'md', ...props }, ref) => {
    const classes = clsx(contentPaddingClasses[padding], className);
    return <div ref={ref} className={classes} {...props} />;
  }
);

CardContent.displayName = 'CardContent';

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  withBorder?: boolean;
}

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className = '', withBorder = true, ...props }, ref) => {
    const classes = clsx(
      'px-6 py-4',
      { 'border-t border-gray-100': withBorder },
      className
    );

    return <div ref={ref} className={classes} {...props} />;
  }
);

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardSubtitle, CardContent, CardFooter };
