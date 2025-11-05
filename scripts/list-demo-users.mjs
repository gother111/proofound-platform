/**
 * List all demo users with their authentication status
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

async function listDemoUsers() {
  console.log('👥 DEMO USER ACCOUNTS\n');
  console.log('=' .repeat(80));
  
  // Get demo profiles
  const demoHandles = ['sofia-martinez', 'james-chen', 'amara-okafor', 'yuki-tanaka', 'alex-rivera'];
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, handle, display_name')
    .in('handle', demoHandles);
  
  if (profilesError) {
    console.error('❌ Error fetching profiles:', profilesError.message);
    return;
  }
  
  console.log('\n📧 INDIVIDUAL USERS (5):\n');
  
  const userEmails = {
    'sofia-martinez': 'sofia.martinez@proofound-demo.com',
    'james-chen': 'james.chen@proofound-demo.com',
    'amara-okafor': 'amara.okafor@proofound-demo.com',
    'yuki-tanaka': 'yuki.tanaka@proofound-demo.com',
    'alex-rivera': 'alex.rivera@proofound-demo.com',
  };
  
  for (const profile of profiles) {
    const email = userEmails[profile.handle];
    console.log(`${profile.display_name} (@${profile.handle})`);
    console.log(`  Email: ${email}`);
    console.log(`  ID: ${profile.id}`);
    console.log('  Password: [Set during account creation - use password reset if needed]');
    console.log('');
  }
  
  console.log('=' .repeat(80));
  console.log('\n🏢 ORGANIZATION ACCOUNTS (3):\n');
  
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, display_name, slug')
    .in('slug', ['greenpath-ngo', 'skillbridge', 'circularcraft']);
  
  const orgEmails = {
    'greenpath-ngo': 'demo@greenpath-ngo.org',
    'skillbridge': 'demo@skillbridge.tech',
    'circularcraft': 'demo@circularcraft.eu',
  };
  
  if (orgs) {
    for (const org of orgs) {
      const email = orgEmails[org.slug];
      console.log(`${org.display_name} (${org.slug})`);
      console.log(`  Email: ${email}`);
      console.log(`  ID: ${org.id}`);
      console.log('  Password: [Set during account creation - use password reset if needed]');
      console.log('');
    }
  }
  
  console.log('=' .repeat(80));
  console.log('\n💡 TIPS:\n');
  console.log('• All accounts are in your Supabase Auth Dashboard');
  console.log('• Use "Forgot Password" flow to reset any account');
  console.log('• Check DEMO_CREDENTIALS.md for full testing guide');
  console.log('• Suggested test password: Demo2025!Proofound\n');
  console.log('=' .repeat(80));
}

listDemoUsers();

