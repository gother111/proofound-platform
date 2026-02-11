#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnvFile(fileName) {
  const envPath = path.join(__dirname, '..', fileName);
  if (!fs.existsSync(envPath)) {
    return false;
  }

  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    if (!key || rest.length === 0) continue;
    if (process.env[key]) continue;
    process.env[key] = rest.join('=').trim().replace(/^['"]|['"]$/g, '');
  }

  return true;
}

loadEnvFile('.env.test') || loadEnvFile('.env.local');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const users = [
  {
    key: 'individual',
    email: process.env.E2E_INDIVIDUAL_EMAIL,
    password: process.env.E2E_INDIVIDUAL_PASSWORD,
    profile: {
      persona: 'individual',
      handle: 'e2e-individual',
      display_name: 'E2E Individual',
    },
    individualProfile: {
      headline: 'E2E profile for critical token-share flow',
      bio: 'Seeded by scripts/seed-e2e-users.mjs',
      location: 'Stockholm',
      verified: true,
    },
  },
  {
    key: 'organization',
    email: process.env.E2E_ORG_EMAIL,
    password: process.env.E2E_ORG_PASSWORD,
    profile: {
      persona: 'org_member',
      handle: 'e2e-org-admin',
      display_name: 'E2E Organization Admin',
    },
  },
];

function requireValue(name, value) {
  if (!value) {
    throw new Error(`Missing required env value: ${name}`);
  }
}

async function ensureAuthUser(supabase, email, password) {
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw new Error(`listUsers failed: ${error.message}`);

  const existing = data.users.find((user) => user.email === email);
  if (existing) {
    const { error: updateError } = await supabase.auth.admin.updateUserById(existing.id, {
      email,
      password,
      email_confirm: true,
    });
    if (updateError) throw new Error(`updateUserById failed (${email}): ${updateError.message}`);
    return existing.id;
  }

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    throw new Error(`createUser failed (${email}): ${createError?.message || 'unknown'}`);
  }

  return created.user.id;
}

async function ensureProfileRows(supabase, userId, entry) {
  const nowIso = new Date().toISOString();

  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      id: userId,
      persona: entry.profile.persona,
      handle: entry.profile.handle,
      display_name: entry.profile.display_name,
      created_at: nowIso,
      updated_at: nowIso,
    },
    { onConflict: 'id' }
  );

  if (profileError) {
    throw new Error(`profiles upsert failed (${entry.key}): ${profileError.message}`);
  }

  if (entry.individualProfile) {
    const { error: individualError } = await supabase.from('individual_profiles').upsert(
      {
        user_id: userId,
        ...entry.individualProfile,
      },
      { onConflict: 'user_id' }
    );

    if (individualError) {
      throw new Error(`individual_profiles upsert failed (${entry.key}): ${individualError.message}`);
    }
  }
}

async function main() {
  requireValue('NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL', supabaseUrl);
  requireValue('SUPABASE_SERVICE_ROLE_KEY', serviceRoleKey);

  for (const entry of users) {
    requireValue(`${entry.key} email`, entry.email);
    requireValue(`${entry.key} password`, entry.password);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  for (const entry of users) {
    const userId = await ensureAuthUser(supabase, entry.email, entry.password);
    await ensureProfileRows(supabase, userId, entry);
    console.log(`Seeded ${entry.key}: ${entry.email}`);
  }

  console.log('E2E seeded users are ready.');
}

main().catch((error) => {
  console.error(`E2E seed failed: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
