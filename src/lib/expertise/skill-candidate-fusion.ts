import type { CvImportCandidate } from '@/lib/expertise/cv-import-suggest';
import {
  calibrateCandidateConfidence,
  computeLexicalOverlap,
  shouldRejectWeakTopSuggestion,
} from '@/lib/expertise/skill-confidence';

type SourceKind = 'local' | 'gemini';

type CandidateWithSource = {
  candidate: CvImportCandidate;
  source: SourceKind;
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9+.#/\-\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function methodWeight(method: 'exact' | 'synonym' | 'fuzzy' | 'semantic'): number {
  if (method === 'exact') return 4;
  if (method === 'synonym') return 3;
  if (method === 'fuzzy') return 2;
  return 1;
}

function topMethodWeight(candidate: CvImportCandidate): number {
  const top = candidate.suggestions[0];
  if (!top) {
    return 0;
  }
  return methodWeight(top.match_method);
}

function dedupeKey(candidate: CvImportCandidate): string {
  const normalized = normalize(candidate.raw_skill_text);
  return normalized || `candidate::${candidate.candidate_id}`;
}

function simplifyForAliasMerge(value: string): string {
  return normalize(value)
    .replace(/\.?js\b/g, '')
    .replace(/[^a-z0-9+#]/g, '');
}

function shouldMergeEquivalentSkillText(
  left: CvImportCandidate,
  right: CvImportCandidate
): boolean {
  const leftNormalized = normalize(left.raw_skill_text);
  const rightNormalized = normalize(right.raw_skill_text);
  if (leftNormalized === rightNormalized) {
    return true;
  }

  if (simplifyForAliasMerge(left.raw_skill_text) === simplifyForAliasMerge(right.raw_skill_text)) {
    return true;
  }

  const leftTop = left.suggestions[0]?.skill_id;
  const rightTop = right.suggestions[0]?.skill_id;
  if (!leftTop || !rightTop || leftTop !== rightTop) {
    return false;
  }

  return computeLexicalOverlap(left.raw_skill_text, right.raw_skill_text) >= 0.52;
}

function mergeEvidence(left: string[], right: string[]): string[] {
  return Array.from(new Set([...left, ...right]))
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function mergeSuggestionLists(left: CvImportCandidate, right: CvImportCandidate) {
  const bySkillId = new Map<string, CvImportCandidate['suggestions'][number]>();
  const all = [...left.suggestions, ...right.suggestions];

  for (const suggestion of all) {
    const existing = bySkillId.get(suggestion.skill_id);
    if (!existing) {
      bySkillId.set(suggestion.skill_id, suggestion);
      continue;
    }
    if (methodWeight(suggestion.match_method) > methodWeight(existing.match_method)) {
      bySkillId.set(suggestion.skill_id, suggestion);
      continue;
    }
    if (
      methodWeight(suggestion.match_method) === methodWeight(existing.match_method) &&
      suggestion.score > existing.score
    ) {
      bySkillId.set(suggestion.skill_id, suggestion);
    }
  }

  return Array.from(bySkillId.values())
    .sort((a, b) => {
      const weightDiff = methodWeight(b.match_method) - methodWeight(a.match_method);
      if (weightDiff !== 0) {
        return weightDiff;
      }
      return b.score - a.score;
    })
    .slice(0, 10);
}

function choosePreferredCandidate(
  left: CandidateWithSource,
  right: CandidateWithSource
): CandidateWithSource {
  const leftWeight = topMethodWeight(left.candidate);
  const rightWeight = topMethodWeight(right.candidate);
  if (leftWeight !== rightWeight) {
    return leftWeight > rightWeight ? left : right;
  }

  const leftConfidence = calibrateCandidateConfidence(left.candidate);
  const rightConfidence = calibrateCandidateConfidence(right.candidate);
  if (leftConfidence !== rightConfidence) {
    return leftConfidence > rightConfidence ? left : right;
  }

  if (left.source !== right.source) {
    return right.source === 'gemini' ? right : left;
  }

  return left;
}

function normalizeCandidate(candidate: CvImportCandidate): CvImportCandidate {
  const next = {
    ...candidate,
    raw_skill_text: candidate.raw_skill_text.trim(),
    evidence_snippets: candidate.evidence_snippets
      .map((snippet) => snippet.trim())
      .filter(Boolean)
      .slice(0, 3),
    suggestions: [...candidate.suggestions],
  };
  next.confidence = calibrateCandidateConfidence(next);
  if (shouldRejectWeakTopSuggestion(next)) {
    next.suggestions = [];
    next.unmapped_candidate = true;
    next.confidence = Math.max(0, Math.min(1, next.confidence * 0.78));
  } else {
    next.unmapped_candidate = next.suggestions.length === 0;
  }
  return next;
}

export function fuseSkillCandidates(params: {
  localCandidates: CvImportCandidate[];
  geminiCandidates: CvImportCandidate[];
}): CvImportCandidate[] {
  const mergedByKey = new Map<string, CandidateWithSource>();
  const all: CandidateWithSource[] = [
    ...params.localCandidates.map((candidate) => ({
      candidate: normalizeCandidate(candidate),
      source: 'local' as const,
    })),
    ...params.geminiCandidates.map((candidate) => ({
      candidate: normalizeCandidate(candidate),
      source: 'gemini' as const,
    })),
  ];

  for (const incoming of all) {
    let key = dedupeKey(incoming.candidate);
    let existing = mergedByKey.get(key);
    if (!existing) {
      for (const [existingKey, existingEntry] of mergedByKey.entries()) {
        if (shouldMergeEquivalentSkillText(existingEntry.candidate, incoming.candidate)) {
          key = existingKey;
          existing = existingEntry;
          break;
        }
      }
    }
    if (!existing) {
      mergedByKey.set(key, incoming);
      continue;
    }

    const preferred = choosePreferredCandidate(existing, incoming);
    const secondary = preferred === existing ? incoming : existing;
    const mergedCandidate: CvImportCandidate = {
      ...preferred.candidate,
      evidence_snippets: mergeEvidence(
        preferred.candidate.evidence_snippets,
        secondary.candidate.evidence_snippets
      ),
      suggestions: mergeSuggestionLists(preferred.candidate, secondary.candidate),
      confidence: preferred.candidate.confidence,
    };

    mergedCandidate.confidence = calibrateCandidateConfidence(mergedCandidate);
    if (shouldRejectWeakTopSuggestion(mergedCandidate)) {
      mergedCandidate.suggestions = [];
      mergedCandidate.unmapped_candidate = true;
      mergedCandidate.confidence = Math.max(0, Math.min(1, mergedCandidate.confidence * 0.78));
    } else {
      mergedCandidate.unmapped_candidate = mergedCandidate.suggestions.length === 0;
      mergedCandidate.confidence = Math.max(
        mergedCandidate.confidence,
        calibrateCandidateConfidence(secondary.candidate)
      );
    }

    preferred.candidate = {
      ...mergedCandidate,
      confidence: Math.max(0, Math.min(1, mergedCandidate.confidence)),
    };
    mergedByKey.set(key, preferred);
  }

  return Array.from(mergedByKey.values())
    .map((entry) => entry.candidate)
    .sort((a, b) => {
      if (a.unmapped_candidate !== b.unmapped_candidate) {
        return a.unmapped_candidate ? 1 : -1;
      }
      if (b.confidence !== a.confidence) {
        return b.confidence - a.confidence;
      }
      return a.raw_skill_text.localeCompare(b.raw_skill_text);
    })
    .slice(0, 40);
}
