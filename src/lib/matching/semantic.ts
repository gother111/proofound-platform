/**
 * Legacy semantic matching compatibility surface.
 *
 * Mission/vision/purpose embeddings were removed from the active individual MVP
 * matching path. Keep these exports neutral so older call sites fall back to the
 * proof, skill, constraint, verification, and logistics contract.
 */

export interface ProfileWithEmbedding {
  profileId: string;
  missionEmbedding: number[] | null;
  visionEmbedding: number[] | null;
  purposeEmbedding: number[] | null;
}

export interface AssignmentWithEmbedding {
  id: string;
  missionEmbedding: number[] | null;
  visionEmbedding: number[] | null;
  purposeEmbedding: number[] | null;
}

export interface SemanticSimilarityResult {
  missionSimilarity: number;
  visionSimilarity: number;
  combinedSimilarity: number;
}

export interface ANNSearchResult {
  id: string;
  similarity: number;
}

export function calculateSemanticSimilarity(): SemanticSimilarityResult {
  return {
    missionSimilarity: 0,
    visionSimilarity: 0,
    combinedSimilarity: 0,
  };
}

export async function fetchProfileEmbeddings(): Promise<ProfileWithEmbedding | null> {
  return null;
}

export async function fetchAssignmentEmbeddings(): Promise<AssignmentWithEmbedding | null> {
  return null;
}

export async function annRetrieveSimilarProfiles(
  _assignmentId?: string,
  _limit?: number
): Promise<ANNSearchResult[]> {
  return [];
}

export async function annRetrieveSimilarAssignments(
  _profileId?: string,
  _limit?: number
): Promise<ANNSearchResult[]> {
  return [];
}

export async function updateProfileEmbeddings(): Promise<void> {
  return;
}

export async function updateAssignmentEmbeddings(): Promise<void> {
  return;
}

export async function getMissionVisionScore(): Promise<number | null> {
  return null;
}

export async function batchGetMissionVisionScores(): Promise<Map<string, number>> {
  return new Map();
}

export async function batchGetMissionVisionScoresForProfile(): Promise<Map<string, number>> {
  return new Map();
}
