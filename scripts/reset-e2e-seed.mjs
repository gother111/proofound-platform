#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadEnvFile(fileName) {
  const envPath = join(__dirname, '..', fileName);
  try {
    const envFile = readFileSync(envPath, 'utf-8');
    envFile.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        return;
      }

      const [key, ...values] = trimmed.split('=');
      if (!key || values.length === 0 || process.env[key]) {
        return;
      }

      process.env[key] = values.join('=').trim().replace(/^['"]|['"]$/g, '');
    });
  } catch {
    // Ignore missing env files.
  }
}

loadEnvFile('.env.test');
loadEnvFile('.env.local');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    'Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const seedEmails = [
  process.env.E2E_INDIVIDUAL_EMAIL,
  process.env.E2E_ORG_EMAIL,
].filter(Boolean);

if (seedEmails.length === 0) {
  console.log('No E2E seed emails configured. Nothing to reset.');
  process.exit(0);
}

async function findUserIdsByEmail(emails) {
  const ids = [];
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      throw new Error(`Failed to list auth users: ${error.message}`);
    }

    const users = data?.users || [];
    if (users.length === 0) {
      break;
    }

    users.forEach((user) => {
      if (user.email && emails.includes(user.email)) {
        ids.push(user.id);
      }
    });

    if (users.length < 200) {
      break;
    }

    page += 1;
  }

  return Array.from(new Set(ids));
}

async function main() {
  const userIds = await findUserIdsByEmail(seedEmails);

  if (userIds.length === 0) {
    console.log('No matching E2E users found.');
    return;
  }

  const { error: snippetsError } = await supabase.from('profile_snippets').delete().in('user_id', userIds);
  if (snippetsError) {
    throw new Error(`Failed to delete profile_snippets: ${snippetsError.message}`);
  }

  console.log(`Reset complete. Removed profile snippets for ${userIds.length} seeded users.`);
}

main().catch((error) => {
  console.error('E2E reset failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
