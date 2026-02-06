-- Migration: Add Smart Search Capabilities to skills_taxonomy
-- Created: 2025-11-05
-- Purpose: Enable fuzzy/smart search with trigrams and full-text search

-- ==========================================
-- 1. Enable Required Extensions
-- ==========================================

-- Enable pg_trgm for fuzzy/typo-tolerant matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enable unaccent for handling accented characters (optional but helpful)
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ==========================================
-- 2. Add Search Vector Column for Full-Text Search
-- ==========================================

-- Add tsvector column for full-text search if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'skills_taxonomy'
        AND column_name = 'search_vector'
    ) THEN
        ALTER TABLE skills_taxonomy
        ADD COLUMN search_vector tsvector;
    END IF;
END $$;

-- ==========================================
-- 3. Create Function to Update Search Vector
-- ==========================================

-- Function to generate search vector from skill data
CREATE OR REPLACE FUNCTION skills_taxonomy_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.name_i18n->>'en', '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.slug, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.description_i18n->>'en', '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'D');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 4. Create Trigger for Auto-Updating Search Vector
-- ==========================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS skills_taxonomy_search_vector_trigger ON skills_taxonomy;

-- Create trigger to auto-update search_vector on INSERT/UPDATE
CREATE TRIGGER skills_taxonomy_search_vector_trigger
BEFORE INSERT OR UPDATE OF name_i18n, slug, description_i18n, tags
ON skills_taxonomy
FOR EACH ROW
EXECUTE FUNCTION skills_taxonomy_search_vector_update();

-- ==========================================
-- 5. Update Existing Records
-- ==========================================

-- Populate search_vector for all existing records
UPDATE skills_taxonomy
SET search_vector =
    setweight(to_tsvector('english', COALESCE(name_i18n->>'en', '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(slug, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(description_i18n->>'en', '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(tags, ' '), '')), 'D')
WHERE search_vector IS NULL;

-- ==========================================
-- 6. Create Indexes for Fast Searching
-- ==========================================

-- GIN index for full-text search (handles complex queries, stemming)
CREATE INDEX IF NOT EXISTS idx_skills_taxonomy_search_vector
ON skills_taxonomy USING GIN(search_vector);

-- GIN index for trigram similarity on skill name (handles typos, partial matches)
CREATE INDEX IF NOT EXISTS idx_skills_taxonomy_name_trgm
ON skills_taxonomy USING GIN((name_i18n->>'en') gin_trgm_ops);

-- GIN index for trigram similarity on description
CREATE INDEX IF NOT EXISTS idx_skills_taxonomy_desc_trgm
ON skills_taxonomy USING GIN((description_i18n->>'en') gin_trgm_ops);

-- GIN index for aliases (if array is populated)
CREATE INDEX IF NOT EXISTS idx_skills_taxonomy_aliases_trgm
ON skills_taxonomy USING GIN((aliases_i18n->>'en') gin_trgm_ops);

-- B-tree index for exact slug matches (fast exact lookups)
CREATE INDEX IF NOT EXISTS idx_skills_taxonomy_slug
ON skills_taxonomy(slug);

-- ==========================================
-- 7. Create Helper Function for Smart Search
-- ==========================================

-- Function to search skills with ranking
CREATE OR REPLACE FUNCTION search_skills_smart(
    search_query TEXT,
    result_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    code TEXT,
    name_i18n JSONB,
    slug TEXT,
    description_i18n JSONB,
    aliases_i18n JSONB,
    tags TEXT[],
    cat_id INTEGER,
    subcat_id INTEGER,
    l3_id INTEGER,
    relevance_score REAL,
    match_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH
    -- Exact matches (highest priority)
    exact_matches AS (
        SELECT
            st.code,
            st.name_i18n,
            st.slug,
            st.description_i18n,
            st.aliases_i18n,
            st.tags,
            st.cat_id,
            st.subcat_id,
            st.l3_id,
            100.0::REAL as score,
            'exact'::TEXT as match_type
        FROM skills_taxonomy st
        WHERE
            LOWER(st.name_i18n->>'en') = LOWER(search_query)
            OR LOWER(st.slug) = LOWER(search_query)
        LIMIT 10
    ),
    -- Fuzzy/trigram matches (medium priority, handles typos)
    fuzzy_matches AS (
        SELECT
            st.code,
            st.name_i18n,
            st.slug,
            st.description_i18n,
            st.aliases_i18n,
            st.tags,
            st.cat_id,
            st.subcat_id,
            st.l3_id,
            (similarity(st.name_i18n->>'en', search_query) * 80.0)::REAL as score,
            'fuzzy'::TEXT as match_type
        FROM skills_taxonomy st
        WHERE
            st.code NOT IN (SELECT em.code FROM exact_matches em)
            AND (
                (st.name_i18n->>'en') % search_query
                OR (st.description_i18n->>'en') % search_query
            )
        ORDER BY similarity(st.name_i18n->>'en', search_query) DESC
        LIMIT 30
    ),
    -- Full-text search matches (lower priority, handles word variations)
    fulltext_matches AS (
        SELECT
            st.code,
            st.name_i18n,
            st.slug,
            st.description_i18n,
            st.aliases_i18n,
            st.tags,
            st.cat_id,
            st.subcat_id,
            st.l3_id,
            (ts_rank(st.search_vector, websearch_to_tsquery('english', search_query)) * 60.0)::REAL as score,
            'fulltext'::TEXT as match_type
        FROM skills_taxonomy st
        WHERE
            st.code NOT IN (SELECT em.code FROM exact_matches em)
            AND st.code NOT IN (SELECT fm.code FROM fuzzy_matches fm)
            AND st.search_vector @@ websearch_to_tsquery('english', search_query)
        ORDER BY ts_rank(st.search_vector, websearch_to_tsquery('english', search_query)) DESC
        LIMIT 20
    )
    -- Combine all results
    SELECT * FROM exact_matches
    UNION ALL
    SELECT * FROM fuzzy_matches
    UNION ALL
    SELECT * FROM fulltext_matches
    ORDER BY score DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ==========================================
-- 8. Grant Permissions
-- ==========================================

-- Grant execute permission on the search function
GRANT EXECUTE ON FUNCTION search_skills_smart(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION search_skills_smart(TEXT, INTEGER) TO anon;

-- ==========================================
-- 9. Add Helpful Comments
-- ==========================================

COMMENT ON COLUMN skills_taxonomy.search_vector IS 'Computed tsvector for full-text search across name, slug, description, and tags';
COMMENT ON FUNCTION search_skills_smart IS 'Smart search function that combines exact, fuzzy (trigram), and full-text matching with relevance scoring';

-- ==========================================
-- Verification Queries (for testing)
-- ==========================================

-- Test the search function:
-- SELECT * FROM search_skills_smart('python', 10);
-- SELECT * FROM search_skills_smart('react', 10);
-- SELECT * FROM search_skills_smart('pythn', 10);  -- Test typo tolerance
-- SELECT * FROM search_skills_smart('prog', 10);   -- Test partial matches
