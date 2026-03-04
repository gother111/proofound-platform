type SkillMatchMethod = 'exact' | 'synonym' | 'fuzzy' | 'semantic';

type SkillSuggestion = {
  skill_id: string;
  skill_name?: string;
  match_method: SkillMatchMethod;
  score: number;
};

type SkillCandidateShape = {
  raw_skill_text: string;
  confidence: number;
  evidence_snippets: string[];
  suggestions: SkillSuggestion[];
};

export type SelectionRiskReason =
  | 'ambiguous_token'
  | 'weak_method'
  | 'low_overlap'
  | 'weak_evidence';

const METHOD_WEIGHT: Record<SkillMatchMethod, number> = {
  exact: 1,
  synonym: 0.94,
  fuzzy: 0.7,
  semantic: 0.62,
};

const AMBIGUOUS_SHORT_TOKEN_HINTS: Record<string, string[]> = {
  r: ['r language', 'rstudio', 'tidyverse', 'ggplot', 'dplyr'],
  go: ['golang', 'go language', 'goroutine', 'go module', 'go service', 'go microservice'],
  pm: ['project manager', 'product manager', 'program manager', 'pmp', 'scrum'],
};

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9+.#/\-\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeForOverlap(value: string): Set<string> {
  const normalized = normalize(value);
  const tokens = new Set<string>();

  for (const token of normalized.split(' ')) {
    const trimmed = token.trim();
    if (!trimmed) {
      continue;
    }

    tokens.add(trimmed);

    const stripped = trimmed.replace(/[./_-]/g, '');
    if (stripped && stripped !== trimmed) {
      tokens.add(stripped);
    }

    const parts = trimmed.split(/[./_-]+/).filter(Boolean);
    if (parts.length > 1) {
      for (const part of parts) {
        tokens.add(part);
      }
    }
  }

  return tokens;
}

function normalizeSingleToken(value: string): string {
  return normalize(value).replace(/\s+/g, ' ').trim();
}

function resolveAmbiguousToken(value: string): string | null {
  const normalized = normalizeSingleToken(value);
  if (!normalized || normalized.includes(' ') || normalized.length > 3) {
    return null;
  }
  return Object.prototype.hasOwnProperty.call(AMBIGUOUS_SHORT_TOKEN_HINTS, normalized)
    ? normalized
    : null;
}

export function isAmbiguousTokenWithoutDisambiguation(params: {
  rawSkillText: string;
  evidenceSnippets: string[];
  suggestionLabel?: string;
}): boolean {
  const ambiguousToken = resolveAmbiguousToken(params.rawSkillText);
  if (!ambiguousToken) {
    return false;
  }

  const hints = AMBIGUOUS_SHORT_TOKEN_HINTS[ambiguousToken] || [];
  if (hints.length === 0) {
    return true;
  }

  const haystack = [...params.evidenceSnippets, params.suggestionLabel || '']
    .join(' ')
    .toLowerCase();
  return !hints.some((hint) => haystack.includes(hint));
}

export function computeLexicalOverlap(left: string, right: string): number {
  const leftTokens = tokenizeForOverlap(left);
  const rightTokens = tokenizeForOverlap(right);
  if (leftTokens.size === 0 || rightTokens.size === 0) {
    return 0;
  }

  let overlap = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) {
      overlap += 1;
    }
  }

  return clamp(overlap / Math.max(leftTokens.size, rightTokens.size));
}

export function computeEvidenceQuality(rawSkillText: string, evidenceSnippets: string[]): number {
  if (!Array.isArray(evidenceSnippets) || evidenceSnippets.length === 0) {
    return 0;
  }

  const rawNormalized = normalize(rawSkillText);
  if (!rawNormalized) {
    return 0;
  }

  let best = 0;
  for (const snippet of evidenceSnippets) {
    const snippetNormalized = normalize(snippet);
    if (!snippetNormalized) {
      continue;
    }

    const includesRaw = snippetNormalized.includes(rawNormalized) ? 1 : 0;
    const lexical = computeLexicalOverlap(rawNormalized, snippetNormalized);
    const brevity = clamp(1 - Math.max(0, snippetNormalized.length - 200) / 240);
    const score = includesRaw * 0.55 + lexical * 0.3 + brevity * 0.15;
    best = Math.max(best, score);
  }

  return clamp(best);
}

