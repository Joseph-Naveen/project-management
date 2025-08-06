const { Client } = require('pg');
require('dotenv').config();

async function createDatabaseIfNotExists() {
  // First connect to postgres database to create our target database
  const adminClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5433,
    database: 'postgres', // Connect to default postgres database
    user: process.env.DB_USER || 'user',
    password: process.env.DB_PASSWORD || 'user',
  });

  try {
    console.log('🔗 Connecting to PostgreSQL admin database...');
    await adminClient.connect();
    console.log('✅ Connected to PostgreSQL admin database');

    // Check if database exists
    const result = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [process.env.DB_NAME || 'project_management']
    );

    if (result.rows.length === 0) {
      console.log('📁 Creating database...');
      await adminClient.query(`CREATE DATABASE "${process.env.DB_NAME || 'project_management'}"`);
      console.log('✅ Database created successfully');
    } else {
      console.log('ℹ️  Database already exists');
    }
  } catch (error) {
    console.error('❌ Database creation failed:', error.message);
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Database already exists, continuing...');
    } else {
      throw error;
    }
  } finally {
    await adminClient.end();
  }
}

createDatabaseIfNotExists()
  .then(() => {
    console.log('🎉 Database setup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  });
