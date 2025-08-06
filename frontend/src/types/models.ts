// User and Authentication types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'manager' | 'developer' | 'qa' | 'owner' | 'member';
  department?: string;
  jobTitle?: string;
  phone?: string;
  isActive?: boolean;
  isOnline?: boolean;
  assignedTasksCount?: number;
  createdTasksCount?: number;
  totalTasksCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    timezone?: string;
    language?: string;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
  };
  lastLoginAt?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  department?: string;
  jobTitle?: string;
  projectRole?: string;
  joinedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: 'admin' | 'manager' | 'developer' | 'qa';
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: 'admin' | 'manager' | 'developer' | 'qa';
  department?: string;
  jobTitle?: string;
  phone?: string;
  isActive?: boolean;
}

// Team types
export interface Team {
  id: string;
  name: string;
  description?: string;
  managerId?: string;
  manager?: User;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
  managerId?: string;
}

export interface UpdateTeamRequest {
  name?: string;
  description?: string;
  managerId?: string;
  isActive?: boolean;
}

// Project types
export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  startDate?: string;
  endDate?: string;
  budget?: number;
  progress?: number;
  ownerId: string;
  owner?: User;
  teamId?: string;
  team?: Team;
  members?: ProjectMember[]; // Changed from User[] to ProjectMember[]
  taskCount?: number;
  taskCounts?: {
    todo: number;
    inProgress: number;
    review: number;
    done: number;
  };
  isFavorite?: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  teamId?: string;
  memberIds?: string[];
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  startDate?: string;
  endDate?: string;
  budget?: number;
  progress?: number;
  teamId?: string;
  tags?: string[];
  memberIds?: string[];
}

// Task types
export interface TaskDependency {
  id: string;
  type: 'blocks' | 'blocked_by' | 'related';
  task: Pick<Task, 'id' | 'title'>;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: User;
  assigneeId?: string;
  creator: User;
  creatorId: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  progress?: number;
  attachments?: Attachment[];
  project: Pick<Project, 'id' | 'name'>;
  projectId: string;
  dependencies?: TaskDependency[];
  labels?: string[];
  tags?: string[];
  watchers?: string[];
  commentCount?: number;
  timeLogCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  projectId: string;
  assigneeId?: string;
  creatorId?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'todo' | 'in_progress' | 'review' | 'done';
  dueDate?: string;
  estimatedHours?: number;
  labels?: string[];
  tags?: string[];
  dependencies?: string[];
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: 'todo' | 'in_progress' | 'review' | 'done';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assigneeId?: string;
  dueDate?: string;
  estimatedHours?: number;
  labels?: string[];
  tags?: string[];
  dependencies?: string[];
}

// Time tracking types
export interface TimeLog {
  id: string;
  description: string;
  duration: number; // in hours
  date: string;
  startTime?: string;
  endTime?: string;
  user: User;
  userId: string;
  task?: Pick<Task, 'id' | 'title'> | null;
  taskId?: string;
  project: Pick<Project, 'id' | 'name'>;
  projectId: string;
  billable: boolean;
  hourlyRate?: number;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTimeLogRequest {
  description: string;
  duration?: number;
  startTime?: string;
  endTime?: string;
  date?: string;
  userId?: string;
  taskId?: string;
  projectId: string;
  billable?: boolean;
  hourlyRate?: number;
  tags?: string[];
}

export interface UpdateTimeLogRequest {
  taskId?: string;
  hours?: number;
  description?: string;
  logDate?: string;
}

// Comment types
export interface Comment {
  id: string;
  content: string;
  author: User;
  authorId: string;
  taskId?: string;
  projectId?: string;
  parentId?: string;
  replies?: Comment[];
  attachments?: Attachment[];
  reactions: CommentReaction[];
  mentions?: string[];
  isEdited?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommentReaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface CreateCommentRequest {
  content: string;
  parentId?: string;
  taskId?: string;
  projectId?: string;
  attachments?: File[];
}

export interface CreateNotificationRequest {
  type: string;
  title: string;
  message: string;
  category: 'system' | 'project' | 'task' | 'comment' | 'mention';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  userId: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  data?: Record<string, any>;
}

// Project member type
export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
  user?: User; // Populated when included in queries
}

export interface UpdateCommentRequest {
  content: string;
}

// Notification types
export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  category: 'system' | 'project' | 'task' | 'comment' | 'mention' | 'deadline' | 'timesheet';
  priority: 'low' | 'medium' | 'high' | 'critical';
  read: boolean;
  readAt?: string;
  userId: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  data?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  id: string;
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  categories: {
    system: boolean;
    project: boolean;
    task: boolean;
    comment: boolean;
    mention: boolean;
  };
  quietHours?: {
    enabled: boolean;
    start: string;
    end: string;
    startTime?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Attachment type
export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedBy: string;
  createdAt: string;
}

// Activity types
export interface Activity {
  id: string;
  type: 'create' | 'update' | 'delete' | 'comment' | 'assign' | 'complete';
  entity: 'project' | 'task' | 'comment' | 'user';
  entityId: string;
  actor: User;
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

// Dashboard types
export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  totalUsers: number;
  activeUsers: number;
  totalTimeLogged: number;
  billableHours: number;
}

export interface RecentActivity {
  projects: Activity[];
  tasks: Activity[];
  comments: Activity[];
}

// Report types
export interface ProjectReport {
  project: Project;
  stats: {
    totalTasks: number;
    completedTasks: number;
    progress: number;
    totalHours: number;
    billableHours: number;
    teamSize: number;
  };
  timeline: {
    date: string;
    tasksCompleted: number;
    hoursLogged: number;
  }[];
}

export interface TeamReport {
  user: User;
  stats: {
    tasksCompleted: number;
    totalHours: number;
    billableHours: number;
    activeProjects: number;
  };
  breakdown: {
    project: string;
    tasks: number;
    hours: number;
  }[];
}

// Search and filter types
export interface SearchFilters {
  query?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  projectId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  tags?: string[];
  limit?: number;
  offset?: number;
}

// Pagination types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Export all types for easy importing
export type * from './models';