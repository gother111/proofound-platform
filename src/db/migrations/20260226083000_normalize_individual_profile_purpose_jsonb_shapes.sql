-- Normalize legacy JSONB string payloads in individual profile purpose columns.
-- This migration is idempotent and only updates rows where JSONB values are strings.

CREATE OR REPLACE FUNCTION pg_temp.try_parse_jsonb(input_text text)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  parsed jsonb;
BEGIN
  IF input_text IS NULL OR btrim(input_text) = '' THEN
    RETURN NULL;
  END IF;

  parsed := input_text::jsonb;
  RETURN parsed;
EXCEPTION
  WHEN others THEN
    RETURN NULL;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.individual_profiles') IS NULL THEN
    RAISE NOTICE 'Skipping PRO-75 normalization: public.individual_profiles not found';
    RETURN;
  END IF;

  UPDATE public.individual_profiles AS p
  SET values = CASE
    WHEN parsed.parsed_payload IS NOT NULL
      AND jsonb_typeof(parsed.parsed_payload) = 'array'
      THEN parsed.parsed_payload
    ELSE '[]'::jsonb
  END
  FROM (
    SELECT
      user_id,
      pg_temp.try_parse_jsonb(values #>> '{}') AS parsed_payload
    FROM public.individual_profiles
    WHERE jsonb_typeof(values) = 'string'
  ) AS parsed
  WHERE p.user_id = parsed.user_id
    AND jsonb_typeof(p.values) = 'string';

  UPDATE public.individual_profiles AS p
  SET mission_links = jsonb_build_object(
    'values',
    CASE
      WHEN parsed.parsed_payload IS NOT NULL
        AND jsonb_typeof(parsed.parsed_payload -> 'values') = 'array'
        THEN parsed.parsed_payload -> 'values'
      ELSE '[]'::jsonb
    END,
    'causes',
    CASE
      WHEN parsed.parsed_payload IS NOT NULL
        AND jsonb_typeof(parsed.parsed_payload -> 'causes') = 'array'
        THEN parsed.parsed_payload -> 'causes'
      ELSE '[]'::jsonb
    END
  )
  FROM (
    SELECT
      user_id,
      pg_temp.try_parse_jsonb(mission_links #>> '{}') AS parsed_payload
    FROM public.individual_profiles
    WHERE jsonb_typeof(mission_links) = 'string'
  ) AS parsed
  WHERE p.user_id = parsed.user_id
    AND jsonb_typeof(p.mission_links) = 'string';

  UPDATE public.individual_profiles AS p
  SET vision_links = jsonb_build_object(
    'values',
    CASE
      WHEN parsed.parsed_payload IS NOT NULL
        AND jsonb_typeof(parsed.parsed_payload -> 'values') = 'array'
        THEN parsed.parsed_payload -> 'values'
      ELSE '[]'::jsonb
    END,
    'causes',
    CASE
      WHEN parsed.parsed_payload IS NOT NULL
        AND jsonb_typeof(parsed.parsed_payload -> 'causes') = 'array'
        THEN parsed.parsed_payload -> 'causes'
      ELSE '[]'::jsonb
    END
  )
  FROM (
    SELECT
      user_id,
      pg_temp.try_parse_jsonb(vision_links #>> '{}') AS parsed_payload
    FROM public.individual_profiles
    WHERE jsonb_typeof(vision_links) = 'string'
  ) AS parsed
  WHERE p.user_id = parsed.user_id
    AND jsonb_typeof(p.vision_links) = 'string';
END;
$$;
