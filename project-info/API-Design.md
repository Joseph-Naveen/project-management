# API Design & Data Flow

## API Overview
The Project Management Dashboard API follows RESTful principles with consistent response formats, comprehensive error handling, and role-based access control.

### Base URL
```
Development: http://localhost:3001/api/v1
Production: https://api.projectdashboard.com/api/v1
```

### Authentication
All protected endpoints require JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Response Format
All API responses follow this consistent structure:
```typescript
{
  success: boolean;
  data?: any;
  message?: string;
  errors?: string[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
}
```

## Authentication Endpoints

### POST /auth/register
**Purpose**: Register a new user account
**Access**: Public
**Request Body**:
```typescript
{
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'team_member' | 'project_manager' | 'admin' | 'viewer';
}
```
**Response**:
```typescript
{
  success: true;
  data: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      createdAt: string;
    };
    token: string;
    refreshToken: string;
  };
  message: "User registered successfully";
}
```

### POST /auth/login
**Purpose**: Authenticate user and receive JWT token
**Access**: Public
**Request Body**:
```typescript
{
  email: string;
  password: string;
}
```
**Response**:
```typescript
{
  success: true;
  data: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
    };
    token: string;
    refreshToken: string;
    expiresIn: number;
  };
}
```

### POST /auth/refresh
**Purpose**: Refresh JWT token
**Access**: Public (requires refresh token)
**Request Body**:
```typescript
{
  refreshToken: string;
}
```

### POST /auth/logout
**Purpose**: Invalidate JWT token
**Access**: Protected
**Request Body**: None

### GET /auth/me
**Purpose**: Get current user profile
**Access**: Protected
**Response**:
```typescript
{
  success: true;
  data: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    avatar?: string;
    createdAt: string;
    updatedAt: string;
  };
}
```

## Project Management Endpoints

### GET /projects
**Purpose**: Get all projects with filtering and pagination
**Access**: Protected (all roles)
**Query Parameters**:
```typescript
{
  page?: number;
  limit?: number;
  status?: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'dueDate';
  sortOrder?: 'asc' | 'desc';
}
```
**Response**:
```typescript
{
  success: true;
  data: {
    id: string;
    name: string;
    description: string;
    status: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    startDate: string;
    endDate: string;
    progress: number;
    owner: {
      id: string;
      firstName: string;
      lastName: string;
    };
    teamMembers: User[];
    createdAt: string;
    updatedAt: string;
  }[];
  pagination: PaginationInfo;
}
```

### POST /projects
**Purpose**: Create a new project
**Access**: Protected (project_manager, admin)
**Request Body**:
```typescript
{
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  teamMemberIds: string[];
}
```

### GET /projects/:id
**Purpose**: Get specific project details
**Access**: Protected (project members or admin)
**Response**: Detailed project object with tasks and team members

### PUT /projects/:id
**Purpose**: Update project information
**Access**: Protected (project owner, admin)
**Request Body**: Partial project object

### DELETE /projects/:id
**Purpose**: Delete a project
**Access**: Protected (project owner, admin)

## Task Management Endpoints

### GET /projects/:projectId/tasks
**Purpose**: Get all tasks for a project
**Access**: Protected (project members)
**Query Parameters**:
```typescript
{
  status?: 'todo' | 'in_progress' | 'review' | 'done';
  assigneeId?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: string;
}
```

### POST /projects/:projectId/tasks
**Purpose**: Create a new task in a project
**Access**: Protected (project_manager, admin)
**Request Body**:
```typescript
{
  title: string;
  description: string;
  assigneeId?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'todo' | 'in_progress' | 'review' | 'done';
  dueDate?: string;
  estimatedHours?: number;
  dependencies?: string[];
}
```

### GET /tasks/:id
**Purpose**: Get specific task details
**Access**: Protected (project members)
**Response**:
```typescript
{
  success: true;
  data: {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    assignee?: User;
    project: {
      id: string;
      name: string;
    };
    dueDate?: string;
    estimatedHours?: number;
    actualHours?: number;
    createdAt: string;
    updatedAt: string;
    comments: Comment[];
    attachments: Attachment[];
  };
}
```

### PUT /tasks/:id
**Purpose**: Update task information
**Access**: Protected (assignee, project_manager, admin)

### DELETE /tasks/:id
**Purpose**: Delete a task
**Access**: Protected (project_manager, admin)

### PUT /tasks/:id/status
**Purpose**: Update task status
**Access**: Protected (assignee, project_manager, admin)
**Request Body**:
```typescript
{
  status: 'todo' | 'in_progress' | 'review' | 'done';
}
```

## Comment System Endpoints

### GET /tasks/:taskId/comments
**Purpose**: Get all comments for a task
**Access**: Protected (project members)
**Response**:
```typescript
{
  success: true;
  data: {
    id: string;
    content: string;
    author: {
      id: string;
      firstName: string;
      lastName: string;
      avatar?: string;
    };
    createdAt: string;
    updatedAt: string;
    mentions: User[];
  }[];
}
```

### POST /tasks/:taskId/comments
**Purpose**: Add a comment to a task
**Access**: Protected (project members)
**Request Body**:
```typescript
{
  content: string;
  mentions?: string[];
}
```

### GET /projects/:projectId/comments
**Purpose**: Get all comments for a project
**Access**: Protected (project members)

