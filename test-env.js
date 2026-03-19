// Simple test script to check environment variables and basic setup
require('dotenv').config();

console.log('🔍 Environment Variables Check:');
console.log('================================');

const requiredEnvVars = [
  'NODE_ENV',
  'APP_PORT',
  'APP_NAME',
  'API_PREFIX',
  'DB_HOST',
  'DB_PORT',
  'DB_USERNAME',
  'DB_PASSWORD',
  'DB_DATABASE',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET'
];

let missingVars = [];

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    missingVars.push(varName);
    console.log(`❌ ${varName}: MISSING`);
  } else {
    // Hide sensitive values
    const displayValue = varName.includes('SECRET') || varName.includes('PASSWORD') 
      ? '***HIDDEN***' 
      : value;
    console.log(`✅ ${varName}: ${displayValue}`);
  }
});

console.log('\n📋 Summary:');
if (missingVars.length > 0) {
  console.log(`❌ Missing ${missingVars.length} required environment variables:`);
  missingVars.forEach(varName => console.log(`   - ${varName}`));
  process.exit(1);
} else {
  console.log('✅ All required environment variables are present');
}

// Test database connection
console.log('\n🔍 Testing Database Connection:');
const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

client.connect()
  .then(() => {
    console.log('✅ Database connection successful');
    return client.query('SELECT version()');
  })
  .then(result => {
    console.log('✅ Database query successful');
    console.log(`   PostgreSQL version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);
    return client.end();
  })
  .then(() => {
    console.log('✅ Database connection closed');
    console.log('\n🎉 All checks passed!');
  })
  .catch(error => {
    console.log('❌ Database connection failed:');
    console.log(`   Error: ${error.message}`);
    console.log(`   Code: ${error.code}`);
    process.exit(1);
  });