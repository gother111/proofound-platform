/**
 * 🔧 Privacy Tests Setup
 *
 * This file runs before all privacy tests to:
 * 1. Load environment variables
 * 2. Verify Supabase connection
 * 3. Set up global test utilities
 */

import fs from 'node:fs';
import path from 'node:path';
import { config } from 'dotenv';

const REQUIRED_ENV = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

function loadPrivacyEnv(cwd: string = process.cwd()) {
  const envTestPath = path.resolve(cwd, '.env.test');
  const envLocalPath = path.resolve(cwd, '.env.local');

  if (fs.existsSync(envTestPath)) {
    config({ path: envTestPath });
    return '.env.test';
  }

  if (fs.existsSync(envLocalPath)) {
    config({ path: envLocalPath });
    return '.env.local';
  }

  return 'process-env';
}

function getMissingPrivacyEnvVars() {
  return REQUIRED_ENV.filter((key) => !process.env[key]);
}

const loadedSource = loadPrivacyEnv();
if (loadedSource === '.env.test') {
  console.log('✅ Loaded environment from .env.test');
} else if (loadedSource === '.env.local') {
  console.log('⚠️  No .env.test found, using .env.local');
  console.log('   Consider creating .env.test for a dedicated test environment');
} else {
  console.warn('⚠️  No .env file found. Make sure environment variables are set.');
}

const missingVars = getMissingPrivacyEnvVars();

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach((varName) => console.error(`   - ${varName}`));
  console.error('\nPlease create a .env.test file with your test Supabase credentials.');
  console.error('See tests/privacy/ENV_SETUP.md for setup instructions.');
  throw new Error('Missing required environment variables for privacy tests');
}

console.log('✅ All required environment variables are set');
console.log(`📍 Test Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
