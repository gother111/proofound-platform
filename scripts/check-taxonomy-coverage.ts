#!/usr/bin/env tsx

/**
 * Deterministic taxonomy coverage check.
 *
 * Validates canonical and alias discoverability for:
 * - UI-controlled language options
 * - UI-controlled skill labels
 * - Required broad-search terms
 * - Optional generated canonical/alias wave snapshots
 */

import fs from 'node:fs';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { LANGUAGE_OPTIONS, SKILLS_TAXONOMY } from '@/lib/taxonomy/data';
import { SEARCH_COVERAGE_REQUIRED_TERMS } from './taxonomy-wave-config';

loadEnv({ path: '.env.local', quiet: true });

type CoverageStatus = 'exact' | 'partial' | 'none';

type CoverageResult = {
  label: string;
  status: CoverageStatus;
  matchedBy?: string;
};

const CANONICAL_SNAPSHOT_PATH = path.join(
  process.cwd(),
  'scripts',
  'generated',
  'taxonomy-canonical-wave.json'
);
const ALIAS_SNAPSHOT_PATH = path.join(
  process.cwd(),
  'scripts',
  'generated',
  'taxonomy-alias-wave.json'
);

function normalize(value: string): string {
  const canonicalized = value
    .toLowerCase()
    .replace(/quality\s+assurance/g, ' qa ')
    .replace(/people\s+operations/g, ' people ops ')
    .replace(/&/g, ' and ')
    .replace(/\band\b/g, ' ');

  return canonicalized
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function evaluateCoverage(labels: string[], normalizedCorpus: Set<string>): CoverageResult[] {
  const corpus = Array.from(normalizedCorpus);

  return labels.map((label) => {
    const normalizedLabel = normalize(label);
    if (!normalizedLabel) {
      return { label, status: 'none' };
    }

    if (normalizedCorpus.has(normalizedLabel)) {
      return { label, status: 'exact' };
    }

    const partialMatch = corpus.find(
      (candidate) => candidate.includes(normalizedLabel) || normalizedLabel.includes(candidate)
    );

    if (partialMatch) {
      return {
        label,
        status: 'partial',
        matchedBy: partialMatch,
      };
    }

    return { label, status: 'none' };
  });
}

function printSection(title: string, rows: CoverageResult[]) {
  const exact = rows.filter((row) => row.status === 'exact').length;
  const partial = rows.filter((row) => row.status === 'partial').length;
  const missing = rows.filter((row) => row.status === 'none');

  console.log(`\n${title}`);
  console.log(`- exact: ${exact}`);
  console.log(`- partial: ${partial}`);
  console.log(`- missing: ${missing.length}`);

  if (missing.length) {
    for (const row of missing) {
      console.log(`  - ${row.label}`);
    }
  }
}

function loadSnapshotLabels(
  filePath: string,
  key: 'candidates' | 'selected',
  labelKey: string
): string[] {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const payload = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Record<string, any>;
  const rows = Array.isArray(payload[key]) ? payload[key] : [];
  return rows
    .map((row: Record<string, unknown>) => {
      const value = row[labelKey];
      return typeof value === 'string' ? value : null;
    })
    .filter((value: string | null): value is string => Boolean(value));
}

async function fetchNormalizedCorpora() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRole) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  const supabase = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const normalizedNames = new Set<string>();
  const normalizedAliases = new Set<string>();

  let from = 0;
  const pageSize = 1000;
  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from('skills_taxonomy')
      .select('name_i18n')
      .eq('status', 'active')
      .range(from, to);

    if (error) {
      throw new Error(`Failed to read skills_taxonomy rows (${from}-${to}): ${error.message}`);
    }

    const page = data || [];
    if (!page.length) break;

    for (const row of page) {
      const skillName = row?.name_i18n?.en;
      if (typeof skillName === 'string' && skillName.trim().length > 0) {
        normalizedNames.add(normalize(skillName));
      }
    }

    if (page.length < pageSize) break;
    from += pageSize;
  }

  from = 0;
  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from('skills_taxonomy_aliases')
      .select('alias')
      .eq('status', 'active')
      .range(from, to);

    if (error) {
      const message = error.message || '';
      if (
        error.code === '42P01' ||
        message.includes("Could not find the table 'public.skills_taxonomy_aliases'")
      ) {
        // Alias table not migrated yet.
        break;
      }
      throw new Error(
        `Failed to read skills_taxonomy_aliases rows (${from}-${to}): ${error.message}`
      );
    }

    const page = data || [];
    if (!page.length) break;

    for (const row of page) {
      if (typeof row?.alias === 'string' && row.alias.trim().length > 0) {
        normalizedAliases.add(normalize(row.alias));
      }
    }

    if (page.length < pageSize) break;
    from += pageSize;
  }

  return {
    normalizedNames,
    normalizedAliases,
    normalizedSearchable: new Set<string>([...normalizedNames, ...normalizedAliases]),
  };
}

