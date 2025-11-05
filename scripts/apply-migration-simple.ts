#!/usr/bin/env tsx
/**
 * Apply Smart Search Migration via Supabase SQL
 *
 * Since Supabase doesn't support direct SQL execution via the client library,
 * this script outputs the SQL that needs to be run in the Supabase Dashboard
 */

import * as fs from 'fs';
import * as path from 'path';

console.log('\n' + '='.repeat(70));
console.log('📋 SMART SEARCH MIGRATION - MANUAL APPLICATION REQUIRED');
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

console.log('✅ Migration file loaded successfully\n');
console.log('📊 File:', migrationPath);
console.log('📏 Size:', Math.round(migrationSQL.length / 1024), 'KB');
console.log('📝 Lines:', migrationSQL.split('\n').length, '\n');

console.log('='.repeat(70));
console.log('🔧 HOW TO APPLY THIS MIGRATION');
console.log('='.repeat(70) + '\n');

console.log('Option 1: Using Supabase Dashboard (RECOMMENDED)');
console.log('   1. Go to: https://supabase.com/dashboard/project/cjpfrgmsxwxhuomnvciq');
console.log('   2. Navigate to: SQL Editor');
console.log('   3. Click: + New query');
console.log('   4. Copy the SQL from: supabase/migrations/20251105_add_skills_search_indexes.sql');
console.log('   5. Paste and click: Run\n');

console.log('Option 2: Using psql command line');
console.log('   Run this command:');
console.log('   psql "$DATABASE_URL" -f supabase/migrations/20251105_add_skills_search_indexes.sql\n');

console.log('Option 3: Copy SQL to clipboard (macOS)');
console.log('   Run this command:');
console.log('   cat supabase/migrations/20251105_add_skills_search_indexes.sql | pbcopy\n');

console.log('='.repeat(70));
console.log('✨ WHAT THIS MIGRATION DOES');
console.log('='.repeat(70) + '\n');

console.log('Creates:');
console.log('   ✓ pg_trgm extension (fuzzy matching)');
console.log('   ✓ unaccent extension (accent handling)');
console.log('   ✓ search_vector column (full-text search)');
console.log('   ✓ 5 GIN indexes for fast searching');
console.log('   ✓ search_skills_smart() function (smart search)\n');

console.log('Enables:');
console.log('   ✓ Typo-tolerant search ("pythn" → "Python")');
console.log('   ✓ Partial matching ("prog" → "programming")');
console.log('   ✓ Fuzzy similarity matching');
console.log('   ✓ Full-text search with stemming\n');

console.log('='.repeat(70));
console.log('🚀 AFTER APPLYING THE MIGRATION');
console.log('='.repeat(70) + '\n');

console.log('1. Restart your application (npm run dev)');
console.log('2. Test the search in Expertise tab → Add manually → Quick Search');
console.log('3. Try searches: "python", "pythn", "react", "prog"\n');

console.log('='.repeat(70) + '\n');

// Offer to display the SQL
console.log('Would you like to see the SQL? It\'s in:');
console.log(`   ${migrationPath}\n`);
