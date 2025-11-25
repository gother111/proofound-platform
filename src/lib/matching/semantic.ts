/**
 * Semantic Matching Module
 *
 * Provides semantic similarity scoring for mission/vision statements
 * and two-stage matching (ANN retrieval + precise re-ranking).
 *
 * PRD Reference: Proofound_Matching_Conversation.md
 */

import { createClient } from '@supabase/supabase-js';
import {
  cosineSimilarity,
  generateEmbedding,
  parseEmbeddingFromPostgres,
  EMBEDDING_CONFIG,
} from './embeddings';

// Create Supabase client for semantic queries
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getSupabaseClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Profile with embedding data
 */
export interface ProfileWithEmbedding {
  profileId: string;
  missionEmbedding: number[] | null;
  visionEmbedding: number[] | null;
  purposeEmbedding: number[] | null;
}

/**
 * Assignment with embedding data
 */
export interface AssignmentWithEmbedding {
  id: string;
  missionEmbedding: number[] | null;
  visionEmbedding: number[] | null;
  purposeEmbedding: number[] | null;
}

/**
 * Semantic similarity result
 */
export interface SemanticSimilarityResult {
  missionSimilarity: number;
  visionSimilarity: number;
  combinedSimilarity: number;
}

/**
 * ANN search result
 */
export interface ANNSearchResult {
  id: string;
  similarity: number;
}

/**
 * Calculate semantic similarity between a profile and an assignment.
 *
 * @param profileEmbeddings Profile's mission/vision embeddings
 * @param assignmentEmbeddings Assignment's mission/vision embeddings
 * @returns Similarity scores
 */
export function calculateSemanticSimilarity(
  profileEmbeddings: {
    missionEmbedding: number[] | null;
    visionEmbedding: number[] | null;
  },
  assignmentEmbeddings: {
    missionEmbedding: number[] | null;
    visionEmbedding: number[] | null;
  }
): SemanticSimilarityResult {
  const { missionEmbedding: profileMission, visionEmbedding: profileVision } = profileEmbeddings;
  const { missionEmbedding: assignmentMission, visionEmbedding: assignmentVision } =
    assignmentEmbeddings;

  // Calculate individual similarities
  const missionSimilarity =
    profileMission && assignmentMission ? cosineSimilarity(profileMission, assignmentMission) : 0;

  const visionSimilarity =
    profileVision && assignmentVision ? cosineSimilarity(profileVision, assignmentVision) : 0;

  // Calculate combined similarity (weighted average)
  let combinedSimilarity = 0;
  let totalWeight = 0;

  if (profileMission && assignmentMission) {
    combinedSimilarity += missionSimilarity * 0.6;
    totalWeight += 0.6;
  }

  if (profileVision && assignmentVision) {
    combinedSimilarity += visionSimilarity * 0.4;
    totalWeight += 0.4;
  }

  // Normalize if we only have partial data
  if (totalWeight > 0 && totalWeight < 1) {
    combinedSimilarity /= totalWeight;
  }

  return {
    missionSimilarity,
    visionSimilarity,
    combinedSimilarity,
  };
}

/**
 * Fetch profile embeddings from database.
 */
export async function fetchProfileEmbeddings(
  profileId: string
): Promise<ProfileWithEmbedding | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('matching_profiles')
    .select('profile_id, mission_embedding, vision_embedding, purpose_embedding')
    .eq('profile_id', profileId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    profileId: data.profile_id,
    missionEmbedding: data.mission_embedding
      ? parseEmbeddingFromPostgres(data.mission_embedding)
      : null,
    visionEmbedding: data.vision_embedding
      ? parseEmbeddingFromPostgres(data.vision_embedding)
      : null,
    purposeEmbedding: data.purpose_embedding
      ? parseEmbeddingFromPostgres(data.purpose_embedding)
      : null,
  };
}

/**
 * Fetch assignment embeddings from database.
 */
export async function fetchAssignmentEmbeddings(
  assignmentId: string
): Promise<AssignmentWithEmbedding | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('assignments')
    .select('id, mission_embedding, vision_embedding, purpose_embedding')
    .eq('id', assignmentId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    missionEmbedding: data.mission_embedding
      ? parseEmbeddingFromPostgres(data.mission_embedding)
      : null,
    visionEmbedding: data.vision_embedding
      ? parseEmbeddingFromPostgres(data.vision_embedding)
      : null,
    purposeEmbedding: data.purpose_embedding
      ? parseEmbeddingFromPostgres(data.purpose_embedding)
      : null,
  };
}

/**
 * Stage 1: ANN retrieval for assignment matching.
 *
 * Uses pgvector HNSW index to quickly find top-N similar profiles.
 *
 * @param assignmentId Assignment to find matches for
 * @param limit Maximum number of results
 * @returns Array of profile IDs with similarity scores
 */
