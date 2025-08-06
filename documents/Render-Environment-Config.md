# Render Environment Configuration Guide

## Overview
This guide shows how to configure environment variables in Render dashboard for both frontend and backend services.

## Backend Service Environment Variables

Configure these in your Render backend service dashboard:

### Required Database Variables (PostgreSQL)
```bash
DB_HOST=<your-postgres-host>          # From Render PostgreSQL service
DB_PORT=5432                          # Default PostgreSQL port
DB_NAME=<your-database-name>          # Your database name
DB_USER=<your-database-user>          # From Render PostgreSQL service
DB_PASSWORD=<your-database-password>  # From Render PostgreSQL service
```

### Required Security Variables
```bash
JWT_SECRET=<generate-strong-secret>           # Use openssl rand -hex 32
SESSION_SECRET=<generate-strong-secret>       # Use openssl rand -hex 32
ADMIN_PASSWORD=<secure-admin-password>        # Strong password for admin user
```

### Required CORS Configuration
```bash
CORS_ORIGIN=<your-frontend-url>               # e.g., https://your-app.onrender.com
```

### Optional Email Configuration
```bash
SMTP_HOST=smtp.gmail.com                      # Or your email provider
SMTP_PORT=587                                 # SMTP port
SMTP_USER=<your-email@gmail.com>             # Your email
SMTP_PASS=<your-app-password>                # App-specific password
SMTP_FROM=<noreply@yourdomain.com>           # From email address
```

### Optional Performance Tuning
```bash
NODE_ENV=production                           # Set to production
RATE_LIMIT_WINDOW_MS=900000                  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100                  # Requests per window
LOG_LEVEL=info                               # Logging level
BCRYPT_ROUNDS=12                             # Password hashing rounds
```

### Optional Redis Configuration (if using Redis)
```bash
REDIS_HOST=<your-redis-host>                 # From Render Redis service
REDIS_PORT=6379                              # Default Redis port
REDIS_PASSWORD=<your-redis-password>         # From Render Redis service
```

## Frontend Service Environment Variables

Configure these in your Render frontend service dashboard:

### Required API Configuration
```bash
VITE_API_BASE_URL=<your-backend-url>/api     # e.g., https://your-api.onrender.com/api
```

## Step-by-Step Render Configuration

### 1. Backend Service Setup

1. **Create Web Service** in Render dashboard
2. **Connect Repository** to your GitHub repo
3. **Configure Build Settings**:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

4. **Add Environment Variables** (in service settings):
   - Go to "Environment" tab
   - Add all backend variables listed above
   - Use "Generate" for secrets like JWT_SECRET

### 2. PostgreSQL Database Setup

1. **Create PostgreSQL Service** in Render
2. **Copy Connection Details**:
   - Internal Database URL will be provided
   - Use internal hostname for DB_HOST
   - Use provided credentials

### 3. Frontend Service Setup

1. **Create Static Site** in Render dashboard
2. **Connect Repository** to your GitHub repo
3. **Configure Build Settings**:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

4. **Add Environment Variables**:
   - Add `VITE_API_BASE_URL` pointing to your backend service

### 4. Service URLs

After deployment, your services will have URLs like:
- **Backend**: `https://your-backend-service.onrender.com`
- **Frontend**: `https://your-frontend-service.onrender.com`

Update the environment variables accordingly:
- Set `VITE_API_BASE_URL=https://your-backend-service.onrender.com/api`
- Set `CORS_ORIGIN=https://your-frontend-service.onrender.com`

## Security Best Practices

### Generate Strong Secrets
```bash
# Generate JWT secret
openssl rand -hex 32

# Generate session secret
openssl rand -hex 32
```

### Database Security
- Use Render's internal database connections
- Enable SSL in production
- Use strong database passwords

### CORS Configuration
- Set CORS_ORIGIN to your exact frontend URL
- Don't use wildcards (*) in production

## Environment Variable Examples

### Backend Service Environment Variables
```bash
# Database (from Render PostgreSQL service)
DB_HOST=dpg-xxxxx-a.oregon-postgres.render.com
DB_PORT=5432
DB_NAME=project_management_db
DB_USER=project_user
DB_PASSWORD=secure_db_password

# Security
JWT_SECRET=a1b2c3d4e5f6789012345678901234567890abcdef1234567890
SESSION_SECRET=9876543210fedcba098765432109876543210abcdef
ADMIN_PASSWORD=SecureAdmin123!

# CORS
CORS_ORIGIN=https://project-mgmt-frontend.onrender.com

# Optional Email
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Frontend Service Environment Variables
```bash
VITE_API_BASE_URL=https://project-mgmt-backend.onrender.com/api
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure CORS_ORIGIN matches your frontend URL exactly
2. **Database Connection**: Use internal database URL provided by Render
3. **Build Failures**: Check that all required environment variables are set
4. **API Connection**: Verify VITE_API_BASE_URL points to correct backend URL

### Health Check

Your backend should respond at:
- `https://your-backend.onrender.com/health`

Your frontend should load at:
- `https://your-frontend.onrender.com`

## Free Tier Considerations

- **Database**: PostgreSQL free tier has 1GB storage limit
- **Services**: Both services will sleep after 15 minutes of inactivity
- **Build Time**: Limited monthly build minutes
- **Bandwidth**: 100GB/month bandwidth limit

## Production Checklist

- [ ] All environment variables configured
- [ ] Strong secrets generated for JWT and session
- [ ] CORS configured with exact frontend URL
- [ ] Database connected and migrations run
- [ ] SSL enabled (automatic with Render)
- [ ] Health checks responding
- [ ] Frontend connecting to backend successfully
- [ ] Error handling tested
- [ ] Performance optimized for free tier limits
