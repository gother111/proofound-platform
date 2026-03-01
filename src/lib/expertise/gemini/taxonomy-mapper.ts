import { sql } from 'drizzle-orm';

import { db } from '@/db';
import { getRows } from '@/lib/db/rows';
import type { CvImportCandidate } from '@/lib/expertise/cv-import-suggest';
import type { GeminiSkillCandidate } from '@/lib/expertise/gemini/schemas';

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
  return rows
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
}

export async function mapGeminiCandidatesToCvImportCandidates(params: {
  documentId: string;
  extractedSkills: GeminiSkillCandidate[];
  suggestionsLimit: number;
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

  const candidates: CvImportCandidate[] = [];
  for (let index = 0; index < deduped.length; index += 1) {
    const skill = deduped[index];
    const suggestions = await searchTaxonomySkills(skill.raw_skill_text, params.suggestionsLimit);
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
