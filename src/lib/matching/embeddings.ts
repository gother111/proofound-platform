/**
 * Semantic Embeddings Library
 *
 * Uses local transformer model (Xenova/all-MiniLM-L6-v2) to generate
 * embeddings for mission/vision statements for semantic matching.
 *
 * PRD Reference: Proofound_Matching_Conversation.md - Stage-1 ANN retrieval
 *
 * Model: all-MiniLM-L6-v2
 * - Dimensions: 384
 * - Context: 256 tokens
 * - Language: English (primary), multilingual support via sentence-transformers
 */

// Note: @xenova/transformers is dynamically imported to avoid issues in serverless
let pipeline: any = null;
let embedder: any = null;
let modelLoading: Promise<any> | null = null;

// Model configuration
export const EMBEDDING_CONFIG = {
  MODEL_NAME: 'Xenova/all-MiniLM-L6-v2',
  DIMENSIONS: 384,
  MAX_TOKENS: 256,
  POOLING: 'mean' as const,
  NORMALIZE: true,
} as const;

/**
 * Initialize the embedding model.
 * Uses lazy loading to avoid slow startup times.
 */
async function initializeModel(): Promise<any> {
  if (embedder) {
    return embedder;
  }

  if (modelLoading) {
    return modelLoading;
  }

  modelLoading = (async () => {
    try {
      // Dynamic import to work with Next.js serverless
      const { pipeline: pipelineFn } = await import('@xenova/transformers');
      pipeline = pipelineFn;

      console.log('[Embeddings] Loading model:', EMBEDDING_CONFIG.MODEL_NAME);
      embedder = await pipeline('feature-extraction', EMBEDDING_CONFIG.MODEL_NAME);
      console.log('[Embeddings] Model loaded successfully');

      return embedder;
    } catch (error) {
      console.error('[Embeddings] Failed to load model:', error);
      modelLoading = null;
      throw error;
    }
  })();

  return modelLoading;
}

/**
 * Generate embedding for a text string.
 *
 * @param text Text to embed (mission, vision, or description)
 * @returns Array of numbers (384 dimensions)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    // Return zero vector for empty text
    return new Array(EMBEDDING_CONFIG.DIMENSIONS).fill(0);
  }

  try {
    const model = await initializeModel();

    // Truncate text if too long (rough estimate: 1 token ≈ 4 chars)
    const maxChars = EMBEDDING_CONFIG.MAX_TOKENS * 4;
    const truncatedText = text.length > maxChars ? text.substring(0, maxChars) : text;

    // Generate embedding
    const output = await model(truncatedText, {
      pooling: EMBEDDING_CONFIG.POOLING,
      normalize: EMBEDDING_CONFIG.NORMALIZE,
    });

    // Convert to array
    return Array.from(output.data as Float32Array);
  } catch (error) {
    console.error('[Embeddings] Failed to generate embedding:', error);
    // Return zero vector on error (graceful degradation)
    return new Array(EMBEDDING_CONFIG.DIMENSIONS).fill(0);
  }
}

/**
 * Generate embeddings for multiple texts in batch.
 * More efficient than individual calls.
 *
 * @param texts Array of texts to embed
 * @returns Array of embeddings
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];

  for (const text of texts) {
    results.push(await generateEmbedding(text));
  }

  return results;
}

/**
 * Calculate cosine similarity between two embeddings.
 * Exported from scorers.ts but also available here for convenience.
 *
 * @param a First embedding
 * @param b Second embedding
 * @returns Similarity score in range [0, 1]
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  if (magnitude === 0) {
    return 0;
  }

  // Cosine similarity is [-1, 1], normalize to [0, 1]
  const similarity = dotProduct / magnitude;
  return (similarity + 1) / 2;
}

/**
 * Calculate semantic similarity between two texts.
 * Generates embeddings and computes cosine similarity.
 *
 * @param textA First text
 * @param textB Second text
 * @returns Similarity score in range [0, 1]
 */
export async function calculateSemanticSimilarity(textA: string, textB: string): Promise<number> {
  const [embeddingA, embeddingB] = await Promise.all([
    generateEmbedding(textA),
    generateEmbedding(textB),
  ]);

  return cosineSimilarity(embeddingA, embeddingB);
}

/**
 * Calculate combined mission/vision similarity.
 * Weighted average of mission and vision similarities.
 *
 * @param profileMission Profile's mission statement
 * @param profileVision Profile's vision statement
 * @param assignmentMission Assignment's mission statement
 * @param assignmentVision Assignment's vision statement
 * @returns Combined similarity score in range [0, 1]
 */
export async function calculateMissionVisionSimilarity(
  profileMission: string | null | undefined,
  profileVision: string | null | undefined,
  assignmentMission: string | null | undefined,
  assignmentVision: string | null | undefined
): Promise<number> {
  const missionSim =
    profileMission && assignmentMission
      ? await calculateSemanticSimilarity(profileMission, assignmentMission)
      : 0;

  const visionSim =
    profileVision && assignmentVision
      ? await calculateSemanticSimilarity(profileVision, assignmentVision)
      : 0;

  // Weight mission higher than vision (0.6 vs 0.4)
  // If one is missing, use only the available one
  if (profileMission && assignmentMission && profileVision && assignmentVision) {
    return 0.6 * missionSim + 0.4 * visionSim;
  } else if (profileMission && assignmentMission) {
    return missionSim;
  } else if (profileVision && assignmentVision) {
    return visionSim;
  }

  return 0;
}

/**
 * Check if the embedding model is available.
 * Useful for graceful degradation when model can't be loaded.
 */
export async function isModelAvailable(): Promise<boolean> {
  try {
    await initializeModel();
    return true;
  } catch {
    return false;
  }
}

/**
 * Preload the model for faster first-use response.
 * Call this during app initialization if desired.
 */
export async function preloadModel(): Promise<void> {
  try {
    await initializeModel();
  } catch (error) {
    console.error('[Embeddings] Failed to preload model:', error);
  }
}

/**
 * Format embedding array for PostgreSQL vector type.
 * Returns a string like '[0.1, 0.2, ...]'
 */
export function formatEmbeddingForPostgres(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}

/**
 * Parse PostgreSQL vector string back to number array.
 */
export function parseEmbeddingFromPostgres(vectorString: string): number[] {
  if (!vectorString) {
    return [];
  }

  // Remove brackets and split by comma
  const cleaned = vectorString.replace(/[\[\]]/g, '');
  return cleaned.split(',').map((s) => parseFloat(s.trim()));
}
