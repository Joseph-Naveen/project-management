// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL 
    ? (import.meta.env.VITE_API_BASE_URL.endsWith('/api') 
        ? import.meta.env.VITE_API_BASE_URL 
        : `${import.meta.env.VITE_API_BASE_URL}/api`)
    : '/api',
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 0, // Disabled retries for cost optimization on Render free tier
} as const;

// Debug log for environment variables
if (import.meta.env.DEV) {
  console.log('🔍 API Configuration Debug:', {
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    BASE_URL: API_CONFIG.BASE_URL,
    MODE: import.meta.env.MODE
  });
}

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    FORGOT_PASSWORD: '/auth/forgot-password',
  },
  
  // Projects
  PROJECTS: {
    BASE: '/projects',
    BY_ID: (id: string) => `/projects/${id}`,
    TASKS: (id: string) => `/projects/${id}/tasks`,
    COMMENTS: (id: string) => `/projects/${id}/comments`,
  },
  
  // Tasks
  TASKS: {
    BASE: '/tasks',
    BY_ID: (id: string) => `/tasks/${id}`,
    STATUS: (id: string) => `/tasks/${id}/status`,
    COMMENTS: (id: string) => `/tasks/${id}/comments`,
    TIME_LOGS: (id: string) => `/tasks/${id}/time-logs`,
  },
  
  // Users
  USERS: {
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`,
    PROFILE: '/users/profile',
    TIMESHEET: (id: string) => `/users/${id}/timesheet`,
  },
  
  // Comments
  COMMENTS: {
    BASE: '/comments',
    BY_ID: (id: string) => `/comments/${id}`,
  },
  
  // Time Tracking
  TIME_LOGS: {
    BASE: '/time-logs',
    BY_ID: (id: string) => `/time-logs/${id}`,
  },
  
  // Attachments
  ATTACHMENTS: {
    BASE: '/attachments',
    BY_ID: (id: string) => `/attachments/${id}`,
  },
  
  // Notifications
  NOTIFICATIONS: {
    BASE: '/notifications',
    BY_ID: (id: string) => `/notifications/${id}`,
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/mark-all-read',
  },
  
  // Dashboard
  DASHBOARD: {
    BASE: '/dashboard',
    STATS: '/dashboard/stats',
    RECENT_PROJECTS: '/dashboard/recent-projects',
    RECENT_ACTIVITY: '/dashboard/recent-activity',
    USER_DASHBOARD: '/dashboard/user',
  },
} as const;

// App Constants
export const APP_CONFIG = {
  NAME: 'Project Management Dashboard',
  VERSION: '1.0.0',
  DESCRIPTION: 'A comprehensive project management solution for development teams',
} as const;

// Route Paths
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD: '/dashboard',
  PROJECTS: '/projects',
  PROJECT_DETAIL: (id: string) => `/projects/${id}`,
  PROJECT_TASKS: (id: string) => `/projects/${id}/tasks`,
  TASKS: '/tasks',
  TASK_DETAIL: (id: string) => `/tasks/${id}`,
  TEAM: '/team',
  TEAM_MANAGEMENT: '/admin/teams',
  PROFILE: '/profile',
  TIMESHEET: '/timesheet',
  REPORTS: '/reports',
  ADMIN: '/admin',
  USER_MANAGEMENT: '/admin/users',
  UNAUTHORIZED: '/unauthorized',
  NOT_FOUND: '/404',
} as const;

// User Roles - Updated to match new system
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  DEVELOPER: 'developer',
  QA: 'qa',
} as const;

// Project Status
export const PROJECT_STATUS = {
  PLANNING: 'planning',
  ACTIVE: 'active',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

// Task Status
export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  DONE: 'done',
} as const;

// Priority Levels
export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

// Status Colors (for UI styling)
export const STATUS_COLORS = {
  PROJECT: {
    [PROJECT_STATUS.PLANNING]: 'blue',
    [PROJECT_STATUS.ACTIVE]: 'green',
    [PROJECT_STATUS.ON_HOLD]: 'yellow',
    [PROJECT_STATUS.COMPLETED]: 'gray',
    [PROJECT_STATUS.CANCELLED]: 'red',
  },
  TASK: {
    [TASK_STATUS.TODO]: 'gray',
    [TASK_STATUS.IN_PROGRESS]: 'blue',
    [TASK_STATUS.REVIEW]: 'yellow',
    [TASK_STATUS.DONE]: 'green',
  },
  PRIORITY: {
    [PRIORITY_LEVELS.LOW]: 'gray',
    [PRIORITY_LEVELS.MEDIUM]: 'blue',
    [PRIORITY_LEVELS.HIGH]: 'yellow',
    [PRIORITY_LEVELS.CRITICAL]: 'red',
  },
} as const;

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.txt'],
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  THEME: 'theme',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',
  TABLE_PREFERENCES: 'table_preferences',
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  INPUT: 'yyyy-MM-dd',
  DATETIME: 'MMM dd, yyyy HH:mm',
  TIME: 'HH:mm',
  FULL: 'EEEE, MMMM do, yyyy',
  RELATIVE: 'relative', // for time ago functionality
} as const;

// Query Keys (for React Query)
export const QUERY_KEYS = {
  AUTH_USER: ['auth', 'user'],
  PROJECTS: ['projects'],
  PROJECT: (id: string) => ['projects', id],
  PROJECT_TASKS: (id: string) => ['projects', id, 'tasks'],
  TASKS: ['tasks'],
  TASK: (id: string) => ['tasks', id],
  TASK_COMMENTS: (id: string) => ['tasks', id, 'comments'],
  USERS: ['users'],
  USER: (id: string) => ['users', id],
  TIME_LOGS: ['time-logs'],
  TIMESHEET: (userId: string, dateRange: string) => ['timesheet', userId, dateRange],
  NOTIFICATIONS: ['notifications'],
  COMMENTS: ['comments'],
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  GENERIC: 'Something went wrong. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
  FILE_SIZE: `File size must be less than ${FILE_UPLOAD.MAX_SIZE / (1024 * 1024)}MB`,
  FILE_TYPE: 'File type not supported',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Successfully logged in!',
  LOGOUT: 'Successfully logged out!',
  REGISTER: 'Account created successfully!',
  PROJECT_CREATED: 'Project created successfully!',
  PROJECT_UPDATED: 'Project updated successfully!',
  PROJECT_DELETED: 'Project deleted successfully!',
  TASK_CREATED: 'Task created successfully!',
  TASK_UPDATED: 'Task updated successfully!',
  TASK_DELETED: 'Task deleted successfully!',
  COMMENT_ADDED: 'Comment added successfully!',
  TIME_LOGGED: 'Time logged successfully!',
  FILE_UPLOADED: 'File uploaded successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
  MENTION: 'mention',
  TASK_ASSIGNED: 'task_assigned',
  COMMENT: 'comment',
  PROJECT_UPDATE: 'project_update',
  DEADLINE_REMINDER: 'deadline_reminder',
} as const;

// Theme Configuration
export const THEME_CONFIG = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

// Development Configuration
export const DEV_CONFIG = {
  ENABLE_LOGGING: import.meta.env.DEV,
  MOCK_API_DELAY: 1000, // 1 second delay for mock APIs
  ENABLE_DEV_TOOLS: import.meta.env.DEV,
} as const; 