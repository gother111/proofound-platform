/**
 * Broader search for demo skill codes
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
  console.error('⚠️  Could not load .env.local file');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function searchSkills(term) {
  const { data, error } = await supabase
    .from('skills_taxonomy')
    .select('code, slug, name_i18n')
    .ilike('slug', `%${term}%`)
    .limit(10);

  if (!error && data) {
    return data;
  }
  return [];
}

async function main() {
  console.log('🔍 Broad search for demo skills in taxonomy...\n');

  const searches = [
    'design',
    'user',
    'product',
    'program',
    'typescript',
    'react',
    'node',
    'postgres',
    'payment',
    'api',
    'cloud',
    'blockchain',
    'fundrais',
    'campaign',
    'coalition',
    'data',
    'tensorflow',
    'pytorch',
    'deep-learn',
    'nlp',
    'natural-language'
  ];

  for (const term of searches) {
    console.log(`\n📌 Searching for: "${term}"`);
    const results = await searchSkills(term);
    results.forEach(r => {
      console.log(`   ${r.code} | ${r.slug} | ${r.name_i18n?.en || ''}`);
    });
  }
}

main();

