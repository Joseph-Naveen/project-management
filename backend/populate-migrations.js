const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5433,
  database: process.env.DB_NAME || 'project_management',
  user: process.env.DB_USER || 'user',
  password: process.env.DB_PASSWORD || 'user',
});

async function populateMigrationsTable() {
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    // Get all migration files except the new one
    const migrationsDir = path.join(__dirname, 'db/migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .filter(file => !file.includes('011_add_updated_at_to_activities')) // Exclude our new migration
      .sort();

    console.log(`📁 Found ${migrationFiles.length} existing migration files to mark as executed`);

    // Mark existing migrations as executed
    for (const file of migrationFiles) {
      await client.query(
        'INSERT INTO migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
        [file]
      );
      console.log(`✅ Marked ${file} as executed`);
    }

    console.log('🎉 Migrations table populated successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

populateMigrationsTable();
