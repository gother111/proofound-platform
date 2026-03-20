/**
 * Ordered migration runner for local/CI environments.
 *
 * Canonical SQL migration path: src/db/migrations
 * Supplemental legacy SQL (applied through the same ledger):
 * - src/db/policies.sql
 * - src/db/triggers.sql
 */

import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import dns from 'node:dns';
import pg from 'pg';
import { config } from 'dotenv';

if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

config({ path: '.env.local' });

const { Client } = pg;
const projectRoot = process.cwd();
const migrationDirectory = path.join(projectRoot, 'src', 'db', 'migrations');
const supplementalMigrations = [
  {
    version: '20260212120000_legacy_policies_sql',
    filePath: path.join(projectRoot, 'src', 'db', 'policies.sql'),
  },
  {
    version: '20260212120100_legacy_triggers_sql',
    filePath: path.join(projectRoot, 'src', 'db', 'triggers.sql'),
  },
];
const supplementalMigrationVersions = new Set(supplementalMigrations.map((migration) => migration.version));

function checksum(content) {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

async function collectMigrations() {
  const entries = await fs.readdir(migrationDirectory, { withFileTypes: true });
  const fileMigrations = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .map((entry) => ({
      version: entry.name.replace(/\.sql$/, ''),
      filePath: path.join(migrationDirectory, entry.name),
    }));

  return [...fileMigrations, ...supplementalMigrations].sort((a, b) =>
    a.version.localeCompare(b.version)
  );
}

async function ensureLedger(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.app_migration_ledger (
      version TEXT PRIMARY KEY,
      checksum TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedMap(client) {
  const result = await client.query(
    'SELECT version, checksum, applied_at FROM public.app_migration_ledger'
  );

  return new Map(result.rows.map((row) => [row.version, row]));
}

async function applyMigration(client, migration, sqlText, hash) {
  await client.query('BEGIN');
  try {
    await client.query(sqlText);
    await client.query(
      `
        INSERT INTO public.app_migration_ledger (version, checksum)
        VALUES ($1, $2)
      `,
      [migration.version, hash]
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

async function markMigrationApplied(client, migration, hash) {
  await client.query(
    `
      INSERT INTO public.app_migration_ledger (version, checksum)
      VALUES ($1, $2)
    `,
    [migration.version, hash]
  );
}

async function refreshAppliedChecksum(client, migration, hash) {
  await client.query(
    `
      UPDATE public.app_migration_ledger
      SET checksum = $2,
          applied_at = NOW()
      WHERE version = $1
    `,
    [migration.version, hash]
  );
}

async function isLegacySupplementalAlreadyPresent(client, migrationVersion) {
  if (migrationVersion === '20260212120000_legacy_policies_sql') {
    const { rowCount } = await client.query(
      `
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'profiles'
          AND policyname = 'Users can view all profiles'
        LIMIT 1
      `
    );
    return rowCount > 0;
  }

  if (migrationVersion === '20260212120100_legacy_triggers_sql') {
    const { rowCount } = await client.query(
      `
        SELECT 1
        FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname = 'profiles'
          AND t.tgname = 'set_updated_at_profiles'
          AND NOT t.tgisinternal
        LIMIT 1
      `
    );
    return rowCount > 0;
  }

  return false;
}

async function runMigrations() {
  const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DIRECT_URL or DATABASE_URL is required to run migrations.');
  }

  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    console.log(`Using ${process.env.DIRECT_URL ? 'DIRECT_URL' : 'DATABASE_URL'} for migrations.`);
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected.');

    await ensureLedger(client);
    const migrations = await collectMigrations();
    const appliedMap = await getAppliedMap(client);

    let appliedCount = 0;
    let skippedCount = 0;

    for (const migration of migrations) {
      const sqlText = await fs.readFile(migration.filePath, 'utf8');
      const hash = checksum(sqlText);
      const applied = appliedMap.get(migration.version);

      if (applied) {
        if (applied.checksum !== hash) {
          if (supplementalMigrationVersions.has(migration.version)) {
            await refreshAppliedChecksum(client, migration, hash);
            skippedCount += 1;
            console.log(
              `Refreshing checksum for supplemental baseline ${migration.version} (forward migrations remain authoritative).`
            );
            continue;
          }

          throw new Error(
            `Checksum mismatch for already applied migration ${migration.version}. ` +
              'Update strategy required before re-running migrations.'
          );
        }

        skippedCount += 1;
        console.log(`Skipping ${migration.version} (already applied).`);
        continue;
      }

      if (await isLegacySupplementalAlreadyPresent(client, migration.version)) {
        await markMigrationApplied(client, migration, hash);
        skippedCount += 1;
        console.log(
          `Marking ${migration.version} as already present (legacy supplemental objects detected).`
        );
        continue;
      }

      console.log(`Applying ${migration.version}...`);
      await applyMigration(client, migration, sqlText, hash);
      appliedCount += 1;
      console.log(`Applied ${migration.version}.`);
    }

    console.log('\nMigration run complete.');
    console.log(`Applied: ${appliedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log(`Total discovered: ${migrations.length}`);
  } finally {
    await client.end();
  }
}

runMigrations().catch((error) => {
  console.error('Migration runner failed:', error.message);
  process.exit(1);
});
