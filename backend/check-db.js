const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5433,
  database: process.env.DB_NAME || 'project_management',
  user: process.env.DB_USER || 'user',
  password: process.env.DB_PASSWORD || 'user',
});

async function checkDatabase() {
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    // Check if migrations table exists
    const migrationsCheck = await client.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'migrations')");
    console.log('📊 Migrations table exists:', migrationsCheck.rows[0].exists);
    
    if (migrationsCheck.rows[0].exists) {
      const executedMigrations = await client.query('SELECT name, executed_at FROM migrations ORDER BY id');
      console.log('📋 Executed migrations:');
      executedMigrations.rows.forEach(row => console.log('  -', row.name, 'at', row.executed_at));
    }
    
    // Check if activities table exists and its structure
    const activitiesCheck = await client.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'activities')");
    console.log('📊 Activities table exists:', activitiesCheck.rows[0].exists);
    
    if (activitiesCheck.rows[0].exists) {
      const columns = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'activities' ORDER BY ordinal_position");
      console.log('📋 Activities table columns:');
      columns.rows.forEach(row => console.log('  -', row.column_name));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkDatabase();
