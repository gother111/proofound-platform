#!/usr/bin/env node
/**
 * DB Schema + Connectivity Verifier (Supabase)
 *
 * Read-only script that fails fast when required DB objects are missing.
 *
 * Loads env from:
 * - .env.test (preferred, if present)
 * - otherwise .env.local
 *
 * Usage:
 *   node scripts/db-verify.mjs
 */

import fs from 'fs';
import path from 'path';

import { config as dotenvConfig } from 'dotenv';
import postgres from 'postgres';

const cwd = process.cwd();

function loadEnv() {
  const envTestPath = path.resolve(cwd, '.env.test');
  const envLocalPath = path.resolve(cwd, '.env.local');

  if (fs.existsSync(envTestPath)) {
    dotenvConfig({ path: envTestPath });
    return { source: '.env.test' };
  }

  if (fs.existsSync(envLocalPath)) {
    dotenvConfig({ path: envLocalPath });
    return { source: '.env.local' };
  }

  return { source: 'process.env' };
}

function normalizeUrl(value) {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const withScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return new URL(withScheme);
  } catch {
    return null;
  }
}

function safeHost(value) {
  const url = normalizeUrl(value);
  return url?.host ?? null;
}

function safeOrigin(value) {
  const url = normalizeUrl(value);
  return url?.origin ?? null;
}

function isLocalHostname(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

function redactConnectionForLog(connectionString) {
  try {
    const url = new URL(connectionString);
    const host = url.host;
    const db = url.pathname?.replace(/^\//, '') || '';
    const user = url.username ? `${url.username.slice(0, 2)}...` : '';
    return `postgresql://${user}@${host}/${db || '(db)'}`;
  } catch {
    return '(unparseable DATABASE_URL)';
  }
}

function parseSupabaseProjectRefFromUrl(supabaseUrl) {
  const url = normalizeUrl(supabaseUrl);
  if (!url) return null;

  const host = url.hostname || '';
  if (!host.endsWith('.supabase.co')) return null;
  const parts = host.split('.');
  const sub = parts[0] || '';
  return sub || null;
}

function parseSupabaseProjectRefFromDatabaseUrl(databaseUrl) {
  try {
    const url = new URL(databaseUrl);
    const host = url.hostname || '';
    const user = url.username || '';

    // Direct host: db.<ref>.supabase.co
    if (host.startsWith('db.') && host.endsWith('.supabase.co')) {
      const ref = host.split('.')[1];
      return ref || null;
    }

    // Pooler user: postgres.<ref>
    if (user.startsWith('postgres.')) {
      const ref = user.split('.')[1];
      return ref || null;
    }

    return null;
  } catch {
    return null;
  }
}

function collectFiles(dir, allowedExts, out) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'dist') {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(fullPath, allowedExts, out);
      continue;
    }
    const ext = path.extname(entry.name);
    if (allowedExts.has(ext)) {
      out.push(fullPath);
    }
  }
}

function uniqueSorted(arr) {
  return Array.from(new Set(arr)).sort((a, b) => a.localeCompare(b));
}

function parsePgTableNames(schemaPath) {
  const content = fs.readFileSync(schemaPath, 'utf8');
  const names = [];
  const re = /pgTable\s*\(\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(content))) {
    names.push(m[1]);
  }
  return uniqueSorted(names);
}

function parseSupabaseFromTableNames(files) {
  const names = [];
  const storageBuckets = new Set();
  const fromRe = /\.from\(\s*['"]([^'"]+)['"]\s*\)/g;
  const storageFromRe = /\.storage\s*\.\s*from\(\s*['"]([^'"]+)['"]\s*\)/g;
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    let m;
    while ((m = storageFromRe.exec(content))) {
      storageBuckets.add(m[1]);
    }
    while ((m = fromRe.exec(content))) {
      names.push(m[1]);
    }
  }
  return uniqueSorted(names).filter((t) => !storageBuckets.has(t));
}

function parseSupabaseRpcNames(files) {
  const names = [];
  const re = /\.rpc\(\s*['"]([^'"]+)['"]\s*[),]/g;
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    let m;
    while ((m = re.exec(content))) {
      names.push(m[1]);
    }
  }
  return uniqueSorted(names);
}

