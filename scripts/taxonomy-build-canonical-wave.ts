#!/usr/bin/env tsx

import fs from 'node:fs';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  CANONICAL_TARGET_COUNTS,
  CURATED_ALIAS_MAP,
  DOMAIN_KNOWLEDGE_CURATED,
  DOMAIN_TO_CAT_ID,
  EXPANDED_LANGUAGE_TERMS,
  FUTURE_OF_WORK_TERMS,
  MANDATORY_TECH_STACK,
  type CanonicalCandidate,
  type DomainCode,
} from './taxonomy-wave-config';

loadEnv({ path: '.env.local', quiet: true });

type SkillsSubcategory = {
  cat_id: number;
  subcat_id: number;
  slug: string;
  name_i18n?: { en?: string };
};

type SkillsL3 = {
  cat_id: number;
  subcat_id: number;
  l3_id: number;
  slug: string;
  name_i18n?: { en?: string };
};

type ExistingSkill = {
  code: string;
  slug: string;
  name_i18n?: { en?: string };
};

type ExternalSkill = {
  name: string;
  l1_code: DomainCode;
  l2_code: string;
  l2_name: string;
  l3_name: string;
  description?: string;
};

const DEFAULT_OUTPUT_SQL = path.join(
  process.cwd(),
  'src',
  'db',
  'migrations',
  '20260225162000_expand_taxonomy_canonical_wave.sql'
);
const DEFAULT_OUTPUT_JSON = path.join(
  process.cwd(),
  'scripts',
  'generated',
  'taxonomy-canonical-wave.json'
);

const CORRECTED_SOURCE_PATH = path.join(
  process.cwd(),
  'data',
  'expertise-atlas-l4-skills-corrected.json'
);
const FINAL_SOURCE_PATH = path.join(process.cwd(), 'data', 'expertise-atlas-20k-l4-final.json');

