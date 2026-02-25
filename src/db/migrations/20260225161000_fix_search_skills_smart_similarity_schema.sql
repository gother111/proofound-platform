-- Migration: Harden smart taxonomy search and include alias ranking
-- Date: 2026-02-25
-- Purpose:
--   - Fix similarity/operator resolution by including extensions schema in function search_path
--   - Add canonical + alias ranking tiers
--   - Keep function signature and API contract stable

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION public.normalize_skill_alias(input_text TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $function$
  SELECT regexp_replace(
    trim(
      regexp_replace(
        lower(
          replace(
            extensions.unaccent(coalesce(input_text, '')),
            '&',
            ' and '
          )
        ),
        '[^a-z0-9]+',
        ' ',
        'g'
      )
    ),
    '\\s+',
    ' ',
    'g'
  )
$function$;

CREATE OR REPLACE FUNCTION public.search_skills_smart(
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
)
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_catalog, extensions
AS $function$
DECLARE
  cleaned_query TEXT;
  normalized_query TEXT;
  effective_limit INTEGER;
BEGIN
  cleaned_query := trim(coalesce(search_query, ''));
  IF cleaned_query = '' THEN
    RETURN;
  END IF;

  normalized_query := public.normalize_skill_alias(cleaned_query);
  effective_limit := GREATEST(COALESCE(result_limit, 50), 1);

  RETURN QUERY
  WITH canonical_base AS (
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
      public.normalize_skill_alias(st.name_i18n->>'en') AS canonical_name_norm
    FROM public.skills_taxonomy st
    WHERE st.status = 'active'
  ),
  exact_canonical AS (
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
      130.0::REAL AS score,
      1 AS tier,
      'exact_canonical'::TEXT AS match_type
    FROM canonical_base st
    WHERE
      lower(st.name_i18n->>'en') = lower(cleaned_query)
      OR lower(st.slug) = lower(cleaned_query)
      OR st.canonical_name_norm = normalized_query
    ORDER BY st.code
    LIMIT LEAST(effective_limit, 50)
  ),
  exact_alias AS (
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
      (118.0 + (COALESCE(a.confidence, 1.0)::REAL * 2.0))::REAL AS score,
      2 AS tier,
      'exact_alias'::TEXT AS match_type
    FROM public.skills_taxonomy_aliases a
    INNER JOIN canonical_base st
      ON st.code = a.skill_code
    WHERE
      a.status = 'active'
      AND a.locale = 'en'
      AND (
        lower(a.alias) = lower(cleaned_query)
        OR a.alias_norm = normalized_query
      )
      AND st.code NOT IN (SELECT em.code FROM exact_canonical em)
    ORDER BY st.code
    LIMIT LEAST(effective_limit, 50)
  ),
  fuzzy_canonical AS (
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
      (
        GREATEST(
          extensions.similarity(COALESCE(st.name_i18n->>'en', ''), cleaned_query),
          extensions.similarity(COALESCE(st.slug, ''), cleaned_query),
          extensions.similarity(st.canonical_name_norm, normalized_query)
        ) * 90.0
      )::REAL AS score,
      3 AS tier,
      'fuzzy_canonical'::TEXT AS match_type
    FROM canonical_base st
    WHERE
      st.code NOT IN (SELECT em.code FROM exact_canonical em)
      AND st.code NOT IN (SELECT ea.code FROM exact_alias ea)
      AND (
        COALESCE(st.name_i18n->>'en', '') OPERATOR(extensions.%) cleaned_query
        OR COALESCE(st.slug, '') OPERATOR(extensions.%) cleaned_query
        OR st.canonical_name_norm OPERATOR(extensions.%) normalized_query
      )
    ORDER BY score DESC, st.code
    LIMIT effective_limit * 4
  ),
  fuzzy_alias AS (
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
      (
        GREATEST(
          extensions.similarity(COALESCE(a.alias, ''), cleaned_query),
          extensions.similarity(COALESCE(a.alias_norm, ''), normalized_query)
        ) * 85.0
      + (COALESCE(a.confidence, 1.0)::REAL * 3.0)
      )::REAL AS score,
      4 AS tier,
      'fuzzy_alias'::TEXT AS match_type
    FROM public.skills_taxonomy_aliases a
    INNER JOIN canonical_base st
      ON st.code = a.skill_code
    WHERE
      a.status = 'active'
      AND a.locale = 'en'
      AND st.code NOT IN (SELECT em.code FROM exact_canonical em)
      AND st.code NOT IN (SELECT ea.code FROM exact_alias ea)
      AND st.code NOT IN (SELECT fm.code FROM fuzzy_canonical fm)
      AND (
        COALESCE(a.alias, '') OPERATOR(extensions.%) cleaned_query
        OR COALESCE(a.alias_norm, '') OPERATOR(extensions.%) normalized_query
      )
    ORDER BY score DESC, st.code
    LIMIT effective_limit * 4
  ),
  fulltext_canonical AS (
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
      (
        ts_rank(
          to_tsvector(
            'english',
            concat_ws(
              ' ',
              COALESCE(st.name_i18n->>'en', ''),
              COALESCE(st.slug, ''),
              COALESCE(st.description_i18n->>'en', ''),
              COALESCE(array_to_string(st.tags, ' '), '')
            )
          ),
          websearch_to_tsquery('english', cleaned_query)
        ) * 60.0
      )::REAL AS score,
      5 AS tier,
      'fulltext_canonical'::TEXT AS match_type
    FROM canonical_base st
    WHERE
      st.code NOT IN (SELECT em.code FROM exact_canonical em)
      AND st.code NOT IN (SELECT ea.code FROM exact_alias ea)
      AND st.code NOT IN (SELECT fm.code FROM fuzzy_canonical fm)
      AND st.code NOT IN (SELECT fa.code FROM fuzzy_alias fa)
      AND to_tsvector(
        'english',
        concat_ws(
          ' ',
          COALESCE(st.name_i18n->>'en', ''),
          COALESCE(st.slug, ''),
          COALESCE(st.description_i18n->>'en', ''),
          COALESCE(array_to_string(st.tags, ' '), '')
        )
      ) @@ websearch_to_tsquery('english', cleaned_query)
    ORDER BY score DESC, st.code
    LIMIT effective_limit * 3
  ),
  combined AS (
    SELECT * FROM exact_canonical
    UNION ALL
    SELECT * FROM exact_alias
    UNION ALL
    SELECT * FROM fuzzy_canonical
    UNION ALL
    SELECT * FROM fuzzy_alias
    UNION ALL
    SELECT * FROM fulltext_canonical
  ),
  deduped AS (
    SELECT DISTINCT ON (c.code)
      c.code,
      c.name_i18n,
      c.slug,
      c.description_i18n,
      c.aliases_i18n,
      c.tags,
      c.cat_id,
      c.subcat_id,
      c.l3_id,
      c.score,
      c.match_type,
      c.tier
    FROM combined c
    ORDER BY c.code, c.tier ASC, c.score DESC
  )
  SELECT
    d.code,
    d.name_i18n,
    d.slug,
    d.description_i18n,
    d.aliases_i18n,
    d.tags,
    d.cat_id,
    d.subcat_id,
    d.l3_id,
    d.score AS relevance_score,
    d.match_type
  FROM deduped d
  ORDER BY d.score DESC, d.tier ASC, d.code
  LIMIT effective_limit;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.search_skills_smart(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_skills_smart(TEXT, INTEGER) TO anon;

COMMENT ON FUNCTION public.search_skills_smart IS 'Reliable smart taxonomy search with canonical + alias exact/fuzzy/full-text ranking and extensions-safe similarity resolution.';
