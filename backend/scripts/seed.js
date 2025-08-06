const { Client } = require('pg');
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Create Sequelize instance for model creation
const sequelize = new Sequelize(
  process.env.DB_NAME || 'project_management',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433'),
    dialect: 'postgres',
    logging: false
  }
);

// Define User model for proper password hashing
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'password_hash',
  },
  role: {
    type: DataTypes.ENUM('admin', 'manager', 'developer', 'qa'),
    allowNull: false,
    defaultValue: 'developer',
  },
  department: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  jobTitle: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'job_title',
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active',
  },
  isOnline: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_online',
  },
}, {
  tableName: 'users',
  underscored: true, // Use snake_case for database columns
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
  },
});

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5433,
  database: process.env.DB_NAME || 'project_management',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

async function seedDatabase() {
  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    // Create single admin user
    console.log('👥 Creating admin user...');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminPassword) {
      console.error('❌ ADMIN_PASSWORD environment variable is required');
      process.exit(1);
    }

    const adminUser = {
      email: adminEmail,
      name: 'System Administrator',
      password: adminPassword, // Will be hashed by the model hook
      role: 'admin',
      department: 'IT',
      jobTitle: 'System Administrator',
      isActive: true
    };

    try {
      const [user, created] = await User.findOrCreate({
        where: { email: adminUser.email },
        defaults: adminUser
      });
      
      if (created) {
        console.log(`✅ Created admin user: ${adminUser.email}`);
      } else {
        console.log(`✅ Admin user already exists: ${adminUser.email}`);
      }
    } catch (error) {
      console.error(`❌ Error creating admin user:`, error.message);
      process.exit(1);
    }

    console.log('� Database seeding completed successfully!');
    console.log('\n📋 Admin User Created:');
    console.log(`  - ${adminEmail} (System Administrator)`);
    console.log('\n� Use this admin account to log into the system.');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await client.end();
    await sequelize.close();
  }
}

seedDatabase(); 