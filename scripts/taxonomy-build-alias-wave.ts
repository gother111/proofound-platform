#!/usr/bin/env tsx

import fs from 'node:fs';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  ALIAS_STOPWORDS,
  CURATED_ALIAS_MAP,
  EXPANDED_LANGUAGE_TERMS,
  SEARCH_COVERAGE_REQUIRED_TERMS,
  type AliasCandidate,
} from './taxonomy-wave-config';
import { normalizeTaxonomyAlias } from '../src/lib/expertise/taxonomy-normalization';

loadEnv({ path: '.env.local', quiet: true });

type ExistingSkill = {
  code: string;
  slug: string;
  name_i18n?: { en?: string };
};

const TARGET_ALIAS_COUNT = 14000;

const CANONICAL_SNAPSHOT_PATH = path.join(
  process.cwd(),
  'scripts',
  'generated',
  'taxonomy-canonical-wave.json'
);

const OUTPUT_SQL = path.join(
  process.cwd(),
  'src',
  'db',
  'migrations',
  '20260225163000_expand_taxonomy_aliases_wave.sql'
);

const OUTPUT_JSON = path.join(process.cwd(), 'scripts', 'generated', 'taxonomy-alias-wave.json');

function normalize(value: string): string {
  return normalizeTaxonomyAlias(value);
}

function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function toConfidence(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(3))));
}

function isLowSignalAlias(alias: string): boolean {
  const normalized = normalize(alias);
  if (!normalized) return true;

  if (ALIAS_STOPWORDS.has(normalized)) return true;

  if (
    /^(best practices|compliance|customization|optimization|troubleshooting|auditing|assessment)$/.test(
      normalized
    )
  ) {
    return true;
  }

  if (/^\d+$/.test(normalized)) return true;

  return false;
}

function acronymFromName(name: string): string | null {
  const words = normalize(name)
    .split(' ')
    .filter((word) => word.length > 2 && !ALIAS_STOPWORDS.has(word));

  if (words.length < 2 || words.length > 5) {
    return null;
  }

  const acronym = words.map((word) => word[0]).join('');
  if (acronym.length < 2 || acronym.length > 6) {
    return null;
  }

  return acronym;
}

