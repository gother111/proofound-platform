import type { CvImportCandidate } from '@/lib/expertise/cv-import-suggest';

type ConfidenceTiers = {
  high: number;
  medium: number;
  low: number;
};

export type GeminiRerankMetrics = {
  inputCandidateCount: number;
  candidateCount: number;
  mappedCount: number;
  evidenceValidCount: number;
  highConfidenceCount: number;
  confidenceTiers: ConfidenceTiers;
};

export type GeminiRerankResult = {
  candidates: CvImportCandidate[];
  metrics: GeminiRerankMetrics;
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

function includesNormalized(haystack: string, needle: string): boolean {
  const normalizedNeedle = normalize(needle);
  if (!normalizedNeedle) {
    return false;
  }
  return normalize(haystack).includes(normalizedNeedle);
}

function lexicalOverlap(rawSkillText: string, suggestionLabel: string): number {
  const rawTokens = new Set(normalize(rawSkillText).split(' ').filter(Boolean));
  const suggestionTokens = new Set(normalize(suggestionLabel).split(' ').filter(Boolean));
  if (rawTokens.size === 0 || suggestionTokens.size === 0) {
    return 0;
  }

  let overlap = 0;
  for (const token of rawTokens) {
    if (suggestionTokens.has(token)) {
      overlap += 1;
    }
  }

  const denominator = Math.max(rawTokens.size, suggestionTokens.size);
  return clamp(overlap / denominator);
}

function sectionPrior(text: string, evidenceSnippet: string): number {
  const normalizedText = text.toLowerCase();
  const snippet = evidenceSnippet.trim().toLowerCase();
  if (!snippet) {
    return 0;
  }

  const index = normalizedText.indexOf(snippet);
  if (index < 0) {
    return 0;
  }

  const leftBoundary = Math.max(0, index - 180);
  const window = normalizedText.slice(leftBoundary, index + snippet.length);

  if (/\b(skills?|competenc(?:y|ies)|technologies|tooling|stack)\b/.test(window)) {
    return 1;
  }

  if (/\b(experience|projects?|employment|work)\b/.test(window)) {
    return 0.6;
  }

  return 0.25;
}

function tierForConfidence(confidence: number): keyof ConfidenceTiers {
  if (confidence >= 0.82) {
    return 'high';
  }
  if (confidence >= 0.58) {
    return 'medium';
  }
  return 'low';
}

function topSuggestionLabel(candidate: CvImportCandidate): string {
  if (!candidate.suggestions[0]) {
    return candidate.raw_skill_text;
  }
  return candidate.suggestions[0].skill_name || candidate.raw_skill_text;
}

function dedupeKey(candidate: CvImportCandidate): string {
  const topSuggestionSkillId = candidate.suggestions[0]?.skill_id || 'unmapped';
  return `${normalize(candidate.raw_skill_text)}::${topSuggestionSkillId}`;
}

export function rerankGeminiCandidates(params: {
  text: string;
  candidates: CvImportCandidate[];
}): GeminiRerankResult {
  const sourceText = params.text || '';
  const normalizedSourceText = normalize(sourceText);
  const tiers: ConfidenceTiers = { high: 0, medium: 0, low: 0 };

  const enriched = params.candidates
    .map((candidate) => {
      const validEvidence = candidate.evidence_snippets.filter((snippet) =>
        includesNormalized(normalizedSourceText, snippet)
      );
      if (validEvidence.length === 0) {
        return null;
      }

      const mappedScore = candidate.suggestions[0]?.score ?? 0;
      const lexical = lexicalOverlap(candidate.raw_skill_text, topSuggestionLabel(candidate));
      const prior = sectionPrior(sourceText, validEvidence[0] || candidate.raw_skill_text);

      const composite =
        candidate.confidence * 0.45 + mappedScore * 0.35 + lexical * 0.15 + prior * 0.05;

      const calibratedConfidence = clamp(candidate.confidence * 0.55 + composite * 0.45);
      const ranked: CvImportCandidate = {
        ...candidate,
        evidence_snippets: validEvidence.slice(0, 3),
        confidence: calibratedConfidence,
      };

      return ranked;
    })
    .filter((candidate): candidate is CvImportCandidate => Boolean(candidate));

  const deduped = new Map<string, CvImportCandidate>();
  for (const candidate of enriched) {
    const key = dedupeKey(candidate);
    const existing = deduped.get(key);
    if (!existing || candidate.confidence > existing.confidence) {
      deduped.set(key, candidate);
    }
  }

  const candidates = Array.from(deduped.values()).sort((a, b) => {
    if (b.confidence !== a.confidence) {
      return b.confidence - a.confidence;
    }
    if (a.unmapped_candidate !== b.unmapped_candidate) {
      return a.unmapped_candidate ? 1 : -1;
    }
    return a.raw_skill_text.localeCompare(b.raw_skill_text);
  });

  for (const candidate of candidates) {
    tiers[tierForConfidence(candidate.confidence)] += 1;
  }

  const metrics: GeminiRerankMetrics = {
    inputCandidateCount: params.candidates.length,
    candidateCount: candidates.length,
    mappedCount: candidates.filter((candidate) => !candidate.unmapped_candidate).length,
    evidenceValidCount: candidates.length,
    highConfidenceCount: tiers.high,
    confidenceTiers: tiers,
  };

  return {
    candidates,
    metrics,
  };
}
