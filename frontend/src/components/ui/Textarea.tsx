import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helpText?: string;
  fullWidth?: boolean;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className, 
    label,
    error,
    helpText,
    fullWidth = false,
    resize = 'vertical',
    disabled,
    rows = 4,
    ...props 
  }, ref) => {
    const textareaId = props.id || props.name;

    return (
      <div className={clsx('flex flex-col', fullWidth && 'w-full')}>
        {/* Label */}
        {label && (
          <label 
            htmlFor={textareaId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}

        {/* Textarea field */}
        <textarea
          className={clsx(
            // Base styles
            'block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 transition-colors duration-150 ease-in-out',
            // State styles
            error 
              ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500' 
              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500',
            // Disabled styles
            disabled && 'bg-gray-50 text-gray-500 cursor-not-allowed',
            // Resize styles
            resize === 'none' && 'resize-none',
            resize === 'vertical' && 'resize-y',
            resize === 'horizontal' && 'resize-x',
            resize === 'both' && 'resize',
            // Custom className
            className
          )}
          disabled={disabled}
          ref={ref}
          id={textareaId}
          rows={rows}
          {...props}
        />

        {/* Help text or error message */}
        {(error || helpText) && (
          <p className={clsx(
            'mt-1 text-sm',
            error ? 'text-red-600' : 'text-gray-500'
          )}>
            {error || helpText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';