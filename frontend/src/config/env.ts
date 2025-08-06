/**
 * Environment Configuration
 * Centralized access to environment variables with type safety
 */

export const env = {
  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  
  // App Configuration
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Project Management Dashboard',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  APP_DESCRIPTION: import.meta.env.VITE_APP_DESCRIPTION || 'A comprehensive project management solution',
  
  // Environment
  ENVIRONMENT: import.meta.env.MODE || 'development',
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
  
  // Feature Flags
  ENABLE_DEV_TOOLS: import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true' || import.meta.env.DEV,
  ENABLE_LOGGING: import.meta.env.VITE_ENABLE_LOGGING === 'true' || import.meta.env.DEV,
  DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === 'true' || import.meta.env.DEV,
  
  // Mock API Configuration
  MOCK_API_DELAY: parseInt(import.meta.env.VITE_MOCK_API_DELAY || '1000', 10),
  
  // File Upload Configuration
  MAX_FILE_SIZE: parseInt(import.meta.env.VITE_MAX_FILE_SIZE || '10485760', 10), // 10MB
  ALLOWED_FILE_TYPES: (import.meta.env.VITE_ALLOWED_FILE_TYPES || 
    'image/jpeg,image/png,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain')
    .split(','),
    
  // Optional third-party services
  ANALYTICS_ID: import.meta.env.VITE_ANALYTICS_ID,
  SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
  
  // OAuth Configuration (future)
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  GITHUB_CLIENT_ID: import.meta.env.VITE_GITHUB_CLIENT_ID,
} as const;

/**
 * Validate required environment variables
 */
export const validateEnv = (): void => {
  const requiredVars = [
    'API_BASE_URL',
    'APP_NAME',
  ] as const;
  
  const missing = requiredVars.filter(key => !env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

/**
 * Get environment info for debugging
 */
export const getEnvInfo = () => {
  return {
    environment: env.ENVIRONMENT,
    isDevelopment: env.IS_DEVELOPMENT,
    isProduction: env.IS_PRODUCTION,
    apiBaseUrl: env.API_BASE_URL,
    appName: env.APP_NAME,
    appVersion: env.APP_VERSION,
    debugMode: env.DEBUG_MODE,
    enableLogging: env.ENABLE_LOGGING,
  };
};

// Initialize environment validation in development
if (env.IS_DEVELOPMENT) {
  try {
    validateEnv();
    if (env.ENABLE_LOGGING) {
      console.log('Environment loaded:', getEnvInfo());
    }
  } catch (error) {
    console.error('Environment validation failed:', error);
  }
} 