#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { Client } from 'pg';
import { config as loadEnv } from 'dotenv';
import { computeDrift, parseVersionFromFile, sanitizeMigrationName } from './lib/migration-ledger.mjs';

loadEnv({ path: '.env.local', quiet: true });

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const write = args.has('--write') || !dryRun;

const databaseUrl = process.env.DATABASE_URL;

async function readLocalEntries(migrationDir) {
  const files = (await fs.readdir(migrationDir))
    .filter((file) => file.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));

  return files.map((file) => ({
    file,
    version: parseVersionFromFile(file),
  }));
}

function buildPlaceholderFileName(version, name) {
  const safeName = sanitizeMigrationName(name);
  return `${version}_${safeName}.sql`;
}

function placeholderSql(version, name) {
  return [
    '-- ============================================================================',
    '-- BASELINE RESTORED MIGRATION ARTIFACT',
    '-- This file is a canonical placeholder for a migration already recorded as',
    '-- applied in supabase_migrations.schema_migrations.',
    '-- It is intentionally a no-op and exists to keep repo/db migration ledger parity.',
    `-- Version: ${version}`,
    `-- Name: ${name || 'unknown'}`,
    '-- ============================================================================',
    '',
    'SELECT 1;',
    '',
  ].join('\n');
}

async function insertBaselineStamp(client, version, name) {
  await client.query(
    `
      INSERT INTO supabase_migrations.schema_migrations
      (version, name, statements, rollback, created_by, idempotency_key)
      VALUES ($1, $2, $3::text[], $4::text[], $5, $6)
      ON CONFLICT (version) DO NOTHING
    `,
    [
      version,
      name,
      ['-- baseline stamped by scripts/reconcile-migration-ledger.mjs'],
      ['-- no rollback (baseline stamp)'],
      'codex-reconcile',
      `baseline-${version}`,
    ]
  );
}

async function main() {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required.');
  }

  const migrationDir = path.join(process.cwd(), 'supabase', 'migrations');
  const localEntries = await readLocalEntries(migrationDir);

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const dbResult = await client.query(`
    SELECT version::text AS version, name
    FROM supabase_migrations.schema_migrations
    ORDER BY version
  `);

  const drift = computeDrift(localEntries, dbResult.rows);

  console.log(`file_not_applied: ${drift.fileNotApplied.length}`);
  console.log(`applied_missing_file: ${drift.appliedMissingFile.length}`);

  const actions = {
    createdFiles: 0,
    stampedRows: 0,
  };

  for (const row of drift.appliedMissingFile) {
    const fileName = buildPlaceholderFileName(row.version, row.name);
    const fullPath = path.join(migrationDir, fileName);

    try {
      await fs.access(fullPath);
      continue;
    } catch {
      // File does not exist.
    }

    if (write) {
      await fs.writeFile(fullPath, placeholderSql(row.version, row.name), 'utf8');
    }
    actions.createdFiles += 1;
  }

  for (const entry of drift.fileNotApplied) {
    if (write) {
      await insertBaselineStamp(client, entry.version, entry.file.replace(/\.sql$/i, ''));
    }
    actions.stampedRows += 1;
  }

  const updatedLocalEntries = await readLocalEntries(migrationDir);
  const updatedDbRows = (
    await client.query(
      `SELECT version::text AS version, name FROM supabase_migrations.schema_migrations ORDER BY version`
    )
  ).rows;

  await client.end();

  const post = computeDrift(updatedLocalEntries, updatedDbRows);

  console.log(`created placeholder files: ${actions.createdFiles}`);
  console.log(`baseline-stamped rows: ${actions.stampedRows}`);
  console.log(`post file_not_applied: ${post.fileNotApplied.length}`);
  console.log(`post applied_missing_file: ${post.appliedMissingFile.length}`);

  if (post.fileNotApplied.length > 0 || post.appliedMissingFile.length > 0) {
    throw new Error('Migration reconciliation did not converge to zero drift.');
  }

  console.log('Migration reconciliation complete: zero drift.');
}

main().catch((error) => {
  console.error(`Migration reconciliation failed: ${error.message}`);
  process.exit(1);
});
