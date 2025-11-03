/**
 * Find taxonomy codes for demo user skills
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

const DEMO_SKILLS = {
  sofia: [
    { id: 'ui-ux-design', search: ['UI/UX', 'UX/UI', 'user experience design', 'interface design'] },
    { id: 'user-research', search: ['user research', 'UX research'] },
    { id: 'figma', search: ['figma'] },
    { id: 'product-strategy', search: ['product strategy', 'product management strategy'] },
    { id: 'design-systems', search: ['design systems', 'design system'] },
    { id: 'prototyping', search: ['prototyping', 'prototype'] },
    { id: 'data-visualization', search: ['data visualization', 'data viz'] },
    { id: 'sustainability-design', search: ['sustainability', 'sustainable design'] },
  ],
  james: [
    { id: 'typescript', search: ['typescript'] },
    { id: 'react', search: ['react', 'reactjs', 'react.js'] },
    { id: 'nodejs', search: ['node.js', 'nodejs', 'node'] },
    { id: 'postgresql', search: ['postgresql', 'postgres'] },
    { id: 'system-architecture', search: ['system architecture', 'systems architecture', 'software architecture'] },
    { id: 'payment-systems', search: ['payment systems', 'payment processing'] },
    { id: 'api-design', search: ['API design', 'REST API', 'API development'] },
    { id: 'cloud-infrastructure', search: ['cloud infrastructure', 'cloud computing', 'AWS', 'Azure'] },
    { id: 'web3', search: ['web3', 'blockchain', 'cryptocurrency'] },
  ],
  amara: [
    { id: 'program-management', search: ['program management'] },
    { id: 'community-engagement', search: ['community engagement'] },
    { id: 'impact-measurement', search: ['impact measurement', 'impact assessment'] },
    { id: 'strategic-planning', search: ['strategic planning'] },
    { id: 'stakeholder-management', search: ['stakeholder management'] },
    { id: 'fundraising', search: ['fundraising', 'fund development'] },
    { id: 'monitoring-evaluation', search: ['monitoring evaluation', 'M&E', 'monitoring and evaluation'] },
    { id: 'partnership-development', search: ['partnership development', 'partnerships'] },
  ],
  yuki: [
    { id: 'python', search: ['python programming', 'python'] },
    { id: 'machine-learning', search: ['machine learning', 'ML'] },
    { id: 'data-analysis', search: ['data analysis', 'data analytics'] },
    { id: 'tensorflow', search: ['tensorflow', 'tensor flow'] },
    { id: 'pytorch', search: ['pytorch'] },
    { id: 'statistical-modeling', search: ['statistical modeling', 'statistical analysis'] },
    { id: 'healthcare-analytics', search: ['healthcare analytics', 'health analytics', 'medical analytics'] },
    { id: 'deep-learning', search: ['deep learning'] },
    { id: 'nlp', search: ['NLP', 'natural language processing', 'natural language'] },
  ],
  alex: [
    { id: 'community-organizing', search: ['community organizing', 'community organization'] },
    { id: 'campaign-strategy', search: ['campaign strategy', 'political campaign'] },
    { id: 'public-speaking', search: ['public speaking'] },
    { id: 'fundraising', search: ['fundraising', 'fund development'] },
    { id: 'coalition-building', search: ['coalition building'] },
    { id: 'event-management', search: ['event management', 'event planning'] },
    { id: 'advocacy', search: ['advocacy', 'policy advocacy'] },
    { id: 'digital-organizing', search: ['digital organizing', 'online organizing'] },
  ],
};

async function findSkillCode(searchTerms) {
  for (const term of searchTerms) {
    const { data, error } = await supabase
      .from('skills_taxonomy')
      .select('code, slug, name_i18n')
      .or(`slug.ilike.%${term.toLowerCase().replace(/[.\s]/g, '-')}%,name_i18n->>en.ilike.%${term}%`)
      .limit(5);

    if (!error && data && data.length > 0) {
      return data[0];
    }
  }
  return null;
}

async function main() {
  console.log('🔍 Finding taxonomy codes for all demo user skills...\n');

  const mapping = {};

  for (const [user, skills] of Object.entries(DEMO_SKILLS)) {
    console.log(`\n👤 ${user.toUpperCase()}:`);
    mapping[user] = {};

    for (const skill of skills) {
      const found = await findSkillCode(skill.search);
      if (found) {
        mapping[user][skill.id] = found.code;
        console.log(`  ✅ ${skill.id.padEnd(30)} → ${found.code} (${found.name_i18n?.en})`);
      } else {
        console.log(`  ❌ ${skill.id.padEnd(30)} → NOT FOUND (searched: ${skill.search.join(', ')})`);
      }
    }
  }

  console.log('\n\n📋 FINAL MAPPING (Copy this to seed script):\n');
  console.log('const SKILL_CODE_MAPPING = ' + JSON.stringify(mapping, null, 2) + ';');
}

main();

