import type { User } from './models';

// Common API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Authentication API Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'member' | 'admin' | 'owner' | 'viewer';
  department?: string;
  jobTitle?: string;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn?: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// Project API Types
export interface CreateProjectRequest {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  teamMemberIds: string[];
  status?: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  ownerId?: string;
  budget?: number;
  tags?: string[];
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  status?: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
}

export interface ProjectsQueryParams {
  page?: number;
  limit?: number;
  status?: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'dueDate';
  sortOrder?: 'asc' | 'desc';
}

// Task API Types
export interface CreateTaskRequest {
  title: string;
  description: string;
  assigneeId?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'todo' | 'in_progress' | 'review' | 'done';
  dueDate?: string;
  estimatedHours?: number;
  dependencies?: string[];
}

export type UpdateTaskRequest = Partial<CreateTaskRequest>;

export interface UpdateTaskStatusRequest {
  status: 'todo' | 'in_progress' | 'review' | 'done';
}

export interface TasksQueryParams {
  status?: 'todo' | 'in_progress' | 'review' | 'done';
  assigneeId?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: string;
}

// Comment API Types
export interface CreateCommentRequest {
  content: string;
  mentions?: string[];
}

export interface UpdateCommentRequest {
  content: string;
}

// Time Tracking API Types
export interface CreateTimeLogRequest {
  taskId: string;
  hours: number;
  description?: string;
  logDate: string;
}

export type UpdateTimeLogRequest = Partial<CreateTimeLogRequest>;

export interface TimeLogsQueryParams {
  userId?: string;
  projectId?: string;
  taskId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface TimesheetQueryParams {
  startDate: string;
  endDate: string;
  projectId?: string;
}

// File Upload API Types
export interface FileUploadRequest {
  file: File;
  entityType: 'project' | 'task' | 'comment';
  entityId: string;
}

// User API Types
export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  avatarUrl?: string;
}

export interface UsersQueryParams {
  role?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// Notification API Types
export interface NotificationsQueryParams {
  read?: boolean;
  type?: 'mention' | 'task_assigned' | 'comment' | 'project_update';
  page?: number;
  limit?: number;
} 