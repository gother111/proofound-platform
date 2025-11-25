#!/usr/bin/env node
/**
 * Reset Demo User Passwords
 * Sets a known password for demo accounts for testing
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
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
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create admin client
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const DEMO_PASSWORD = 'Demo2025!Proofound';

const DEMO_USERS = [
  'sofia.martinez@proofound-demo.com',
  'james.chen@proofound-demo.com',
  'amara.okafor@proofound-demo.com',
  'yuki.tanaka@proofound-demo.com',
  'alex.rivera@proofound-demo.com',
  'demo@circularcraft.eu',
  'demo@greenpath-ngo.org',
  'demo@skillbridge.tech',
];

async function resetPasswords() {
  console.log('🔐 Resetting demo user passwords...\n');

  for (const email of DEMO_USERS) {
    try {
      // Get user by email
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();
      
      if (listError) {
        console.error(`❌ Error listing users: ${listError.message}`);
        continue;
      }

      const user = users.users.find(u => u.email === email);
      
      if (!user) {
        console.log(`⚠️  User not found: ${email}`);
        continue;
      }

      // Update user password
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: DEMO_PASSWORD }
      );

      if (updateError) {
        console.error(`❌ Failed to update ${email}: ${updateError.message}`);
      } else {
        console.log(`✅ Password reset for: ${email}`);
      }
    } catch (err) {
      console.error(`❌ Error processing ${email}:`, err.message);
    }
  }

  console.log(`\n🎉 Done! Demo password: ${DEMO_PASSWORD}`);
}

resetPasswords();
