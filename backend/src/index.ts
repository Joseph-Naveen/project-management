import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { createServer } from 'http';
import { rateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { connectDatabase, checkDatabaseHealth } from './config/database';
import { setupSocketServer, setSocketIO } from './sockets';
import config from './config/app';

// Global error handling - must be at the top
process.on('uncaughtException', (error) => {
  console.error('🚨 UNCAUGHT EXCEPTION:', error);
  console.error('Stack trace:', error.stack);
  // Don't exit immediately, let the app handle it gracefully
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 UNHANDLED REJECTION at:', promise);
  console.error('Reason:', reason);
  // Don't exit immediately, let the app handle it gracefully
});

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Import models (this ensures all models are loaded and associations are set up)
import './models';

// Import routes
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import projectsRoutes from './routes/projects';
import tasksRoutes from './routes/tasks';
import commentsRoutes from './routes/comments';
import timeLogsRoutes from './routes/timeLogs';
import notificationsRoutes from './routes/notifications';
import reportsRoutes from './routes/reports';
import searchRoutes from './routes/search';
import attachmentsRoutes from './routes/attachments';
import dashboardRoutes from './routes/dashboard';
import teamsRoutes from './routes/teams';
import healthRoutes from './routes/health';

const app = express();
const httpServer = createServer(app);

// Database connection state tracking
let isDBConnected = false;
let dbConnectionRetries = 0;
const MAX_DB_RETRIES = 5;

// Database connection wrapper with error handling
const initializeDatabase = async () => {
  try {
    console.log('🔗 Attempting to connect to database...');
    
    // Log all database connection parameters
    console.log('📊 Database Connection Parameters:');
    console.log(`   Host: ${process.env['DB_HOST'] || 'undefined'}`);
    console.log(`   Port: ${process.env['DB_PORT'] || 'undefined'}`);
    console.log(`   Database: ${process.env['DB_NAME'] || 'undefined'}`);
    console.log(`   Username: ${process.env['DB_USER'] || 'undefined'}`);
    console.log(`   Dialect: ${process.env['DB_DIALECT'] || 'undefined'}`);
    console.log(`   Node Environment: ${process.env['NODE_ENV'] || 'undefined'}`);
    console.log(`   Server Port: ${process.env['PORT'] || 'undefined'}`);
    console.log('');
    console.log('🔍 Raw Environment Variables Check:');
    console.log(`   All DB_* vars:`, Object.keys(process.env).filter(key => key.startsWith('DB_')));
    console.log(`   Docker ENV check - DB_HOST exists:`, 'DB_HOST' in process.env);
    console.log(`   Config values being used:`, {
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      user: config.database.user
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    await connectDatabase();
    isDBConnected = true;
    dbConnectionRetries = 0;
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    isDBConnected = false;
    dbConnectionRetries++;
    
    if (dbConnectionRetries < MAX_DB_RETRIES) {
      console.log(`🔄 Retrying database connection (${dbConnectionRetries}/${MAX_DB_RETRIES})...`);
      setTimeout(initializeDatabase, 5000); // Retry after 5 seconds
    } else {
      console.error('❌ Max database connection retries reached. App will continue without database.');
      console.log('⚠️  Routes requiring database will return 503 Service Unavailable');
    }
  }
};

// Initialize database
initializeDatabase();

// Listen for database connection events
process.on('db:connected' as any, () => {
  isDBConnected = true;
  console.log('✅ Database connection state updated: connected');
});

process.on('db:disconnected' as any, () => {
  isDBConnected = false;
  console.log('⚠️  Database connection state updated: disconnected');
});

// Security middleware
app.use(helmet());

// CORS configuration
console.log('🌐 CORS Configuration:');
console.log(`   Allowed Origin: ${config.cors.origin}`);
console.log(`   Environment: ${config.nodeEnv}`);
console.log('');

app.use(cors({
  origin: config.cors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Auth-Token',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['Content-Length', 'X-Requested-With'],
  maxAge: 86400 // 24 hours
}));

// Handle preflight requests
app.options('*', cors());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined'));

// Rate limiting
app.use(rateLimiter);

// Database health check middleware
const dbHealthCheck = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Skip health check endpoint
  if (req.path === '/health') {
    return next();
  }
  
  // Skip test endpoint
  if (req.path === '/api/test') {
    return next();
  }
  
  // Check if database is actually connected for API routes
  if (req.path.startsWith('/api/')) {
    try {
      const isHealthy = await checkDatabaseHealth();
      if (!isHealthy) {
        console.warn(`⚠️  Database health check failed, returning 503 for ${req.method} ${req.path}`);
        return res.status(503).json({
          success: false,
          message: 'Service temporarily unavailable - database connection issue',
          timestamp: new Date().toISOString(),
          retryAfter: 30 // Suggest retry after 30 seconds
        });
      }
    } catch (error) {
      console.error('❌ Database health check error:', error);
      return res.status(503).json({
        success: false,
        message: 'Service temporarily unavailable - database connection issue',
        timestamp: new Date().toISOString(),
        retryAfter: 30
      });
    }
  }
  
  next();
};

// Apply database health check middleware
app.use(dbHealthCheck);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    database: {
      connected: isDBConnected,
      retries: dbConnectionRetries
    }
  });
});

// Test endpoint
app.get('/api/test', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend API is working!',
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  });
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CORS test endpoint',
    data: {
      origin: req.headers.origin,
      corsConfig: config.cors.origin,
      headers: req.headers,
      timestamp: new Date().toISOString()
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/time-logs', timeLogsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/attachments', attachmentsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/health', healthRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Setup Socket.io server
const io = setupSocketServer(httpServer);
setSocketIO(io);

// Start server with port fallback
const startServer = async (initialPort: number) => {
  const tryPort = (port: number): Promise<number> => {
    return new Promise((resolve, reject) => {
      const server = httpServer.listen(port, () => {
        server.close();
        resolve(port);
      });
      
      server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`⚠️  Port ${port} is already in use, trying next port...`);
          reject(err);
        } else {
          reject(err);
        }
      });
    });
  };

  // Try ports starting from initialPort, then increment by 1
  let currentPort = initialPort;
  const maxAttempts = 10;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const availablePort = await tryPort(currentPort);
      httpServer.listen(availablePort, () => {
        console.log(`🚀 Server running on port ${availablePort}`);
        console.log(`📊 Environment: ${config.nodeEnv}`);
        console.log(`🔗 Health check: http://localhost:${availablePort}/health`);
        console.log(`🧪 Test endpoint: http://localhost:${availablePort}/api/test`);
        console.log(`🔌 Socket.io server ready on port ${availablePort}`);
        console.log(`🌐 Server URL: http://localhost:${availablePort}`);
      });
      return;
    } catch (err: any) {
      if (err.code === 'EADDRINUSE') {
        currentPort++;
        if (attempt === maxAttempts) {
          console.error(`❌ Failed to find available port after ${maxAttempts} attempts`);
          console.error(`💡 Try stopping other services or manually specify a port via PORT environment variable`);
          process.exit(1);
        }
      } else {
        console.error('❌ Server startup error:', err);
        process.exit(1);
      }
    }
  }
};

startServer(config.port);

export default app; 