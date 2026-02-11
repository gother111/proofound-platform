#!/usr/bin/env tsx
import { getMissingPrivacyEnvVars, loadPrivacyEnv } from '../src/lib/testing/privacy-env-loader';

function main() {
  const result = loadPrivacyEnv(process.cwd());

  if (result.source === '.env.test') {
    console.log('Loaded: .env.test');
  } else if (result.source === '.env.local') {
    console.log('Loaded: .env.local (fallback)');
  } else {
    console.log('Loaded: process env only');
  }

  const missing = getMissingPrivacyEnvVars();
  if (missing.length > 0) {
    console.error('Missing required environment variables:');
    for (const key of missing) {
      console.error(`- ${key}`);
    }
    process.exit(1);
  }

  console.log('Privacy env setup check passed.');
}

main();
