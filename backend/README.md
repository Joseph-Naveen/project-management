# Project Management Dashboard - Backend

A Node.js/Express backend API for the Project Management Dashboard with TypeScript, PostgreSQL, and comprehensive authentication.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Database**: PostgreSQL with Sequelize ORM
- **API Documentation**: RESTful API with comprehensive endpoints
- **Security**: Rate limiting, CORS, helmet, input validation
- **Real-time**: WebSocket support for live updates
- **File Upload**: Support for attachments and file management
- **Testing**: Unit and integration tests with Jest

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

## 🛠 Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your database credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=5433
   DB_NAME=project_management
   DB_USER=postgres
   DB_PASSWORD=your_password
   ```

4. **Database Setup**
   ```bash
   # Create database
   createdb project_management
   
   # Run migrations
   npm run db:migrate
   
   # Seed initial data
   npm run db:seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── middleware/       # Express middleware
│   ├── routes/          # API route handlers
│   ├── types/           # TypeScript type definitions
│   └── index.ts         # Main application entry
├── db/
│   ├── migrations/      # Database migrations
│   └── seed/           # Seed data files
├── scripts/            # Database scripts
└── package.json
```

## 🗄 Database Schema

### Core Tables
- **users**: User accounts and profiles
- **projects**: Project information and metadata
- **tasks**: Task management and tracking
- **comments**: Discussion and collaboration
- **time_logs**: Time tracking and billing
- **notifications**: User notifications
- **attachments**: File uploads and storage
- **activities**: Audit trail and activity feed

### Supporting Tables
- **project_members**: Project team relationships
- **task_dependencies**: Task dependencies and relationships

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication:

- **Login**: `POST /api/auth/login`
- **Register**: `POST /api/auth/register`
- **Refresh**: `POST /api/auth/refresh`
- **Logout**: `POST /api/auth/logout`

### User Roles
- `admin`: Full system access
- `project_manager`: Project management capabilities
- `team_member`: Standard user access
- `viewer`: Read-only access

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - List users
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Projects
- `GET /api/projects` - List projects
- `GET /api/projects/:id` - Get project details
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks
- `GET /api/tasks` - List tasks
- `GET /api/tasks/:id` - Get task details
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Comments
- `GET /api/comments` - List comments
- `POST /api/comments` - Create comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment

### Time Tracking
- `GET /api/time-logs` - List time logs
- `POST /api/time-logs` - Create time log
- `PUT /api/time-logs/:id` - Update time log
- `DELETE /api/time-logs/:id` - Delete time log

### Notifications
- `GET /api/notifications` - List notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/recent-activity` - Recent activity

### Reports
- `GET /api/reports/projects` - Project reports
- `GET /api/reports/team` - Team reports

### Search
- `GET /api/search` - Global search

### Attachments
- `POST /api/attachments` - Upload file
- `GET /api/attachments/:id` - Download file
- `DELETE /api/attachments/:id` - Delete file

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📊 Database Management

```bash
# Run migrations
npm run db:migrate

# Seed database
npm run db:seed

# Reset database (drops all tables)
npm run db:reset
```

## 🔧 Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Format code
npm run format
```

## 🚀 Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set production environment variables**
   ```env
   NODE_ENV=production
   PORT=3001
   DB_HOST=your_db_host
   DB_PASSWORD=your_db_password
   JWT_SECRET=your_jwt_secret
   ```

3. **Start the server**
   ```bash
   npm start
   ```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5433` |
| `DB_NAME` | Database name | `project_management` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `password` |
| `JWT_SECRET` | JWT secret key | `your-super-secret-jwt-key` |
| `JWT_EXPIRES_IN` | JWT expiration | `24h` |
| `CORS_ORIGIN` | CORS origin | `http://localhost:3000` |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the test files for usage examples 