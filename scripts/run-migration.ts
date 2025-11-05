#!/usr/bin/env tsx
/**
 * Run Smart Search Migration
 *
 * Applies the smart search migration directly to PostgreSQL
 */

import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: path.join(process.cwd(), '.env.local') });

async function runMigration() {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.error('   Make sure your .env.local file is configured');
    process.exit(1);
  }

  console.log('\n' + '='.repeat(70));
  console.log('🚀 APPLYING SMART SEARCH MIGRATION');
  console.log('='.repeat(70) + '\n');

  const migrationPath = path.join(
    process.cwd(),
    'supabase/migrations/20251105_add_skills_search_indexes.sql'
  );

  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath);
    process.exit(1);
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  console.log('✅ Migration file loaded');
  console.log('📄 File:', path.basename(migrationPath));
  console.log('📏 Size:', Math.round(migrationSQL.length / 1024), 'KB');
  console.log('📝 Lines:', migrationSQL.split('\n').length);
  console.log('');

  // Create PostgreSQL client
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected\n');

    console.log('⚙️  Executing migration SQL...');
    console.log('   This may take a minute...\n');

    await client.query(migrationSQL);

    console.log('✅ Migration executed successfully!\n');

    // Verify the migration
    console.log('🔍 Verifying migration...\n');

    // Check for extensions
    const extResult = await client.query(`
      SELECT extname FROM pg_extension
      WHERE extname IN ('pg_trgm', 'unaccent')
      ORDER BY extname
    `);
    console.log(`   📦 Extensions installed: ${extResult.rows.map(r => r.extname).join(', ')}`);

    // Check for search_vector column
    const colResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'skills_taxonomy'
      AND column_name = 'search_vector'
    `);
    console.log(`   📋 search_vector column: ${colResult.rows.length > 0 ? '✅ EXISTS' : '❌ NOT FOUND'}`);

    // Check for indexes
    const idxResult = await client.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'skills_taxonomy'
      AND indexname LIKE 'idx_skills_taxonomy_%'
      ORDER BY indexname
    `);
    console.log(`   🔍 Indexes created: ${idxResult.rows.length} indexes`);
    idxResult.rows.forEach(r => {
      console.log(`      - ${r.indexname}`);
    });

    // Check for search function
    const funcResult = await client.query(`
      SELECT proname
      FROM pg_proc
      WHERE proname = 'search_skills_smart'
    `);
    console.log(`   ⚙️  search_skills_smart(): ${funcResult.rows.length > 0 ? '✅ EXISTS' : '❌ NOT FOUND'}`);

    // Test the search function
    if (funcResult.rows.length > 0) {
      console.log('\n   🧪 Testing search function...');
      const testResult = await client.query(`
        SELECT COUNT(*) as count
        FROM search_skills_smart('python', 5)
      `);
      console.log(`   ✅ Test successful - returned ${testResult.rows[0].count} results`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('🎉 MIGRATION COMPLETE!');
    console.log('='.repeat(70) + '\n');

    console.log('✨ What\'s enabled now:');
    console.log('   ✓ Fuzzy search (typo-tolerant)');
    console.log('   ✓ Partial matching');
    console.log('   ✓ Full-text search with stemming');
    console.log('   ✓ Smart relevance ranking\n');

    console.log('🚀 Next steps:');
    console.log('   1. Restart your application (if running)');
    console.log('   2. Go to Expertise tab → Add manually → Quick Search');
    console.log('   3. Try searching: "python", "pythn", "react", "prog"\n');

  } catch (error: any) {
    console.error('\n❌ Migration failed!\n');
    console.error('Error:', error.message);

    if (error.message.includes('already exists')) {
      console.log('\n⚠️  This error usually means the migration was already applied.');
      console.log('   The search feature should already be working!\n');
    } else if (error.message.includes('permission denied')) {
      console.log('\n⚠️  Permission denied - make sure DATABASE_URL uses the correct credentials');
      console.log('   You may need to use the Supabase service role credentials\n');
    } else {
      console.log('\n💡 Try applying the migration manually:');
      console.log('   1. Go to Supabase Dashboard → SQL Editor');
      console.log('   2. Copy content from: supabase/migrations/20251105_add_skills_search_indexes.sql');
      console.log('   3. Paste and run\n');
    }

    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
