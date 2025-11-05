/**
 * Reset all demo account passwords to a standard test password
 * Uses Supabase Admin API to directly update passwords
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

// Create admin client with service role
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Standard test password for all demo accounts
const TEST_PASSWORD = 'Demo2025!Proofound';

const demoAccounts = [
  { email: 'sofia.martinez@proofound-demo.com', name: 'Sofia Martinez' },
  { email: 'james.chen@proofound-demo.com', name: 'James Chen' },
  { email: 'amara.okafor@proofound-demo.com', name: 'Amara Okafor' },
  { email: 'yuki.tanaka@proofound-demo.com', name: 'Yuki Tanaka' },
  { email: 'alex.rivera@proofound-demo.com', name: 'Alex Rivera' },
  { email: 'demo@greenpath-ngo.org', name: 'GreenPath NGO' },
  { email: 'demo@skillbridge.tech', name: 'SkillBridge' },
  { email: 'demo@circularcraft.eu', name: 'CircularCraft' },
];

async function resetPassword(email, name) {
  try {
    // Get user by email
    const { data: users, error: getUserError } = await supabase.auth.admin.listUsers();
    
    if (getUserError) {
      console.log(`   ❌ ${name}: Could not list users - ${getUserError.message}`);
      return false;
    }
    
    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      console.log(`   ❌ ${name}: User not found`);
      return false;
    }
    
    // Update user password using admin API
    const { data, error } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: TEST_PASSWORD }
    );
    
    if (error) {
      console.log(`   ❌ ${name}: ${error.message}`);
      return false;
    }
    
    console.log(`   ✅ ${name} (${email})`);
    return true;
    
  } catch (err) {
    console.log(`   ❌ ${name}: ${err.message}`);
    return false;
  }
}

async function resetAllPasswords() {
  console.log('🔐 RESETTING DEMO ACCOUNT PASSWORDS\n');
  console.log('=' .repeat(80));
  console.log(`\n🔑 New Password: ${TEST_PASSWORD}\n`);
  console.log('=' .repeat(80));
  console.log('\n📝 Processing accounts...\n');
  
  let successful = 0;
  let failed = 0;
  
  for (const account of demoAccounts) {
    const success = await resetPassword(account.email, account.name);
    if (success) {
      successful++;
    } else {
      failed++;
    }
  }
  
  console.log('\n' + '=' .repeat(80));
  console.log(`\n✅ Successfully reset: ${successful}/${demoAccounts.length} accounts`);
  
  if (failed > 0) {
    console.log(`❌ Failed: ${failed} accounts\n`);
  }
  
  console.log('\n📋 SUMMARY:\n');
  console.log('All demo accounts now have the password:');
  console.log(`  ${TEST_PASSWORD}\n`);
  console.log('You can now login to any demo account using:');
  console.log('  • Email: [any demo email from DEMO_CREDENTIALS.md]');
  console.log(`  • Password: ${TEST_PASSWORD}\n`);
  console.log('=' .repeat(80));
}

resetAllPasswords();

