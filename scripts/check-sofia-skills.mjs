/**
 * Quick check to see if Sofia's skills have proper codes
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
} catch (err) {
  console.error('Could not load .env.local file');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const SOFIA_ID = '0584f063-58cd-4e1f-a95d-c54c105a7ac0';

async function main() {
  console.log('Checking Sofia skills...\n');

  const { data: skills, error } = await supabase
    .from('skills')
    .select('*')
    .eq('profile_id', SOFIA_ID);

  if (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }

  if (!skills || skills.length === 0) {
    console.log('No skills found for Sofia');
    process.exit(0);
  }

  console.log(`Found ${skills.length} skills:\n`);
  skills.forEach(skill => {
    console.log(`Skill: ${skill.skill_id}`);
    console.log(`  Code: ${skill.skill_code || 'NULL'}`);
    console.log(`  Level: ${skill.level}`);
    console.log('');
  });

  const withCodes = skills.filter(s => s.skill_code !== null).length;
  console.log(`Skills with codes: ${withCodes}/${skills.length}`);
  
  process.exit(0);
}

main();

