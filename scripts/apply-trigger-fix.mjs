/**
 * Apply the assignment trigger fix to Supabase database
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

async function applyFix() {
  console.log('🔧 Applying assignment trigger fix...\n');
  
  const sqlFix = readFileSync(join(__dirname, 'fix-assignment-trigger.sql'), 'utf-8');
  
  const { error } = await supabase.rpc('exec', { sql: sqlFix });
  
  if (error) {
    console.error('❌ Error applying fix:', error.message);
    console.log(
      '\n📋 Do not paste this SQL into the Supabase dashboard for launch evidence. Move the fix into a canonical migration under src/db/migrations/ and rerun npm run db:migrate.\n'
    );
    console.log(sqlFix);
    process.exit(1);
  }
  
  console.log('✅ Trigger fix applied successfully!\n');
  console.log('You can now run: node scripts/add-demo-assignments.mjs\n');
}

applyFix();
