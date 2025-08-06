// TODO: Install date-fns for production
// import { format, formatDistanceToNow, parseISO, isValid, differenceInDays } from 'date-fns';
import { DATE_FORMATS } from '../constants';

/**
 * Format a date string or Date object to a human-readable format
 */
export const formatDate = (date: string | Date, formatPattern: string = DATE_FORMATS.DISPLAY): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }

    if (formatPattern === DATE_FORMATS.RELATIVE) {
      // Simple relative time without date-fns
      const now = new Date();
      const diffMs = now.getTime() - dateObj.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      return 'Just now';
    }

    // Basic formatting without date-fns
    return dateObj.toLocaleDateString();
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Format date for display in UI components
 */
export const formatDisplayDate = (date: string | Date): string => {
  return formatDate(date, DATE_FORMATS.DISPLAY);
};

/**
 * Format date for datetime input fields
 */
export const formatInputDate = (date: string | Date): string => {
  return formatDate(date, DATE_FORMATS.INPUT);
};

/**
 * Format date with time for display
 */
export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, DATE_FORMATS.DATETIME);
};

/**
 * Get relative time string (e.g., "2 hours ago")
 */
export const getRelativeTime = (date: string | Date): string => {
  return formatDate(date, DATE_FORMATS.RELATIVE);
};

/**
 * Check if a date is in the past
 */
export const isPastDate = (date: string | Date): boolean => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return !isNaN(dateObj.getTime()) && dateObj < new Date();
  } catch {
    return false;
  }
};

/**
 * Check if a date is today
 */
export const isToday = (date: string | Date): boolean => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    return !isNaN(dateObj.getTime()) && 
           dateObj.getDate() === today.getDate() &&
           dateObj.getMonth() === today.getMonth() &&
           dateObj.getFullYear() === today.getFullYear();
  } catch {
    return false;
  }
};

/**
 * Get days until a future date (negative if past)
 */
export const getDaysUntil = (date: string | Date): number => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 0;
    const today = new Date();
    const diffTime = dateObj.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
};

/**
 * Get current date in ISO format
 */
export const getCurrentDate = (): string => {
  return new Date().toISOString();
};

/**
 * Get date range for common periods
 */
export const getDateRange = (period: 'today' | 'week' | 'month' | 'quarter' | 'year') => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (period) {
    case 'today':
      return {
        startDate: startOfToday.toISOString(),
        endDate: new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString(),
      };
    
    case 'week': {
      const startOfWeek = new Date(startOfToday);
      startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return {
        startDate: startOfWeek.toISOString(),
        endDate: endOfWeek.toISOString(),
      };
    }
    
    case 'month': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return {
        startDate: startOfMonth.toISOString(),
        endDate: endOfMonth.toISOString(),
      };
    }
    
    case 'quarter': {
      const quarter = Math.floor(now.getMonth() / 3);
      const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1);
      const endOfQuarter = new Date(now.getFullYear(), quarter * 3 + 3, 0);
      return {
        startDate: startOfQuarter.toISOString(),
        endDate: endOfQuarter.toISOString(),
      };
    }
    
    case 'year': {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear(), 11, 31);
      return {
        startDate: startOfYear.toISOString(),
        endDate: endOfYear.toISOString(),
      };
    }
    
    default:
      return {
        startDate: startOfToday.toISOString(),
        endDate: startOfToday.toISOString(),
      };
  }
}; 