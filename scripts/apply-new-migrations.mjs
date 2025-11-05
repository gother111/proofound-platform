/**
 * Apply new migrations (interviews and fairness_reports tables)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env.local');

try {
  const envFile = readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach((line) => {
    const [key, ...values] = line.split('=');
    if (key && !key.startsWith('#') && values.length > 0) {
      const value = values.join('=').trim().replace(/^["']|["']$/g, '');
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = value;
      }
    }
  });
} catch (err) {
  console.error('⚠️  Could not load .env.local file');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function applyMigrations() {
  console.log('🚀 Applying New Migrations...\n');
  
  const migrations = [
    {
      name: 'interviews table',
      file: join(__dirname, '..', 'drizzle', 'migrations', '20251105195215_add_interviews_table.sql'),
    },
    {
      name: 'fairness_reports table',
      file: join(__dirname, '..', 'drizzle', 'migrations', '20251105195839_add_fairness_reports.sql'),
    },
  ];
  
  for (const migration of migrations) {
    console.log(`📝 Applying: ${migration.name}`);
    
    try {
      const sql = readFileSync(migration.file, 'utf-8');
      
      // Since Supabase client doesn't have a direct SQL execution method,
      // we'll need to use the REST API or PostgreSQL client
      // For now, output the SQL
      console.log('   SQL read successfully');
      console.log(`   ⚠️  Manual application required - see instructions below\n`);
    } catch (err) {
      console.error(`   ❌ Error reading migration: ${err.message}\n`);
    }
  }
  
  console.log('=' .repeat(60));
  console.log('\n🪄 MANUAL MIGRATION REQUIRED\n');
  console.log('Please apply these migrations manually in Supabase Dashboard:\n');
  console.log('1. Go to your Supabase Dashboard → SQL Editor');
  console.log('2. Click "New Query"');
  console.log('3. Copy and paste the SQL from:');
  console.log('   - drizzle/migrations/20251105195215_add_interviews_table.sql');
  console.log('   - drizzle/migrations/20251105195839_add_fairness_reports.sql');
  console.log('4. Run each migration\n');
  console.log('OR run them all at once with this combined SQL:\n');
  
  // Output combined SQL
  console.log('```sql');
  for (const migration of migrations) {
    const sql = readFileSync(migration.file, 'utf-8');
    console.log(sql);
    console.log('');
  }
  console.log('```\n');
  
  console.log('=' .repeat(60));
}

applyMigrations();

