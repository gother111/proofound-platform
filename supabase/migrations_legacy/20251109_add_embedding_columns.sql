-- Migration: Add embedding columns for semantic matching
-- PRD Reference: Proofound_Matching_Conversation.md - Semantic search with pgvector
--
-- This migration adds:
-- 1. pgvector extension (if not already enabled)
-- 2. Embedding columns to matching_profiles for mission/vision
-- 3. Embedding columns to assignments for mission/vision
-- 4. HNSW indexes for fast approximate nearest neighbor search
-- 5. Helper function for embedding-based matching

-- ============================================================================
-- STEP 1: Enable pgvector extension
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- STEP 2: Add embedding columns to matching_profiles
-- ============================================================================

-- Mission embedding (384 dimensions for all-MiniLM-L6-v2)
ALTER TABLE matching_profiles
ADD COLUMN IF NOT EXISTS mission_embedding vector(384);

-- Vision embedding
ALTER TABLE matching_profiles
ADD COLUMN IF NOT EXISTS vision_embedding vector(384);

-- Combined purpose embedding (for ANN search)
ALTER TABLE matching_profiles
ADD COLUMN IF NOT EXISTS purpose_embedding vector(384);

-- Track when embeddings were last updated
ALTER TABLE matching_profiles
ADD COLUMN IF NOT EXISTS embeddings_updated_at timestamp;

-- ============================================================================
-- STEP 3: Add embedding columns to assignments
-- ============================================================================

-- Mission embedding
ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS mission_embedding vector(384);

-- Vision embedding
ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS vision_embedding vector(384);

-- Combined purpose embedding (for ANN search)
ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS purpose_embedding vector(384);

-- Track when embeddings were last updated
ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS embeddings_updated_at timestamp;

-- ============================================================================
-- STEP 4: Add embedding columns to individual_profiles
-- (Profile mission/vision are stored here, will be synced to matching_profiles)
-- ============================================================================

ALTER TABLE individual_profiles
ADD COLUMN IF NOT EXISTS mission_embedding vector(384);

ALTER TABLE individual_profiles
ADD COLUMN IF NOT EXISTS vision_embedding vector(384);

ALTER TABLE individual_profiles
ADD COLUMN IF NOT EXISTS embeddings_updated_at timestamp;

-- ============================================================================
-- STEP 5: Add embedding columns to organizations
-- (Org mission/vision used for assignments)
-- ============================================================================

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS mission_embedding vector(384);

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS vision_embedding vector(384);

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS embeddings_updated_at timestamp;

-- ============================================================================
-- STEP 6: Create HNSW indexes for fast ANN search
-- HNSW parameters:
--   m = 16: number of connections per element (higher = better recall, more memory)
--   ef_construction = 64: construction time/accuracy tradeoff
-- ============================================================================

-- Index on matching_profiles purpose embedding
CREATE INDEX IF NOT EXISTS idx_matching_profiles_purpose_embedding
ON matching_profiles
USING hnsw (purpose_embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Index on assignments purpose embedding
CREATE INDEX IF NOT EXISTS idx_assignments_purpose_embedding
ON assignments
USING hnsw (purpose_embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- ============================================================================
-- STEP 7: Create helper function for embedding similarity search
-- ============================================================================

-- Function to find similar profiles for an assignment
CREATE OR REPLACE FUNCTION find_similar_profiles_by_embedding(
  query_embedding vector(384),
  limit_count integer DEFAULT 500
)
RETURNS TABLE (
  profile_id uuid,
  similarity float
)
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    profile_id,
    1 - (purpose_embedding <=> query_embedding) AS similarity
  FROM matching_profiles
  WHERE purpose_embedding IS NOT NULL
  ORDER BY purpose_embedding <=> query_embedding
  LIMIT limit_count;
$$;

-- Function to find similar assignments for a profile
CREATE OR REPLACE FUNCTION find_similar_assignments_by_embedding(
  query_embedding vector(384),
  limit_count integer DEFAULT 100
)
RETURNS TABLE (
  assignment_id uuid,
  similarity float
)
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    id AS assignment_id,
    1 - (purpose_embedding <=> query_embedding) AS similarity
  FROM assignments
  WHERE purpose_embedding IS NOT NULL
    AND status = 'active'
  ORDER BY purpose_embedding <=> query_embedding
  LIMIT limit_count;
$$;

-- ============================================================================
-- STEP 8: Add comments for documentation
-- ============================================================================

COMMENT ON COLUMN matching_profiles.mission_embedding IS 'Embedding vector for profile mission statement (384 dimensions, all-MiniLM-L6-v2)';
COMMENT ON COLUMN matching_profiles.vision_embedding IS 'Embedding vector for profile vision statement (384 dimensions)';
COMMENT ON COLUMN matching_profiles.purpose_embedding IS 'Combined mission+vision embedding for ANN search';
COMMENT ON COLUMN matching_profiles.embeddings_updated_at IS 'Timestamp when embeddings were last regenerated';

COMMENT ON COLUMN assignments.mission_embedding IS 'Embedding vector for assignment mission/description (384 dimensions)';
COMMENT ON COLUMN assignments.vision_embedding IS 'Embedding vector for assignment vision/goals (384 dimensions)';
COMMENT ON COLUMN assignments.purpose_embedding IS 'Combined embedding for ANN search';
COMMENT ON COLUMN assignments.embeddings_updated_at IS 'Timestamp when embeddings were last regenerated';

COMMENT ON INDEX idx_matching_profiles_purpose_embedding IS 'HNSW index for fast ANN search on profile embeddings';
COMMENT ON INDEX idx_assignments_purpose_embedding IS 'HNSW index for fast ANN search on assignment embeddings';

-- ============================================================================
-- STEP 9: Grant permissions
-- ============================================================================

-- Ensure service role can use the functions
GRANT EXECUTE ON FUNCTION find_similar_profiles_by_embedding(vector, integer) TO service_role;
GRANT EXECUTE ON FUNCTION find_similar_assignments_by_embedding(vector, integer) TO service_role;