function generateNameVariants(
  name: string,
  slug: string
): Array<{ alias: string; confidence: number }> {
  const variants = new Map<string, number>();

  const add = (alias: string, confidence: number) => {
    const trimmed = alias.trim();
    if (!trimmed) return;
    const current = variants.get(trimmed);
    if (current == null || confidence > current) {
      variants.set(trimmed, confidence);
    }
  };

  const normalizedSlugWords = slug.replace(/-/g, ' ').trim();
  const noParens = name
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const andVariant = name.replace(/&/g, 'and').replace(/\s+/g, ' ').trim();
  const dotless = name.replace(/\./g, '').replace(/\s+/g, ' ').trim();
  const slashSpaced = name.replace(/\//g, ' ').replace(/\s+/g, ' ').trim();
  const slashAnd = name.replace(/\//g, ' and ').replace(/\s+/g, ' ').trim();

  if (normalizedSlugWords && normalize(normalizedSlugWords) !== normalize(name)) {
    add(normalizedSlugWords, 0.72);
  }

  if (noParens && normalize(noParens) !== normalize(name)) {
    add(noParens, 0.78);
  }

  if (andVariant && normalize(andVariant) !== normalize(name)) {
    add(andVariant, 0.78);
  }

  if (dotless && normalize(dotless) !== normalize(name)) {
    add(dotless, 0.81);
  }

  if (slashSpaced && normalize(slashSpaced) !== normalize(name)) {
    add(slashSpaced, 0.75);
  }

  if (slashAnd && normalize(slashAnd) !== normalize(name)) {
    add(slashAnd, 0.73);
  }

  const acronym = acronymFromName(name);
  if (acronym) {
    add(acronym, 0.65);
  }

  if (/ language proficiency$/i.test(name)) {
    add(name.replace(/ language proficiency$/i, ''), 0.99);
  }

  if (/ programming language$/i.test(name)) {
    add(name.replace(/ programming language$/i, ''), 0.98);
  }

  if (/infrastructure as code/i.test(name)) {
    add('IaC', 0.93);
  }

  return Array.from(variants.entries()).map(([alias, confidence]) => ({ alias, confidence }));
}

async function fetchAllRows<T>(
  supabase: SupabaseClient,
  table: string,
  columns: string,
  pageSize = 1000
): Promise<T[]> {
  const rows: T[] = [];
  let from = 0;

  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase.from(table).select(columns).range(from, to);

    if (error) {
      throw new Error(`Failed to fetch ${table} rows ${from}-${to}: ${error.message}`);
    }

    const page = (data || []) as T[];
    if (!page.length) break;

    rows.push(...page);
    if (page.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}

function loadCanonicalSnapshot(): Array<{ slug: string; name: string }> {
  if (!fs.existsSync(CANONICAL_SNAPSHOT_PATH)) {
    return [];
  }

  const payload = JSON.parse(fs.readFileSync(CANONICAL_SNAPSHOT_PATH, 'utf8')) as {
    candidates?: Array<{ slug: string; name: string }>;
  };

  return payload.candidates || [];
}

function makeManualAliasCandidates(
  canonicalFromSnapshot: Array<{ slug: string; name: string }>
): AliasCandidate[] {
  const candidates: AliasCandidate[] = [...CURATED_ALIAS_MAP];

  for (const language of EXPANDED_LANGUAGE_TERMS) {
    const slug = `${slugify(language)}-language-proficiency`;
    candidates.push({
      targetSlug: slug,
      alias: language,
      source: 'curated',
      confidence: 0.99,
    });
  }

  for (const term of SEARCH_COVERAGE_REQUIRED_TERMS) {
    const maybeSlug = slugify(term);
    const canonical = canonicalFromSnapshot.find((item) => item.slug === maybeSlug);
    if (canonical) {
      candidates.push({
        targetSlug: canonical.slug,
        alias: term,
        source: 'telemetry',
        confidence: 0.92,
      });
    }
  }

  return candidates;
}

function dedupeAndFilterCandidates(
  candidates: AliasCandidate[],
  canonicalNameBySlug: Map<string, string>
): {
  insertable: Array<AliasCandidate & { aliasNorm: string }>;
  collisions: Array<{ aliasNorm: string; slugs: string[] }>;
} {
  const byTargetAndNorm = new Map<string, AliasCandidate & { aliasNorm: string }>();
  const sourceRank: Record<AliasCandidate['source'], number> = {
    curated: 4,
    manual: 3,
    telemetry: 2,
    external: 1,
  };

  for (const candidate of candidates) {
    const alias = candidate.alias.trim();
    const aliasNorm = normalize(alias);
    if (!aliasNorm) continue;

    if (alias.length < 2 || alias.length > 80) continue;
    if (isLowSignalAlias(alias)) continue;

    const canonicalName = canonicalNameBySlug.get(candidate.targetSlug) || '';
    const canonicalNorm = normalize(canonicalName);
    if (canonicalNorm && aliasNorm === canonicalNorm) continue;

    const key = `${candidate.targetSlug}::${aliasNorm}`;
    const current = byTargetAndNorm.get(key);
    const normalizedCandidate = {
      ...candidate,
      alias,
      confidence: toConfidence(candidate.confidence),
      aliasNorm,
    };

    if (!current || normalizedCandidate.confidence > current.confidence) {
      byTargetAndNorm.set(key, normalizedCandidate);
    }
  }

  const aliasToCandidates = new Map<string, Array<AliasCandidate & { aliasNorm: string }>>();
  for (const candidate of byTargetAndNorm.values()) {
    const bucket = aliasToCandidates.get(candidate.aliasNorm) || [];
    bucket.push(candidate);
    aliasToCandidates.set(candidate.aliasNorm, bucket);
  }

  const collisions: Array<{ aliasNorm: string; slugs: string[] }> = [];
  const winnersByNorm = new Map<string, AliasCandidate & { aliasNorm: string }>();

  for (const [aliasNorm, bucket] of aliasToCandidates.entries()) {
    const sorted = [...bucket].sort((a, b) => {
      const bySource = sourceRank[b.source] - sourceRank[a.source];
      if (bySource !== 0) return bySource;

      if (b.confidence !== a.confidence) return b.confidence - a.confidence;
      if (a.alias.length !== b.alias.length) return a.alias.length - b.alias.length;
      if (a.targetSlug !== b.targetSlug) return a.targetSlug.localeCompare(b.targetSlug);
      return a.alias.localeCompare(b.alias);
    });

    winnersByNorm.set(aliasNorm, sorted[0]);

    const slugs = Array.from(new Set(sorted.map((item) => item.targetSlug))).sort();
    if (slugs.length > 1) {
      collisions.push({ aliasNorm, slugs });
    }
  }

  const insertable = Array.from(winnersByNorm.values()).sort((a, b) => {
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    if (a.alias.length !== b.alias.length) return a.alias.length - b.alias.length;
    if (a.targetSlug !== b.targetSlug) return a.targetSlug.localeCompare(b.targetSlug);
    return a.alias.localeCompare(b.alias);
  });

  return { insertable, collisions };
}

function buildSql(candidates: Array<AliasCandidate & { aliasNorm: string }>): string {
  const rows = candidates.map((candidate, index) => {
    return `    (${index + 1}, ${sqlString(candidate.targetSlug)}, 'en', ${sqlString(candidate.alias)}, ${sqlString(candidate.source)}, ${candidate.confidence.toFixed(3)}, 'active')`;
  });

  return `-- Migration: Broad alias taxonomy expansion wave for PRO-39
-- Date: 2026-02-25
-- Purpose:
--   - Seed scalable alias coverage for canonical skills
--   - Enforce quality filters and collision safety
--   - Preserve deterministic canonical-to-alias matching behavior

WITH curated(
  seed_order,
  target_slug,
  locale,
  alias,
  source,
  confidence,
  status
) AS (
  VALUES
${rows.join(',\n')}
),
resolved AS (
  SELECT
    c.seed_order,
    c.target_slug,
    c.locale,
    c.alias,
    c.source,
    c.confidence,
    c.status,
    st.code AS skill_code,
    st.name_i18n->>'en' AS canonical_name
  FROM curated c
  INNER JOIN public.skills_taxonomy st
    ON st.slug = c.target_slug
   AND st.status = 'active'
),
prepared AS (
  SELECT
    r.seed_order,
    r.skill_code,
    r.locale,
    trim(r.alias) AS alias,
    public.normalize_skill_alias(r.alias) AS alias_norm,
    public.normalize_skill_alias(COALESCE(r.canonical_name, '')) AS canonical_norm,
    r.source,
    r.confidence,
    r.status,
    jsonb_build_object(
      'target_slug', r.target_slug,
      'seed_order', r.seed_order,
      'confidence', r.confidence
    ) AS payload
  FROM resolved r
),
quality AS (
  SELECT p.*
  FROM prepared p
  WHERE
    p.alias <> ''
    AND char_length(p.alias) BETWEEN 2 AND 80
    AND p.alias_norm <> ''
    AND p.alias_norm <> p.canonical_norm
    AND p.alias_norm !~ '^(a|an|and|or|the|of|to|in|on|for|with)$'
),
batch_collisions AS (
  SELECT
    q.locale,
    min(q.alias) AS alias,
    q.alias_norm,
    max(q.skill_code) AS incoming_skill_code,
    min(q.skill_code) AS existing_skill_code,
    'Batch collision: alias maps to multiple canonical skills in this wave'::TEXT AS reason,
    jsonb_build_object('skill_codes', array_agg(DISTINCT q.skill_code ORDER BY q.skill_code)) AS payload,
    max(q.source) AS source,
    max(q.confidence) AS confidence
  FROM quality q
  GROUP BY q.locale, q.alias_norm
  HAVING COUNT(DISTINCT q.skill_code) > 1
),
existing_collisions AS (
  SELECT DISTINCT
    q.locale,
    q.alias,
    q.alias_norm,
    q.skill_code AS incoming_skill_code,
    e.skill_code AS existing_skill_code,
    'Existing active alias collision'::TEXT AS reason,
    q.payload,
    q.source,
    q.confidence
  FROM quality q
  INNER JOIN public.skills_taxonomy_aliases e
    ON e.locale = q.locale
   AND e.alias_norm = q.alias_norm
   AND e.status = 'active'
   AND e.skill_code <> q.skill_code
),
all_collisions AS (
  SELECT
    bc.locale,
    bc.alias,
    bc.alias_norm,
    bc.incoming_skill_code,
    bc.existing_skill_code,
    bc.reason,
    bc.payload,
    bc.source,
    bc.confidence
  FROM batch_collisions bc
  UNION ALL
  SELECT
    ec.locale,
    ec.alias,
    ec.alias_norm,
    ec.incoming_skill_code,
    ec.existing_skill_code,
    ec.reason,
    ec.payload,
    ec.source,
    ec.confidence
  FROM existing_collisions ec
),
insert_conflicts AS (
  INSERT INTO public.skills_taxonomy_alias_conflicts (
    locale,
    alias,
    alias_norm,
    incoming_skill_code,
    existing_skill_code,
    source,
    confidence,
    reason,
    payload
  )
  SELECT
    c.locale,
    c.alias,
    c.alias_norm,
    c.incoming_skill_code,
    c.existing_skill_code,
    c.source,
    c.confidence,
    c.reason,
    c.payload
  FROM all_collisions c
  RETURNING id
),
insertable AS (
  SELECT DISTINCT ON (q.skill_code, q.locale, q.alias_norm)
    q.skill_code,
    q.locale,
    q.alias,
    q.alias_norm,
    q.source,
    q.confidence,
    q.status
  FROM quality q
  WHERE NOT EXISTS (
    SELECT 1
    FROM all_collisions c
    WHERE c.locale = q.locale
      AND c.alias_norm = q.alias_norm
  )
  ORDER BY q.skill_code, q.locale, q.alias_norm, q.confidence DESC, q.seed_order ASC
),
insert_aliases AS (
  INSERT INTO public.skills_taxonomy_aliases (
    skill_code,
    locale,
    alias,
    alias_norm,
    source,
    confidence,
    status
  )
  SELECT
    i.skill_code,
    i.locale,
    i.alias,
    i.alias_norm,
    i.source,
    i.confidence,
    i.status
  FROM insertable i
  ON CONFLICT (skill_code, locale, alias_norm, status) DO UPDATE
  SET
    alias = EXCLUDED.alias,
    source = EXCLUDED.source,
    confidence = EXCLUDED.confidence,
    status = EXCLUDED.status,
    updated_at = NOW()
  RETURNING id
)
SELECT
  (SELECT COUNT(*)::INT FROM insert_aliases) AS alias_inserted_count,
  (SELECT COUNT(*)::INT FROM insert_conflicts) AS conflict_inserted_count;
`;
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRole) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  const supabase = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const existingSkills = await fetchAllRows<ExistingSkill>(
    supabase,
    'skills_taxonomy',
    'code, slug, name_i18n'
  );

  const canonicalSnapshot = loadCanonicalSnapshot();

  const canonicalNameBySlug = new Map<string, string>();
  for (const skill of existingSkills) {
    canonicalNameBySlug.set(skill.slug, skill.name_i18n?.en || skill.slug);
  }
  for (const candidate of canonicalSnapshot) {
    if (!canonicalNameBySlug.has(candidate.slug)) {
      canonicalNameBySlug.set(candidate.slug, candidate.name);
    }
  }

  const candidates: AliasCandidate[] = [];
  candidates.push(...makeManualAliasCandidates(canonicalSnapshot));

  for (const skill of existingSkills) {
    const name = skill.name_i18n?.en || '';
    if (!name.trim()) continue;

    for (const variant of generateNameVariants(name, skill.slug)) {
      candidates.push({
        targetSlug: skill.slug,
        alias: variant.alias,
        source: 'external',
        confidence: variant.confidence,
      });
    }
  }

  for (const candidate of canonicalSnapshot) {
    for (const variant of generateNameVariants(candidate.name, candidate.slug)) {
      candidates.push({
        targetSlug: candidate.slug,
        alias: variant.alias,
        source: 'manual',
        confidence: Math.max(variant.confidence, 0.9),
      });
    }
  }

  const { insertable, collisions } = dedupeAndFilterCandidates(candidates, canonicalNameBySlug);

  if (insertable.length < TARGET_ALIAS_COUNT) {
    throw new Error(
      `Insufficient insertable alias candidates. Required ${TARGET_ALIAS_COUNT}, got ${insertable.length}.`
    );
  }

  const selected = insertable.slice(0, TARGET_ALIAS_COUNT);
  const sql = buildSql(selected);

  fs.mkdirSync(path.dirname(OUTPUT_SQL), { recursive: true });
  fs.writeFileSync(OUTPUT_SQL, sql, 'utf8');

  fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });
  fs.writeFileSync(
    OUTPUT_JSON,
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        total_candidates: candidates.length,
        total_insertable: insertable.length,
        selected_count: selected.length,
        collision_count: collisions.length,
        selected: selected.map((candidate) => ({
          targetSlug: candidate.targetSlug,
          alias: candidate.alias,
          aliasNorm: candidate.aliasNorm,
          source: candidate.source,
          confidence: candidate.confidence,
        })),
        collisions: collisions.slice(0, 1000),
      },
      null,
      2
    ),
    'utf8'
  );

  console.log('[taxonomy-build-alias-wave] Generated alias wave migration:');
  console.log(`- SQL: ${path.relative(process.cwd(), OUTPUT_SQL)}`);
  console.log(`- Snapshot: ${path.relative(process.cwd(), OUTPUT_JSON)}`);
  console.log(`- Raw candidates: ${candidates.length}`);
  console.log(`- Insertable candidates: ${insertable.length}`);
  console.log(`- Selected candidates: ${selected.length}`);
  console.log(`- Collision groups detected: ${collisions.length}`);
}

main().catch((error) => {
  console.error('[taxonomy-build-alias-wave] Failed:', error.message);
  process.exit(1);
});
