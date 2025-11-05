/**
 * Critical Gaps Migration Runner
 * Executes migrations-to-run.sql against Supabase database
 */

import { readFileSync } from 'fs';
import pg from 'pg';
import { config } from 'dotenv';

config({ path: '.env.local' });

const { Client } = pg;

async function runMigrations() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔄 Connecting to Supabase database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    console.log('📖 Reading migrations-to-run.sql...');
    const migrationSQL = readFileSync('./migrations-to-run.sql', 'utf8');
    
    console.log('🚀 Executing migrations...\n');
    console.log('Creating tables:');
    console.log('  - interviews (Gap 1: Interview Scheduling)');
    console.log('  - fairness_reports (Gap 3: Fairness Reporting)');
    console.log('  - matching_profiles (Gap 5: Matching Profile Editor)\n');
    
    const result = await client.query(migrationSQL);
    
    console.log('✅ Migrations completed successfully!\n');
    
    // Show results
    if (result.rows && result.rows.length > 0) {
      console.log('📊 Verification Results:');
      console.table(result.rows);
    }
    
    console.log('\n🎉 All critical gaps database tables created!');
    console.log('\n✨ Next steps:');
    console.log('  1. Set environment variables for Zoom/Google Meet');
    console.log('  2. Test the new features');
    console.log('  3. Review CRITICAL_GAPS_IMPLEMENTATION_COMPLETE.md');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.error('\n🔍 Database connection issue detected.');
      console.error('Your Supabase project may be paused (free tier auto-pauses after 7 days).');
      console.error('\n📝 To fix:');
      console.error('  1. Go to: https://supabase.com/dashboard/project/cjpfrgmsxwxhuomnvciq');
      console.error('  2. Click "Resume Project" if paused');
      console.error('  3. Wait 30 seconds for project to wake up');
      console.error('  4. Run this script again: node run-critical-gaps-migrations.mjs');
    } else if (error.code === '42P07') {
      console.error('\n✅ Tables already exist! This is okay.');
      console.error('Your migrations were previously applied successfully.');
    } else {
      console.error('\nFull error:', error);
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();

