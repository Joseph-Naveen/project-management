import { forwardRef, Children } from 'react';
import type { ImgHTMLAttributes } from 'react';
import { User } from 'lucide-react';
import { clsx } from 'clsx';

export interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
  showOnlineIndicator?: boolean;
  isOnline?: boolean;
}

const avatarSizes = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

const iconSizes = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
};

const indicatorSizes = {
  xs: 'h-1.5 w-1.5',
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
  xl: 'h-4 w-4',
};

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ 
    src,
    alt,
    size = 'md',
    fallback,
    showOnlineIndicator = false,
    isOnline = false,
    className,
    ...props 
  }, ref) => {
    // Get initials from alt text or fallback
    const getInitials = (name?: string) => {
      if (!name) return '';
      return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    };

    const initials = getInitials(alt || fallback);

    return (
      <div
        ref={ref}
        className={clsx(
          'relative flex-shrink-0 inline-block',
          className
        )}
      >
        <div
          className={clsx(
            'rounded-full overflow-hidden bg-gray-100 flex items-center justify-center',
            avatarSizes[size]
          )}
        >
          {src ? (
            <img
              src={src}
              alt={alt}
              className="h-full w-full object-cover"
              onError={(e) => {
                // Hide broken image and show fallback
                e.currentTarget.style.display = 'none';
              }}
              {...props}
            />
          ) : initials ? (
            <span className={clsx(
              'font-medium text-gray-600',
              size === 'xs' && 'text-xs',
              size === 'sm' && 'text-xs',
              size === 'md' && 'text-sm',
              size === 'lg' && 'text-base',
              size === 'xl' && 'text-lg'
            )}>
              {initials}
            </span>
          ) : (
            <User className={clsx('text-gray-400', iconSizes[size])} />
          )}
        </div>

        {/* Online indicator */}
        {showOnlineIndicator && (
          <span
            className={clsx(
              'absolute bottom-0 right-0 block rounded-full ring-2 ring-white',
              indicatorSizes[size],
              isOnline ? 'bg-green-400' : 'bg-gray-300'
            )}
            aria-hidden="true"
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

// Avatar Group component for displaying multiple avatars
export interface AvatarGroupProps {
  children: React.ReactNode;
  max?: number;
  className?: string;
}

export const AvatarGroup = ({ children, max, className }: AvatarGroupProps) => {
  const childrenArray = Children.toArray(children);
  const displayChildren = max ? childrenArray.slice(0, max) : childrenArray;
  const remainingCount = max ? Math.max(0, childrenArray.length - max) : 0;

  return (
    <div className={clsx('flex -space-x-2 overflow-hidden', className)}>
      {displayChildren}
      {remainingCount > 0 && (
        <div className="relative flex-shrink-0 inline-block">
          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center ring-2 ring-white">
            <span className="text-xs font-medium text-gray-600">
              +{remainingCount}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};