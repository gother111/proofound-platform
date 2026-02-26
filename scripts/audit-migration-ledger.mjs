#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { Client } from 'pg';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.local', quiet: true });

const args = process.argv.slice(2);

function readArg(flag, fallback = null) {
  const idx = args.indexOf(flag);
  if (idx === -1) return fallback;
  return args[idx + 1] ?? fallback;
}

function hasFlag(flag) {
  return args.includes(flag);
}

const outputPath = readArg('--out');
const mode = readArg('--mode', 'canonical');
const failOnExtra = hasFlag('--fail-on-extra');
const baselinePathArg = readArg('--baseline');

const supportedModes = new Set([
  'canonical',
  'legacy-supabase',
  'legacy-supabase-baseline',
]);

const canonicalSupplementalVersions = [
  '20260212120000_legacy_policies_sql',
  '20260212120100_legacy_triggers_sql',
];

function parseSupabaseVersionFromFile(fileName) {
  return fileName.replace(/\.sql$/, '').split('_')[0];
}

function parseCanonicalVersionFromFile(fileName) {
  return fileName.replace(/\.sql$/, '');
}

function createEntryMap(entries) {
  const map = new Map();
  for (const entry of entries) {
    map.set(entry.version, entry);
  }
  return map;
}

async function loadLocalEntries(selectedMode) {
  if (selectedMode === 'legacy-supabase') {
    const migrationDir = path.join(process.cwd(), 'supabase', 'migrations');
    const localFiles = (await fs.readdir(migrationDir))
      .filter((file) => file.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b));

    return localFiles.map((file) => ({
      file,
      version: parseSupabaseVersionFromFile(file),
    }));
  }

  const migrationDir = path.join(process.cwd(), 'src', 'db', 'migrations');
  const localFiles = (await fs.readdir(migrationDir))
    .filter((file) => file.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));

  const migrations = localFiles.map((file) => ({
    file,
    version: parseCanonicalVersionFromFile(file),
  }));

  for (const version of canonicalSupplementalVersions) {
    migrations.push({
      file: `${version}.sql`,
      version,
    });
  }

  return migrations.sort((a, b) => a.version.localeCompare(b.version));
}

async function loadDbEntries(client, selectedMode) {
  if (selectedMode === 'legacy-supabase' || selectedMode === 'legacy-supabase-baseline') {
    const dbResult = await client.query(`
      SELECT version::text AS version, name
      FROM supabase_migrations.schema_migrations
      ORDER BY version
    `);

    return dbResult.rows;
  }

  const dbResult = await client.query(`
    SELECT version, checksum
    FROM public.app_migration_ledger
    ORDER BY version
  `);

  return dbResult.rows.map((row) => ({
    version: row.version,
    name: row.version,
  }));
}

async function loadLegacyBaseline(baselinePath) {
  const baselineRaw = await fs.readFile(baselinePath, 'utf8');
  const parsed = JSON.parse(baselineRaw);

  const rows = Array.isArray(parsed.rows)
    ? parsed.rows
    : Array.isArray(parsed.entries)
      ? parsed.entries
      : [];

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('Baseline file must include non-empty rows/entries array.');
  }

  const normalized = rows.map((row, index) => {
    if (!row || typeof row.version !== 'string' || typeof row.name !== 'string') {
      throw new Error(`Invalid baseline row at index ${index}.`);
    }

    return {
      version: row.version,
      name: row.name,
    };
  });

  return {
    path: baselinePath,
    metadata: {
      capturedAt: parsed.capturedAt ?? null,
      source: parsed.source ?? null,
      rowCount: parsed.rowCount ?? null,
    },
    rows: normalized,
  };
}

function buildParityReport({ selectedMode, localEntries, dbEntries }) {
  const localVersionSet = new Set(localEntries.map((entry) => entry.version));
  const dbVersionSet = new Set(dbEntries.map((row) => row.version));

  const fileNotApplied = localEntries.filter((entry) => !dbVersionSet.has(entry.version));
  const appliedMissingFile = dbEntries.filter((row) => !localVersionSet.has(row.version));
  const appliedWithFile = localEntries.filter((entry) => dbVersionSet.has(entry.version));

  return {
    mode: selectedMode,
    generatedAt: new Date().toISOString(),
    localMigrationFileCount: localEntries.length,
    databaseMigrationRowCount: dbEntries.length,
    appliedWithFileCount: appliedWithFile.length,
    fileNotAppliedCount: fileNotApplied.length,
    appliedMissingFileCount: appliedMissingFile.length,
    fileNotApplied,
    appliedMissingFile,
  };
}