function normalize(value: string): string {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[\u2019\u2018']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
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

function sqlArray(values: string[]): string {
  const escaped = values.map((value) => sqlString(value)).join(', ');
  return `ARRAY[${escaped}]`;
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

function loadExternalSources(): {
  externalSkills: ExternalSkill[];
  descriptionByNormalizedName: Map<string, string>;
} {
  const correctedSource = JSON.parse(fs.readFileSync(CORRECTED_SOURCE_PATH, 'utf8')) as {
    skills: ExternalSkill[];
  };
  const descriptionSource = JSON.parse(fs.readFileSync(FINAL_SOURCE_PATH, 'utf8')) as {
    skills: Array<{ name: string; description?: string }>;
  };

  const descriptionByNormalizedName = new Map<string, string>();
  for (const row of descriptionSource.skills || []) {
    const key = normalize(row.name || '');
    if (!key) continue;
    const description = (row.description || '').trim();
    if (description && !descriptionByNormalizedName.has(key)) {
      descriptionByNormalizedName.set(key, description);
    }
  }

  return {
    externalSkills: correctedSource.skills || [],
    descriptionByNormalizedName,
  };
}

function inferDescription(name: string, l3Name: string): string {
  return `Apply ${name} effectively within ${l3Name.toLowerCase()} workflows and domain contexts.`;
}

function buildManualCandidates(): CanonicalCandidate[] {
  const candidates: CanonicalCandidate[] = [];

  for (const language of EXPANDED_LANGUAGE_TERMS) {
    candidates.push({
      domain: 'L',
      catId: 4,
      subcatId: 105,
      l3Id: 840,
      name: `${language} language proficiency`,
      description: `Use ${language} effectively in professional communication across speaking, writing, and comprehension contexts.`,
      tags: ['l', 'language', 'cefr', normalize(language).replace(/ /g, '-')],
      source: 'curated',
      priority: 'mandatory',
    });
  }

  for (const skill of MANDATORY_TECH_STACK) {
    candidates.push({
      domain: 'T',
      catId: skill.catId,
      subcatId: skill.subcatId,
      l3Id: skill.l3Id,
      name: skill.name,
      description: `Use ${skill.name} effectively in production-grade technical delivery, operations, and platform workflows.`,
      tags: skill.tags,
      source: 'curated',
      priority: 'mandatory',
    });
  }

  for (const skill of FUTURE_OF_WORK_TERMS) {
    candidates.push({
      domain: 'U',
      catId: skill.catId,
      subcatId: skill.subcatId,
      l3Id: skill.l3Id,
      name: skill.name,
      description: `Demonstrate ${skill.name.toLowerCase()} in modern team, product, and organizational environments.`,
      tags: skill.tags,
      source: 'curated',
      priority: 'mandatory',
    });
  }

  for (const pack of DOMAIN_KNOWLEDGE_CURATED) {
    for (const term of pack.terms) {
      candidates.push({
        domain: 'D',
        catId: 6,
        subcatId: pack.subcatId,
        l3Id: pack.l3Id,
        name: term,
        description: `Apply ${term.toLowerCase()} in domain-specific decision-making, governance, and execution contexts.`,
        tags: ['d', pack.tag, 'domain-knowledge'],
        source: 'curated',
        priority: 'high',
      });
    }
  }

  return candidates;
}

function buildMappings(subcategories: SkillsSubcategory[], l3Rows: SkillsL3[]) {
  const subBySlug = new Map<string, SkillsSubcategory>();
  const subByName = new Map<string, SkillsSubcategory>();

  for (const row of subcategories) {
    subBySlug.set((row.slug || '').toLowerCase(), row);
    const name = normalize(row.name_i18n?.en || '');
    if (name) {
      subByName.set(`${row.cat_id}:${name}`, row);
    }
  }

  const l3ByName = new Map<string, SkillsL3>();
  for (const row of l3Rows) {
    const name = normalize(row.name_i18n?.en || '');
    if (name) {
      l3ByName.set(`${row.cat_id}:${row.subcat_id}:${name}`, row);
    }
  }

  return { subBySlug, subByName, l3ByName };
}

function isLowSignalName(name: string): boolean {
  const normalized = normalize(name);
  if (!normalized) return true;

  if (/^enterprise\b/i.test(name)) return true;
  if (/\bin practice\b/i.test(name)) return true;
  if (/\bfor enterprise\b/i.test(name)) return true;
  if (/\bworkflow(s)?\b/i.test(name) && /\bcontext(s)?\b/i.test(name)) return true;
  if (/\b([a-z0-9]+)\s+\1\b/i.test(normalized)) return true;

  const noisyPatterns = [
    /\badvanced\b/i,
    /\bapplied\b/i,
    /\bassessment\b/i,
    /\bauditing\b/i,
    /\bautomation\b/i,
    /\bbest practices\b/i,
    /\bcompliance\b/i,
    /\bcustomization\b/i,
    /\bdocumentation\b/i,
    /\bexecution\b/i,
    /\bimplementation\b/i,
    /\bintegration\b/i,
    /\binnovation\b/i,
    /\bmonitoring\b/i,
    /\boptimization\b/i,
    /\bplanning\b/i,
    /\breporting\b/i,
    /\bstandardization\b/i,
    /\btechniques\b/i,
    /\btroubleshooting\b/i,
    /\bconfiguration\b/i,
    /\badministration\b/i,
    /\bperformance tuning\b/i,
    /\banalysis\b/i,
    /\bdesign\b/i,
    /\bevaluation\b/i,
    /\bautomated\b/i,
    /\bbasic\b/i,
    /\bagile\b/i,
    /\bin\s+(technology|finance|healthcare|government|manufacturing|retail|construction|energy|non-profit|non profit|education)\b/i,
  ];

  return noisyPatterns.some((pattern) => pattern.test(name));
}

function qualityScore(candidate: CanonicalCandidate): number {
  const normalizedName = normalize(candidate.name);
  const words = normalizedName.split(' ').filter(Boolean);

  let score = 0;

  if (candidate.source === 'curated') score += 40;
  if (candidate.source === 'external') score += 20;
  if (candidate.priority === 'mandatory') score += 80;
  if (candidate.priority === 'high') score += 40;

  if (words.length >= 2 && words.length <= 5) score += 20;
  if (words.length >= 6 && words.length <= 8) score += 10;
  if (words.length > 10) score -= 20;

  if (/ language proficiency$/i.test(candidate.name)) score += 15;
  if (/ programming language$/i.test(candidate.name)) score += 10;

  if (/^enterprise\b/i.test(candidate.name)) score -= 120;
  if (/\bin practice\b/i.test(candidate.name)) score -= 120;
  if (/\bfor enterprise\b/i.test(candidate.name)) score -= 80;
  if (/\b([a-z0-9]+)\s+\1\b/i.test(normalizedName)) score -= 100;
  if (/\(|\)|\//.test(candidate.name)) score -= 8;
  if (/&/.test(candidate.name)) score -= 6;

  return score;
}

function resolveExternalCandidate(
  row: ExternalSkill,
  maps: ReturnType<typeof buildMappings>,
  descriptionByNormalizedName: Map<string, string>
): CanonicalCandidate | null {
  const catId = DOMAIN_TO_CAT_ID[row.l1_code];
  if (!catId) return null;

  const subcategory =
    maps.subBySlug.get((row.l2_code || '').toLowerCase()) ||
    maps.subByName.get(`${catId}:${normalize(row.l2_name)}`);
  if (!subcategory) return null;

  const l3 = maps.l3ByName.get(`${catId}:${subcategory.subcat_id}:${normalize(row.l3_name)}`);
  if (!l3) return null;

  if (isLowSignalName(row.name)) return null;

  const normalizedName = normalize(row.name);
  const description =
    descriptionByNormalizedName.get(normalizedName) ||
    row.description ||
    inferDescription(row.name, row.l3_name);

  return {
    domain: row.l1_code,
    catId,
    subcatId: subcategory.subcat_id,
    l3Id: l3.l3_id,
    name: row.name.trim(),
    description: description.trim(),
    tags: [row.l1_code.toLowerCase(), (row.l2_code || '').toLowerCase(), 'taxonomy-wave'],
    source: 'external',
    priority: 'normal',
  };
}

function uniqueByNameAndSlug(candidates: CanonicalCandidate[]): CanonicalCandidate[] {
  const seen = new Set<string>();
  const unique: CanonicalCandidate[] = [];

  for (const candidate of candidates) {
    const normalizedName = normalize(candidate.name);
    const slug = slugify(candidate.name);
    if (!normalizedName || !slug) continue;

    const key = `${normalizedName}::${slug}`;
    if (seen.has(key)) continue;

    seen.add(key);
    unique.push(candidate);
  }

  return unique;
}

function removeExisting(
  candidates: CanonicalCandidate[],
  existingNormalizedNames: Set<string>,
  existingSlugs: Set<string>
): CanonicalCandidate[] {
  return candidates.filter((candidate) => {
    const normalizedName = normalize(candidate.name);
    const slug = slugify(candidate.name);
    return !existingNormalizedNames.has(normalizedName) && !existingSlugs.has(slug);
  });
}

function selectBalancedWave(candidates: CanonicalCandidate[]): CanonicalCandidate[] {
  const byDomain: Record<DomainCode, CanonicalCandidate[]> = {
    U: [],
    F: [],
    T: [],
    L: [],
    M: [],
    D: [],
  };

  for (const candidate of candidates) {
    byDomain[candidate.domain].push(candidate);
  }

  for (const domain of Object.keys(byDomain) as DomainCode[]) {
    byDomain[domain].sort((a, b) => {
      const priorityWeight = { mandatory: 0, high: 1, normal: 2 } as const;
      const byPriority = priorityWeight[a.priority] - priorityWeight[b.priority];
      if (byPriority !== 0) return byPriority;

      const byQuality = qualityScore(b) - qualityScore(a);
      if (byQuality !== 0) return byQuality;

      if (a.source !== b.source) {
        return a.source === 'curated' ? -1 : 1;
      }

      if (a.name.length !== b.name.length) {
        return a.name.length - b.name.length;
      }

      return a.name.localeCompare(b.name);
    });
  }

  const selected: CanonicalCandidate[] = [];

  for (const domain of Object.keys(CANONICAL_TARGET_COUNTS) as DomainCode[]) {
    const target = CANONICAL_TARGET_COUNTS[domain];
    const bucket = byDomain[domain];
    if (bucket.length < target) {
      throw new Error(
        `Insufficient candidates for domain ${domain}. Required ${target}, available ${bucket.length}.`
      );
    }
    selected.push(...bucket.slice(0, target));
  }

  return selected;
}

function buildSql(selected: CanonicalCandidate[]): string {
  const rows = selected.map((candidate, index) => {
    const slug = slugify(candidate.name);
    const tags = candidate.tags.length ? candidate.tags : ['taxonomy-wave'];

    return `    (${index + 1}, ${candidate.catId}, ${candidate.subcatId}, ${candidate.l3Id}, ${sqlString(slug)}, ${sqlString(candidate.name)}, ${sqlString(candidate.description)}, ${sqlArray(tags)}, ${sqlString(candidate.source)}, ${sqlString(candidate.priority)})`;
  });

  return `-- Migration: Broad canonical taxonomy expansion wave for PRO-39
-- Date: 2026-02-25
-- Purpose:
--   - Insert a balanced canonical expansion wave across all six L1 domains
--   - Keep inserts deterministic and idempotent via slug/name normalization checks
--   - Preserve API contracts while broadening direct-term search coverage

WITH curated(
  seed_order,
  cat_id,
  subcat_id,
  l3_id,
  slug,
  name_en,
  description_en,
  tags,
  source,
  priority
) AS (
  VALUES
${rows.join(',\n')}
),
max_skill AS (
  SELECT GREATEST(COALESCE(MAX(skill_id), 0) + 1, 96001) AS base_skill_id
  FROM public.skills_taxonomy
),
prepared AS (
  SELECT
    c.seed_order,
    c.cat_id,
    c.subcat_id,
    c.l3_id,
    c.slug,
    c.name_en,
    c.description_en,
    c.tags,
    c.source,
    c.priority,
    (SELECT base_skill_id FROM max_skill) + c.seed_order - 1 AS skill_id,
    public.normalize_skill_alias(c.name_en) AS normalized_name
  FROM curated c
),
validated AS (
  SELECT p.*
  FROM prepared p
  INNER JOIN public.skills_l3 l3
    ON l3.cat_id = p.cat_id
   AND l3.subcat_id = p.subcat_id
   AND l3.l3_id = p.l3_id
),
filtered AS (
  SELECT v.*
  FROM validated v
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.skills_taxonomy st
    WHERE lower(st.slug) = lower(v.slug)
  )
    AND NOT EXISTS (
      SELECT 1
      FROM public.skills_taxonomy st
      WHERE public.normalize_skill_alias(COALESCE(st.name_i18n->>'en', '')) = v.normalized_name
    )
),
inserted AS (
  INSERT INTO public.skills_taxonomy (
    code,
    cat_id,
    subcat_id,
    l3_id,
    skill_id,
    slug,
    name_i18n,
    aliases_i18n,
    description_i18n,
    tags,
    status,
    version
  )
  SELECT
    LPAD(f.cat_id::text, 2, '0') || '.' ||
    LPAD(f.subcat_id::text, 3, '0') || '.' ||
    LPAD(f.l3_id::text, 3, '0') || '.' ||
    LPAD(f.skill_id::text, 5, '0') AS code,
    f.cat_id,
    f.subcat_id,
    f.l3_id,
    f.skill_id,
    f.slug,
    jsonb_build_object('en', f.name_en) AS name_i18n,
    '[]'::jsonb AS aliases_i18n,
    jsonb_build_object('en', f.description_en) AS description_i18n,
    f.tags,
    'active'::text,
    1
  FROM filtered f
  ON CONFLICT (code) DO NOTHING
  RETURNING code
)
SELECT COUNT(*)::INT AS inserted_count
FROM inserted;
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

  const [subcategories, l3Rows, existingSkills] = await Promise.all([
    fetchAllRows<SkillsSubcategory>(
      supabase,
      'skills_subcategories',
      'cat_id, subcat_id, slug, name_i18n'
    ),
    fetchAllRows<SkillsL3>(supabase, 'skills_l3', 'cat_id, subcat_id, l3_id, slug, name_i18n'),
    fetchAllRows<ExistingSkill>(supabase, 'skills_taxonomy', 'code, slug, name_i18n'),
  ]);

  const maps = buildMappings(subcategories, l3Rows);
  const { externalSkills, descriptionByNormalizedName } = loadExternalSources();

  const existingNormalizedNames = new Set(
    existingSkills.map((row) => normalize(row.name_i18n?.en || '')).filter(Boolean)
  );
  const existingSlugs = new Set(
    existingSkills.map((row) => (row.slug || '').toLowerCase()).filter(Boolean)
  );

  const manualCandidates = buildManualCandidates();
  const externalCandidates = externalSkills
    .map((row) => resolveExternalCandidate(row, maps, descriptionByNormalizedName))
    .filter((row): row is CanonicalCandidate => Boolean(row));

  const allCandidates = uniqueByNameAndSlug([...manualCandidates, ...externalCandidates]);
  const filteredCandidates = removeExisting(allCandidates, existingNormalizedNames, existingSlugs);
  const selected = selectBalancedWave(filteredCandidates);

  const sql = buildSql(selected);
  fs.mkdirSync(path.dirname(DEFAULT_OUTPUT_SQL), { recursive: true });
  fs.writeFileSync(DEFAULT_OUTPUT_SQL, sql, 'utf8');

  fs.mkdirSync(path.dirname(DEFAULT_OUTPUT_JSON), { recursive: true });
  fs.writeFileSync(
    DEFAULT_OUTPUT_JSON,
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        total: selected.length,
        by_domain: selected.reduce<Record<string, number>>((acc, item) => {
          acc[item.domain] = (acc[item.domain] || 0) + 1;
          return acc;
        }, {}),
        candidates: selected.map((item) => ({
          domain: item.domain,
          catId: item.catId,
          subcatId: item.subcatId,
          l3Id: item.l3Id,
          name: item.name,
          slug: slugify(item.name),
          description: item.description,
          tags: item.tags,
          source: item.source,
          priority: item.priority,
        })),
        alias_seed_references: CURATED_ALIAS_MAP,
      },
      null,
      2
    ),
    'utf8'
  );

  console.log('[taxonomy-build-canonical-wave] Generated canonical wave migration:');
  console.log(`- SQL: ${path.relative(process.cwd(), DEFAULT_OUTPUT_SQL)}`);
  console.log(`- Snapshot: ${path.relative(process.cwd(), DEFAULT_OUTPUT_JSON)}`);
  console.log(`- Total candidates selected: ${selected.length}`);

  for (const domain of Object.keys(CANONICAL_TARGET_COUNTS) as DomainCode[]) {
    const count = selected.filter((candidate) => candidate.domain === domain).length;
    console.log(`  - ${domain}: ${count}`);
  }
}

main().catch((error) => {
  console.error('[taxonomy-build-canonical-wave] Failed:', error.message);
  process.exit(1);
});