function parseRepoSupabaseMigrations(migrationsDir) {
  if (!fs.existsSync(migrationsDir)) {
    return { migrations: [], invalidFiles: [], duplicateVersions: [], duplicateNames: [] };
  }

  const entries = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'));
  const invalidFiles = [];
  const migrations = [];

  for (const file of entries) {
    const base = path.basename(file, '.sql');
    const match = /^(\d{8,})_(.+)$/.exec(base);
    if (match) {
      const version = match[1];
      const name = match[2];
      migrations.push({ file, version, name });
    } else {
      invalidFiles.push(file);
    }
  }

  const byVersion = new Map();
  const byName = new Map();
  for (const m of migrations) {
    byVersion.set(m.version, (byVersion.get(m.version) || 0) + 1);
    byName.set(m.name, (byName.get(m.name) || 0) + 1);
  }

  const duplicateVersions = uniqueSorted(Array.from(byVersion.entries()).filter(([, c]) => c > 1).map(([v]) => v));
  const duplicateNames = uniqueSorted(Array.from(byName.entries()).filter(([, c]) => c > 1).map(([n]) => n));

  return {
    migrations: migrations.sort((a, b) => a.version.localeCompare(b.version)),
    invalidFiles: uniqueSorted(invalidFiles),
    duplicateVersions,
    duplicateNames,
  };
}

function printList(title, items, { limit = 50 } = {}) {
  if (!items.length) return;
  const shown = items.slice(0, limit);
  console.error(`- ${title}: ${shown.join(', ')}${items.length > shown.length ? ` … (+${items.length - shown.length} more)` : ''}`);
}

