#!/usr/bin/env tsx
/**
 * Backfills skills.skill_code for custom skills when a confident taxonomy match exists.
 *
 * Matching order:
 * 1) Exact normalized taxonomy name
 * 2) Exact slug
 * 3) search_skills_smart single high-confidence match
 *
 * Usage:
 *   npx tsx scripts/backfill-skill-codes.ts --dry-run
 *   npx tsx scripts/backfill-skill-codes.ts --apply
 */

import { config as loadEnv } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

loadEnv({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const OUTPUT_DIR = path.join(process.cwd(), 'output');
const PAGE_SIZE = 1000;

type SkillRow = {
  id: string;
  profile_id: string;
  skill_id: string;
  skill_code: string | null;
};

type TaxonomyRow = {
  code: string;
  slug: string;
  name_i18n: { en?: string };
};

type SearchMatch = {
  code: string;
  name_i18n: { en?: string };
  relevance_score?: number;
  slug?: string;
};

type MatchResult =
  | {
      status: 'matched';
      method: 'exact_name' | 'exact_slug' | 'search';
      code: string;
      confidence: number;
      details: string;
    }
  | { status: 'ambiguous'; reason: string; candidates: string[] }
  | { status: 'unmatched'; reason: string };

function normalizeText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, ' ')
    .replace(/[_\s]+/g, ' ')
    .trim()
    .toLowerCase();
}

function toSlug(value: string): string {
  return normalizeText(value).replace(/\s+/g, '-');
}

function extractCustomSkillName(skillId: string): string | null {
  if (!skillId.startsWith('custom-')) return null;
  const parts = skillId.split('-');
  if (parts.length <= 4) return null;
  return parts.slice(4).join(' ').trim();
}

function ensureOutputDir() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function toIsoFileStamp(date: Date): string {
  return date.toISOString().replace(/[:.]/g, '-');
}

async function fetchCustomSkills(): Promise<SkillRow[]> {
  const rows: SkillRow[] = [];
  let from = 0;
  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from('skills')
      .select('id, profile_id, skill_id, skill_code')
      .is('skill_code', null)
      .like('skill_id', 'custom-%')
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch custom skills (${from}-${to}): ${error.message}`);
    }

    const page = (data || []) as SkillRow[];
    if (page.length === 0) break;
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return rows;
}

async function fetchTaxonomyRows(): Promise<TaxonomyRow[]> {
  const rows: TaxonomyRow[] = [];
  let from = 0;
  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from('skills_taxonomy')
      .select('code, slug, name_i18n')
      .eq('status', 'active')
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch taxonomy rows (${from}-${to}): ${error.message}`);
    }

    const page = (data || []) as TaxonomyRow[];
    if (page.length === 0) break;
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return rows;
}

async function searchSkill(query: string): Promise<SearchMatch[]> {
  const { data, error } = await supabase.rpc('search_skills_smart', {
    search_query: query,
    result_limit: 5,
  });

  if (error) {
    return [];
  }

  return (data || []) as SearchMatch[];
}

