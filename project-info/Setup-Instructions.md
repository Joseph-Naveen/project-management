# Detailed Setup Instructions

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Development Environment Setup](#development-environment-setup)
3. [Database Configuration](#database-configuration)
4. [Environment Variables](#environment-variables)
5. [Running the Application](#running-the-application)
6. [Testing the Setup](#testing-the-setup)
7. [Production Deployment](#production-deployment)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements
- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18+)
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher (comes with Node.js)
- **PostgreSQL**: Version 12.0 or higher
- **Git**: Latest version
- **Code Editor**: VS Code (recommended) with extensions:
  - TypeScript
  - ESLint
  - Prettier
  - PostgreSQL Client

### Installing Prerequisites

#### Node.js Installation
1. **Download**: Visit [nodejs.org](https://nodejs.org/) and download the LTS version
2. **Install**: Run the installer and follow the setup wizard
3. **Verify**: Open terminal and run:
   ```bash
   node --version  # Should show v18.x.x or higher
   npm --version   # Should show 8.x.x or higher
   ```

#### PostgreSQL Installation

**Windows**:
1. Download from [postgresql.org/download/windows](https://www.postgresql.org/download/windows/)
2. Run installer and remember the superuser password
3. Add PostgreSQL bin directory to PATH

**macOS**:
```bash
# Using Homebrew
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu)**:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Verify PostgreSQL Installation
```bash
psql --version  # Should show PostgreSQL 12.x or higher

# Test connection (use the password you set during installation)
psql -U postgres -h localhost
```

## Development Environment Setup

### 1. Clone and Setup Project
```bash
# Clone the repository
git clone <repository-url>
cd project_management_dashboard

# Create necessary directories
mkdir -p backend/logs
mkdir -p backend/uploads
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Install development tools globally (optional but recommended)
npm install -g ts-node-dev nodemon

# Verify installation
npm list --depth=0
```

### 3. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Install additional development tools (optional)
npm install -g @vitejs/plugin-react

# Verify installation
npm list --depth=0
```

## Database Configuration

### 1. Create Database and User
```sql
-- Connect as superuser
psql -U postgres

-- Create database
CREATE DATABASE project_management_db;

-- Create dedicated user (recommended for production)
CREATE USER pm_user WITH ENCRYPTED PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE project_management_db TO pm_user;

-- Connect to the new database
\c project_management_db

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO pm_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO pm_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO pm_user;

-- Exit psql
\q
```

### 2. Initialize Database Schema
```bash
# From project root directory
psql -d project_management_db -U pm_user -f database/init.sql

# Or if using superuser
psql -d project_management_db -U postgres -f database/init.sql
```

### 3. Verify Database Setup
```sql
-- Connect to database
psql -d project_management_db -U pm_user

-- List tables
\dt

-- Check if sample data is loaded
SELECT email, role FROM users;

-- Should show admin and test users
-- Exit
\q
```

## Environment Variables

### Backend Environment Configuration

Create `backend/.env` file:
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your specific values:
```env
# Server Configuration
NODE_ENV=development
PORT=3001
API_VERSION=v1

# Database Configuration
DB_HOST=localhost
DB_PORT=5433
DB_NAME=project_management_db
DB_USER=pm_user
DB_PASSWORD=your_secure_password

# JWT Configuration (generate secure random strings)
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters_long
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_SECRET=your_super_secure_refresh_token_secret_minimum_32_characters
REFRESH_TOKEN_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# File Upload Configuration
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,doc,docx,jpg,jpeg,png,gif

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend Environment Configuration

Create `frontend/.env` file:
```bash
cd frontend
```

Create `.env` file:
```env
VITE_API_BASE_URL=http://localhost:3001/api/v1
VITE_APP_NAME=Project Management Dashboard
VITE_APP_VERSION=1.0.0
```

### Generate Secure JWT Secrets
Use Node.js to generate secure secrets:
```javascript
// Run in Node.js REPL
require('crypto').randomBytes(64).toString('hex')
```

Or use online tools like:
- [randomkeygen.com](https://randomkeygen.com/)
- [passwordsgenerator.net](https://passwordsgenerator.net/)

## Running the Application

### 1. Start PostgreSQL
Ensure PostgreSQL is running:
```bash
# Windows (if installed as service)
net start postgresql-x64-14

# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql
```

### 2. Start Backend Server
```bash
cd backend

# Development mode with hot reload
npm run dev

# Or standard development mode
npm start

# You should see:
# ✅ Database connected successfully
# 🚀 Server running on port 3001
```

### 3. Start Frontend Server
Open a new terminal:
```bash
cd frontend

# Start development server
npm run dev

# You should see:
# Local:   http://localhost:3000/
# Network: http://192.168.x.x:3000/
```

### 4. Verify Both Servers
- **Frontend**: Open http://localhost:3000
- **Backend API**: Open http://localhost:3001/health
- **API Documentation**: Open http://localhost:3001/api/v1

## Testing the Setup

### 1. Backend API Tests
```bash
# Test health endpoint
curl http://localhost:3001/health

# Test API base endpoint
curl http://localhost:3001/api/v1

# Test user registration
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### 2. Database Connection Test
```bash
cd backend
node -e "
const { testConnection } = require('./dist/config/database');
testConnection().then(() => console.log('✅ Success')).catch(console.error);
"
```

### 3. Frontend Build Test
```bash
cd frontend
npm run build
npm run preview
```

### 4. Run Test Suites
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## Production Deployment

### 1. Environment Preparation
```bash
# Set production environment
export NODE_ENV=production

# Update environment variables for production
# - Use strong, unique secrets
# - Set proper CORS origins
# - Configure production database
# - Set up file storage (AWS S3, etc.)
```

### 2. Build Applications
```bash
# Build backend
cd backend
npm run build

# Build frontend
cd frontend
npm run build
```

### 3. Database Migration for Production
```bash
# Create production database
createdb project_management_prod

# Run initialization with production data
psql -d project_management_prod -f database/init.sql

# Create database backups
pg_dump project_management_prod > backup.sql
```

### 4. Deploy to Server
```bash
# Copy built files to server
scp -r backend/dist/ user@server:/app/backend/
scp -r frontend/dist/ user@server:/app/frontend/

# Install dependencies on server
ssh user@server "cd /app/backend && npm ci --only=production"

# Start with process manager
pm2 start /app/backend/dist/server.js --name pm-dashboard
```

### 5. Set Up Reverse Proxy (Nginx)
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        root /app/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed
**Symptoms**: `Database connection failed` error on startup

**Solutions**:
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Verify connection manually
psql -h localhost -U pm_user -d project_management_db

# Check environment variables
echo $DB_HOST $DB_PORT $DB_NAME $DB_USER

# Reset database connection
sudo systemctl restart postgresql
```

#### 2. Port Already in Use
**Symptoms**: `EADDRINUSE: address already in use :::3001`

**Solutions**:
```bash
# Find process using port
lsof -i :3001  # macOS/Linux
netstat -ano | findstr :3001  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Or use different port
export PORT=3001
```

#### 3. Module Not Found Errors
**Symptoms**: TypeScript/ES module errors

**Solutions**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear npm cache
npm cache clean --force

# Verify Node.js version
node --version
```

#### 4. CORS Issues
**Symptoms**: Frontend can't connect to backend

**Solutions**:
- Check `CORS_ORIGIN` in backend `.env`
- Verify frontend runs on correct port
- Update Vite proxy configuration

#### 5. File Upload Issues
**Symptoms**: File uploads fail

**Solutions**:
```bash
# Check upload directory permissions
mkdir -p backend/uploads
chmod 755 backend/uploads

# Verify file size limits in .env
# Check disk space
df -h
```

### Debug Mode

#### Backend Debug Mode
```bash
cd backend
DEBUG=* npm run dev  # Verbose logging
# Or
LOG_LEVEL=debug npm run dev
```

#### Frontend Debug Mode
```bash
cd frontend
VITE_DEBUG=true npm run dev
```

### Log Files
- **Backend logs**: `backend/logs/app.log`
- **Database logs**: Check PostgreSQL log directory
- **Frontend console**: Browser Developer Tools

### Getting Help
1. **Check logs**: Always check application and database logs first
2. **Search issues**: Look for similar problems in project issues
3. **Environment**: Verify all environment variables are set correctly
4. **Dependencies**: Ensure all required packages are installed
5. **Ports**: Confirm no port conflicts exist

### Health Checks
Create a simple health check script:
```bash
#!/bin/bash
echo "🔍 Running health checks..."

# Check Node.js
node --version || echo "❌ Node.js not found"

# Check PostgreSQL
psql --version || echo "❌ PostgreSQL not found"

# Check database connection
psql -d project_management_db -c "SELECT 1;" || echo "❌ Database connection failed"

# Check backend server
curl -f http://localhost:3001/health || echo "❌ Backend server not responding"

# Check frontend server
curl -f http://localhost:3000 || echo "❌ Frontend server not responding"

echo "✅ Health checks completed"
```

Save as `health-check.sh` and run with `bash health-check.sh`. 