async function main() {
  const { source } = loadEnv();

  const databaseUrl = (process.env.DATABASE_URL || '').trim();
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
  const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
  const supabaseServiceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || '').trim();

  console.log('');
  console.log('DB Verify');
  console.log('========================================');
  console.log(`Env source: ${source}`);

  console.log(`SITE host: ${safeHost(siteUrl) ?? '(missing)'}`);
  console.log(`SUPABASE host: ${safeHost(supabaseUrl) ?? '(missing)'}`);
  console.log(`DATABASE target: ${databaseUrl ? redactConnectionForLog(databaseUrl) : '(missing)'}`);
  console.log('');

  const missingEnv = [];
  if (!databaseUrl) missingEnv.push('DATABASE_URL');
  if (!supabaseUrl) missingEnv.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseAnonKey) missingEnv.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (!supabaseServiceRoleKey) missingEnv.push('SUPABASE_SERVICE_ROLE_KEY');

  if (missingEnv.length) {
    console.error('❌ Missing required env vars:');
    for (const k of missingEnv) console.error(`- ${k}`);
    process.exit(1);
  }

  // Best-effort check that backend and frontend point to the same Supabase project.
  const urlRef = parseSupabaseProjectRefFromUrl(supabaseUrl);
  const dbRef = parseSupabaseProjectRefFromDatabaseUrl(databaseUrl);
  if (urlRef && dbRef && urlRef !== dbRef) {
    console.error('❌ Supabase project mismatch between SUPABASE URL and DATABASE URL.');
    console.error(`- From SUPABASE URL: ${urlRef}`);
    console.error(`- From DATABASE URL: ${dbRef}`);
    console.error('Fix: Align DATABASE_URL to the same Supabase project as NEXT_PUBLIC_SUPABASE_URL.');
    process.exit(1);
  }

  const dbHost = (() => {
    try {
      return new URL(databaseUrl).hostname;
    } catch {
      return '';
    }
  })();

  const isLocalDb = isLocalHostname(dbHost);
  const sql = postgres(databaseUrl, {
    prepare: false,
    ssl: isLocalDb ? false : 'require',
    connect_timeout: 10,
  });

  const errors = [];

  try {
    await sql`SELECT 1 as ok`;
  } catch (err) {
    errors.push(`DB connectivity failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Inventory required objects from repo.
  const schemaPath = path.resolve(cwd, 'src', 'db', 'schema.ts');
  const srcDir = path.resolve(cwd, 'src');

  const files = [];
  collectFiles(srcDir, new Set(['.ts', '.tsx', '.js', '.jsx']), files);

  const drizzleTables = fs.existsSync(schemaPath) ? parsePgTableNames(schemaPath) : [];
  const supabaseTables = parseSupabaseFromTableNames(files);
  const requiredTables = uniqueSorted([...drizzleTables, ...supabaseTables]);

  const requiredRpcs = parseSupabaseRpcNames(files);

  // Extensions
  try {
    const extRows = await sql`
      SELECT extname
      FROM pg_extension
      WHERE extname IN ('pgcrypto', 'vector')
      ORDER BY extname
    `;
    const present = new Set(extRows.map((r) => r.extname));
    for (const ext of ['pgcrypto', 'vector']) {
      if (!present.has(ext)) {
        errors.push(`Missing required extension: ${ext}`);
      }
    }
  } catch (err) {
    errors.push(`Failed to query extensions: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Tables and views
  const presentPublicTables = new Map(); // name -> table_type
  try {
    const rows = await sql`
      SELECT table_name, table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `;
    for (const r of rows) presentPublicTables.set(r.table_name, r.table_type);

    const missingTables = requiredTables.filter((t) => !presentPublicTables.has(t));
    if (missingTables.length) {
      errors.push(`Missing ${missingTables.length} required table(s)/view(s) in public schema.`);
      printList('Missing tables', missingTables);
    }
  } catch (err) {
    errors.push(`Failed to query information_schema.tables: ${err instanceof Error ? err.message : String(err)}`);
  }

  // RPC functions
  try {
    const fnRows = await sql`
      SELECT p.proname
      FROM pg_proc p
      INNER JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
    `;
    const presentFns = new Set(fnRows.map((r) => r.proname));
    const missingFns = requiredRpcs.filter((fn) => !presentFns.has(fn));
    if (missingFns.length) {
      errors.push(`Missing ${missingFns.length} required RPC function(s) in public schema.`);
      printList('Missing RPC functions', missingFns);
    }
  } catch (err) {
    errors.push(`Failed to query pg_proc: ${err instanceof Error ? err.message : String(err)}`);
  }

  // RLS sanity (tables only, not views)
  try {
    const rlsRows = await sql`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
    `;
    const rlsByTable = new Map(rlsRows.map((r) => [r.tablename, r.rowsecurity]));

    const policyRows = await sql`
      SELECT tablename, COUNT(*)::int as policy_count
      FROM pg_policies
      WHERE schemaname = 'public'
      GROUP BY tablename
    `;
    const policiesByTable = new Map(policyRows.map((r) => [r.tablename, r.policy_count]));

    const requiredBaseTables = requiredTables.filter((t) => presentPublicTables.get(t) === 'BASE TABLE');
    const missingRls = requiredBaseTables.filter((t) => rlsByTable.get(t) === false);
    if (missingRls.length) {
      errors.push(`RLS is disabled on ${missingRls.length} required table(s).`);
      printList('RLS disabled tables', missingRls);
    }

    const noPolicies = requiredBaseTables.filter((t) => (policiesByTable.get(t) ?? 0) === 0);
    if (noPolicies.length) {
      errors.push(`No RLS policies found on ${noPolicies.length} required table(s).`);
      printList('Tables with zero policies', noPolicies);
    }
  } catch (err) {
    errors.push(`Failed to verify RLS/policies: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Migration history + drift (Supabase)
  const repoMigrationsDir = path.resolve(cwd, 'supabase', 'migrations');
  const {
    migrations: repoMigrations,
    invalidFiles,
    duplicateVersions,
    duplicateNames,
  } = parseRepoSupabaseMigrations(repoMigrationsDir);

  if (duplicateVersions.length) {
    errors.push(
      `Supabase migrations have ${duplicateVersions.length} duplicate version(s). ` +
        'Supabase CLI requires unique numeric prefixes.'
    );
    printList('Duplicate migration versions', duplicateVersions, { limit: 80 });
  }

  if (duplicateNames.length) {
    console.warn(`⚠️  Found duplicate Supabase migration name(s): ${duplicateNames.join(', ')}`);
  }

  if (invalidFiles.length) {
    errors.push(`Found ${invalidFiles.length} Supabase migration file(s) with invalid filename format.`);
    console.warn('Invalid migration filenames (expected: <digits>_<name>.sql):');
    for (const f of invalidFiles) console.warn(`- ${f}`);
  }

  try {
    const appliedRows = await sql`
      SELECT version, name
      FROM supabase_migrations.schema_migrations
      ORDER BY version
    `;
    const appliedByVersion = new Map(appliedRows.map((r) => [String(r.version), String(r.name)]));
    const appliedByName = new Map(appliedRows.map((r) => [String(r.name), String(r.version)]));

    const missing = [];
    const nameVersionMismatches = [];
    for (const m of repoMigrations) {
      if (appliedByVersion.has(m.version)) continue;
      const appliedVersionForName = appliedByName.get(m.name);
      if (appliedVersionForName) {
        nameVersionMismatches.push(`${m.name} (repo ${m.version}, db ${appliedVersionForName})`);
        continue;
      }
      missing.push(`${m.version}_${m.name}`);
    }

    if (missing.length) {
      errors.push(`Supabase migrations pending: ${missing.length} version(s) present in repo but not applied in DB.`);
      printList('Missing migration versions', missing, { limit: 80 });
    }

    if (nameVersionMismatches.length) {
      console.warn(
        `⚠️  ${nameVersionMismatches.length} migration(s) appear applied by name but have different version prefixes in DB.`
      );
      printList('Name/version mismatches', nameVersionMismatches, { limit: 40 });
    }

    const repoVersions = new Set(repoMigrations.map((m) => m.version));
    const extra = Array.from(appliedByVersion.keys())
      .filter((v) => !repoVersions.has(v))
      .sort();
    if (extra.length) {
      console.warn(`⚠️  DB has ${extra.length} migration version(s) not present in repo (DB may be ahead).`);
      printList('Extra migration versions', extra, { limit: 40 });
    }
  } catch (err) {
    errors.push(
      `Failed to query supabase_migrations.schema_migrations: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  // Security sanity: platform_role must not be user-writable.
  try {
    const hasPlatformRole = await sql`
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'platform_role'
      LIMIT 1
    `;
    if (hasPlatformRole.length) {
      const privRows = await sql`
        SELECT grantee, privilege_type
        FROM information_schema.column_privileges
        WHERE table_schema = 'public'
          AND table_name = 'profiles'
          AND column_name = 'platform_role'
          AND grantee IN ('anon', 'authenticated')
      `;
      const bad = privRows.filter(
        (r) => r.privilege_type === 'UPDATE' || r.privilege_type === 'INSERT'
      );
      if (bad.length) {
        const triggerRows = await sql`
          SELECT t.tgname
          FROM pg_trigger t
          INNER JOIN pg_class c ON c.oid = t.tgrelid
          INNER JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'public'
            AND c.relname = 'profiles'
            AND t.tgname IN ('enforce_platform_role_on_insert', 'enforce_platform_role_on_update')
            AND NOT t.tgisinternal
        `;
        const present = new Set(triggerRows.map((r) => r.tgname));
        const hasInsertTrigger = present.has('enforce_platform_role_on_insert');
        const hasUpdateTrigger = present.has('enforce_platform_role_on_update');

        if (hasInsertTrigger && hasUpdateTrigger) {
          console.warn(
            '⚠️  profiles.platform_role has broad GRANTs, but server-only enforcement triggers are present (OK).'
          );
        } else {
          errors.push(
            'Security: public.profiles.platform_role is writable by anon/authenticated (privilege escalation risk).'
          );
        }
      }
    }
  } catch (err) {
    errors.push(`Failed to verify profiles.platform_role privileges: ${err instanceof Error ? err.message : String(err)}`);
  }

  await sql.end({ timeout: 5 });

  if (errors.length) {
    console.error('');
    console.error('❌ DB verification failed:');
    for (const e of errors) console.error(`- ${e}`);
    console.error('');
    console.error('Suggested next steps:');
    console.error('- Apply pending Supabase migrations: supabase db push (dry-run, then --yes).');
    console.error('- If core tables are missing, apply baseline schema from migrations-to-run.sql first.');
    process.exit(1);
  }

  console.log('✅ DB verification passed');
}

main().catch((err) => {
  console.error('❌ db-verify crashed:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
