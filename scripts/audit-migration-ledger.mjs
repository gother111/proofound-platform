#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { Client } from 'pg';
import { config as loadEnv } from 'dotenv';
import { computeDrift, parseVersionFromFile } from './lib/migration-ledger.mjs';

loadEnv({ path: '.env.local', quiet: true });

const args = process.argv.slice(2);
const databaseUrl = process.env.DATABASE_URL;

function readArg(flag) {
  const idx = args.indexOf(flag);
  if (idx === -1) return null;
  return args[idx + 1] ?? null;
}

const outputPath = readArg('--out');

async function main() {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required.');
  }

  const migrationDir = path.join(process.cwd(), 'supabase', 'migrations');
  const localFiles = (await fs.readdir(migrationDir))
    .filter((file) => file.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));

  const localEntries = localFiles.map((file) => ({
    file,
    version: parseVersionFromFile(file),
  }));

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
  await client.end();

  const { fileNotApplied, appliedMissingFile, appliedWithFile } = computeDrift(
    localEntries,
    dbResult.rows
  );

  const report = {
    generatedAt: new Date().toISOString(),
    localMigrationFileCount: localEntries.length,
    databaseMigrationRowCount: dbResult.rows.length,
    appliedWithFileCount: appliedWithFile.length,
    fileNotAppliedCount: fileNotApplied.length,
    appliedMissingFileCount: appliedMissingFile.length,
    fileNotApplied,
    appliedMissingFile,
  };

  console.log(`Local migration files: ${report.localMigrationFileCount}`);
  console.log(`DB migration rows: ${report.databaseMigrationRowCount}`);
  console.log(`Applied with local file: ${report.appliedWithFileCount}`);
  console.log(`File present but not applied: ${report.fileNotAppliedCount}`);
  console.log(`Applied in DB but missing local file: ${report.appliedMissingFileCount}`);

  if (report.fileNotAppliedCount > 0) {
    console.log('\nfile_not_applied:');
    for (const entry of fileNotApplied) {
      console.log(`- ${entry.file}`);
    }
  }

  if (report.appliedMissingFileCount > 0) {
    console.log('\napplied_missing_file (showing first 25):');
    for (const entry of appliedMissingFile.slice(0, 25)) {
      console.log(`- ${entry.version}: ${entry.name}`);
    }
  }

  if (outputPath) {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    console.log(`\nReport written to ${outputPath}`);
  }

  if (report.fileNotAppliedCount > 0 || report.appliedMissingFileCount > 0) {
    process.exit(2);
  }
}

main().catch((error) => {
  console.error('Migration audit failed:', error.message);
  process.exit(1);
});
