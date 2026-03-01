import { sql } from 'drizzle-orm';

import { db } from '@/db';
import { getRows } from '@/lib/db/rows';
import type { CvImportCandidate } from '@/lib/expertise/cv-import-suggest';
import type { GeminiSkillCandidate } from '@/lib/expertise/gemini/schemas';
import type { TaxonomyShortlistSkill } from '@/lib/expertise/gemini/taxonomy-shortlist';

type SearchSkillRow = {
  code: string;
  name_i18n: { en?: string } | null;
  match_type: string | null;
  relevance_score: number | string | null;
};

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeEvidenceSnippets(values: string[]): string[] {
  const unique = new Set<string>();
  for (const raw of values) {
    const value = raw.trim();
    if (!value) continue;
    unique.add(value.slice(0, 280));
    if (unique.size >= 3) {
      break;
    }
  }
  return Array.from(unique);
}

function normalizeRawSkill(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9+.#\-/\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenOverlap(raw: string, label: string): number {
  const rawTokens = new Set(normalizeRawSkill(raw).split(' ').filter(Boolean));
  const labelTokens = new Set(normalizeRawSkill(label).split(' ').filter(Boolean));
  if (rawTokens.size === 0 || labelTokens.size === 0) {
    return 0;
  }
  let overlap = 0;
  for (const token of rawTokens) {
    if (labelTokens.has(token)) {
      overlap += 1;
    }
  }
  return clamp(overlap / Math.max(rawTokens.size, labelTokens.size));
}

function mapMatchMethod(matchType: string | null): 'exact' | 'synonym' | 'fuzzy' | 'semantic' {
  const value = (matchType || '').toLowerCase();
  if (value.includes('exact_alias')) {
    return 'synonym';
  }
  if (value.includes('exact')) {
    return 'exact';
  }
  if (value.includes('alias')) {
    return 'synonym';
  }
  if (value.includes('fuzzy')) {
    return 'fuzzy';
  }
  return 'semantic';
}

function normalizeScore(value: number | string | null): number {
  if (typeof value === 'number') {
    return value > 1 ? clamp(value / 130) : clamp(value);
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed > 1 ? clamp(parsed / 130) : clamp(parsed);
    }
  }
  return 0.35;
}