export async function annRetrieveSimilarProfiles(
  assignmentId: string,
  limit: number = 500
): Promise<ANNSearchResult[]> {
  const supabase = getSupabaseClient();

  // First, get the assignment's purpose embedding
  const assignment = await fetchAssignmentEmbeddings(assignmentId);

  if (!assignment?.purposeEmbedding) {
    // Fallback: return empty (will use traditional matching)
    return [];
  }

  // Use the database function for ANN search
  const { data, error } = await supabase.rpc('find_similar_profiles_by_embedding', {
    query_embedding: assignment.purposeEmbedding,
    limit_count: limit,
  });

  if (error) {
    console.error('[Semantic] ANN profile search failed:', error);
    return [];
  }

  return (data || []).map((row: { profile_id: string; similarity: number }) => ({
    id: row.profile_id,
    similarity: row.similarity,
  }));
}

/**
 * Stage 1: ANN retrieval for profile matching.
 *
 * Uses pgvector HNSW index to quickly find top-N similar assignments.
 *
 * @param profileId Profile to find matches for
 * @param limit Maximum number of results
 * @returns Array of assignment IDs with similarity scores
 */
export async function annRetrieveSimilarAssignments(
  profileId: string,
  limit: number = 100
): Promise<ANNSearchResult[]> {
  const supabase = getSupabaseClient();

  // First, get the profile's purpose embedding
  const profile = await fetchProfileEmbeddings(profileId);

  if (!profile?.purposeEmbedding) {
    // Fallback: return empty (will use traditional matching)
    return [];
  }

  // Use the database function for ANN search
  const { data, error } = await supabase.rpc('find_similar_assignments_by_embedding', {
    query_embedding: profile.purposeEmbedding,
    limit_count: limit,
  });

  if (error) {
    console.error('[Semantic] ANN assignment search failed:', error);
    return [];
  }

  return (data || []).map((row: { assignment_id: string; similarity: number }) => ({
    id: row.assignment_id,
    similarity: row.similarity,
  }));
}

/**
 * Generate and store embeddings for a profile.
 *
 * Call this when a profile's mission/vision is updated.
 *
 * @param profileId Profile ID
 * @param mission Mission statement
 * @param vision Vision statement
 */
export async function updateProfileEmbeddings(
  profileId: string,
  mission: string | null,
  vision: string | null
): Promise<void> {
  const supabase = getSupabaseClient();

  try {
    // Generate embeddings
    const missionEmbedding = mission
      ? await generateEmbedding(mission)
      : new Array(EMBEDDING_CONFIG.DIMENSIONS).fill(0);

    const visionEmbedding = vision
      ? await generateEmbedding(vision)
      : new Array(EMBEDDING_CONFIG.DIMENSIONS).fill(0);

    // Combined purpose embedding (average, normalized)
    const purposeEmbedding = combineAndNormalizeEmbeddings(missionEmbedding, visionEmbedding);

    // Update matching_profiles
    await supabase
      .from('matching_profiles')
      .update({
        mission_embedding: missionEmbedding,
        vision_embedding: visionEmbedding,
        purpose_embedding: purposeEmbedding,
        embeddings_updated_at: new Date().toISOString(),
      })
      .eq('profile_id', profileId);

    console.log('[Semantic] Updated embeddings for profile:', profileId);
  } catch (error) {
    console.error('[Semantic] Failed to update profile embeddings:', error);
  }
}

/**
 * Generate and store embeddings for an assignment.
 *
 * Call this when an assignment's description/impact is updated.
 *
 * @param assignmentId Assignment ID
 * @param description Assignment description (mission)
 * @param expectedImpact Expected impact (vision)
 */
export async function updateAssignmentEmbeddings(
  assignmentId: string,
  description: string | null,
  expectedImpact: string | null
): Promise<void> {
  const supabase = getSupabaseClient();

  try {
    const missionEmbedding = description
      ? await generateEmbedding(description)
      : new Array(EMBEDDING_CONFIG.DIMENSIONS).fill(0);

    const visionEmbedding = expectedImpact
      ? await generateEmbedding(expectedImpact)
      : new Array(EMBEDDING_CONFIG.DIMENSIONS).fill(0);

    const purposeEmbedding = combineAndNormalizeEmbeddings(missionEmbedding, visionEmbedding);

    await supabase
      .from('assignments')
      .update({
        mission_embedding: missionEmbedding,
        vision_embedding: visionEmbedding,
        purpose_embedding: purposeEmbedding,
        embeddings_updated_at: new Date().toISOString(),
      })
      .eq('id', assignmentId);

    console.log('[Semantic] Updated embeddings for assignment:', assignmentId);
  } catch (error) {
    console.error('[Semantic] Failed to update assignment embeddings:', error);
  }
}

