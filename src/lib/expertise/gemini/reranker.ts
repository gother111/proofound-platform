import type { CvImportCandidate } from '@/lib/expertise/cv-import-suggest';
import { candidateDedupeKey } from '@/lib/expertise/candidate-dedupe';
import {
  calibrateCandidateConfidence,
  hasStrongExactOrSynonymSignal,
  shouldRejectWeakTopSuggestion,
} from '@/lib/expertise/skill-confidence';

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

function methodWeight(method: 'exact' | 'synonym' | 'fuzzy' | 'semantic'): number {
  if (method === 'exact') return 4;
  if (method === 'synonym') return 3;
  if (method === 'fuzzy') return 2;
  return 1;
}

function mergeSuggestionLists(
  left: CvImportCandidate['suggestions'],
  right: CvImportCandidate['suggestions']
): CvImportCandidate['suggestions'] {
  const bySkillId = new Map<string, CvImportCandidate['suggestions'][number]>();
  for (const suggestion of [...left, ...right]) {
    const existing = bySkillId.get(suggestion.skill_id);
    if (!existing) {
      bySkillId.set(suggestion.skill_id, suggestion);
      continue;
    }
    const incomingWeight = methodWeight(suggestion.match_method);
    const existingWeight = methodWeight(existing.match_method);
    if (
      incomingWeight > existingWeight ||
      (incomingWeight === existingWeight && suggestion.score > existing.score)
    ) {
      bySkillId.set(suggestion.skill_id, suggestion);
    }
  }

  return Array.from(bySkillId.values())
    .sort((a, b) => {
      const methodDiff = methodWeight(b.match_method) - methodWeight(a.match_method);
      if (methodDiff !== 0) {
        return methodDiff;
      }
      return b.score - a.score;
    })
    .slice(0, 10);
}

function dedupeKey(candidate: CvImportCandidate): string {
  return candidateDedupeKey(normalize(candidate.raw_skill_text), candidate.candidate_id);
}

function topSuggestionSkillId(candidate: CvImportCandidate): string | null {
  return candidate.suggestions[0]?.skill_id || null;
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

      const calibratedConfidence = calibrateCandidateConfidence({
        ...candidate,
        confidence: clamp(candidate.confidence * 0.55 + composite * 0.45),
      });
      const ranked: CvImportCandidate = {
        ...candidate,
        evidence_snippets: validEvidence.slice(0, 3),
        confidence: calibratedConfidence,
      };

      if (shouldRejectWeakTopSuggestion(ranked)) {
        ranked.unmapped_candidate = true;
        ranked.confidence = clamp(ranked.confidence * 0.8);
      }

      return ranked;
    })
    .filter((candidate): candidate is CvImportCandidate => Boolean(candidate));

  const deduped = new Map<string, CvImportCandidate>();
  for (const candidate of enriched) {
    const key = dedupeKey(candidate);
    const existing = deduped.get(key);
    if (!existing) {
      deduped.set(key, candidate);
      continue;
    }

    const base = candidate.confidence >= existing.confidence ? candidate : existing;
    const secondary = base === candidate ? existing : candidate;
    const merged: CvImportCandidate = {
      ...base,
      evidence_snippets: Array.from(
        new Set([...base.evidence_snippets, ...secondary.evidence_snippets])
      ).slice(0, 3),
      suggestions: mergeSuggestionLists(base.suggestions, secondary.suggestions),
      confidence: base.confidence,
    };

    const baseTopSkillId = topSuggestionSkillId(base);
    const secondaryTopSkillId = topSuggestionSkillId(secondary);
    if (
      baseTopSkillId &&
      secondaryTopSkillId &&
      baseTopSkillId !== secondaryTopSkillId &&
      !hasStrongExactOrSynonymSignal(base) &&
      !hasStrongExactOrSynonymSignal(secondary)
    ) {
      merged.suggestions = [];
      merged.unmapped_candidate = true;
      merged.confidence = clamp(Math.max(base.confidence, secondary.confidence) * 0.84);
      deduped.set(key, merged);
      continue;
    }

    merged.confidence = calibrateCandidateConfidence(merged);
    if (shouldRejectWeakTopSuggestion(merged)) {
      merged.unmapped_candidate = true;
      merged.confidence = clamp(merged.confidence * 0.8);
    } else {
      merged.unmapped_candidate = merged.suggestions.length === 0;
    }

    deduped.set(key, merged);
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
