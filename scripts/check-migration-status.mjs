/**
 * Check if migrations have been applied to the database
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

async function checkMigrations() {
  console.log('🔍 Checking Migration Status...\n');
  
  // Check interviews table
  console.log('📅 INTERVIEWS TABLE:');
  const { data: interviews, error: interviewsError } = await supabase
    .from('interviews')
    .select('*')
    .limit(1);
  
  if (interviewsError) {
    console.log('  ❌ Not migrated:', interviewsError.message);
  } else {
    console.log('  ✅ Migrated and accessible');
    console.log('  📊 Records:', interviews?.length || 0);
  }
  
  // Check fairness_reports table
  console.log('\n📊 FAIRNESS_REPORTS TABLE:');
  const { data: reports, error: reportsError } = await supabase
    .from('fairness_reports')
    .select('*')
    .limit(1);
  
  if (reportsError) {
    console.log('  ❌ Not migrated:', reportsError.message);
  } else {
    console.log('  ✅ Migrated and accessible');
    console.log('  📊 Records:', reports?.length || 0);
  }
  
  // Check skills_taxonomy table (important for matching)
  console.log('\n🔤 SKILLS_TAXONOMY TABLE:');
  const { data: taxonomy, error: taxonomyError, count } = await supabase
    .from('skills_taxonomy')
    .select('*', { count: 'exact', head: false })
    .limit(1);
  
  if (taxonomyError) {
    console.log('  ❌ Error:', taxonomyError.message);
  } else {
    console.log('  ✅ Accessible');
    
    // Get count
    const { count } = await supabase
      .from('skills_taxonomy')
      .select('*', { count: 'exact', head: true });
    
    console.log(`  📊 Total skills in taxonomy: ${count || 'unknown'}`);
    
    if (count && count > 15000) {
      console.log('  ✅ Full 20K taxonomy appears to be loaded');
    } else if (count && count > 0) {
      console.log(`  ⚠️  Only ${count} skills found (expected ~18,708)`);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  
  const migrationsNeeded = [];
  if (interviewsError) migrationsNeeded.push('interviews');
  if (reportsError) migrationsNeeded.push('fairness_reports');
  
  if (migrationsNeeded.length === 0) {
    console.log('\n✅ ALL MIGRATIONS APPLIED\n');
  } else {
    console.log('\n⚠️  MIGRATIONS NEEDED:\n');
    migrationsNeeded.forEach(table => {
      console.log(`  - ${table}`);
    });
    console.log('\n📝 To apply migrations, run:');
    console.log('   node scripts/run-migrations.mjs\n');
  }
}

checkMigrations();

