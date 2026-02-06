-- ============================================================================
-- GENERATED FROM REMOTE supabase_migrations.schema_migrations
-- version: 20251125100909
-- name: fix_function_search_path
--
-- This file exists to sync local migration history with the remote database.
-- Do not edit by hand. Source of truth is the remote DB migration table.
-- ============================================================================
-- ============================================
-- FIX FUNCTION SEARCH PATH
-- ============================================
-- Migration: 20251125_fix_function_search_path
-- Date: 2025-11-25
-- Purpose: Set explicit search_path on all functions to prevent security issues
-- Reference: PRD Part 8 - Security & Privacy Requirements
-- ============================================

-- ============================================
-- TRIGGER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.auto_populate_field_visibility()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $function$
BEGIN
    INSERT INTO assignment_field_visibility (
        assignment_id,
        field_name,
        visibility_level,
        redaction_type,
        generic_label
    )
    SELECT
        NEW.id,
        d.field_name,
        d.default_visibility,
        d.default_redaction_type,
        d.default_generic_label
    FROM assignment_field_visibility_defaults d
    WHERE d.is_system_field = true
    ON CONFLICT (assignment_id, field_name) DO NOTHING;

    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.skills_taxonomy_search_vector_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $function$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.name_i18n->>'en', '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.slug, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.description_i18n->>'en', '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'D');

    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_competency_label()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $function$
BEGIN
    NEW.competency_label := CASE NEW.level
        WHEN 1 THEN 'C1'
        WHEN 2 THEN 'C2'
        WHEN 3 THEN 'C3'
        WHEN 4 THEN 'C4'
        WHEN 5 THEN 'C5'
        ELSE NULL
    END;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_skill_computed_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $function$
BEGIN
    UPDATE skills
    SET
        last_used_at = compute_skill_last_used(NEW.user_id, skill_code),
        recency_multiplier = compute_skill_recency_multiplier(NEW.user_id, skill_code),
        impact_score = compute_skill_impact_score(NEW.user_id, skill_code),
        evidence_strength = compute_skill_evidence_strength(NEW.user_id, skill_code),
        updated_at = NOW()
    WHERE profile_id = NEW.user_id
      AND skill_code IS NOT NULL;

    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_assignment_creation_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $function$
DECLARE
    assignment_id UUID;
    is_complete BOOLEAN;
