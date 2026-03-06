import { and, eq, sql } from 'drizzle-orm';

import { getSkillVariations } from '@/lib/ai/nlp-extractor';
import { db } from '@/db';
import { skillsTaxonomy } from '@/db/schema';
import { getRows } from '@/lib/db/rows';
import {
  computeEvidenceQuality,
  computeLexicalOverlap,
  getAmbiguousTokenHints,
  hasStrongExactOrSynonymSignal,
  isAmbiguousTokenWithoutDisambiguation,
  shouldRejectWeakTopSuggestion,
} from '@/lib/expertise/skill-confidence';

const ATLAS_CACHE_TTL_MS = 10 * 60 * 1000;
const DEFAULT_LIMIT = 8;
const MAX_QUERY_VARIANTS = 12;

type CandidateCategory =
  | 'technical'
  | 'soft_skills'
  | 'tools_technologies'
  | 'languages'
  | 'certifications'
  | 'other';

type MatchMethod = 'exact' | 'synonym' | 'fuzzy' | 'semantic';

type AtlasCanonicalRow = {
  code: string;
  catId: number;
  subcatId: number;
  l3Id: number;
  nameI18n: unknown;
  aliasesI18n: unknown;
  descriptionI18n: unknown;
  tags: string[] | null;
};

type AtlasAliasRow = {
  skill_code: string;
  alias: string;
  alias_norm: string;
  confidence: number | string | null;
};

type SearchVariant = {
  value: string;
  boost: number;
};

type AtlasAlias = {
  alias: string;
  strict: string;
  loose: string;
  confidence: number;
};

type AtlasSkill = {
  skillId: string;
  skillName: string;
  strictName: string;
  looseName: string;
  catId: number;
  subcatId: number;
  l3Id: number;
  tags: string[];
  aliases: AtlasAlias[];
};

type AtlasCache = {
  loadedAt: number;
  skills: AtlasSkill[];
};

type RankedMatch = {
  skill_id: string;
  skill_name: string;
  match_method: MatchMethod;
  score: number;
  match_source: 'canonical' | 'alias';
  matched_query: string;
  matched_label: string;
  lexical_overlap: number;
};

export type AtlasSearchMatch = RankedMatch;

export type AtlasVerifierSuggestion = {
  skill_id: string;
  skill_name: string;
  match_method: MatchMethod;
  score: number;
};

export type AtlasVerificationCandidate = {
  raw_skill_text: string;
  category: CandidateCategory;
  evidence_snippets: string[];
  suggestions: AtlasVerifierSuggestion[];
};

let atlasCache: AtlasCache | null = null;

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeDiacritics(value: string): string {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
}

