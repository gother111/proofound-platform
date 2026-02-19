#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { Client } from 'pg';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.local', quiet: true });

const args = process.argv.slice(2);

function readArg(flag) {
  const idx = args.indexOf(flag);
  if (idx === -1) return null;
  return args[idx + 1] ?? null;
}

const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
const outRoot = readArg('--out') ?? '/tmp/proofound-db-checkpoints';

const criticalTables = [
  'profiles',
  'organizations',
  'assignments',
  'interviews',
  'conversations',
  'messages',
  'analytics_events',
  'fairness_notes',
  'verification_requests',
  'user_video_integrations',
  'decision_reminders',
];

const timestampColumnsPriority = [
  'created_at',
  'occurred_at',
  'updated_at',
  'generated_at',
  'sent_at',
  'completed_at',
];

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function commandExists(command) {
  const check = spawnSync('sh', ['-lc', `command -v ${command}`], {
    stdio: 'ignore',
  });
  return check.status === 0;
}

async function writeJson(filePath, payload) {
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

async function getTableFingerprint(client, tableName) {
  const existsResult = await client.query(
    `
      SELECT to_regclass($1) IS NOT NULL AS exists
    `,
    [`public.${tableName}`]
  );

  const exists = Boolean(existsResult.rows[0]?.exists);
  if (!exists) {
    return { table: tableName, exists: false };
  }

  const countResult = await client.query(`SELECT COUNT(*)::bigint AS count FROM public."${tableName}"`);

  const columnResult = await client.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
        AND column_name = ANY($2::text[])
    `,
    [tableName, timestampColumnsPriority]
  );

  const availableColumns = new Set(columnResult.rows.map((row) => row.column_name));
  const selectedTimestampColumn = timestampColumnsPriority.find((col) => availableColumns.has(col));

  let maxTimestamp = null;
  if (selectedTimestampColumn) {
    const maxResult = await client.query(
      `SELECT MAX("${selectedTimestampColumn}") AS max_value FROM public."${tableName}"`
    );
    maxTimestamp = maxResult.rows[0]?.max_value ?? null;
  }

  return {
    table: tableName,
    exists: true,
    rowCount: countResult.rows[0]?.count ?? '0',
    timestampColumn: selectedTimestampColumn ?? null,
    maxTimestamp,
  };
}

async function main() {
  if (!databaseUrl) {
    throw new Error('DIRECT_URL or DATABASE_URL is required.');
  }

  const checkpointDir = path.join(outRoot, nowStamp());
  await fs.mkdir(checkpointDir, { recursive: true });

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  const fingerprint = [];
  for (const table of criticalTables) {
    fingerprint.push(await getTableFingerprint(client, table));
  }

  const migrationCount = await client.query(
    `SELECT COUNT(*)::bigint AS count FROM supabase_migrations.schema_migrations`
  );

  const dbIdentity = await client.query(
    `
      SELECT
        current_database() AS database,
        current_user AS user_name,
        inet_server_addr()::text AS server_addr,
        inet_server_port() AS server_port
    `
  );

  await client.end();

  const summary = {
    createdAt: new Date().toISOString(),
    checkpointDir,
    database: dbIdentity.rows[0],
    migrationRows: migrationCount.rows[0]?.count ?? '0',
    tablesAudited: criticalTables.length,
  };

  await writeJson(path.join(checkpointDir, 'summary.json'), summary);
  await writeJson(path.join(checkpointDir, 'row-fingerprint.json'), fingerprint);

  if (commandExists('pg_dump')) {
    const schemaPath = path.join(checkpointDir, 'schema.sql');
    const schemaDump = spawnSync(
      'pg_dump',
      ['--schema-only', '--no-owner', '--no-privileges', databaseUrl],
      { encoding: 'utf8', maxBuffer: 1024 * 1024 * 20 }
    );

    if (schemaDump.status === 0) {
      await fs.writeFile(schemaPath, schemaDump.stdout, 'utf8');
    } else {
      await fs.writeFile(
        path.join(checkpointDir, 'pg_dump-schema-error.txt'),
        schemaDump.stderr || 'pg_dump schema failed without stderr output',
        'utf8'
      );
    }

    for (const table of criticalTables) {
      const dataDump = spawnSync(
        'pg_dump',
        [
          '--data-only',
          '--inserts',
          '--no-owner',
          '--no-privileges',
          '--table',
          `public.${table}`,
          databaseUrl,
        ],
        { encoding: 'utf8', maxBuffer: 1024 * 1024 * 20 }
      );

      if (dataDump.status === 0) {
        await fs.writeFile(path.join(checkpointDir, `${table}.sql`), dataDump.stdout, 'utf8');
      } else {
        await fs.writeFile(
          path.join(checkpointDir, `${table}.error.txt`),
          dataDump.stderr || 'pg_dump data failed without stderr output',
          'utf8'
        );
      }
    }
  } else {
    await fs.writeFile(
      path.join(checkpointDir, 'pg_dump-missing.txt'),
      'pg_dump is not installed on this machine. JSON fingerprint files were generated instead.',
      'utf8'
    );
  }

  console.log(`Checkpoint created at ${checkpointDir}`);
}

main().catch((error) => {
  console.error('Checkpoint creation failed:', error.message);
  process.exit(1);
});
