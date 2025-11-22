/**
 * Migration Runner Script
 * 
 * Runs all pending database migrations
 * Usage: node run-migrations.mjs
 */

import { readFileSync } from 'fs';
import pg from 'pg';
import { config } from 'dotenv';
import dns from 'dns';

// Force IPv4
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

// Load environment variables
config({ path: '.env.local' });

const { Client } = pg;

async function runMigrations() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    connectionString: process.env.DATABASE_URL,
    // ssl: { rejectUnauthorized: false } // Disabled for local docker
  });

  try {
    console.log('🔄 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Read migration file
    console.log('📖 Reading migration script...');
    const migrationSQL = readFileSync('./migrations-to-run.sql', 'utf8');

    console.log('🚀 Running migrations...\n');
    const result = await client.query(migrationSQL);

    console.log('✅ Migrations completed successfully!\n');

    // Verify tables
    console.log('🔍 Verifying tables...');
    const verifyQuery = `
      SELECT 
        table_name,
        EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t.table_name) as exists
      FROM (
        VALUES 
          ('self_assessments'),
          ('work_schedules'),
          ('dashboard_layouts'),
          ('individual_profiles'),
          ('matches')
      ) AS t(table_name);
    `;

    const verification = await client.query(verifyQuery);
    console.table(verification.rows);

    console.log('\n🎉 All migrations applied successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();

