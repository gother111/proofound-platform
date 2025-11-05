-- Fix the ambiguous column reference in search_skills_smart function

DROP FUNCTION IF EXISTS search_skills_smart(TEXT, INTEGER);

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

-- Grant permissions
GRANT EXECUTE ON FUNCTION search_skills_smart(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION search_skills_smart(TEXT, INTEGER) TO anon;

COMMENT ON FUNCTION search_skills_smart IS 'Smart search function that combines exact, fuzzy (trigram), and full-text matching with relevance scoring - FIXED version';
