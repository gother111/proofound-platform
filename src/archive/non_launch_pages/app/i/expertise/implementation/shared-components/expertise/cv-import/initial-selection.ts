import { hasPrecisionAutoSelectSignal } from '@/lib/expertise/skill-confidence';

type SkillMatchMethod = 'exact' | 'synonym' | 'fuzzy' | 'semantic';

interface SkillSuggestion {
  skill_id: string;
  skill_name?: string;
  match_method: SkillMatchMethod;
  score: number;
}

interface InitialSelectionCandidate {
  raw_skill_text: string;
  confidence: number;
  evidence_snippets: string[];
  suggestions: SkillSuggestion[];
}

export function resolveInitialSkillSelectionState(candidate: InitialSelectionCandidate): {
  approved: boolean;
  selectedSkillIds: string[];
} {
  const topSuggestion = candidate.suggestions[0];
  const canAutoSelect = hasPrecisionAutoSelectSignal({
    raw_skill_text: candidate.raw_skill_text,
    confidence: candidate.confidence,
    evidence_snippets: candidate.evidence_snippets,
    suggestions: candidate.suggestions,
  });

  return {
    approved: canAutoSelect,
    selectedSkillIds: canAutoSelect && topSuggestion ? [topSuggestion.skill_id] : [],
  };
}