/**
 * Combine two embeddings and normalize the result.
 */
function combineAndNormalizeEmbeddings(a: number[], b: number[]): number[] {
  const combined: number[] = [];

  for (let i = 0; i < EMBEDDING_CONFIG.DIMENSIONS; i++) {
    combined.push((a[i] + b[i]) / 2);
  }

  // Normalize
  const magnitude = Math.sqrt(combined.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < combined.length; i++) {
      combined[i] /= magnitude;
    }
  }

  return combined;
}

/**
 * Calculate mission/vision similarity score for PAC.
 *
 * This is the function to use in the matching routes.
 *
 * @param profileId Profile ID
 * @param assignmentId Assignment ID
 * @returns Similarity score (0-1) or null if embeddings not available
 */
export async function getMissionVisionScore(
  profileId: string,
  assignmentId: string
): Promise<number | null> {
  try {
    const [profile, assignment] = await Promise.all([
      fetchProfileEmbeddings(profileId),
      fetchAssignmentEmbeddings(assignmentId),
    ]);

    if (!profile || !assignment) {
      return null;
    }

    const similarity = calculateSemanticSimilarity(
      {
        missionEmbedding: profile.missionEmbedding,
        visionEmbedding: profile.visionEmbedding,
      },
      {
        missionEmbedding: assignment.missionEmbedding,
        visionEmbedding: assignment.visionEmbedding,
      }
    );

    return similarity.combinedSimilarity;
  } catch (error) {
    console.error('[Semantic] Failed to get mission/vision score:', error);
    return null;
  }
}

/**
 * Batch fetch mission/vision scores for multiple profiles against one assignment.
 *
 * More efficient than calling getMissionVisionScore repeatedly.
 */
export async function batchGetMissionVisionScores(
  profileIds: string[],
  assignmentId: string
): Promise<Map<string, number>> {
  const supabase = getSupabaseClient();
  const scores = new Map<string, number>();

  try {
    // Fetch assignment embeddings
    const assignment = await fetchAssignmentEmbeddings(assignmentId);
    if (!assignment?.missionEmbedding && !assignment?.visionEmbedding) {
      return scores;
    }

    // Batch fetch profile embeddings
    const { data: profiles, error } = await supabase
      .from('matching_profiles')
      .select('profile_id, mission_embedding, vision_embedding')
      .in('profile_id', profileIds);

    if (error || !profiles) {
      return scores;
    }

    // Calculate similarities
    for (const profile of profiles) {
      const similarity = calculateSemanticSimilarity(
        {
          missionEmbedding: profile.mission_embedding
            ? parseEmbeddingFromPostgres(profile.mission_embedding)
            : null,
          visionEmbedding: profile.vision_embedding
            ? parseEmbeddingFromPostgres(profile.vision_embedding)
            : null,
        },
        {
          missionEmbedding: assignment.missionEmbedding,
          visionEmbedding: assignment.visionEmbedding,
        }
      );

      scores.set(profile.profile_id, similarity.combinedSimilarity);
    }
  } catch (error) {
    console.error('[Semantic] Failed to batch get scores:', error);
  }

  return scores;
}

/**
 * Batch fetch mission/vision scores for one profile against multiple assignments.
 */
export async function batchGetMissionVisionScoresForProfile(
  profileId: string,
  assignmentIds: string[]
): Promise<Map<string, number>> {
  const supabase = getSupabaseClient();
  const scores = new Map<string, number>();

  try {
    // Fetch profile embeddings
    const profile = await fetchProfileEmbeddings(profileId);
    if (!profile?.missionEmbedding && !profile?.visionEmbedding) {
      return scores;
    }

    // Batch fetch assignment embeddings
    const { data: assignments, error } = await supabase
      .from('assignments')
      .select('id, mission_embedding, vision_embedding')
      .in('id', assignmentIds);

    if (error || !assignments) {
      return scores;
    }

    // Calculate similarities
    for (const assignment of assignments) {
      const similarity = calculateSemanticSimilarity(
        {
          missionEmbedding: profile.missionEmbedding,
          visionEmbedding: profile.visionEmbedding,
        },
        {
          missionEmbedding: assignment.mission_embedding
            ? parseEmbeddingFromPostgres(assignment.mission_embedding)
            : null,
          visionEmbedding: assignment.vision_embedding
            ? parseEmbeddingFromPostgres(assignment.vision_embedding)
            : null,
        }
      );

      scores.set(assignment.id, similarity.combinedSimilarity);
    }
  } catch (error) {
    console.error('[Semantic] Failed to batch get scores for profile:', error);
  }

  return scores;
}
