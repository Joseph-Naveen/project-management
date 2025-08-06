import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outline' | 'shadow';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const cardVariants = {
  default: 'bg-white border border-gray-200',
  outline: 'bg-transparent border border-gray-300',
  shadow: 'bg-white shadow-md border-0',
};

const cardPadding = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ 
    className, 
    variant = 'default', 
    padding = 'md',
    hover = false,
    children,
    ...props 
  }, ref) => {
    return (
      <div
        className={clsx(
          // Base styles
          'rounded-lg transition-all duration-150 ease-in-out',
          // Variant styles
          cardVariants[variant],
          // Padding styles
          cardPadding[padding],
          // Hover effect
          hover && 'hover:shadow-lg cursor-pointer',
          // Custom className
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card Header component
export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, description, children, ...props }, ref) => {
    return (
      <div
        className={clsx('pb-4', className)}
        ref={ref}
        {...props}
      >
        {title && (
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        )}
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

// Card Content component
export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        className={clsx('', className)}
        ref={ref}
        {...props}
      />
    );
  }
);

CardContent.displayName = 'CardContent';

// Card Footer component
export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        className={clsx('pt-4 border-t border-gray-200', className)}
        ref={ref}
        {...props}
      />
    );
  }
);

CardFooter.displayName = 'CardFooter';