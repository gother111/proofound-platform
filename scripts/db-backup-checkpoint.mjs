#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { Client } from 'pg';
import { config as loadEnv } from 'dotenv';

import {
  collectCheckpointFingerprint,
  criticalTables,
  nowStamp,
  writeJson,
} from './lib/db-checkpoint-utils.mjs';

loadEnv({ path: '.env.local', quiet: true });

const args = process.argv.slice(2);

function readArg(flag) {
  const idx = args.indexOf(flag);
  if (idx === -1) return null;
  return args[idx + 1] ?? null;
}

const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
const outRoot = readArg('--out') ?? '/tmp/proofound-db-checkpoints';

function commandExists(command) {
  const check = spawnSync('sh', ['-lc', `command -v ${command}`], {
    stdio: 'ignore',
  });
  return check.status === 0;
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

  const { fingerprint, migrationRows, database } = await collectCheckpointFingerprint(client);

  await client.end();

  const summary = {
    createdAt: new Date().toISOString(),
    checkpointDir,
    database,
    migrationRows,
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
