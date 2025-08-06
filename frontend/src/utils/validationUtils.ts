import { FILE_UPLOAD } from '../constants';

/**
 * Email validation
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Password strength validation
 */
export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Required field validation
 */
export const isRequired = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

/**
 * URL validation
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * File validation
 */
export const validateFile = (file: File): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  // Check file size
  if (file.size > FILE_UPLOAD.MAX_SIZE) {
    errors.push(`File size must be less than ${FILE_UPLOAD.MAX_SIZE / (1024 * 1024)}MB`);
  }
  
  // Check file type
  if (!FILE_UPLOAD.ALLOWED_TYPES.includes(file.type as any)) {
    errors.push('File type not supported');
  }
  
  // Check file extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (extension && !FILE_UPLOAD.ALLOWED_EXTENSIONS.includes(extension as any)) {
    errors.push('File extension not allowed');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Date validation
 */
export const isValidDate = (date: string): boolean => {
  const dateObj = new Date(date);
  return !isNaN(dateObj.getTime());
};

/**
 * Date range validation
 */
export const isValidDateRange = (startDate: string, endDate: string): boolean => {
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    return false;
  }
  
  return new Date(startDate) <= new Date(endDate);
};

/**
 * Number validation
 */
export const isValidNumber = (value: string | number, min?: number, max?: number): boolean => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return false;
  if (min !== undefined && num < min) return false;
  if (max !== undefined && num > max) return false;
  
  return true;
};

/**
 * Positive number validation
 */
export const isPositiveNumber = (value: string | number): boolean => {
  return isValidNumber(value, 0.01);
};

/**
 * Integer validation
 */
export const isInteger = (value: string | number): boolean => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isInteger(num);
};

/**
 * Phone number validation (basic)
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

/**
 * Project name validation
 */
export const validateProjectName = (name: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (!isRequired(name)) {
    errors.push('Project name is required');
  } else {
    if (name.length < 3) {
      errors.push('Project name must be at least 3 characters long');
    }
    
    if (name.length > 100) {
      errors.push('Project name must be less than 100 characters');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Task title validation
 */
export const validateTaskTitle = (title: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (!isRequired(title)) {
    errors.push('Task title is required');
  } else {
    if (title.length < 3) {
      errors.push('Task title must be at least 3 characters long');
    }
    
    if (title.length > 255) {
      errors.push('Task title must be less than 255 characters');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Hours validation for time tracking
 */
export const validateHours = (hours: string | number): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  const numHours = typeof hours === 'string' ? parseFloat(hours) : hours;
  
  if (isNaN(numHours)) {
    errors.push('Hours must be a valid number');
  } else {
    if (numHours <= 0) {
      errors.push('Hours must be greater than 0');
    }
    
    if (numHours > 24) {
      errors.push('Hours cannot exceed 24 per day');
    }
    
    // Check for reasonable precision (max 2 decimal places)
    if (numHours.toString().split('.')[1]?.length > 2) {
      errors.push('Hours can have at most 2 decimal places');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Generic form validation helper
 */
export const validateForm = <T extends Record<string, any>>(
  data: T,
  rules: Record<keyof T, (value: any) => { isValid: boolean; errors: string[] }>
): {
  isValid: boolean;
  errors: Record<keyof T, string[]>;
} => {
  const errors = {} as Record<keyof T, string[]>;
  let isValid = true;
  
  for (const field in rules) {
    const validation = rules[field](data[field]);
    errors[field] = validation.errors;
    
    if (!validation.isValid) {
      isValid = false;
    }
  }
  
  return { isValid, errors };
}; 