BEGIN
    IF TG_OP = 'DELETE' THEN
        assignment_id := OLD.assignment_id;
    ELSE
        assignment_id := NEW.assignment_id;
    END IF;

    is_complete := is_pipeline_complete(assignment_id);

    IF is_complete THEN
        UPDATE assignments
        SET
            creation_status = 'pending_review',
            pipeline_completed_at = NOW(),
            updated_at = NOW()
        WHERE id = assignment_id
          AND creation_status = 'pipeline_in_progress';
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_skill_proofs_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_video_integrations_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_decisions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_profile_snippets_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.expire_verification_requests()
RETURNS void
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $function$
BEGIN
  UPDATE skill_verification_requests
  SET status = 'expired'
  WHERE status = 'pending'
  AND expires_at < NOW();
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_pipeline_complete(p_assignment_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_catalog
AS $function$
DECLARE
    incomplete_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO incomplete_count
    FROM assignment_creation_pipeline
    WHERE assignment_id = p_assignment_id
      AND status NOT IN ('completed', 'skipped');

    RETURN incomplete_count = 0;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_current_pipeline_step(p_assignment_id uuid)
RETURNS assignment_creation_pipeline
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_catalog
AS $function$
DECLARE
    current_step assignment_creation_pipeline;
BEGIN
    SELECT *
    INTO current_step
    FROM assignment_creation_pipeline
    WHERE assignment_id = p_assignment_id
      AND status IN ('pending', 'in_progress')
    ORDER BY step_order ASC
    LIMIT 1;

    RETURN current_step;
END;
$function$;

-- ============================================
-- SKILL COMPUTATION FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.compute_skill_last_used(p_user_id uuid, p_skill_code text)
RETURNS timestamp without time zone
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_catalog
AS $function$
DECLARE
    last_used TIMESTAMP;
BEGIN
    SELECT COALESCE(
        MAX(
            CASE
                WHEN p.status = 'ongoing' THEN NOW()
                WHEN p.end_date IS NOT NULL THEN p.end_date::timestamp
                ELSE p.start_date::timestamp
            END
        ),
        NULL
    )
    INTO last_used
    FROM projects p
    INNER JOIN project_skills ps ON p.id = ps.project_id
    WHERE p.user_id = p_user_id
      AND ps.skill_code = p_skill_code
      AND p.status IN ('ongoing', 'concluded');

    RETURN last_used;
END;
$function$;

CREATE OR REPLACE FUNCTION public.compute_skill_recency_multiplier(p_user_id uuid, p_skill_code text, alpha numeric DEFAULT 0.0578)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_catalog
AS $function$
DECLARE
    last_used TIMESTAMP;
    months_since NUMERIC;
BEGIN
    last_used := compute_skill_last_used(p_user_id, p_skill_code);

    IF last_used IS NULL THEN
        RETURN 0.5;
    END IF;

    months_since := EXTRACT(EPOCH FROM (NOW() - last_used)) / (30.44 * 24 * 3600);

    IF months_since < 0 THEN
        months_since := 0;
    END IF;

    RETURN EXP(-alpha * months_since);
END;
$function$;

CREATE OR REPLACE FUNCTION public.compute_skill_evidence_strength(p_user_id uuid, p_skill_code text)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_catalog
AS $function$
DECLARE
    strength NUMERIC := 0;
    peer_count INTEGER;
    employer_count INTEGER;
    public_count INTEGER;
BEGIN
    SELECT
        COUNT(*) FILTER (WHERE p.verification_source = 'referee') AS peer,
        COUNT(*) FILTER (WHERE p.verification_source = 'employer') AS employer,
        COUNT(*) FILTER (WHERE p.verification_source = 'public_acknowledgment') AS public
    INTO peer_count, employer_count, public_count
    FROM projects p
    INNER JOIN project_skills ps ON p.id = ps.project_id
    WHERE p.user_id = p_user_id
      AND ps.skill_code = p_skill_code
      AND p.verified = true;

    strength := LEAST(
        0.3 * (1 - EXP(-0.5 * peer_count)) +
        0.5 * (1 - EXP(-0.5 * employer_count)) +
        0.2 * (1 - EXP(-0.5 * public_count)),
        1.0
    );

    RETURN strength;
END;
$function$;

CREATE OR REPLACE FUNCTION public.compute_skill_impact_score(p_user_id uuid, p_skill_code text)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_catalog
AS $function$
DECLARE
    avg_impact NUMERIC;
BEGIN
    SELECT COALESCE(
        AVG(ps.outcome_contribution * COALESCE((p.outcomes->>'impact_score')::NUMERIC, 0.5)),
        0
    )
    INTO avg_impact
    FROM projects p
    INNER JOIN project_skills ps ON p.id = ps.project_id
    WHERE p.user_id = p_user_id
      AND ps.skill_code = p_skill_code
      AND p.status IN ('ongoing', 'concluded');

    RETURN LEAST(avg_impact, 1.0);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_skill_total_months(p_user_id uuid, p_skill_code text)
RETURNS integer
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_catalog
AS $function$
DECLARE
    total_months INTEGER;
BEGIN
    SELECT COALESCE(
        SUM(
            EXTRACT(EPOCH FROM (
                COALESCE(p.end_date::timestamp, NOW()) - p.start_date::timestamp
            )) / (30.44 * 24 * 3600)
        )::INTEGER,
        0
    )
    INTO total_months
    FROM projects p
    INNER JOIN project_skills ps ON p.id = ps.project_id
    WHERE p.user_id = p_user_id
      AND ps.skill_code = p_skill_code
      AND p.status IN ('ongoing', 'concluded');

    RETURN total_months;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_active_skills(p_user_id uuid, recent_months integer DEFAULT 24)
RETURNS TABLE(skill_code text, skill_name text, last_used timestamp without time zone, total_projects integer, avg_proficiency numeric, recency_score numeric)
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_catalog
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        ps.skill_code,
        (st.name_i18n->>'en')::TEXT AS skill_name,
        MAX(
            CASE
                WHEN p.status = 'ongoing' THEN NOW()
                ELSE COALESCE(p.end_date::timestamp, p.start_date::timestamp)
            END
        ) AS last_used,
        COUNT(DISTINCT p.id)::INTEGER AS total_projects,
        AVG(ps.proficiency_level) AS avg_proficiency,
        compute_skill_recency_multiplier(p_user_id, ps.skill_code) AS recency_score
    FROM projects p
    INNER JOIN project_skills ps ON p.id = ps.project_id
    INNER JOIN skills_taxonomy st ON ps.skill_code = st.code
    WHERE p.user_id = p_user_id
      AND p.status IN ('ongoing', 'concluded')
      AND (
          p.status = 'ongoing'
          OR p.end_date >= NOW() - (recent_months || ' months')::INTERVAL
      )
    GROUP BY ps.skill_code, st.name_i18n
    ORDER BY last_used DESC;
END;
$function$;

-- ============================================
-- MATCHING & SCORING FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.calculate_benefits_match(p_user_id uuid, p_assignment_id uuid)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_catalog
AS $function$
DECLARE
    required_count INTEGER;
    matched_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO required_count
    FROM profile_benefits_prefs
    WHERE user_id = p_user_id
      AND importance = 'required';

    IF required_count = 0 THEN
        RETURN 1.0;
    END IF;

    SELECT COUNT(*)
    INTO matched_count
    FROM profile_benefits_prefs pbp
    INNER JOIN assignment_benefits_offered abo ON pbp.benefit_code = abo.benefit_code
    WHERE pbp.user_id = p_user_id
      AND pbp.importance = 'required'
      AND abo.assignment_id = p_assignment_id;

    RETURN matched_count::NUMERIC / required_count::NUMERIC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_work_auth_compatible(p_user_id uuid, p_assignment_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_catalog
AS $function$
DECLARE
    needs_sponsorship BOOLEAN;
    can_sponsor BOOLEAN;
    user_countries TEXT[];
    sponsor_countries TEXT[];
BEGIN
    SELECT mp.needs_sponsorship
    INTO needs_sponsorship
    FROM matching_profiles mp
    WHERE mp.profile_id = p_user_id;

    IF NOT needs_sponsorship THEN
        RETURN true;
    END IF;

    SELECT a.can_sponsor_visa, a.sponsorship_countries
    INTO can_sponsor, sponsor_countries
    FROM assignments a
    WHERE a.id = p_assignment_id;

    IF NOT can_sponsor THEN
        RETURN false;
    END IF;

    IF sponsor_countries IS NULL OR array_length(sponsor_countries, 1) IS NULL THEN
        RETURN true;
    END IF;

    SELECT (mp.work_authorization->'countries')::TEXT[]
    INTO user_countries
    FROM matching_profiles mp
    WHERE mp.profile_id = p_user_id;

    IF user_countries IS NULL THEN
        RETURN true;
    END IF;

    RETURN EXISTS (
        SELECT 1
        FROM unnest(user_countries) AS uc
        WHERE uc = ANY(sponsor_countries)
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_availability_overlap(candidate_bitmap bit, required_bitmap bit)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_catalog
AS $function$
DECLARE
    overlap_bits INTEGER;
    required_bits INTEGER;
BEGIN
    IF candidate_bitmap IS NULL OR required_bitmap IS NULL THEN
        RETURN 1.0;
    END IF;

    required_bits := bit_count(required_bitmap);

    IF required_bits = 0 THEN
        RETURN 1.0;
    END IF;

    overlap_bits := bit_count(candidate_bitmap & required_bitmap);

    RETURN overlap_bits::NUMERIC / required_bits::NUMERIC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.normalize_compensation_to_usd(amount numeric, currency text)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_catalog
AS $function$
DECLARE
    rate NUMERIC;
BEGIN
    IF currency = 'USD' THEN
        RETURN amount;
    END IF;

    SELECT r.rate INTO rate
    FROM currency_exchange_rates r
    WHERE r.from_currency = currency
      AND r.to_currency = 'USD'
    ORDER BY r.last_updated DESC
    LIMIT 1;

    IF rate IS NULL THEN
        RETURN amount;
    END IF;

    RETURN amount * rate;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_compensation_score(candidate_comp_target numeric, candidate_currency text, assignment_budget_min numeric, assignment_budget_max numeric, assignment_currency text, k numeric DEFAULT 10.0)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_catalog
AS $function$
DECLARE
    target_usd NUMERIC;
    budget_mid_usd NUMERIC;
    diff_ratio NUMERIC;
BEGIN
    target_usd := normalize_compensation_to_usd(candidate_comp_target, candidate_currency);
    budget_mid_usd := normalize_compensation_to_usd(
        (assignment_budget_min + assignment_budget_max) / 2.0,
        assignment_currency
    );

    IF budget_mid_usd = 0 THEN
        RETURN 1.0;
    END IF;

    diff_ratio := (budget_mid_usd - target_usd) / budget_mid_usd;

    RETURN 1.0 / (1.0 + EXP(-k * diff_ratio));
END;
$function$;

-- ============================================
-- SKILL TAXONOMY FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.skill_taxonomy_distance(code1 text, code2 text)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_catalog
AS $function$
DECLARE
    parts1 TEXT[];
    parts2 TEXT[];
BEGIN
    -- Same skill
    IF code1 = code2 THEN
        RETURN 0;
    END IF;

    -- Parse codes (format: "01.02.03.004")
    parts1 := string_to_array(code1, '.');
    parts2 := string_to_array(code2, '.');

    -- Same L1.L2.L3, different L4 → distance 1
    IF parts1[1] = parts2[1] AND parts1[2] = parts2[2] AND parts1[3] = parts2[3] THEN
        RETURN 1;
    END IF;

    -- Same L1.L2, different L3 → distance 2
    IF parts1[1] = parts2[1] AND parts1[2] = parts2[2] THEN
        RETURN 2;
    END IF;

    -- Same L1, different L2 → distance 3
    IF parts1[1] = parts2[1] THEN
        RETURN 3;
    END IF;

    -- Different L1 → no adjacency
    RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.skill_adjacency_factor(code1 text, code2 text, lambda numeric DEFAULT 0.7)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_catalog
AS $function$
DECLARE
    dist INTEGER;
BEGIN
    -- Check explicit adjacency first
    SELECT distance INTO dist
    FROM skill_adjacency
    WHERE (from_code = code1 AND to_code = code2)
       OR (from_code = code2 AND to_code = code1)
    LIMIT 1;

    IF dist IS NOT NULL THEN
        RETURN EXP(-lambda * dist);
    END IF;

    -- Fall back to taxonomy distance
    dist := skill_taxonomy_distance(code1, code2);

    IF dist IS NULL OR dist > 3 THEN
        RETURN 0;
    END IF;

    RETURN EXP(-lambda * dist);
END;
$function$;

CREATE OR REPLACE FUNCTION public.search_skills_smart(search_query text, result_limit integer DEFAULT 50)
RETURNS TABLE(code text, name_i18n jsonb, slug text, description_i18n jsonb, aliases_i18n jsonb, tags text[], cat_id integer, subcat_id integer, l3_id integer, relevance_score real, match_type text)
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_catalog
AS $function$
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
$function$;
