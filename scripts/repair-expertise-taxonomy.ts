#!/usr/bin/env tsx
/**
 * Repairs Expertise Atlas taxonomy data (L1-L4) with safeguards.
 *
 * Usage:
 *   npx tsx scripts/repair-expertise-taxonomy.ts --dry-run
 *   npx tsx scripts/repair-expertise-taxonomy.ts --apply
 */

import { config as loadEnv } from 'dotenv';
import fs from 'fs';
import path from 'path';
import postgres from 'postgres';
import { createClient } from '@supabase/supabase-js';

loadEnv({ path: '.env.local' });

const REQUIRED_FILES = {
  l1L3SeedSql: path.join(
    process.cwd(),
    'src',
    'db',
    'migrations',
    '20250131_seed_taxonomy_l1_l2_l3.sql'
  ),
  taxonomyMarkdownPrimary: path.join(
    process.cwd(),
    'Expertise_Atlas_Taxonomy_L1_L2_L3_Expanded.md'
  ),
  taxonomyMarkdownFallback: path.join(
    process.cwd(),
    'docs',
    'archive',
    'legacy-platform',
    'Expertise_Atlas_Taxonomy_L1_L2_L3_Expanded.md'
  ),
  l4Json: path.join(process.cwd(), 'data', 'expertise-atlas-20k-l4-final.json'),
};

const OUTPUT_DIR = path.join(process.cwd(), 'output');
const PAGE_SIZE = 1000;

const databaseUrl = process.env.DATABASE_URL;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!databaseUrl || !supabaseUrl || !serviceRoleKey) {
  console.error(
    '❌ Missing required environment variables (DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).'
  );
  process.exit(1);
}

const sql = postgres(databaseUrl, { max: 1 });
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type TaxonomyCounts = {
  l1: number;
  l2: number;
  l3: number;
  l4: number;
  skills: number;
};

function toIsoFileStamp(date: Date): string {
  return date.toISOString().replace(/[:.]/g, '-');
}

function resolveTaxonomyMarkdownPath(): string | null {
  if (fs.existsSync(REQUIRED_FILES.taxonomyMarkdownPrimary)) {
    return REQUIRED_FILES.taxonomyMarkdownPrimary;
  }
  if (fs.existsSync(REQUIRED_FILES.taxonomyMarkdownFallback)) {
    return REQUIRED_FILES.taxonomyMarkdownFallback;
  }
  return null;
}

async function getCounts(): Promise<TaxonomyCounts> {
  const [{ count: l1 }, { count: l2 }, { count: l3 }, { count: l4 }, { count: skills }] =
    await Promise.all([
      supabase.from('skills_categories').select('*', { count: 'exact', head: true }),
      supabase.from('skills_subcategories').select('*', { count: 'exact', head: true }),
      supabase.from('skills_l3').select('*', { count: 'exact', head: true }),
      supabase.from('skills_taxonomy').select('*', { count: 'exact', head: true }),
      supabase.from('skills').select('*', { count: 'exact', head: true }),
    ]);

  return {
    l1: l1 || 0,
    l2: l2 || 0,
    l3: l3 || 0,
    l4: l4 || 0,
    skills: skills || 0,
  };
}

function printCounts(prefix: string, counts: TaxonomyCounts) {
  console.log(`${prefix}`);
  console.log(`  - skills_categories (L1): ${counts.l1}`);
  console.log(`  - skills_subcategories (L2): ${counts.l2}`);
  console.log(`  - skills_l3 (L3): ${counts.l3}`);
  console.log(`  - skills_taxonomy (L4): ${counts.l4}`);
  console.log(`  - skills (user rows): ${counts.skills}`);
}

function toCsv(rows: Record<string, any>[]): string {
  if (rows.length === 0) {
    return '';
  }
  const columns = Array.from(
    rows.reduce((acc, row) => {
      Object.keys(row).forEach((key) => acc.add(key));
      return acc;
    }, new Set<string>())
  );
  const escape = (value: unknown) => {
    if (value === null || value === undefined) return '';
    const serialized =
      typeof value === 'string'
        ? value
        : typeof value === 'object'
          ? JSON.stringify(value)
          : String(value);
    if (serialized.includes('"') || serialized.includes(',') || serialized.includes('\n')) {
      return `"${serialized.replace(/"/g, '""')}"`;
    }
    return serialized;
  };

  const header = columns.join(',');
  const lines = rows.map((row) => columns.map((column) => escape(row[column])).join(','));
  return [header, ...lines].join('\n');
}

async function snapshotTable(table: string, timestamp: string) {
  const rows: Record<string, any>[] = [];
  let from = 0;
  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase.from(table).select('*').range(from, to);
    if (error) {
      throw new Error(`Failed to snapshot table ${table} (${from}-${to}): ${error.message}`);
    }
    const page = data || [];
    if (page.length === 0) break;
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  const jsonPath = path.join(OUTPUT_DIR, `${table}-${timestamp}.json`);
  const csvPath = path.join(OUTPUT_DIR, `${table}-${timestamp}.csv`);

  fs.writeFileSync(jsonPath, JSON.stringify(rows, null, 2), 'utf8');
  fs.writeFileSync(csvPath, toCsv(rows), 'utf8');

  return { table, rowCount: rows.length, jsonPath, csvPath };
}

