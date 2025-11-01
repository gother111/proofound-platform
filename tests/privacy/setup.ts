/**
 * 🔧 Privacy Tests Setup
 * 
 * This file runs before all privacy tests to:
 * 1. Load environment variables
 * 2. Verify Supabase connection
 * 3. Set up global test utilities
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.test if it exists, otherwise use .env.local
const envPath = resolve(process.cwd(), '.env.test');
const envLocalPath = resolve(process.cwd(), '.env.local');

try {
  config({ path: envPath });
  console.log('✅ Loaded environment from .env.test');
} catch {
  try {
    config({ path: envLocalPath });
    console.log('⚠️  No .env.test found, using .env.local');
    console.log('   Consider creating .env.test for a dedicated test environment');
  } catch {
    console.warn('⚠️  No .env file found. Make sure environment variables are set.');
  }
}

// Verify required environment variables
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\nPlease create a .env.test file with your test Supabase credentials.');
  console.error('See tests/privacy/ENV_SETUP.md for setup instructions.');
  throw new Error('Missing required environment variables for privacy tests');
}

console.log('✅ All required environment variables are set');
console.log(`📍 Test Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);

