/**
 * Check what's in the skills_taxonomy table
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

// Get Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: Missing Supabase credentials');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function main() {
  console.log('🔍 Checking skills_taxonomy table...\n');

  // Check if table exists and has data
  const { data: skills, error } = await supabase
    .from('skills_taxonomy')
    .select('code, slug, name_i18n')
    .limit(10);

  if (error) {
    console.error('❌ Error querying skills_taxonomy:', error.message);
    console.log('\nThe table might not exist or be empty.');
    process.exit(1);
  }

  if (!skills || skills.length === 0) {
    console.log('⚠️  skills_taxonomy table is EMPTY');
    console.log('   You need to seed the taxonomy first!');
    process.exit(1);
  }

  console.log(`✅ Found ${skills.length} skills (showing first 10):\n`);
  skills.forEach(skill => {
    console.log(`  Code: ${skill.code}`);
    console.log(`  Slug: ${skill.slug}`);
    console.log(`  Name: ${JSON.stringify(skill.name_i18n)}`);
    console.log('');
  });

  // Search for specific skills we need
  console.log('\n🔍 Searching for demo user skills...\n');
  
  const searchTerms = [
    'Python',
    'JavaScript',
    'TypeScript',
    'React',
    'Node',
    'PostgreSQL',
    'Figma',
    'UX',
    'UI',
    'User research',
    'Design',
    'Machine learning',
    'Data analysis'
  ];

  for (const term of searchTerms) {
    const { data: matches } = await supabase
      .from('skills_taxonomy')
      .select('code, slug, name_i18n')
      .ilike('slug', `%${term.toLowerCase()}%`)
      .limit(3);

    if (matches && matches.length > 0) {
      console.log(`📌 "${term}" matches:`);
      matches.forEach(m => {
        console.log(`   ${m.code} - ${m.name_i18n?.en || m.slug}`);
      });
    }
  }
}

main();

