import type { ConfidenceBucket, SelectionRiskReason } from '@/lib/expertise/skill-confidence';
import { confidenceBucketForValue } from '@/lib/expertise/skill-confidence';

type MatchMethod = 'exact' | 'synonym' | 'fuzzy' | 'semantic';

type ReviewSuggestion = {
  skill_id: string;
  skill_name?: string;
  match_method: MatchMethod;
  score: number;
};

type ReviewCandidate = {
  raw_skill_text: string;
  category: string;
  confidence: number;
  suggestions: ReviewSuggestion[];
  already_in_profile?: boolean;
};

function normalizeForHash(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9+.#/\-\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function fnv1aHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function hashCvImportCandidate(rawSkillText: string): string {
  const normalized = normalizeForHash(rawSkillText);
  return normalized ? fnv1aHash(normalized) : 'empty';
}

export function hashCvImportQuery(value: string): string {
  const normalized = normalizeForHash(value);
  return normalized ? fnv1aHash(normalized) : 'empty';
}

export function buildCvImportReviewTelemetry(params: {
  action: string;
  candidate: ReviewCandidate;
  engineUsed?: string | null;
  riskReasons?: SelectionRiskReason[];
  selectedSkillId?: string | null;
  selectedSkillName?: string | null;
  selectionSource?: 'suggested' | 'manual';
  searchQuery?: string;
  resultCount?: number;
  unresolvedCount?: number;
  reviewOutcome?: string;
}): Record<string, unknown> {
  const topSuggestion = params.candidate.suggestions[0];
  const qualityBucket: ConfidenceBucket = confidenceBucketForValue(params.candidate.confidence);

  return {
    action: params.action,
    candidate_hash: hashCvImportCandidate(params.candidate.raw_skill_text),
    candidate_category: params.candidate.category,
    quality_bucket: qualityBucket,
    confidence: Number(params.candidate.confidence.toFixed(3)),
    engine_used: params.engineUsed || null,
    top_suggestion_skill_id: topSuggestion?.skill_id || null,
    top_suggestion_method: topSuggestion?.match_method || null,
    top_suggestion_score:
      typeof topSuggestion?.score === 'number' ? Number(topSuggestion.score.toFixed(3)) : null,
    selected_skill_id: params.selectedSkillId || null,
    selected_skill_name: params.selectedSkillName || null,
    selection_source: params.selectionSource || null,
    already_in_profile: Boolean(params.candidate.already_in_profile),
    review_outcome: params.reviewOutcome || null,
    unresolved_count:
      typeof params.unresolvedCount === 'number' ? Math.max(0, params.unresolvedCount) : null,
    result_count: typeof params.resultCount === 'number' ? Math.max(0, params.resultCount) : null,
    search_query_hash: params.searchQuery ? hashCvImportQuery(params.searchQuery) : null,
    risk_reasons: params.riskReasons?.length ? params.riskReasons : [],
  };
}
