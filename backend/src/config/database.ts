import { Sequelize } from 'sequelize';
import config from './app';

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  username: config.database.user,
  password: config.database.password,
  logging: config.nodeEnv === 'development' ? console.log : false,
  pool: {
    max: 20,
    min: 5,
    acquire: 60000,
    idle: 30000,
    evict: 60000
  },
  retry: {
    max: 3,
    backoffBase: 1000,
    backoffExponent: 1.5
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  }
});

export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Set up connection event listeners
    sequelize.addHook('afterConnect', () => {
      console.log('🔗 Database connection active');
      // Emit event for connection state tracking
      process.emit('db:connected' as any);
    });
    
    sequelize.addHook('afterDisconnect', () => {
      console.log('🔌 Database connection lost');
      // Emit event for connection state tracking
      process.emit('db:disconnected' as any);
    });
    
    // Add connection error handling
    sequelize.addHook('afterConnect', (connection: any) => {
      connection.on('error', (err: any) => {
        console.error('🔌 Database connection error:', err);
        process.emit('db:disconnected' as any);
      });
    });
    
    if (config.nodeEnv === 'development') {
      // Handle password column migration safely
      try {
        // Check if password column exists
        const [results] = await sequelize.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'password'
        `) as [any[], any];
        
        if (results.length === 0) {
          // Password column doesn't exist, add it with default value
          console.log('🔧 Adding password column with default value...');
          await sequelize.query(`
            ALTER TABLE "users" 
            ADD COLUMN "password" VARCHAR(255) NOT NULL DEFAULT 'temp_password_${Date.now()}'
          `);
          console.log('✅ Password column added successfully.');
        }
        
        // Now sync the rest of the schema
        await sequelize.sync({ alter: true });
        console.log('✅ Database synchronized.');
      } catch (migrationError) {
        console.error('❌ Migration error:', migrationError);
        console.log('🔄 Attempting alternative migration approach...');
        
        // Alternative approach: drop and recreate for development
        console.log('🗑️  Dropping and recreating users table for clean migration...');
        await sequelize.query('DROP TABLE IF EXISTS users CASCADE');
        await sequelize.sync({ force: true });
        console.log('✅ Database recreated successfully.');
      }
    }
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    console.log('⚠️  Starting server without database connection. Some features may not work.');
    console.log('💡 To set up the database:');
    console.log('   1. Install PostgreSQL');
    console.log('   2. Create database: project_management');
    console.log('   3. Update .env with correct credentials');
    console.log('   4. Run: npm run db:migrate');
  }
};

// Health check function
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    await sequelize.authenticate();
    return true;
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    return false;
  }
};

// Get connection status
export const getConnectionStatus = () => {
  return {
    connected: sequelize.authenticate().then(() => true).catch(() => false),
  };
};

export default sequelize; 