async function main() {
  const { normalizedNames, normalizedAliases, normalizedSearchable } =
    await fetchNormalizedCorpora();

  const languageCoverage = evaluateCoverage(
    LANGUAGE_OPTIONS.map((item) => item.label),
    normalizedSearchable
  );

  const skillCoverage = evaluateCoverage(
    SKILLS_TAXONOMY.map((item) => item.label),
    normalizedSearchable
  );

  const requiredTermCoverage = evaluateCoverage(
    SEARCH_COVERAGE_REQUIRED_TERMS,
    normalizedSearchable
  );

  const canonicalSnapshotLabels = loadSnapshotLabels(CANONICAL_SNAPSHOT_PATH, 'candidates', 'name');
  const canonicalSnapshotCoverage = canonicalSnapshotLabels.length
    ? evaluateCoverage(canonicalSnapshotLabels, normalizedNames)
    : [];

  const aliasSnapshotLabels = loadSnapshotLabels(ALIAS_SNAPSHOT_PATH, 'selected', 'alias');
  const aliasSnapshotCoverage = aliasSnapshotLabels.length
    ? evaluateCoverage(aliasSnapshotLabels, normalizedAliases)
    : [];

  console.log('[check-taxonomy-coverage]');
  console.log(`- active canonical names: ${normalizedNames.size}`);
  console.log(`- active aliases: ${normalizedAliases.size}`);

  printSection('Language coverage', languageCoverage);
  printSection('Skills coverage', skillCoverage);
  printSection('Required term coverage', requiredTermCoverage);

  if (canonicalSnapshotCoverage.length) {
    printSection('Canonical wave snapshot coverage', canonicalSnapshotCoverage);
  } else {
    console.log('\nCanonical wave snapshot coverage');
    console.log(
      `- skipped: snapshot not found at ${path.relative(process.cwd(), CANONICAL_SNAPSHOT_PATH)}`
    );
  }

  if (aliasSnapshotCoverage.length) {
    printSection('Alias wave snapshot coverage', aliasSnapshotCoverage);
  } else {
    console.log('\nAlias wave snapshot coverage');
    console.log(
      `- skipped: snapshot not found at ${path.relative(process.cwd(), ALIAS_SNAPSHOT_PATH)}`
    );
  }

  const missingCount =
    languageCoverage.filter((row) => row.status === 'none').length +
    skillCoverage.filter((row) => row.status === 'none').length +
    requiredTermCoverage.filter((row) => row.status === 'none').length +
    canonicalSnapshotCoverage.filter((row) => row.status === 'none').length +
    aliasSnapshotCoverage.filter((row) => row.status === 'none').length;

  if (missingCount > 0) {
    console.error(`\nCoverage check failed: ${missingCount} labels are missing.`);
    process.exit(1);
  }

  console.log('\nCoverage check passed.');
}

main().catch((error) => {
  console.error('Coverage check failed unexpectedly:', error.message);
  process.exit(1);
});
