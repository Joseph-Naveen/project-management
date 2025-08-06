# Backend API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication
All protected endpoints require: `Authorization: Bearer <jwt_token>`

---

## 🔐 Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration  
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Refresh token
- `GET /auth/me` - Get current user
- `GET /auth/check-email` - Check email availability

## 👥 Users
- `GET /users` - Get all users (with filters)
- `GET /users/{id}` - Get user by ID
- `PUT /users/profile` - Update profile
- `PUT /users/change-password` - Change password

## 📁 Projects
- `GET /projects` - Get all projects (with filters)
- `GET /projects/{id}` - Get project by ID
- `POST /projects` - Create project
- `PUT /projects/{id}` - Update project
- `DELETE /projects/{id}` - Delete project
- `GET /projects/{id}/tasks` - Get project tasks
- `GET /projects/{id}/members` - Get project members
- `POST /projects/{id}/members` - Add member
- `DELETE /projects/{id}/members/{userId}` - Remove member
- `PUT /projects/{id}/status` - Update status
- `PUT /projects/{id}/progress` - Update progress
- `GET /projects/{id}/stats` - Get project stats

## ✅ Tasks
- `GET /tasks` - Get all tasks (with filters)
- `GET /tasks/{id}` - Get task by ID
- `POST /tasks` - Create task
- `PUT /tasks/{id}` - Update task
- `DELETE /tasks/{id}` - Delete task
- `PUT /tasks/{id}/status` - Update status
- `PUT /tasks/{id}/priority` - Update priority
- `PUT /tasks/{id}/assign` - Assign task
- `PUT /tasks/{id}/due-date` - Update due date
- `GET /tasks/{id}/comments` - Get task comments
- `GET /tasks/{id}/time-logs` - Get task time logs
- `GET /tasks/{id}/attachments` - Get task attachments

## 💬 Comments
- `GET /comments` - Get comments (with filters)
- `GET /comments/{id}` - Get comment by ID
- `POST /comments` - Create comment
- `PUT /comments/{id}` - Update comment
- `DELETE /comments/{id}` - Delete comment
- `POST /comments/{id}/reactions` - Add reaction
- `DELETE /comments/{id}/reactions` - Remove reaction

## ⏰ Time Tracking
- `GET /time-logs` - Get time logs (with filters)
- `GET /time-logs/{id}` - Get time log by ID
- `POST /time-logs` - Create time log
- `PUT /time-logs/{id}` - Update time log
- `DELETE /time-logs/{id}` - Delete time log
- `POST /time-logs/start` - Start timer
- `POST /time-logs/stop` - Stop timer
- `PUT /time-logs/{id}/approve` - Approve time log
- `PUT /time-logs/{id}/reject` - Reject time log

## 🔔 Notifications
- `GET /notifications` - Get notifications
- `GET /notifications/{id}` - Get notification by ID
- `PUT /notifications/{id}/read` - Mark as read
- `PUT /notifications/mark-all-read` - Mark all as read
- `DELETE /notifications/{id}` - Delete notification
- `GET /notifications/unread-count` - Get unread count

## 📊 Dashboard
- `GET /dashboard/stats` - Get dashboard statistics
- `GET /dashboard/recent-projects` - Get recent projects
- `GET /dashboard/recent-activity` - Get recent activity

## 🔍 Search
- `GET /search` - Global search
- `POST /search/saved` - Save search
- `GET /search/saved` - Get saved searches
- `DELETE /search/saved/{id}` - Delete saved search

## 📈 Reports
- `GET /reports/projects` - Get project reports
- `GET /reports/team` - Get team reports
- `GET /reports/time` - Get time tracking reports
- `GET /reports/export` - Export report

## 📁 Attachments
- `GET /attachments/{id}` - Get attachment by ID
- `POST /attachments` - Upload attachment
- `DELETE /attachments/{id}` - Delete attachment
- `GET /attachments/{id}/download` - Download attachment

---

## 🔌 WebSocket Events

### Listen For:
- `user:online/offline` - User presence
- `project:update/create/delete` - Project changes
- `task:update/create/delete/move/assign` - Task changes
- `comment:new/update/delete/reaction` - Comment changes
- `notification:new/read` - Notification changes
- `time:start/stop/update` - Time tracking changes
- `activity:new` - New activity
- `dashboard:stats-update` - Dashboard updates
- `kanban:update` - Kanban updates

### Emit:
- `project:join/leave` - Join/leave project room
- `task:join/leave` - Join/leave task room
- `comment:typing:start/stop` - Typing indicators

---

## Error Response Format
```json
{
  "success": false,
  "error": {
    "message": "string",
    "code": "string"
  }
}
``` 