function mergeSuggestions(
  entries: Array<{
    skillId: string;
    skillName: string;
    matchMethod: 'exact' | 'synonym' | 'fuzzy' | 'semantic';
    score: number;
  }>,
  limit: number
) {
  const byId = new Map<
    string,
    {
      skillId: string;
      skillName: string;
      matchMethod: 'exact' | 'synonym' | 'fuzzy' | 'semantic';
      score: number;
    }
  >();

  const methodWeight: Record<'exact' | 'synonym' | 'fuzzy' | 'semantic', number> = {
    exact: 4,
    synonym: 3,
    fuzzy: 2,
    semantic: 1,
  };

  for (const entry of entries) {
    const existing = byId.get(entry.skillId);
    if (!existing) {
      byId.set(entry.skillId, entry);
      continue;
    }

    if (entry.score > existing.score) {
      byId.set(entry.skillId, entry);
      continue;
    }

    if (
      entry.score === existing.score &&
      methodWeight[entry.matchMethod] > methodWeight[existing.matchMethod]
    ) {
      byId.set(entry.skillId, entry);
    }
  }

  return Array.from(byId.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

async function searchTaxonomySkills(
  query: string,
  suggestionsLimit: number
): Promise<
  Array<{
    skillId: string;
    skillName: string;
    matchMethod: 'exact' | 'synonym' | 'fuzzy' | 'semantic';
    score: number;
  }>
> {
  const result = await db.execute(sql`
    SELECT code, name_i18n, match_type, relevance_score
    FROM public.search_skills_smart(${query}, ${suggestionsLimit})
    LIMIT ${suggestionsLimit};
  `);
  const rows = getRows(result) as SearchSkillRow[];
  const primaryMatches = rows
    .filter((row) => typeof row.code === 'string' && row.code.trim().length > 0)
    .map((row) => ({
      skillId: row.code,
      skillName:
        row.name_i18n && typeof row.name_i18n === 'object' && typeof row.name_i18n.en === 'string'
          ? row.name_i18n.en
          : row.code,
      matchMethod: mapMatchMethod(row.match_type),
      score: normalizeScore(row.relevance_score),
    }));

  if (primaryMatches.length > 0) {
    return primaryMatches.slice(0, suggestionsLimit);
  }

  const fallbackResult = await db.execute(sql`
    WITH normalized AS (
      SELECT
        trim(coalesce(${query}, '')) AS cleaned_query,
        public.normalize_skill_alias(${query}) AS normalized_query
    ),
    alias_exact AS (
      SELECT
        st.code,
        st.name_i18n,
        0.88::REAL AS relevance_score,
        'exact_alias'::TEXT AS match_type
      FROM public.skills_taxonomy_aliases a
      INNER JOIN public.skills_taxonomy st ON st.code = a.skill_code
      CROSS JOIN normalized n
      WHERE
        a.status = 'active'
        AND a.locale = 'en'
        AND (
          lower(a.alias) = lower(n.cleaned_query)
          OR a.alias_norm = n.normalized_query
        )
      LIMIT ${suggestionsLimit}
    ),
    canonical_fallback AS (
      SELECT
        st.code,
        st.name_i18n,
        0.62::REAL AS relevance_score,
        'canonical_ilike'::TEXT AS match_type
      FROM public.skills_taxonomy st
      CROSS JOIN normalized n
      WHERE
        st.status = 'active'
        AND (
          lower(st.name_i18n->>'en') LIKE '%' || lower(n.cleaned_query) || '%'
          OR lower(st.slug) LIKE '%' || lower(n.cleaned_query) || '%'
        )
      LIMIT ${suggestionsLimit}
    )
    SELECT code, name_i18n, relevance_score, match_type
    FROM alias_exact
    UNION ALL
    SELECT code, name_i18n, relevance_score, match_type
    FROM canonical_fallback
    LIMIT ${suggestionsLimit}
  `);

  const fallbackRows = getRows(fallbackResult) as SearchSkillRow[];
  return fallbackRows
    .filter((row) => typeof row.code === 'string' && row.code.trim().length > 0)
    .map((row) => ({
      skillId: row.code,
      skillName:
        row.name_i18n && typeof row.name_i18n === 'object' && typeof row.name_i18n.en === 'string'
          ? row.name_i18n.en
          : row.code,
      matchMethod: mapMatchMethod(row.match_type),
      score: normalizeScore(row.relevance_score),
    }))
    .slice(0, suggestionsLimit);
}

function shortlistHintSuggestions(params: {
  rawSkillText: string;
  shortlist: TaxonomyShortlistSkill[];
  suggestionsLimit: number;
}) {
  const normalizedRaw = normalizeRawSkill(params.rawSkillText);
  if (!normalizedRaw || params.shortlist.length === 0) {
    return [];
  }

  return params.shortlist
    .map((entry) => {
      const aliasLabel = [entry.skill_name, ...entry.aliases].join(' ');
      const overlap = tokenOverlap(normalizedRaw, aliasLabel);
      if (overlap <= 0) {
        return null;
      }
      const score = clamp(entry.relevance_score * 0.65 + overlap * 0.35);
      return {
        skillId: entry.skill_id,
        skillName: entry.skill_name,
        matchMethod: 'semantic' as const,
        score,
      };
    })
    .filter(
      (
        entry
      ): entry is {
        skillId: string;
        skillName: string;
        matchMethod: 'semantic';
        score: number;
      } => Boolean(entry)
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, params.suggestionsLimit);
}

function geminiHintSuggestions(skill: GeminiSkillCandidate) {
  const hints = skill.taxonomy_candidates || [];
  return hints
    .map((hint) => ({
      skillId: hint.skill_id,
      skillName: hint.skill_name,
      matchMethod: 'semantic' as const,
      score: clamp(hint.confidence),
    }))
    .sort((a, b) => b.score - a.score);
}

export async function mapGeminiCandidatesToCvImportCandidates(params: {
  documentId: string;
  extractedSkills: GeminiSkillCandidate[];
  suggestionsLimit: number;
  taxonomyShortlist?: TaxonomyShortlistSkill[];
}): Promise<CvImportCandidate[]> {
  const deduped: GeminiSkillCandidate[] = [];
  const seen = new Set<string>();

  for (const skill of params.extractedSkills) {
    const normalized = normalizeRawSkill(skill.raw_skill_text);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    deduped.push(skill);
  }

  const uniqueQueries = Array.from(
    new Set(deduped.map((skill) => skill.raw_skill_text.trim()).filter((skill) => skill.length > 0))
  );
  const lookupEntries = await Promise.all(
    uniqueQueries.map(async (query) => {
      const suggestions = await searchTaxonomySkills(query, params.suggestionsLimit);
      return [query, suggestions] as const;
    })
  );
  const lookup = new Map(lookupEntries);

  const candidates: CvImportCandidate[] = [];
  for (let index = 0; index < deduped.length; index += 1) {
    const skill = deduped[index];
    const dbSuggestions = lookup.get(skill.raw_skill_text.trim()) || [];
    const shortlistSuggestions = shortlistHintSuggestions({
      rawSkillText: skill.raw_skill_text,
      shortlist: params.taxonomyShortlist || [],
      suggestionsLimit: params.suggestionsLimit,
    });
    const hintSuggestions = geminiHintSuggestions(skill);
    const suggestions = mergeSuggestions(
      [...dbSuggestions, ...shortlistSuggestions, ...hintSuggestions],
      params.suggestionsLimit
    );
    const evidenceSnippets = normalizeEvidenceSnippets(skill.evidence_snippets);

    candidates.push({
      candidate_id: `${params.documentId}::gemini-${index}`,
      raw_skill_text: skill.raw_skill_text.trim(),
      category: skill.category,
      evidence_snippets:
        evidenceSnippets.length > 0 ? evidenceSnippets : [skill.raw_skill_text.trim()],
      confidence: clamp(skill.confidence),
      suggestions: suggestions.map((entry) => ({
        skill_id: entry.skillId,
        skill_name: entry.skillName,
        match_method: entry.matchMethod,
        score: clamp(entry.score),
      })),
      unmapped_candidate: suggestions.length === 0,
    });
  }

  return candidates;
}
