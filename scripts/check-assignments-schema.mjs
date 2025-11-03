/**
 * Check assignments table schema
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

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
} catch (err) {}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function main() {
  console.log('🔍 Checking assignments table schema...\n');
  
  // Try to get table info from information_schema
  const { data, error } = await supabase
    .rpc('exec_sql', {
      query: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'assignments'
        ORDER BY ordinal_position;
      `
    });
  
  if (error) {
    console.log('RPC not available, trying direct query...\n');
    
    // Try inserting a minimal assignment to see what error we get
    const { error: insertError } = await supabase
      .from('assignments')
      .insert({
        org_id: '00000000-0000-0000-0000-000000000000',
        role: 'Test Role',
      })
      .select();
    
    console.log('Insert error:', insertError);
    console.log('\nFull error:', JSON.stringify(insertError, null, 2));
  } else {
    console.log('Schema:', data);
  }
}

main();

