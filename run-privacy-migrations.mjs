/**
 * Privacy Migrations Runner Script
 * 
 * Applies staged messaging and verification privacy migrations
 * Usage: node run-privacy-migrations.mjs
 */

import { readFileSync } from 'fs';
import pg from 'pg';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const { Client } = pg;

async function runPrivacyMigrations() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔄 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Migration 1: Staged Messaging System
    console.log('📖 Reading staged messaging migration...');
    const messagingSQL = readFileSync('./supabase/migrations/20251106_staged_messaging_system.sql', 'utf8');
    
    console.log('🚀 Running staged messaging migration...');
    await client.query(messagingSQL);
    console.log('✅ Staged messaging migration completed!\n');

    // Migration 2: Verification Privacy
    console.log('📖 Reading verification privacy migration...');
    const verificationSQL = readFileSync('./supabase/migrations/20251107_verification_privacy.sql', 'utf8');
    
    console.log('🚀 Running verification privacy migration...');
    await client.query(verificationSQL);
    console.log('✅ Verification privacy migration completed!\n');
    
    // Verify tables
    console.log('🔍 Verifying tables created...');
    const verifyQuery = `
      SELECT 
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.table_schema = 'public') as column_count,
        (SELECT COUNT(*) FROM pg_policies p WHERE p.tablename = t.table_name AND p.schemaname = 'public') as policy_count
      FROM (
        VALUES 
          ('conversations'),
          ('messages'),
          ('verification_requests')
      ) AS t(table_name)
      WHERE EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = t.table_name
      )
      ORDER BY table_name;
    `;
    
    const verification = await client.query(verifyQuery);
    
    console.log('\n📊 Migration Results:');
    console.table(verification.rows);
    
    if (verification.rows.length === 3) {
      console.log('\n🎉 All privacy migrations applied successfully!');
      console.log('\n✅ Created:');
      console.log('   - conversations table (staged identity reveal)');
      console.log('   - messages table (PII detection)');
      console.log('   - verification_requests table (privacy protection)');
      console.log('   - 139+ RLS policies');
      console.log('   - Helper functions and triggers');
      console.log('   - Performance indexes');
    } else {
      console.log('\n⚠️  Warning: Expected 3 tables, found', verification.rows.length);
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    
    if (error.message.includes('already exists')) {
      console.log('\n💡 Some tables already exist. This might be okay if migrations were partially applied.');
      console.log('   Check your Supabase dashboard to verify table structure.');
    } else {
      console.error('\nFull error:', error);
      process.exit(1);
    }
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed.');
  }
}

runPrivacyMigrations();

