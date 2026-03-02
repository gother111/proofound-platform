type SkillMatchMethod = 'exact' | 'synonym' | 'fuzzy' | 'semantic';

interface SkillSuggestion {
  skill_id: string;
  match_method: SkillMatchMethod;
  score: number;
}

interface InitialSelectionCandidate {
  confidence: number;
  suggestions: SkillSuggestion[];
}

const AUTO_SELECT_METHODS = new Set<SkillMatchMethod>(['exact', 'synonym']);
const AUTO_SELECT_MIN_SCORE = 0.9;
const AUTO_SELECT_MIN_CONFIDENCE = 0.55;

export function resolveInitialSkillSelectionState(candidate: InitialSelectionCandidate): {
  approved: boolean;
  selectedSkillIds: string[];
} {
  const topSuggestion = candidate.suggestions[0];
  const canAutoSelect =
    Boolean(topSuggestion) &&
    candidate.confidence >= AUTO_SELECT_MIN_CONFIDENCE &&
    topSuggestion.score >= AUTO_SELECT_MIN_SCORE &&
    AUTO_SELECT_METHODS.has(topSuggestion.match_method);

  return {
    approved: canAutoSelect,
    selectedSkillIds: canAutoSelect && topSuggestion ? [topSuggestion.skill_id] : [],
  };
}
