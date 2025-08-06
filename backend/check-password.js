const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5433,
  database: process.env.DB_NAME || 'project_management',
  user: process.env.DB_USER || 'user',
  password: process.env.DB_PASSWORD || 'user',
});

async function checkPassword() {
  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Get all users to see what's in the database
    console.log('🔍 Checking all users in database...');
    const allUsersResult = await client.query('SELECT email, role FROM users LIMIT 10');
    console.log('📊 Total users found:', allUsersResult.rows.length);
    
    if (allUsersResult.rows.length > 0) {
      console.log('👥 Users in database:');
      allUsersResult.rows.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.email} (${user.role})`);
      });
    } else {
      console.log('❌ No users found in database at all!');
      console.log('💡 You may need to run the seeding script: npm run db:seed');
      await client.end();
      return;
    }

    // Get the admin user
    console.log('\n🔍 Checking admin user...');
    const result = await client.query(
      'SELECT email, role, password_hash FROM users WHERE email = $1',
      ['admin@example.com']
    );

    if (result.rows.length === 0) {
      console.log('❌ No user found with email: admin@example.com');
      return;
    }

    const user = result.rows[0];
    console.log('👤 User found:');
    console.log('  - Email:', user.email);
    console.log('  - Role:', user.role);
    console.log('  - Has password hash:', !!user.password_hash);
    console.log('  - Password hash length:', user.password_hash?.length);
    console.log('  - Password hash starts with:', user.password_hash?.substring(0, 10) + '...');

    // Test password verification
    console.log('\n🔐 Testing password verification...');
    const testPassword = 'password123';
    console.log('  - Testing password:', testPassword);
    
    if (user.password_hash) {
      const isValid = await bcrypt.compare(testPassword, user.password_hash);
      console.log('  - Password verification result:', isValid ? '✅ VALID' : '❌ INVALID');
      
      if (!isValid) {
        console.log('\n🔄 Testing if password needs rehashing...');
        // Test if it's using a different bcrypt rounds
        try {
          const rounds = bcrypt.getRounds(user.password_hash);
          console.log('  - Current hash rounds:', rounds);
          console.log('  - Expected rounds (from config):', process.env.BCRYPT_ROUNDS || 12);
        } catch (err) {
          console.log('  - Error getting rounds:', err.message);
        }
        
        // Try creating a new hash to compare
        console.log('\n🧪 Creating test hash...');
        const newHash = await bcrypt.hash(testPassword, 12);
        console.log('  - New hash:', newHash.substring(0, 20) + '...');
        const testValid = await bcrypt.compare(testPassword, newHash);
        console.log('  - New hash verification:', testValid ? '✅ WORKS' : '❌ BROKEN');
      }
    } else {
      console.log('❌ No password hash found!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

checkPassword();
