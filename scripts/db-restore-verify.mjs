#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { Client } from 'pg';
import { config as loadEnv } from 'dotenv';

import { collectCheckpointFingerprint, writeJson } from './lib/db-checkpoint-utils.mjs';

loadEnv({ path: '.env.local', quiet: true });

const args = process.argv.slice(2);

function readArg(flag) {
  const idx = args.indexOf(flag);
  if (idx === -1) return null;
  return args[idx + 1] ?? null;
}

function normalizeTimestamp(value) {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  return String(value);
}

async function main() {
  const checkpointDir = readArg('--checkpoint');
  const outPath = readArg('--out') ?? null;
  const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

  if (!checkpointDir) {
    throw new Error('--checkpoint <dir> is required');
  }
  if (!databaseUrl) {
    throw new Error('DIRECT_URL or DATABASE_URL is required.');
  }

  const summary = JSON.parse(
    await fs.readFile(path.join(checkpointDir, 'summary.json'), 'utf8')
  );
  const expectedFingerprint = JSON.parse(
    await fs.readFile(path.join(checkpointDir, 'row-fingerprint.json'), 'utf8')
  );

  const client = new Client({
    connectionString: databaseUrl,
    ssl:
      process.env.DB_RESTORE_VERIFY_SSL === 'disable'
        ? false
        : { rejectUnauthorized: false },
  });
  await client.connect();
  const actual = await collectCheckpointFingerprint(client);
  await client.end();

  const comparisons = expectedFingerprint.map((expectedRow) => {
    const actualRow = actual.fingerprint.find((row) => row.table === expectedRow.table) ?? null;
    const rowCountMatches = actualRow?.rowCount === expectedRow.rowCount;
    const expectedTimestamp = normalizeTimestamp(expectedRow.maxTimestamp);
    const actualTimestamp = normalizeTimestamp(actualRow?.maxTimestamp);
    const timestampMatches = actualTimestamp === expectedTimestamp;
    return {
      table: expectedRow.table,
      existsExpected: expectedRow.exists,
      existsActual: actualRow?.exists ?? false,
      rowCountExpected: expectedRow.rowCount ?? null,
      rowCountActual: actualRow?.rowCount ?? null,
      maxTimestampExpected: expectedTimestamp,
      maxTimestampActual: actualTimestamp,
      rowCountMatches,
      timestampMatches,
      ok:
        Boolean(actualRow) &&
        actualRow.exists === expectedRow.exists &&
        rowCountMatches &&
        timestampMatches,
    };
  });

  const report = {
    generatedAt: new Date().toISOString(),
    checkpointDir,
    checkpointSummary: summary,
    restoredDatabase: actual.database,
    restoredMigrationRows: actual.migrationRows,
    ok: comparisons.every((row) => row.ok),
    comparisons,
  };

  if (outPath) {
    await writeJson(outPath, report);
  } else {
    console.log(JSON.stringify(report, null, 2));
  }

  if (!report.ok) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Restore verification failed:', error.message);
  process.exit(1);
});
