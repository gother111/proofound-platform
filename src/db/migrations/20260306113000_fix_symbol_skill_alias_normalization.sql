BEGIN;

CREATE OR REPLACE FUNCTION public.normalize_skill_alias(input_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $function$
DECLARE
  normalized TEXT;
BEGIN
  normalized := lower(
    replace(
      extensions.unaccent(coalesce(input_text, '')),
      '&',
      ' and '
    )
  );

  normalized := regexp_replace(
    normalized,
    '(^|[^a-z0-9])c\s*\+\+([^a-z0-9]|$)',
    '\1 cplusplus \2',
    'g'
  );
  normalized := regexp_replace(
    normalized,
    '(^|[^a-z0-9])c\s*#([^a-z0-9]|$)',
    '\1 csharp \2',
    'g'
  );
  normalized := regexp_replace(
    normalized,
    '(^|[^a-z0-9])(?:\.\s*net|dot\s*net|dotnet)([^a-z0-9]|$)',
    '\1 dotnet \2',
    'g'
  );
  normalized := regexp_replace(
    normalized,
    '(^|[^a-z0-9])node\s*(?:\.\s*js|\s+js|js)([^a-z0-9]|$)',
    '\1 nodejs \2',
    'g'
  );
  normalized := regexp_replace(
    normalized,
    '(^|[^a-z0-9])react\s*(?:\.\s*js|\s+js|js)([^a-z0-9]|$)',
    '\1 reactjs \2',
    'g'
  );
  normalized := regexp_replace(
    normalized,
    '(^|[^a-z0-9])next\s*(?:\.\s*js|\s+js|js)([^a-z0-9]|$)',
    '\1 nextjs \2',
    'g'
  );
  normalized := regexp_replace(
    normalized,
    '(^|[^a-z0-9])ci\s*(?:/\s*|\s+)cd([^a-z0-9]|$)',
    '\1 cicd \2',
    'g'
  );
  normalized := regexp_replace(normalized, '[^a-z0-9]+', ' ', 'g');
  normalized := trim(normalized);
  normalized := regexp_replace(normalized, '\s+', ' ', 'g');

  RETURN normalized;
END;
$function$;

ALTER TABLE public.skills_taxonomy_aliases
  DROP CONSTRAINT IF EXISTS skills_taxonomy_aliases_skill_locale_alias_norm_key;

DROP INDEX IF EXISTS public.idx_skills_taxonomy_aliases_unique_active_alias_norm;

ALTER TABLE public.skills_taxonomy_aliases
  ADD CONSTRAINT skills_taxonomy_aliases_skill_locale_alias_norm_status_key
  UNIQUE (skill_code, locale, alias_norm, status)
  DEFERRABLE INITIALLY DEFERRED;

CREATE TEMP TABLE tmp_skill_alias_projection ON COMMIT DROP AS
SELECT
  a.id,
  a.skill_code,
  a.locale,
  a.alias,
  a.source,
  a.confidence,
  CASE
    WHEN public.normalize_skill_alias(a.alias) = public.normalize_skill_alias(COALESCE(st.name_i18n->>'en', ''))
      THEN 'deprecated'
    WHEN a.skill_code = '03.082.649.96351' AND lower(a.alias) = 'c#' THEN 'active'
    WHEN a.skill_code = '03.082.653.13641' AND lower(a.alias) = 'cplusplus' THEN 'deprecated'
    WHEN a.skill_code = '03.082.655.95017' AND lower(a.alias) = 'nodejs' THEN 'deprecated'
    ELSE a.status
  END AS next_status,
  public.normalize_skill_alias(a.alias) AS next_alias_norm
FROM public.skills_taxonomy_aliases a
INNER JOIN public.skills_taxonomy st
  ON st.code = a.skill_code;

DO $block$
DECLARE
  collision_count INTEGER;
BEGIN
  INSERT INTO public.skills_taxonomy_alias_conflicts (
    locale,
    alias,
    alias_norm,
    incoming_skill_code,
    existing_skill_code,
    source,
    confidence,
    reason,
    payload
  )
  SELECT
    p1.locale,
    p1.alias,
    p1.next_alias_norm,
    p1.skill_code,
    p2.skill_code,
    p1.source,
    p1.confidence,
    'symbol-aware normalization collision during alias backfill',
    jsonb_build_object(
      'migration', '20260306113000_fix_symbol_skill_alias_normalization',
      'incoming_alias', p1.alias,
      'existing_alias', p2.alias,
      'incoming_status', p1.next_status,
      'existing_status', p2.next_status
    )
  FROM tmp_skill_alias_projection p1
  INNER JOIN tmp_skill_alias_projection p2
    ON p1.locale = p2.locale
   AND p1.next_alias_norm = p2.next_alias_norm
   AND p1.skill_code > p2.skill_code
  WHERE p1.next_status = 'active'
    AND p2.next_status = 'active';

  GET DIAGNOSTICS collision_count = ROW_COUNT;

  IF collision_count > 0 THEN
    RAISE EXCEPTION
      'Aborting symbol-aware alias normalization backfill: % active cross-skill collisions detected.',
      collision_count;
  END IF;
END;
$block$;

UPDATE public.skills_taxonomy_aliases a
SET alias_norm = p.next_alias_norm,
    status = p.next_status,
    updated_at = NOW()
FROM tmp_skill_alias_projection p
WHERE a.id = p.id
  AND (
    a.alias_norm IS DISTINCT FROM p.next_alias_norm
    OR a.status IS DISTINCT FROM p.next_status
  );

SET CONSTRAINTS ALL IMMEDIATE;

CREATE UNIQUE INDEX idx_skills_taxonomy_aliases_unique_active_alias_norm
  ON public.skills_taxonomy_aliases (locale, alias_norm)
  WHERE status = 'active';

COMMIT;