### POST /projects/:projectId/comments
**Purpose**: Add a comment to a project
**Access**: Protected (project members)

### PUT /comments/:id
**Purpose**: Update a comment
**Access**: Protected (comment author, admin)

### DELETE /comments/:id
**Purpose**: Delete a comment
**Access**: Protected (comment author, admin)

## Time Tracking Endpoints

### GET /time-logs
**Purpose**: Get time logs with filtering
**Access**: Protected (own logs or project_manager/admin)
**Query Parameters**:
```typescript
{
  userId?: string;
  projectId?: string;
  taskId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
```

### POST /time-logs
**Purpose**: Log time for a task
**Access**: Protected (all roles)
**Request Body**:
```typescript
{
  taskId: string;
  hours: number;
  description?: string;
  logDate: string;
}
```

### GET /time-logs/:id
**Purpose**: Get specific time log entry
**Access**: Protected (log owner, project_manager, admin)

### PUT /time-logs/:id
**Purpose**: Update time log entry
**Access**: Protected (log owner, project_manager, admin)

### DELETE /time-logs/:id
**Purpose**: Delete time log entry
**Access**: Protected (log owner, project_manager, admin)

### GET /users/:userId/timesheet
**Purpose**: Get user's timesheet for a period
**Access**: Protected (own timesheet or project_manager/admin)
**Query Parameters**:
```typescript
{
  startDate: string;
  endDate: string;
  projectId?: string;
}
```

## File Upload Endpoints

### POST /attachments
**Purpose**: Upload file attachment
**Access**: Protected (all roles)
**Request**: Multipart form data
**Form Fields**:
```typescript
{
  file: File;
  entityType: 'task' | 'project' | 'comment';
  entityId: string;
}
```

### GET /attachments/:id
**Purpose**: Download/view attachment
**Access**: Protected (project members)

### DELETE /attachments/:id
**Purpose**: Delete attachment
**Access**: Protected (uploader, project_manager, admin)

## User Management Endpoints

### GET /users
**Purpose**: Get all users with filtering
**Access**: Protected (project_manager, admin)
**Query Parameters**:
```typescript
{
  role?: string;
  search?: string;
  page?: number;
  limit?: number;
}
```

### GET /users/:id
**Purpose**: Get specific user profile
**Access**: Protected (all roles)

### PUT /users/:id
**Purpose**: Update user profile
**Access**: Protected (own profile or admin)

### DELETE /users/:id
**Purpose**: Delete user account
**Access**: Protected (admin only)

## Notification Endpoints

### GET /notifications
**Purpose**: Get user notifications
**Access**: Protected (own notifications)
**Query Parameters**:
```typescript
{
  read?: boolean;
  type?: 'mention' | 'task_assigned' | 'comment' | 'project_update';
  page?: number;
  limit?: number;
}
```

### PUT /notifications/:id/read
**Purpose**: Mark notification as read
**Access**: Protected (notification recipient)

### PUT /notifications/mark-all-read
**Purpose**: Mark all notifications as read
**Access**: Protected (all roles)

## Data Flow Description

### Frontend to Backend Communication

#### Authentication Flow
1. **User Login**: Frontend sends credentials to `/auth/login`
2. **Token Storage**: Frontend stores JWT and refresh token securely
3. **API Requests**: Frontend includes JWT in Authorization header
4. **Token Refresh**: Frontend automatically refreshes expired tokens

#### Project Management Flow
1. **Project List**: Frontend fetches projects from `/projects` with filters
2. **Project Creation**: Frontend sends project data to `POST /projects`
3. **Real-time Updates**: Frontend polls for project updates periodically
4. **Task Synchronization**: Frontend syncs task changes with backend

#### Task Management Flow
1. **Kanban Board**: Frontend fetches tasks and organizes by status
2. **Status Updates**: Frontend sends status changes to `PUT /tasks/:id/status`
3. **Assignment Changes**: Frontend updates task assignments via API
4. **Progress Calculation**: Backend calculates project progress from task statuses

#### Collaboration Flow
1. **Comment Creation**: Frontend posts comments via API
2. **Mention Processing**: Backend processes @mentions and creates notifications
3. **Activity Feed**: Frontend polls for recent activities
4. **File Uploads**: Frontend uploads files and associates with entities

#### Time Tracking Flow
1. **Time Entry**: Frontend submits time logs to `/time-logs`
2. **Timesheet View**: Frontend aggregates time data for display
3. **Reporting**: Frontend generates reports from time tracking data
4. **Project Costing**: Backend calculates project costs from logged time

### Backend Processing

#### Request Processing Pipeline
1. **Request Validation**: Express middleware validates input data
2. **Authentication**: JWT middleware verifies user identity
3. **Authorization**: Role-based middleware checks permissions
4. **Business Logic**: Service layer processes business rules
5. **Database Operations**: Repository layer handles data persistence
6. **Response Formatting**: Consistent response structure returned

#### Data Consistency
- **Transactions**: Database transactions ensure data integrity
- **Validation**: Input validation at multiple layers
- **Error Handling**: Comprehensive error handling and logging
- **Audit Trail**: All critical operations logged for auditing

#### Performance Optimization
- **Caching**: Frequently accessed data cached in Redis
- **Pagination**: Large datasets paginated for performance
- **Indexing**: Database indexes optimize query performance
- **Connection Pooling**: Database connections pooled efficiently 