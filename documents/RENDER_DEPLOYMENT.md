# Render Deployment Guide

## 📋 Prerequisites

1. **GitHub Repository**: Push your code to GitHub
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **Environment Variables**: Prepare the required environment variables

## 🚀 Deployment Steps

### Step 1: Deploy PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "PostgreSQL"
3. Configure:
   - **Name**: `project-management-db`
   - **Database**: `project_management`
   - **User**: `project_user`
   - **Region**: `Oregon (US West)`
   - **Plan**: `Free`
4. Click "Create Database"
5. **Save the connection details** (Internal Database URL)

### Step 2: Deploy Backend API

1. Click "New" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `project-management-backend`
   - **Environment**: `Node`
   - **Region**: `Oregon (US West)`
   - **Branch**: `main`
   - **Root Directory**: Leave empty
   - **Build Command**: `cd backend && npm ci && npm run build`
   - **Start Command**: `cd backend && npm start`

4. **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=[Your PostgreSQL Internal Database URL from Step 1]
   JWT_SECRET=[Generate a secure random string]
   JWT_REFRESH_SECRET=[Generate another secure random string]
   CORS_ORIGIN=https://project-management-frontend.onrender.com
   ```

5. Click "Create Web Service"

### Step 3: Run Database Migrations

After backend deployment:

1. Go to your backend service dashboard
2. Click "Shell" tab
3. Run migrations:
   ```bash
   cd backend
   npm run migrate
   npm run seed
   ```

### Step 4: Deploy Frontend

1. Click "New" → "Static Site"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `project-management-frontend`
   - **Branch**: `main`
   - **Root Directory**: Leave empty
   - **Build Command**: `cd frontend && npm ci && npm run build`
   - **Publish Directory**: `frontend/dist`

4. **Environment Variables**:
   ```
   NODE_ENV=production
   VITE_API_URL=https://project-management-backend.onrender.com
   ```

5. Click "Create Static Site"

### Step 5: Update CORS Settings

After frontend deployment:

1. Go to backend service dashboard
2. Update environment variables:
   - Update `CORS_ORIGIN` to your actual frontend URL
3. Trigger a redeploy

## 🔧 Environment Variables Reference

### Backend Environment Variables
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://username:password@hostname:port/database
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key-here
CORS_ORIGIN=https://your-frontend-app.onrender.com
```

### Frontend Environment Variables
```env
NODE_ENV=production
VITE_API_URL=https://your-backend-app.onrender.com
```

## 📝 Build Scripts

Ensure your `package.json` files have the correct scripts:

### Backend package.json
```json
{
  "scripts": {
    "start": "node dist/index.js",
    "build": "tsc",
    "migrate": "node scripts/migrate.js",
    "seed": "node scripts/seed.js"
  }
}
```

### Frontend package.json
```json
{
  "scripts": {
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies in package.json
   - Check build logs for specific errors

2. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Check database service status
   - Ensure database migrations ran successfully

3. **CORS Errors**
   - Verify CORS_ORIGIN matches frontend URL exactly
   - Check both HTTP and HTTPS protocols
   - Ensure no trailing slashes in URLs

4. **Environment Variables**
   - Double-check all required variables are set
   - Verify no typos in variable names
   - Ensure sensitive variables are not logged

### Debugging Commands

```bash
# Check backend logs
curl https://your-backend-app.onrender.com/health

# Test API endpoints
curl https://your-backend-app.onrender.com/api/test

# Check database connection
# Use Render shell to run:
node -e "console.log(process.env.DATABASE_URL)"
```

## 🔒 Security Considerations

1. **Environment Variables**: Never commit secrets to Git
2. **Database**: Use Render's managed PostgreSQL for security
3. **HTTPS**: Render provides SSL certificates automatically
4. **CORS**: Configure properly to prevent unauthorized access

## 💰 Cost Optimization

### Free Tier Limits
- **Static Sites**: Unlimited
- **Web Services**: 750 hours/month (auto-sleep after 15 min)
- **PostgreSQL**: 1 GB storage, 1 month retention

### Optimization Tips
1. Use static site for frontend (free)
2. Minimize backend wake-up time
3. Optimize database queries
4. Use connection pooling

## 🚀 Going to Production

### Upgrade Considerations
1. **Backend**: Upgrade to Starter plan ($7/month) for:
   - No auto-sleep
   - More memory and CPU
   - Custom domains

2. **Database**: Upgrade to Standard plan ($7/month) for:
   - More storage
   - Better performance
   - Longer backup retention

3. **Monitoring**: Add health checks and monitoring
4. **Scaling**: Consider load balancing for high traffic

## 📊 Monitoring & Maintenance

### Health Checks
- Backend: `https://your-backend-app.onrender.com/health`
- Frontend: Monitor via Render dashboard
- Database: Check connection and query performance

### Regular Tasks
1. Monitor application logs
2. Check database performance
3. Update dependencies regularly
4. Review security updates

## 🎯 Expected URLs

After successful deployment:
- **Frontend**: `https://project-management-frontend.onrender.com`
- **Backend**: `https://project-management-backend.onrender.com`
- **Database**: Internal Render URL (not public)

## 📞 Support Resources

- [Render Documentation](https://render.com/docs)
- [Render Community](https://community.render.com)
- [Render Status Page](https://status.render.com)