function chooseFromSearch(targetName: string, searchResults: SearchMatch[]): MatchResult {
  if (searchResults.length === 0) {
    return { status: 'unmatched', reason: 'No search results returned' };
  }

  const top = searchResults[0];
  const second = searchResults[1];
  const topScore = top.relevance_score || 0;
  const secondScore = second?.relevance_score || 0;
  const normalizedTarget = normalizeText(targetName);
  const normalizedTop = normalizeText(top.name_i18n?.en || '');

  const scoreGap = topScore - secondScore;
  const isHighConfidence =
    topScore >= 80 && (searchResults.length === 1 || scoreGap >= 15 || secondScore < 65);
  const nameAligned =
    normalizedTop === normalizedTarget || toSlug(normalizedTop) === toSlug(normalizedTarget);

  if (isHighConfidence && nameAligned) {
    return {
      status: 'matched',
      method: 'search',
      code: top.code,
      confidence: topScore,
      details: `top=${topScore.toFixed(2)}, second=${secondScore.toFixed(2)}, gap=${scoreGap.toFixed(2)}`,
    };
  }

  return {
    status: 'ambiguous',
    reason: `Search confidence too low or multiple close candidates (top=${topScore.toFixed(2)}, second=${secondScore.toFixed(2)})`,
    candidates: searchResults.map(
      (result) => `${result.code}:${result.name_i18n?.en || 'unknown'}`
    ),
  };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const apply = args.has('--apply');
  const dryRun = !apply || args.has('--dry-run');

  console.log(`🔧 Skill code backfill ${apply ? '(APPLY)' : '(DRY RUN)'}\n`);

  const [customSkills, taxonomyRows] = await Promise.all([
    fetchCustomSkills(),
    fetchTaxonomyRows(),
  ]);
  console.log(`Custom skills with null skill_code: ${customSkills.length}`);
  console.log(`Active taxonomy rows available: ${taxonomyRows.length}`);

  const normalizedNameMap = new Map<string, string[]>();
  const slugMap = new Map<string, string[]>();

  for (const row of taxonomyRows) {
    const normalizedName = normalizeText(row.name_i18n?.en || '');
    if (normalizedName) {
      const existing = normalizedNameMap.get(normalizedName) || [];
      existing.push(row.code);
      normalizedNameMap.set(normalizedName, existing);
    }

    const slug = (row.slug || '').toLowerCase();
    if (slug) {
      const existing = slugMap.get(slug) || [];
      existing.push(row.code);
      slugMap.set(slug, existing);
    }
  }

  const matched: Array<{
    skillId: string;
    profileId: string;
    skillIdentifier: string;
    customName: string;
    code: string;
    method: string;
    confidence: number;
    details: string;
  }> = [];
  const unmatched: Array<{
    skillId: string;
    profileId: string;
    skillIdentifier: string;
    customName: string;
    reason: string;
  }> = [];
  const ambiguous: Array<{
    skillId: string;
    profileId: string;
    skillIdentifier: string;
    customName: string;
    reason: string;
    candidates: string[];
  }> = [];

  for (const skill of customSkills) {
    const customName = extractCustomSkillName(skill.skill_id);
    if (!customName) {
      unmatched.push({
        skillId: skill.id,
        profileId: skill.profile_id,
        skillIdentifier: skill.skill_id,
        customName: '',
        reason: 'Could not parse custom skill name from skill_id',
      });
      continue;
    }

    const normalized = normalizeText(customName);
    const slug = toSlug(customName);

    const exactNameMatches = normalizedNameMap.get(normalized) || [];
    if (exactNameMatches.length === 1) {
      matched.push({
        skillId: skill.id,
        profileId: skill.profile_id,
        skillIdentifier: skill.skill_id,
        customName,
        code: exactNameMatches[0],
        method: 'exact_name',
        confidence: 100,
        details: 'single exact normalized name match',
      });
      continue;
    }
    if (exactNameMatches.length > 1) {
      ambiguous.push({
        skillId: skill.id,
        profileId: skill.profile_id,
        skillIdentifier: skill.skill_id,
        customName,
        reason: 'Multiple exact name matches',
        candidates: exactNameMatches,
      });
      continue;
    }

    const exactSlugMatches = slugMap.get(slug) || [];
    if (exactSlugMatches.length === 1) {
      matched.push({
        skillId: skill.id,
        profileId: skill.profile_id,
        skillIdentifier: skill.skill_id,
        customName,
        code: exactSlugMatches[0],
        method: 'exact_slug',
        confidence: 95,
        details: 'single exact slug match',
      });
      continue;
    }
    if (exactSlugMatches.length > 1) {
      ambiguous.push({
        skillId: skill.id,
        profileId: skill.profile_id,
        skillIdentifier: skill.skill_id,
        customName,
        reason: 'Multiple exact slug matches',
        candidates: exactSlugMatches,
      });
      continue;
    }

    const searchResults = await searchSkill(customName);
    const searchMatch = chooseFromSearch(customName, searchResults);
    if (searchMatch.status === 'matched') {
      matched.push({
        skillId: skill.id,
        profileId: skill.profile_id,
        skillIdentifier: skill.skill_id,
        customName,
        code: searchMatch.code,
        method: searchMatch.method,
        confidence: searchMatch.confidence,
        details: searchMatch.details,
      });
      continue;
    }

    if (searchMatch.status === 'ambiguous') {
      ambiguous.push({
        skillId: skill.id,
        profileId: skill.profile_id,
        skillIdentifier: skill.skill_id,
        customName,
        reason: searchMatch.reason,
        candidates: searchMatch.candidates,
      });
      continue;
    }

    unmatched.push({
      skillId: skill.id,
      profileId: skill.profile_id,
      skillIdentifier: skill.skill_id,
      customName,
      reason: searchMatch.reason,
    });
  }

  console.log(`\nMatched: ${matched.length}`);
  console.log(`Ambiguous: ${ambiguous.length}`);
  console.log(`Unmatched: ${unmatched.length}`);

  let appliedCount = 0;
  if (!dryRun) {
    for (const match of matched) {
      const { error } = await supabase
        .from('skills')
        .update({ skill_code: match.code })
        .eq('id', match.skillId)
        .is('skill_code', null);
      if (error) {
        ambiguous.push({
          skillId: match.skillId,
          profileId: match.profileId,
          skillIdentifier: match.skillIdentifier,
          customName: match.customName,
          reason: `Update failed: ${error.message}`,
          candidates: [match.code],
        });
        continue;
      }
      appliedCount += 1;
    }
    console.log(`Applied updates: ${appliedCount}`);
  }

  ensureOutputDir();
  const timestamp = toIsoFileStamp(new Date());
  const reportPath = path.join(OUTPUT_DIR, `skill-code-backfill-report-${timestamp}.json`);

  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        mode: dryRun ? 'dry-run' : 'apply',
        totals: {
          sourceCustomSkills: customSkills.length,
          matched: matched.length,
          ambiguous: ambiguous.length,
          unmatched: unmatched.length,
          applied: appliedCount,
        },
        matched,
        ambiguous,
        unmatched,
      },
      null,
      2
    ),
    'utf8'
  );

  console.log(`Backfill report: ${path.relative(process.cwd(), reportPath)}`);
}

main().catch((error) => {
  console.error('❌ Backfill failed:', error);
  process.exit(1);
});
