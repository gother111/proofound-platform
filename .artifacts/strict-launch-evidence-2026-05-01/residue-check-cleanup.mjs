import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';

loadEnv({ path: '.env.local', quiet: true });

const since = '2026-05-01T00:00:00.000Z';
const profileCondition = `
  created_at >= TIMESTAMPTZ '2026-05-01T00:00:00.000Z'
  AND (display_name ILIKE 'Strict%' OR handle ILIKE 'strict-%')
`;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1 });

async function listStrictAuthUsers() {
  const auth = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const users = data.users || [];
    auth.push(...users);
    if (users.length < 1000) break;
  }

  return auth.filter(
    (user) =>
      user.email &&
      user.email.endsWith('@test.proofound.com') &&
      user.email.includes('strict-') &&
      user.created_at >= since
  );
}

async function countRows(query) {
  const rows = await sql.unsafe(query);
  return rows[0]?.count ?? 0;
}

async function residueCounts() {
  const strictAuthUsers = await listStrictAuthUsers();
  return {
    strictAuthUsers: strictAuthUsers.length,
    profiles: await countRows(`SELECT count(*)::int AS count FROM profiles WHERE ${profileCondition}`),
    organizations: await countRows(`
      SELECT count(*)::int AS count
      FROM organizations
      WHERE created_at >= TIMESTAMPTZ '2026-05-01T00:00:00.000Z'
        AND (display_name ILIKE 'Strict%' OR slug ILIKE 'strict-%')
    `),
    assignments: await countRows(`
      SELECT count(*)::int AS count
      FROM assignments
      WHERE created_at >= TIMESTAMPTZ '2026-05-01T00:00:00.000Z'
        AND role ILIKE 'Strict%'
    `),
  };
}

async function cleanupStrictProfiles() {
  const strictProfiles = await sql.unsafe(`SELECT id FROM profiles WHERE ${profileCondition}`);
  if (strictProfiles.length === 0) {
    return { strictProfilesBefore: 0, anonymizedProfiles: 0 };
  }

  const ids = strictProfiles.map((row) => row.id);
  const anonymizedProfiles = await sql`
    UPDATE profiles
    SET
      display_name = 'Deleted test fixture',
      handle = NULL,
      deleted = true,
      lifecycle_state = 'deleted',
      public_portfolio_state = 'unavailable',
      updated_at = NOW()
    WHERE id = ANY(${ids}::uuid[])
    RETURNING id
  `;

  return {
    strictProfilesBefore: ids.length,
    anonymizedProfiles: anonymizedProfiles.length,
  };
}

try {
  const before = await residueCounts();
  const cleanup = await cleanupStrictProfiles();
  const after = await residueCounts();
  await sql.end();

  console.log(JSON.stringify({ before, cleanup, after }, null, 2));
  if (Object.values(after).some((value) => value !== 0)) {
    process.exit(1);
  }
} catch (error) {
  await sql.end().catch(() => undefined);
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