async function createSnapshot(timestamp: string) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const tables = [
    'skills_categories',
    'skills_subcategories',
    'skills_l3',
    'skills_taxonomy',
    'skills',
  ];
  const outputs = [];
  for (const table of tables) {
    outputs.push(await snapshotTable(table, timestamp));
  }
  return outputs;
}

async function runL1L3SeedSql(seedSqlPath: string) {
  const seedSql = fs.readFileSync(seedSqlPath, 'utf8');
  await sql.unsafe(seedSql);
}

function validateThresholds(counts: TaxonomyCounts) {
  const failures: string[] = [];
  if (counts.l2 <= 0) failures.push('L2 count must be > 0');
  if (counts.l3 <= 0) failures.push('L3 count must be > 0');
  if (counts.l4 <= 10000) failures.push('L4 count must be > 10000');
  return failures;
}

async function precheck() {
  const taxonomyPath = resolveTaxonomyMarkdownPath();
  const missingFiles: string[] = [];

  if (!fs.existsSync(REQUIRED_FILES.l1L3SeedSql)) {
    missingFiles.push(REQUIRED_FILES.l1L3SeedSql);
  }
  if (!taxonomyPath) {
    missingFiles.push(REQUIRED_FILES.taxonomyMarkdownPrimary);
    missingFiles.push(REQUIRED_FILES.taxonomyMarkdownFallback);
  }
  if (!fs.existsSync(REQUIRED_FILES.l4Json)) {
    missingFiles.push(REQUIRED_FILES.l4Json);
  }

  const counts = await getCounts();
  printCounts('📊 Current taxonomy counts:', counts);
  console.log(`📄 Using taxonomy markdown: ${taxonomyPath || 'N/A'}`);
  console.log(`📄 Using L4 JSON: ${REQUIRED_FILES.l4Json}`);

  if (missingFiles.length > 0) {
    console.error('❌ Precheck failed. Missing required files:');
    for (const missing of missingFiles) {
      console.error(`  - ${missing}`);
    }
    return { ok: false, counts, taxonomyPath: null as string | null };
  }

  console.log('✅ Precheck passed.');
  return { ok: true, counts, taxonomyPath };
}

async function main() {
  const { seedExpertiseTaxonomy } = await import('./seed-expertise-taxonomy');
  const args = new Set(process.argv.slice(2));
  const shouldApply = args.has('--apply');
  const explicitDryRun = args.has('--dry-run');
  const dryRun = !shouldApply || explicitDryRun;

  console.log(`🔧 Expertise taxonomy repair ${shouldApply ? '(APPLY)' : '(DRY RUN)'}\n`);

  const check = await precheck();
  if (!check.ok) {
    await sql.end();
    process.exit(1);
  }

  if (explicitDryRun && shouldApply) {
    console.log('ℹ️  Both --apply and --dry-run were provided. Running in dry-run mode only.');
  }

  if (dryRun) {
    await sql.end();
    return;
  }

  const timestamp = toIsoFileStamp(new Date());
  console.log('\n📦 Creating pre-write snapshots...');
  const snapshots = await createSnapshot(timestamp);
  for (const snapshot of snapshots) {
    console.log(`  - ${snapshot.table}: ${snapshot.rowCount} rows`);
    console.log(`    JSON: ${path.relative(process.cwd(), snapshot.jsonPath)}`);
    console.log(`    CSV: ${path.relative(process.cwd(), snapshot.csvPath)}`);
  }

  console.log('\n🚀 Running L1-L3 seed SQL...');
  await runL1L3SeedSql(REQUIRED_FILES.l1L3SeedSql);
  console.log('✅ L1-L3 seed SQL applied.');

  console.log('\n🚀 Running taxonomy reconciliation seed logic (L2-L4)...');
  await seedExpertiseTaxonomy({
    l4Only: false,
    dryRun: false,
    taxonomyPath: check.taxonomyPath || undefined,
    l4JsonPath: REQUIRED_FILES.l4Json,
  });

  const afterCounts = await getCounts();
  printCounts('\n📊 Counts after repair:', afterCounts);

  const thresholdFailures = validateThresholds(afterCounts);
  if (thresholdFailures.length > 0) {
    console.error('❌ Threshold validation failed:');
    for (const failure of thresholdFailures) {
      console.error(`  - ${failure}`);
    }
    await sql.end();
    process.exit(1);
  }

  console.log('✅ Threshold validation passed.');
  await sql.end();
}

main().catch(async (error) => {
  console.error('❌ Repair failed:', error);
  await sql.end();
  process.exit(1);
});
