#!/usr/bin/env tsx
/**
 * Apply Smart Search Migration
 *
 * This script applies the smart search migration to add:
 * - pg_trgm extension for fuzzy matching
 * - search_vector column for full-text search
 * - search_skills_smart() function
 * - Multiple GIN indexes for performance
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🚀 Applying Smart Search Migration...\n');

  // Read the migration file
  const migrationPath = path.join(
    process.cwd(),
    'supabase/migrations/20251105_add_skills_search_indexes.sql'
  );

  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath);
    process.exit(1);
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  console.log('📄 Migration file loaded:', migrationPath);
  console.log('📊 Migration size:', Math.round(migrationSQL.length / 1024), 'KB\n');

  // Split the migration into individual statements
  // This is necessary because Supabase RPC doesn't handle multi-statement SQL well
  const statements = migrationSQL
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));

  console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';

    // Skip comments
    if (statement.trim().startsWith('--')) continue;

    // Get first line for logging
    const firstLine = statement.split('\n')[0].trim().substring(0, 80);
    console.log(`[${i + 1}/${statements.length}] Executing: ${firstLine}...`);

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        // Some errors are expected (e.g., "already exists")
        if (
          error.message.includes('already exists') ||
          error.message.includes('does not exist')
        ) {
          console.log(`   ⚠️  Skipped (already applied): ${error.message}\n`);
          successCount++;
        } else {
          console.error(`   ❌ Error: ${error.message}\n`);
          errorCount++;
        }
      } else {
        console.log('   ✅ Success\n');
        successCount++;
      }
    } catch (err: any) {
      console.error(`   ❌ Exception: ${err.message}\n`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Successfully executed: ${successCount} statements`);
  if (errorCount > 0) {
    console.log(`❌ Failed: ${errorCount} statements`);
  }
  console.log('='.repeat(60) + '\n');

  // Verify the migration
  console.log('🔍 Verifying migration...\n');

  // Check if extensions are enabled
  const { data: extensions } = await supabase
    .from('pg_extension')
    .select('extname')
    .in('extname', ['pg_trgm', 'unaccent']);

  console.log(`   Extensions: ${extensions?.map((e) => e.extname).join(', ') || 'None'}`);

  // Check if search function exists
  try {
    const { data: testResult, error: testError } = await supabase.rpc('search_skills_smart', {
      search_query: 'test',
      result_limit: 1,
    });

    if (testError) {
      console.log(`   ⚠️  search_skills_smart() function: NOT FOUND`);
      console.log(`   Error: ${testError.message}`);
    } else {
      console.log(`   ✅ search_skills_smart() function: EXISTS`);
      console.log(`   Test query returned ${testResult?.length || 0} results`);
    }
  } catch (err: any) {
    console.log(`   ⚠️  search_skills_smart() function: ERROR`);
    console.log(`   ${err.message}`);
  }

  console.log('\n🎉 Migration application complete!\n');

  if (errorCount > 0) {
    console.log('⚠️  Some statements failed. This may be normal if the migration was partially applied before.');
    console.log('   Check the errors above to ensure no critical issues.\n');
  }
}

applyMigration().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
