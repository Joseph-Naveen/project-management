# Dual Environment Configuration Guide
**Supports Both Local Development and Render Deployment**

## Overview
This configuration supports seamless development locally and deployment on Render without needing to push `.env` files to git.

## How It Works

### Local Development
- Uses `.env` files with static values for local development
- Application code provides fallback defaults using `||` operator
- `.env` files are git-ignored for security
- Developers copy from `.env.example` and customize

### Render Deployment
- Environment variables are set in Render dashboard
- System environment variables override `.env` file values
- Application code handles fallbacks: `process.env.PORT || '5000'`
- No `.env` files needed in production

## Setup Instructions

### 1. Local Development Setup

#### Backend Setup
```bash
# Copy example file
cp backend/.env.example backend/.env

# Edit backend/.env with your local values
```

#### Frontend Setup
```bash
# Copy example file
cp frontend/.env.example frontend/.env

# Edit frontend/.env with your local values
```

### 2. Render Deployment Setup

#### Backend Service Environment Variables
Set these in your Render Web Service dashboard:

**Required - Database (PostgreSQL Service)**
```bash
DB_HOST=<postgres-internal-hostname>
DB_PORT=5432
DB_USER=<postgres-username>
DB_PASSWORD=<postgres-password>
DB_NAME=<database-name>
```

**Required - Security**
```bash
JWT_SECRET=<generate-32-char-hex>
SESSION_SECRET=<generate-32-char-hex>
ADMIN_PASSWORD=<secure-admin-password>
```

**Required - CORS**
```bash
CORS_ORIGIN=<frontend-url>
```

**Optional - Email**
```bash
SMTP_USER=<email-address>
SMTP_PASS=<app-password>
```

#### Frontend Service Environment Variables
Set these in your Render Static Site dashboard:

```bash
VITE_API_BASE_URL=<backend-service-url>/api
```

## Environment Variable Priority

The configuration uses this priority order:
1. **System Environment Variables** (Render/Production)
2. **Local .env file** (Development)
3. **Application fallback values** (Built-in defaults in code)

### How Fallbacks Work
```javascript
// In application code (not .env files)
const port = parseInt(process.env.PORT || '5000');
const dbHost = process.env.DB_HOST || 'localhost';
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
```

### Local .env Format
```bash
# Use simple key=value format (no shell syntax)
PORT=5000
NODE_ENV=development
DB_HOST=localhost
CORS_ORIGIN=http://localhost:5173
```

### Render Environment Variables
```bash
# Set in Render dashboard
PORT=<auto-set-by-render>
NODE_ENV=production
DB_HOST=<postgres-hostname>
CORS_ORIGIN=<frontend-url>
```

## Security Best Practices

### Generate Strong Secrets
```bash
# Generate JWT secret (32 characters)
openssl rand -hex 32

# Generate session secret (32 characters) 
openssl rand -hex 32
```

### Git Security
- ✅ `.env` files are in `.gitignore`
- ✅ Only `.env.example` files are committed
- ✅ No secrets in code repository
- ✅ Environment-specific configuration

## Development Workflow

### Initial Setup
```bash
# 1. Clone repository
git clone <repository-url>

# 2. Setup backend
cd backend
cp .env.example .env
# Edit .env with local database credentials
npm install

# 3. Setup frontend
cd ../frontend
cp .env.example .env
# Edit .env if needed (defaults work for most setups)
npm install

# 4. Start development
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### Adding New Environment Variables

#### For Backend
1. Add to application config with fallback:
   ```javascript
   newVariable: process.env.NEW_VARIABLE || 'default_value'
   ```

2. Add to `backend/.env`:
   ```bash
   NEW_VARIABLE=local_value
   ```

3. Add to `backend/.env.example`:
   ```bash
   NEW_VARIABLE=example_value
   ```

4. Update Render dashboard if needed for production

#### For Frontend
1. Add to `frontend/.env`:
   ```bash
   VITE_NEW_VARIABLE=local_value
   ```

2. Add to `frontend/.env.example`:
   ```bash
   VITE_NEW_VARIABLE=example_value
   ```

3. Update Render dashboard if needed for production

## Local vs Production Configuration

### Local Development (.env files)
```bash
# Backend
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5433
CORS_ORIGIN=http://localhost:5173

# Frontend
VITE_API_BASE_URL=http://localhost:5000/api
```

### Production (Render Environment Variables)
```bash
# Backend
NODE_ENV=production
DB_HOST=dpg-xxxxx-a.oregon-postgres.render.com
DB_PORT=5432
CORS_ORIGIN=https://your-frontend.onrender.com

# Frontend
VITE_API_BASE_URL=https://your-backend.onrender.com/api
```

## Troubleshooting

### Common Issues

#### "Cannot connect to database"
- **Local**: Check PostgreSQL is running and credentials in `.env`
- **Render**: Verify database environment variables are set correctly

#### "CORS error in browser"
- **Local**: Ensure `CORS_ORIGIN=http://localhost:5173` in backend `.env`
- **Render**: Set `CORS_ORIGIN` to exact frontend URL in Render dashboard

#### "API calls failing"
- **Local**: Ensure `VITE_API_BASE_URL=http://localhost:5000/api` in frontend `.env`
- **Render**: Set `VITE_API_BASE_URL` to backend service URL + `/api`

#### "Environment variables not loading"
- Check if `.env` file exists and is in correct location
- Ensure no spaces around `=` in environment variable definitions
- Verify fallback syntax: `${VARIABLE:-default}`

### Debugging Environment Variables

#### Backend Debug
Add to your backend code:
```javascript
console.log('Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  DB_HOST: process.env.DB_HOST,
  CORS_ORIGIN: process.env.CORS_ORIGIN
});
```

#### Frontend Debug
Add to your frontend code:
```javascript
console.log('Environment check:', {
  NODE_ENV: import.meta.env.NODE_ENV,
  API_URL: import.meta.env.VITE_API_BASE_URL
});
```

## Deployment Checklist

### Before Deploying to Render
- [ ] `.env` files are not committed to git
- [ ] `.env.example` files are up to date
- [ ] All required environment variables identified
- [ ] Strong secrets generated for production
- [ ] Database service created in Render
- [ ] Environment variables configured in Render dashboard

### After Deployment
- [ ] Backend service starts successfully
- [ ] Frontend builds and deploys
- [ ] Database connection works
- [ ] CORS configured correctly
- [ ] API endpoints respond correctly
- [ ] Authentication flow works

## Benefits of This Setup

✅ **Developer Friendly**: Easy local setup with sensible defaults
✅ **Secure**: No secrets in code repository
✅ **Flexible**: Works across different environments
✅ **Production Ready**: Optimized for Render deployment
✅ **Maintainable**: Clear separation of concerns
✅ **Git Safe**: Environment files properly ignored
