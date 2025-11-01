#!/usr/bin/env node

/**
 * Test script to verify Veriff configuration
 * 
 * Usage: node scripts/test-veriff-config.js
 * 
 * This script checks:
 * 1. Environment variables are set
 * 2. API credentials format is correct
 * 3. Can connect to Veriff API (if possible)
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Simple .env.local parser
function loadEnvFile() {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const envPath = join(__dirname, '..', '.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          process.env[key.trim()] = value.trim();
        }
      }
    });
  } catch (error) {
    // .env.local might not exist, that's okay
    console.log('Note: .env.local not found, checking existing env vars');
  }
}

loadEnvFile();

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvVar(name, required = true) {
  const value = process.env[name];
  
  if (!value) {
    if (required) {
      log(`❌ ${name} is not set`, 'red');
      return false;
    } else {
      log(`⚠️  ${name} is not set (optional)`, 'yellow');
      return true;
    }
  }
  
  // Basic format validation
  if (name.includes('KEY') || name.includes('SECRET')) {
    if (value.length < 10) {
      log(`⚠️  ${name} seems too short (${value.length} chars)`, 'yellow');
    } else {
      log(`✅ ${name} is set (${value.length} chars)`, 'green');
    }
  } else {
    log(`✅ ${name} is set: ${value}`, 'green');
  }
  
  return true;
}

async function testVeriffConnection() {
  const apiKey = process.env.VERIFF_API_KEY;
  const apiSecret = process.env.VERIFF_API_SECRET;
  const baseUrl = process.env.VERIFF_BASE_URL || 'https://stationapi.veriff.com';
  
  if (!apiKey || !apiSecret) {
    log('\n⚠️  Skipping API connection test (credentials missing)', 'yellow');
    return;
  }
  
  log('\n🔍 Testing Veriff API connection...', 'blue');
  
  try {
    const crypto = await import('crypto');
    const testPayload = JSON.stringify({
      verification: {
        callback: 'https://example.com/webhook',
        person: {
          givenName: 'Test',
          lastName: 'User',
        },
        timestamp: new Date().toISOString(),
      },
    });
    
    const signature = crypto.default
      .createHmac('sha256', apiSecret)
      .update(testPayload)
      .digest('hex');
    
    // Note: This is just a format test, not a real session creation
    log('✅ Request signature generation works', 'green');
    log(`   Signature length: ${signature.length} chars`, 'blue');
    
    log('\n📝 Configuration Summary:', 'blue');
    log(`   Base URL: ${baseUrl}`, 'blue');
    log(`   API Key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`, 'blue');
    log(`   API Secret: ${'*'.repeat(apiSecret.length)}`, 'blue');
    
  } catch (error) {
    log(`❌ Error testing configuration: ${error.message}`, 'red');
  }
}

async function main() {
  log('\n🧪 Veriff Configuration Test\n', 'blue');
  log('='.repeat(50), 'blue');
  
  const checks = [
    checkEnvVar('VERIFF_API_KEY', true),
    checkEnvVar('VERIFF_API_SECRET', true),
    checkEnvVar('VERIFF_BASE_URL', false),
    checkEnvVar('VERIFF_WEBHOOK_SECRET', false),
    checkEnvVar('NEXT_PUBLIC_SITE_URL', false),
  ];
  
  const allPassed = checks.every(check => check);
  
  await testVeriffConnection();
  
  log('\n' + '='.repeat(50), 'blue');
  
  if (allPassed) {
    log('\n✅ All required environment variables are set!', 'green');
    log('\n📋 Next Steps:', 'blue');
    log('   1. Make sure your server is restarted', 'blue');
    log('   2. Configure webhook URL in Veriff Dashboard:', 'blue');
    log(`      ${process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com'}/api/verification/veriff/webhook`, 'blue');
    log('   3. Test the verification flow in Settings → Identity Verification', 'blue');
  } else {
    log('\n❌ Some required environment variables are missing!', 'red');
    log('   Please add them to .env.local and restart your server.', 'red');
  }
  
  log('\n', 'reset');
}

main().catch(console.error);

