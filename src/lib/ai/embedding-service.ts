/**
 * Embedding Service using Transformers.js
 *
 * Generates text embeddings locally using the all-MiniLM-L6-v2 model.
 * This enables semantic similarity matching against the skills taxonomy
 * without external API calls.
 */

import { pipeline, Pipeline, env } from '@xenova/transformers';
import { log } from '@/lib/log';

// Configure transformers.js for server-side usage
// Disable local model checking in development to always use cache
env.allowLocalModels = false;
env.useBrowserCache = false;

// Model configuration
const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';
const EMBEDDING_DIMENSION = 384; // all-MiniLM-L6-v2 outputs 384-dim vectors

// Singleton instance
let embeddingPipeline: Pipeline | null = null;
let isLoading = false;
let loadPromise: Promise<Pipeline> | null = null;

/**
 * Initialize the embedding pipeline (singleton pattern)
 * Downloads model on first use (~25MB), then caches it
 */
async function getEmbeddingPipeline(): Promise<Pipeline> {
  // Return existing pipeline if available
  if (embeddingPipeline) {
    return embeddingPipeline;
  }

  // Wait for existing load if in progress
  if (isLoading && loadPromise) {
    return loadPromise;
  }

  // Start loading
  isLoading = true;

  loadPromise = (async () => {
    try {
      log.info('embedding.model.loading', { model: MODEL_NAME });
      const startTime = Date.now();

      // Load the feature-extraction pipeline
      const loaded = await pipeline('feature-extraction', MODEL_NAME, {
        // Use quantized model for faster loading and inference
        quantized: true,
      });
      embeddingPipeline = loaded;

      const loadTime = Date.now() - startTime;
      log.info('embedding.model.loaded', {
        model: MODEL_NAME,
        loadTimeMs: loadTime,
      });

      return loaded;
    } catch (error) {
      log.error('embedding.model.load_failed', {
        model: MODEL_NAME,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    } finally {
      isLoading = false;
    }
  })();

  return loadPromise;
}

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('Cannot generate embedding for empty text');
  }

  const pipe = await getEmbeddingPipeline();

  // Generate embedding
  const output = await pipe(text, {
    pooling: 'mean',
    normalize: true,
  });

  // Extract the embedding array
  // The output is a Tensor, we need to convert it to a regular array
  const embedding = Array.from(output.data as Float32Array);

  return embedding;
}

/**
 * Generate embeddings for multiple texts in batch
 * More efficient than calling generateEmbedding multiple times
 */
export async function generateEmbeddings(texts: string[]): Promise<Map<string, number[]>> {
  if (texts.length === 0) {
    return new Map();
  }

  const pipe = await getEmbeddingPipeline();
  const results = new Map<string, number[]>();

  // Process in batches to avoid memory issues
  const BATCH_SIZE = 32;

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, Math.min(i + BATCH_SIZE, texts.length));

    // Generate embeddings for this batch
    const outputs = await Promise.all(
      batch.map(async (text) => {
        if (!text || text.trim().length === 0) {
          return { text, embedding: null };
        }

        try {
          const output = await pipe(text, {
            pooling: 'mean',
            normalize: true,
          });
          const embedding = Array.from(output.data as Float32Array);
          return { text, embedding };
        } catch (error) {
          log.warn('embedding.generate.failed', {
            text: text.slice(0, 50),
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          return { text, embedding: null };
        }
      })
    );

    // Add to results
    for (const { text, embedding } of outputs) {
      if (embedding) {
        results.set(text, embedding);
      }
    }
  }

  return results;
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have the same dimension');
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

  if (magnitude === 0) return 0;

  return dotProduct / magnitude;
}

/**
 * Find the most similar items from a list of candidates
 */
export async function findMostSimilar(
  query: string,
  candidates: Array<{ text: string; id: string; embedding?: number[] }>,
  topK: number = 10
): Promise<Array<{ id: string; text: string; similarity: number }>> {
  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);

  // Calculate similarities
  const similarities: Array<{ id: string; text: string; similarity: number }> = [];

  for (const candidate of candidates) {
    let candidateEmbedding: number[];

    if (candidate.embedding) {
      // Use pre-computed embedding
      candidateEmbedding = candidate.embedding;
    } else {
      // Generate embedding on the fly
      try {
        candidateEmbedding = await generateEmbedding(candidate.text);
      } catch {
        continue;
      }
    }

    const similarity = cosineSimilarity(queryEmbedding, candidateEmbedding);

    similarities.push({
      id: candidate.id,
      text: candidate.text,
      similarity,
    });
  }

  // Sort by similarity descending and take top K
  similarities.sort((a, b) => b.similarity - a.similarity);

  return similarities.slice(0, topK);
}

/**
 * Format embedding array for PostgreSQL vector type
 * Converts [0.1, 0.2, ...] to '[0.1,0.2,...]'
 */
export function formatEmbeddingForPostgres(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}

/**
 * Parse embedding from PostgreSQL vector format
 */
export function parseEmbeddingFromPostgres(pgVector: string): number[] {
  // Remove brackets and split by comma
  const cleaned = pgVector.replace(/[\[\]]/g, '');
  return cleaned.split(',').map(Number);
}

/**
 * Get the embedding dimension
 */
export function getEmbeddingDimension(): number {
  return EMBEDDING_DIMENSION;
}

/**
 * Check if the model is loaded
 */
export function isModelLoaded(): boolean {
  return embeddingPipeline !== null;
}

/**
 * Preload the model (call this during app startup for faster first inference)
 */
export async function preloadModel(): Promise<void> {
  await getEmbeddingPipeline();
}
