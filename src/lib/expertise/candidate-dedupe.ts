export function candidateDedupeKey(rawSkillTextNormalized: string, candidateId: string): string {
  return rawSkillTextNormalized || `candidate::${candidateId}`;
}