function normalizeStrict(value: string): string {
  return normalizeDiacritics(value)
    .toLowerCase()
    .replace(/[’'`]/g, '')
    .replace(/&/g, ' and ')
    .replace(/\bc\s*\+\+\b/g, ' cplusplus ')
    .replace(/\bc\s*#\b/g, ' csharp ')
    .replace(/\bnode\s*\.\s*js\b/g, ' nodejs ')
    .replace(/\breact\s*\.\s*js\b/g, ' reactjs ')
    .replace(/\bnext\s*\.\s*js\b/g, ' nextjs ')
    .replace(/\bci\s*\/\s*cd\b/g, ' cicd ')
    .replace(/\b\.\s*net\b/g, ' dotnet ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeLoose(value: string): string {
  return normalizeStrict(value).replace(/\s+/g, ' ').trim();
}

function parseAliases(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const aliases: string[] = [];
  for (const entry of value) {
    if (typeof entry === 'string') {
      const trimmed = entry.trim();
      if (trimmed) {
        aliases.push(trimmed);
      }
      continue;
    }

    if (entry && typeof entry === 'object') {
      for (const localized of Object.values(entry as Record<string, unknown>)) {
        if (typeof localized === 'string') {
          const trimmed = localized.trim();
          if (trimmed) {
            aliases.push(trimmed);
          }
        }
      }
    }
  }

  return Array.from(new Set(aliases));
}

async function queryCanonicalRows(): Promise<AtlasCanonicalRow[]> {
  const rows = await db
    .select({
      code: skillsTaxonomy.code,
      catId: skillsTaxonomy.catId,
      subcatId: skillsTaxonomy.subcatId,
      l3Id: skillsTaxonomy.l3Id,
      nameI18n: skillsTaxonomy.nameI18n,
      aliasesI18n: skillsTaxonomy.aliasesI18n,
      descriptionI18n: skillsTaxonomy.descriptionI18n,
      tags: skillsTaxonomy.tags,
    })
    .from(skillsTaxonomy)
    .where(and(eq(skillsTaxonomy.status, 'active')));

  return rows;
}

async function queryAliasRows(): Promise<AtlasAliasRow[]> {
  try {
    const result = await db.execute(sql`
      SELECT skill_code, alias, alias_norm, confidence
      FROM public.skills_taxonomy_aliases
      WHERE status = 'active' AND locale = 'en'
    `);

    return getRows(result) as AtlasAliasRow[];
  } catch {
    return [];
  }
}

async function loadAtlasCache(): Promise<AtlasCache> {
  if (atlasCache && Date.now() - atlasCache.loadedAt < ATLAS_CACHE_TTL_MS) {
    return atlasCache;
  }

  const [canonicalRows, aliasRows] = await Promise.all([queryCanonicalRows(), queryAliasRows()]);
  const aliasesBySkill = new Map<string, AtlasAlias[]>();

  for (const aliasRow of aliasRows) {
    const alias = aliasRow.alias?.trim();
    if (!alias || !aliasRow.skill_code) {
      continue;
    }

    const bucket = aliasesBySkill.get(aliasRow.skill_code) || [];
    bucket.push({
      alias,
      strict: normalizeStrict(alias),
      loose: normalizeLoose(aliasRow.alias_norm || alias),
      confidence:
        typeof aliasRow.confidence === 'number'
          ? clamp(aliasRow.confidence)
          : typeof aliasRow.confidence === 'string' && Number.isFinite(Number(aliasRow.confidence))
            ? clamp(Number(aliasRow.confidence))
            : 1,
    });
    aliasesBySkill.set(aliasRow.skill_code, bucket);
  }

  const skills = canonicalRows
    .map((row) => {
      const skillName = ((row.nameI18n as { en?: string } | null)?.en || '').trim();
      if (!skillName) {
        return null;
      }

      const aliases = new Map<string, AtlasAlias>();
      for (const alias of parseAliases(row.aliasesI18n)) {
        const strict = normalizeStrict(alias);
        if (!strict) {
          continue;
        }
        aliases.set(strict, {
          alias,
          strict,
          loose: normalizeLoose(alias),
          confidence: 0.92,
        });
      }

      for (const alias of aliasesBySkill.get(row.code) || []) {
        aliases.set(alias.strict, alias);
      }

      return {
        skillId: row.code,
        skillName,
        strictName: normalizeStrict(skillName),
        looseName: normalizeLoose(skillName),
        catId: row.catId,
        subcatId: row.subcatId,
        l3Id: row.l3Id,
        tags: Array.isArray(row.tags)
          ? row.tags.filter((value): value is string => typeof value === 'string')
          : [],
        aliases: Array.from(aliases.values()),
      } satisfies AtlasSkill;
    })
    .filter((skill): skill is AtlasSkill => Boolean(skill));

  atlasCache = {
    loadedAt: Date.now(),
    skills,
  };

  return atlasCache;
}

function methodWeight(method: MatchMethod): number {
  if (method === 'exact') return 4;
  if (method === 'synonym') return 3;
  if (method === 'fuzzy') return 2;
  return 1;
}

function fuzzySimilarity(query: string, label: string): number {
  const normalizedQuery = normalizeLoose(query);
  const normalizedLabel = normalizeLoose(label);
  if (!normalizedQuery || !normalizedLabel) {
    return 0;
  }

  let score = computeLexicalOverlap(normalizedQuery, normalizedLabel);
  if (normalizedLabel === normalizedQuery) {
    return 1;
  }

  if (normalizedLabel.startsWith(normalizedQuery) || normalizedQuery.startsWith(normalizedLabel)) {
    score = Math.max(score, 0.72);
  }

  if (normalizedLabel.includes(normalizedQuery) || normalizedQuery.includes(normalizedLabel)) {
    score = Math.max(score, 0.66);
  }

  if (normalizedQuery.length <= 3 && normalizedLabel.length > normalizedQuery.length) {
    score -= 0.12;
  }

  return clamp(score);
}

function categoryAlignmentBoost(
  category: CandidateCategory | undefined,
  skill: AtlasSkill
): number {
  if (!category || category === 'other') {
    return 0;
  }

  const name = skill.skillName.toLowerCase();
  const tags = new Set(skill.tags.map((tag) => tag.toLowerCase()));

  if (category === 'languages') {
    return skill.catId === 4 || tags.has('language') || name.includes(' language') ? 0.08 : -0.04;
  }

  if (category === 'certifications') {
    return tags.has('certification') || name.includes('certification') ? 0.08 : -0.04;
  }

  if (category === 'soft_skills') {
    return skill.catId === 1 ? 0.04 : 0;
  }

  if (category === 'tools_technologies') {
    return skill.catId === 3 ? 0.05 : 0;
  }

  if (category === 'technical') {
    return skill.catId === 3 ? 0.03 : 0;
  }

  return 0;
}

function buildSearchVariants(params: {
  query: string;
  evidenceSnippets: string[];
}): SearchVariant[] {
  const variants = new Map<string, number>();
  const push = (value: string, boost: number) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    const key = trimmed.toLowerCase();
    const existing = variants.get(key);
    variants.set(key, existing == null ? boost : Math.max(existing, boost));
  };

  push(params.query, 0.18);

  for (const variation of getSkillVariations(params.query).slice(0, MAX_QUERY_VARIANTS)) {
    push(variation, 0.14);
  }

  const hints = getAmbiguousTokenHints(params.query);
  const evidenceHaystack = params.evidenceSnippets.join(' ').toLowerCase();
  for (const hint of hints) {
    push(hint, evidenceHaystack.includes(hint.toLowerCase()) ? 0.18 : 0.08);
  }

  return Array.from(variants.entries())
    .map(([value, boost]) => ({ value, boost }))
    .sort((left, right) => right.boost - left.boost)
    .slice(0, MAX_QUERY_VARIANTS);
}

function rankSkillMatch(params: {
  skill: AtlasSkill;
  variants: SearchVariant[];
  evidenceSnippets: string[];
  category?: CandidateCategory;
}): RankedMatch | null {
  const evidenceHaystack = params.evidenceSnippets.join(' ').toLowerCase();
  const evidenceQuality = computeEvidenceQuality(
    params.variants[0]?.value || '',
    params.evidenceSnippets
  );
  const categoryBoost = categoryAlignmentBoost(params.category, params.skill);
  let best: RankedMatch | null = null;

  const consider = (
    label: string,
    source: 'canonical' | 'alias',
    aliasConfidence = 1,
    variant: SearchVariant
  ) => {
    const strictVariant = normalizeStrict(variant.value);
    const strictLabel = normalizeStrict(label);
    const looseVariant = normalizeLoose(variant.value);
    const looseLabel = normalizeLoose(label);
    if (!strictVariant || !strictLabel || !looseVariant || !looseLabel) {
      return;
    }

    const lexicalOverlap = computeLexicalOverlap(variant.value, label);
    const fuzzyScore = fuzzySimilarity(variant.value, label);
    const evidenceBoost =
      evidenceHaystack.includes(looseLabel) || evidenceHaystack.includes(strictLabel) ? 0.05 : 0;

    let match: RankedMatch | null = null;

    if (strictVariant === strictLabel) {
      match = {
        skill_id: params.skill.skillId,
        skill_name: params.skill.skillName,
        match_method: source === 'alias' ? 'synonym' : 'exact',
        score: clamp(
          (source === 'alias' ? 0.975 : 0.995) + variant.boost * 0.2 + evidenceBoost + categoryBoost
        ),
        match_source: source,
        matched_query: variant.value,
        matched_label: label,
        lexical_overlap: lexicalOverlap,
      };
    } else if (looseVariant === looseLabel) {
      match = {
        skill_id: params.skill.skillId,
        skill_name: params.skill.skillName,
        match_method: source === 'alias' ? 'synonym' : 'exact',
        score: clamp(
          (source === 'alias' ? 0.952 : 0.972) +
            variant.boost * 0.16 +
            evidenceBoost +
            categoryBoost
        ),
        match_source: source,
        matched_query: variant.value,
        matched_label: label,
        lexical_overlap: lexicalOverlap,
      };
    } else if (fuzzyScore >= 0.58) {
      const sourceBoost = source === 'alias' ? aliasConfidence * 0.04 : 0;
      match = {
        skill_id: params.skill.skillId,
        skill_name: params.skill.skillName,
        match_method: fuzzyScore >= 0.82 ? 'fuzzy' : 'semantic',
        score: clamp(
          0.52 +
            fuzzyScore * 0.34 +
            variant.boost * 0.1 +
            evidenceBoost +
            categoryBoost +
            sourceBoost
        ),
        match_source: source,
        matched_query: variant.value,
        matched_label: label,
        lexical_overlap: lexicalOverlap,
      };
    }

    if (!match) {
      return;
    }

    if (
      !best ||
      methodWeight(match.match_method) > methodWeight(best.match_method) ||
      (methodWeight(match.match_method) === methodWeight(best.match_method) &&
        match.score > best.score) ||
      (methodWeight(match.match_method) === methodWeight(best.match_method) &&
        match.score === best.score &&
        match.lexical_overlap > best.lexical_overlap)
    ) {
      best = match;
    }
  };

  for (const variant of params.variants) {
    consider(params.skill.skillName, 'canonical', 1, variant);
    for (const alias of params.skill.aliases) {
      consider(alias.alias, 'alias', alias.confidence, variant);
    }
  }

  if (!best) {
    return null;
  }

  const bestMatch: RankedMatch = best;

  if (
    isAmbiguousTokenWithoutDisambiguation({
      rawSkillText: params.variants[0]?.value || '',
      evidenceSnippets: params.evidenceSnippets,
      suggestionLabel: bestMatch.skill_name,
    })
  ) {
    bestMatch.score = clamp(bestMatch.score * 0.9);
  }

  if (
    bestMatch.match_method === 'semantic' &&
    (bestMatch.lexical_overlap < 0.34 || evidenceQuality < 0.32)
  ) {
    return null;
  }

  if (bestMatch.match_method === 'fuzzy' && bestMatch.lexical_overlap < 0.28) {
    return null;
  }

  return bestMatch;
}

function dedupeMatches(matches: RankedMatch[], limit: number): RankedMatch[] {
  const bySkillId = new Map<string, RankedMatch>();

  for (const match of matches) {
    const existing = bySkillId.get(match.skill_id);
    if (!existing) {
      bySkillId.set(match.skill_id, match);
      continue;
    }

    if (
      methodWeight(match.match_method) > methodWeight(existing.match_method) ||
      (methodWeight(match.match_method) === methodWeight(existing.match_method) &&
        match.score > existing.score) ||
      (methodWeight(match.match_method) === methodWeight(existing.match_method) &&
        match.score === existing.score &&
        match.lexical_overlap > existing.lexical_overlap)
    ) {
      bySkillId.set(match.skill_id, match);
    }
  }

  return Array.from(bySkillId.values())
    .sort((left, right) => {
      const methodDiff = methodWeight(right.match_method) - methodWeight(left.match_method);
      if (methodDiff !== 0) {
        return methodDiff;
      }
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      if (right.lexical_overlap !== left.lexical_overlap) {
        return right.lexical_overlap - left.lexical_overlap;
      }
      return left.skill_name.localeCompare(right.skill_name);
    })
    .slice(0, limit);
}

export async function searchAtlasSkillMatches(params: {
  query: string;
  evidenceSnippets?: string[];
  category?: CandidateCategory;
  limit?: number;
}): Promise<AtlasSearchMatch[]> {
  const query = params.query.trim();
  if (!query) {
    return [];
  }

  const limit = Math.max(1, Math.min(params.limit ?? DEFAULT_LIMIT, 10));
  const evidenceSnippets = (params.evidenceSnippets || [])
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 3);
  const variants = buildSearchVariants({ query, evidenceSnippets });
  const atlas = await loadAtlasCache();

  const ranked = dedupeMatches(
    atlas.skills
      .map((skill) =>
        rankSkillMatch({
          skill,
          variants,
          evidenceSnippets,
          category: params.category,
        })
      )
      .filter((entry): entry is RankedMatch => Boolean(entry)),
    limit
  );

  return ranked;
}

function mergeSuggestions(
  existing: AtlasVerifierSuggestion[],
  verified: AtlasVerifierSuggestion[],
  limit: number
): AtlasVerifierSuggestion[] {
  const bySkillId = new Map<string, AtlasVerifierSuggestion>();

  for (const suggestion of [...existing, ...verified]) {
    const current = bySkillId.get(suggestion.skill_id);
    if (!current) {
      bySkillId.set(suggestion.skill_id, suggestion);
      continue;
    }

    if (
      methodWeight(suggestion.match_method) > methodWeight(current.match_method) ||
      (methodWeight(suggestion.match_method) === methodWeight(current.match_method) &&
        suggestion.score > current.score)
    ) {
      bySkillId.set(suggestion.skill_id, suggestion);
    }
  }

  return Array.from(bySkillId.values())
    .sort((left, right) => {
      const methodDiff = methodWeight(right.match_method) - methodWeight(left.match_method);
      if (methodDiff !== 0) {
        return methodDiff;
      }
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return left.skill_name.localeCompare(right.skill_name);
    })
    .slice(0, limit);
}

export async function verifyAtlasSkillCandidate(params: {
  rawSkillText: string;
  category: CandidateCategory;
  evidenceSnippets: string[];
  suggestions: AtlasVerifierSuggestion[];
  limit?: number;
}): Promise<{
  suggestions: AtlasVerifierSuggestion[];
  verifiedSuggestions: AtlasVerifierSuggestion[];
  forceUnmapped: boolean;
}> {
  const limit = Math.max(1, Math.min(params.limit ?? DEFAULT_LIMIT, 10));
  const verifiedSuggestions = (
    await searchAtlasSkillMatches({
      query: params.rawSkillText,
      evidenceSnippets: params.evidenceSnippets,
      category: params.category,
      limit,
    })
  ).map((entry) => ({
    skill_id: entry.skill_id,
    skill_name: entry.skill_name,
    match_method: entry.match_method,
    score: entry.score,
  }));

  const mergedSuggestions = mergeSuggestions(params.suggestions, verifiedSuggestions, limit);
  const existingCandidate = {
    raw_skill_text: params.rawSkillText,
    confidence: 0.7,
    evidence_snippets: params.evidenceSnippets,
    suggestions: params.suggestions,
  };
  const verifiedCandidate = {
    raw_skill_text: params.rawSkillText,
    confidence: 0.7,
    evidence_snippets: params.evidenceSnippets,
    suggestions: verifiedSuggestions,
  };
  const mergedCandidate = {
    raw_skill_text: params.rawSkillText,
    confidence: 0.7,
    evidence_snippets: params.evidenceSnippets,
    suggestions: mergedSuggestions,
  };

  const topExisting = params.suggestions[0]?.skill_id || null;
  const topVerified = verifiedSuggestions[0]?.skill_id || null;
  const disagreement =
    topExisting &&
    topVerified &&
    topExisting !== topVerified &&
    !hasStrongExactOrSynonymSignal(existingCandidate) &&
    !hasStrongExactOrSynonymSignal(verifiedCandidate);

  return {
    suggestions: mergedSuggestions,
    verifiedSuggestions,
    forceUnmapped:
      mergedSuggestions.length === 0 ||
      disagreement ||
      shouldRejectWeakTopSuggestion(mergedCandidate),
  };
}
