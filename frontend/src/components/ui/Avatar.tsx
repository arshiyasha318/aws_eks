import React from 'react';
import clsx from 'clsx';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type AvatarVariant = 'circle' | 'rounded' | 'square';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: AvatarSize;
  variant?: AvatarVariant;
  className?: string;
  placeholder?: string;
  onClick?: () => void;
  isOnline?: boolean;
  showStatus?: boolean;
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-12 w-12 text-lg',
  xl: 'h-16 w-16 text-xl',
  '2xl': 'h-24 w-24 text-2xl',
};

const statusSizeClasses: Record<AvatarSize, string> = {
  xs: 'h-1.5 w-1.5',
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
  xl: 'h-4 w-4',
  '2xl': 'h-5 w-5',
};

const variantClasses: Record<AvatarVariant, string> = {
  circle: 'rounded-full',
  rounded: 'rounded-lg',
  square: 'rounded-none',
};

const getInitials = (name?: string): string => {
  if (!name) return '?';
  
  const names = name.trim().split(' ');
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  
  return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
};

const getBackgroundColor = (str: string): string => {
  if (!str) return 'bg-gray-400';
  
  // Simple hash function to generate a consistent color based on the string
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Use the hash to generate a hue value
  const hue = Math.abs(hash % 360);
  
  // Return a Tailwind color class based on the hue
  if (hue < 30) return 'bg-red-500';
  if (hue < 60) return 'bg-orange-500';
  if (hue < 90) return 'bg-amber-500';
  if (hue < 120) return 'bg-yellow-500';
  if (hue < 150) return 'bg-lime-500';
  if (hue < 180) return 'bg-green-500';
  if (hue < 210) return 'bg-emerald-500';
  if (hue < 240) return 'bg-teal-500';
  if (hue < 270) return 'bg-cyan-500';
  if (hue < 300) return 'bg-sky-500';
  if (hue < 330) return 'bg-blue-500';
  return 'bg-indigo-500';
};

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = '',
  size = 'md',
  variant = 'circle',
  className = '',
  placeholder,
  onClick,
  isOnline = false,
  showStatus = false,
}) => {
  const hasImage = !!src;
  const hasPlaceholder = !!placeholder;
  const showInitials = !hasImage && !hasPlaceholder;
  const statusSize = statusSizeClasses[size];
  
  const avatarClasses = clsx(
    'inline-block relative overflow-hidden',
    'flex items-center justify-center',
    'bg-gray-200 text-gray-700',
    'select-none',
    sizeClasses[size],
    variantClasses[variant],
    onClick && 'cursor-pointer',
    className
  );
  
  const statusClasses = clsx(
    'absolute rounded-full border-2 border-white',
    'bottom-0 right-0',
    isOnline ? 'bg-green-500' : 'bg-gray-400',
    statusSize
  );
  
  const placeholderClasses = clsx(
    'flex items-center justify-center',
    'w-full h-full',
    'text-white font-medium',
    !hasImage && !hasPlaceholder && getBackgroundColor(alt || '?')
  );

  return (
    <div className="relative inline-block">
      <div className={avatarClasses} onClick={onClick}>
        {hasImage ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            onError={(e) => {
              // If image fails to load, show placeholder or initials
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : null}
        
        {showInitials && (
          <div className={placeholderClasses}>
            {getInitials(alt)}
          </div>
        )}
        
        {hasPlaceholder && (
          <div className={placeholderClasses}>
            {placeholder}
          </div>
        )}
      </div>
      
      {showStatus && (
        <span className={statusClasses} aria-hidden="true">
          <span className="sr-only">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </span>
      )}
    </div>
  );
};

export default Avatar;
