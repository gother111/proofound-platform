/**
 * Simple test to insert an assignment
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

console.log('Using URL:', supabaseUrl);
console.log('Service key present:', !!serviceRoleKey);

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function main() {
  // Get greenpath org
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', 'greenpath-ngo')
    .single();
  
  console.log('GreenPath org ID:', org?.id);
  
  if (!org) {
    console.error('Could not find organization');
    return;
  }
  
  console.log('\nAttempting to insert assignment...\n');
  
  const { data, error } = await supabase
    .from('assignments')
    .insert({
      org_id: org.id,
      role: 'Test Assignment',
      description: 'This is a test',
      status: 'draft',
    })
    .select();
  
  if (error) {
    console.error('Error:', error);
    console.error('\nDetailed error:', JSON.stringify(error, null, 2));
  } else {
    console.log('Success!', data);
  }
}

main();