export function calibrateCandidateConfidence(candidate: SkillCandidateShape): number {
  const topSuggestion = candidate.suggestions[0];
  const methodWeight = topSuggestion ? METHOD_WEIGHT[topSuggestion.match_method] : 0.4;
  const mappedScore = topSuggestion ? clamp(topSuggestion.score) : 0;
  const lexical = topSuggestion
    ? computeLexicalOverlap(
        candidate.raw_skill_text,
        topSuggestion.skill_name || candidate.raw_skill_text
      )
    : 0;
  const evidence = computeEvidenceQuality(candidate.raw_skill_text, candidate.evidence_snippets);

  const calibrated =
    clamp(candidate.confidence) * 0.45 +
    methodWeight * 0.2 +
    mappedScore * 0.2 +
    lexical * 0.1 +
    evidence * 0.05;

  return clamp(calibrated);
}

export function hasPrecisionAutoSelectSignal(candidate: SkillCandidateShape): boolean {
  const topSuggestion = candidate.suggestions[0];
  if (!topSuggestion) {
    return false;
  }

  if (
    isAmbiguousTokenWithoutDisambiguation({
      rawSkillText: candidate.raw_skill_text,
      evidenceSnippets: candidate.evidence_snippets,
      suggestionLabel: topSuggestion.skill_name,
    })
  ) {
    return false;
  }

  if (topSuggestion.match_method !== 'exact' && topSuggestion.match_method !== 'synonym') {
    return false;
  }

  if (topSuggestion.score < 0.93) {
    return false;
  }

  const calibrated = calibrateCandidateConfidence(candidate);
  if (calibrated < 0.68) {
    return false;
  }

  if (computeEvidenceQuality(candidate.raw_skill_text, candidate.evidence_snippets) < 0.45) {
    return false;
  }

  return true;
}

export function evaluateSuggestionSelectionRisk(params: {
  rawSkillText: string;
  evidenceSnippets: string[];
  suggestion: SkillSuggestion;
}): {
  requiresConfirmation: boolean;
  reasons: SelectionRiskReason[];
  lexicalOverlap: number;
  evidenceQuality: number;
} {
  const reasons: SelectionRiskReason[] = [];
  const lexicalOverlap = computeLexicalOverlap(
    params.rawSkillText,
    params.suggestion.skill_name || params.rawSkillText
  );
  const evidenceQuality = computeEvidenceQuality(params.rawSkillText, params.evidenceSnippets);

  if (
    isAmbiguousTokenWithoutDisambiguation({
      rawSkillText: params.rawSkillText,
      evidenceSnippets: params.evidenceSnippets,
      suggestionLabel: params.suggestion.skill_name,
    })
  ) {
    reasons.push('ambiguous_token');
  }

  if (params.suggestion.match_method === 'semantic' || params.suggestion.match_method === 'fuzzy') {
    reasons.push('weak_method');
  }

  const overlapThreshold =
    params.suggestion.match_method === 'exact' || params.suggestion.match_method === 'synonym'
      ? 0.24
      : params.suggestion.match_method === 'fuzzy'
        ? 0.36
        : 0.42;

  if (lexicalOverlap < overlapThreshold) {
    reasons.push('low_overlap');
  }

  if (evidenceQuality < 0.45) {
    reasons.push('weak_evidence');
  }

  return {
    requiresConfirmation: reasons.length > 0,
    reasons: Array.from(new Set(reasons)),
    lexicalOverlap,
    evidenceQuality,
  };
}

export function shouldRejectWeakTopSuggestion(candidate: SkillCandidateShape): boolean {
  const top = candidate.suggestions[0];
  if (!top) {
    return false;
  }

  if (
    isAmbiguousTokenWithoutDisambiguation({
      rawSkillText: candidate.raw_skill_text,
      evidenceSnippets: candidate.evidence_snippets,
      suggestionLabel: top.skill_name,
    })
  ) {
    return true;
  }

  const lexical = computeLexicalOverlap(
    candidate.raw_skill_text,
    top.skill_name || candidate.raw_skill_text
  );
  const evidence = computeEvidenceQuality(candidate.raw_skill_text, candidate.evidence_snippets);

  if (top.match_method === 'semantic' && (top.score < 0.9 || lexical < 0.34 || evidence < 0.46)) {
    return true;
  }

  if (top.match_method === 'fuzzy' && (top.score < 0.86 || lexical < 0.32 || evidence < 0.42)) {
    return true;
  }

  return false;
}