function buildBaselineReport({ selectedMode, baseline, dbEntries }) {
  const baselineMap = createEntryMap(baseline.rows);
  const dbMap = createEntryMap(dbEntries);

  const missingInDb = baseline.rows.filter((row) => !dbMap.has(row.version));
  const extraInDb = dbEntries.filter((row) => !baselineMap.has(row.version));
  const nameMismatches = baseline.rows
    .filter((row) => dbMap.has(row.version))
    .map((row) => ({
      version: row.version,
      expectedName: row.name,
      actualName: dbMap.get(row.version)?.name,
    }))
    .filter((row) => row.expectedName !== row.actualName);

  return {
    mode: selectedMode,
    generatedAt: new Date().toISOString(),
    baselinePath: baseline.path,
    baselineCapturedAt: baseline.metadata.capturedAt,
    baselineSource: baseline.metadata.source,
    baselineRowCount: baseline.rows.length,
    databaseMigrationRowCount: dbEntries.length,
    missingInDbCount: missingInDb.length,
    extraInDbCount: extraInDb.length,
    nameMismatchCount: nameMismatches.length,
    missingInDb,
    extraInDb,
    nameMismatches,
  };
}

function printParityReport(report) {
  console.log(`Audit mode: ${report.mode}`);
  console.log(`Local migration files: ${report.localMigrationFileCount}`);
  console.log(`DB migration rows: ${report.databaseMigrationRowCount}`);
  console.log(`Applied with local file: ${report.appliedWithFileCount}`);
  console.log(`File present but not applied: ${report.fileNotAppliedCount}`);
  console.log(`Applied in DB but missing local file: ${report.appliedMissingFileCount}`);

  if (report.fileNotAppliedCount > 0) {
    console.log('\nfile_not_applied:');
    for (const entry of report.fileNotApplied) {
      console.log(`- ${entry.file}`);
    }
  }

  if (report.appliedMissingFileCount > 0) {
    console.log('\napplied_missing_file (showing first 25):');
    for (const entry of report.appliedMissingFile.slice(0, 25)) {
      console.log(`- ${entry.version}: ${entry.name}`);
    }
  }
}

function printBaselineReport(report) {
  console.log(`Audit mode: ${report.mode}`);
  console.log(`Baseline path: ${report.baselinePath}`);
  if (report.baselineCapturedAt) {
    console.log(`Baseline capturedAt: ${report.baselineCapturedAt}`);
  }
  if (report.baselineSource) {
    console.log(`Baseline source: ${report.baselineSource}`);
  }
  console.log(`Baseline rows: ${report.baselineRowCount}`);
  console.log(`DB migration rows: ${report.databaseMigrationRowCount}`);
  console.log(`Missing in DB: ${report.missingInDbCount}`);
  console.log(`Extra in DB: ${report.extraInDbCount}`);
  console.log(`Name mismatches: ${report.nameMismatchCount}`);

  if (report.missingInDbCount > 0) {
    console.log('\nmissing_in_db (showing first 25):');
    for (const entry of report.missingInDb.slice(0, 25)) {
      console.log(`- ${entry.version}: ${entry.name}`);
    }
  }

  if (report.extraInDbCount > 0) {
    console.log('\nextra_in_db (showing first 25):');
    for (const entry of report.extraInDb.slice(0, 25)) {
      console.log(`- ${entry.version}: ${entry.name}`);
    }
  }

  if (report.nameMismatchCount > 0) {
    console.log('\nname_mismatches (showing first 25):');
    for (const entry of report.nameMismatches.slice(0, 25)) {
      console.log(
        `- ${entry.version}: expected="${entry.expectedName}" actual="${entry.actualName}"`
      );
    }
  }
}

async function writeReport(report) {
  if (!outputPath) {
    return;
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`\nReport written to ${outputPath}`);
}

async function main() {
  if (!supportedModes.has(mode)) {
    throw new Error(
      `Unsupported mode "${mode}". Supported values: ${Array.from(supportedModes).join(', ')}`
    );
  }

  if (mode === 'legacy-supabase-baseline' && !baselinePathArg) {
    throw new Error('--baseline is required for mode legacy-supabase-baseline.');
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required.');
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  let dbEntries;
  try {
    dbEntries = await loadDbEntries(client, mode);
  } finally {
    await client.end();
  }

  if (mode === 'legacy-supabase-baseline') {
    const baselinePath = path.resolve(process.cwd(), baselinePathArg);
    const baseline = await loadLegacyBaseline(baselinePath);
    const report = buildBaselineReport({
      selectedMode: mode,
      baseline,
      dbEntries,
    });

    printBaselineReport(report);
    await writeReport(report);

    if (report.missingInDbCount > 0 || report.extraInDbCount > 0 || report.nameMismatchCount > 0) {
      process.exit(2);
    }

    return;
  }

  const localEntries = await loadLocalEntries(mode);
  const report = buildParityReport({
    selectedMode: mode,
    localEntries,
    dbEntries,
  });

  printParityReport(report);
  await writeReport(report);

  if (report.fileNotAppliedCount > 0) {
    process.exit(2);
  }

  if (failOnExtra && report.appliedMissingFileCount > 0) {
    process.exit(2);
  }

  if (report.appliedMissingFileCount > 0) {
    console.log(
      '\nNon-blocking warning: DB has extra historical versions not present locally. ' +
        'Use --fail-on-extra to enforce strict parity.'
    );
  }
}

main().catch((error) => {
  console.error('Migration audit failed:', error.message);
  process.exit(1);
});
