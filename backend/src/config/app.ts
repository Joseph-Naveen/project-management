import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server Configuration
  port: parseInt(process.env['PORT'] || '3001'),
  nodeEnv: process.env['NODE_ENV'] || 'development',
  
  // Database Configuration
  database: {
    host: process.env['DB_HOST'] || 'localhost',
    port: parseInt(process.env['DB_PORT'] || '5432'),
    name: process.env['DB_NAME'] || 'project_management',
    user: process.env['DB_USER'] || 'postgres',
    password: process.env['DB_PASSWORD'] || 'postgres123',
    dialect: process.env['DB_DIALECT'] || 'postgres',
  },
  
  // JWT Configuration
  jwt: {
    secret: process.env['JWT_SECRET'] || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env['JWT_EXPIRES_IN'] || '24h',
    refreshExpiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d',
  },
  
  // File Upload Configuration
  upload: {
    path: process.env['UPLOAD_PATH'] || './uploads',
    maxFileSize: parseInt(process.env['MAX_FILE_SIZE'] || '10485760'),
    allowedFileTypes: process.env['ALLOWED_FILE_TYPES']?.split(',') || [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
  },
  
  // Email Configuration
  email: {
    host: process.env['SMTP_HOST'] || 'smtp.gmail.com',
    port: parseInt(process.env['SMTP_PORT'] || '587'),
    user: process.env['SMTP_USER'] || '',
    pass: process.env['SMTP_PASS'] || '',
    from: process.env['SMTP_FROM'] || 'noreply@projectmanagement.com',
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'), // 15 minutes
    maxRequests: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || process.env['NODE_ENV'] === 'development' ? '1000' : '100'),
  },
  
  // CORS Configuration
  cors: {
    origin: process.env['CORS_ORIGIN'] || 'http://localhost:5173',
  },
  
  // Logging
  logging: {
    level: process.env['LOG_LEVEL'] || 'info',
    file: process.env['LOG_FILE'] || './logs/app.log',
  },
  
  // Redis Configuration
  redis: {
    host: process.env['REDIS_HOST'] || 'localhost',
    port: parseInt(process.env['REDIS_PORT'] || '6379'),
    password: process.env['REDIS_PASSWORD'] || '',
  },
  
  // Security
  security: {
    bcryptRounds: parseInt(process.env['BCRYPT_ROUNDS'] || '12'),
    sessionSecret: process.env['SESSION_SECRET'] || 'your-session-secret-key',
  },
};

export default config; 