-- Migration: Create alias and conflict tables for skills taxonomy search
-- Date: 2026-02-25
-- Purpose:
--   - Store search aliases separately from canonical skills for scalable indexing
--   - Enforce global active alias uniqueness to prevent ambiguous search matches
--   - Track alias collisions for curation workflows

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

CREATE TABLE IF NOT EXISTS public.skills_taxonomy_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_code TEXT NOT NULL REFERENCES public.skills_taxonomy(code) ON DELETE CASCADE,
  locale TEXT NOT NULL DEFAULT 'en',
  alias TEXT NOT NULL,
  alias_norm TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'curated' CHECK (source IN ('curated', 'external', 'telemetry', 'manual')),
  confidence NUMERIC(4,3) NOT NULL DEFAULT 1.000 CHECK (confidence >= 0 AND confidence <= 1),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deprecated')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT skills_taxonomy_aliases_skill_locale_alias_norm_key UNIQUE (skill_code, locale, alias_norm)
);

CREATE TABLE IF NOT EXISTS public.skills_taxonomy_alias_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  locale TEXT NOT NULL DEFAULT 'en',
  alias TEXT NOT NULL,
  alias_norm TEXT NOT NULL,
  incoming_skill_code TEXT NOT NULL REFERENCES public.skills_taxonomy(code) ON DELETE CASCADE,
  existing_skill_code TEXT NOT NULL REFERENCES public.skills_taxonomy(code) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'curated' CHECK (source IN ('curated', 'external', 'telemetry', 'manual')),
  confidence NUMERIC(4,3) NOT NULL DEFAULT 1.000 CHECK (confidence >= 0 AND confidence <= 1),
  reason TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skills_taxonomy_aliases_skill_code
  ON public.skills_taxonomy_aliases(skill_code);

CREATE INDEX IF NOT EXISTS idx_skills_taxonomy_aliases_locale
  ON public.skills_taxonomy_aliases(locale);

CREATE INDEX IF NOT EXISTS idx_skills_taxonomy_aliases_alias_trgm
  ON public.skills_taxonomy_aliases USING gin(alias extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_skills_taxonomy_aliases_alias_norm_trgm
  ON public.skills_taxonomy_aliases USING gin(alias_norm extensions.gin_trgm_ops);

CREATE UNIQUE INDEX IF NOT EXISTS idx_skills_taxonomy_aliases_unique_active_alias_norm
  ON public.skills_taxonomy_aliases(locale, alias_norm)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_skills_taxonomy_alias_conflicts_alias_norm
  ON public.skills_taxonomy_alias_conflicts(locale, alias_norm);

CREATE OR REPLACE FUNCTION public.skills_taxonomy_aliases_before_write()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.alias := trim(NEW.alias);
  NEW.alias_norm := public.normalize_skill_alias(NEW.alias);
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_skills_taxonomy_aliases_before_write ON public.skills_taxonomy_aliases;

CREATE TRIGGER trg_skills_taxonomy_aliases_before_write
BEFORE INSERT OR UPDATE OF alias, locale, status
ON public.skills_taxonomy_aliases
FOR EACH ROW
EXECUTE FUNCTION public.skills_taxonomy_aliases_before_write();

-- Backfill normalization for any pre-existing rows (safe no-op for new table)
UPDATE public.skills_taxonomy_aliases
SET alias_norm = public.normalize_skill_alias(alias),
    updated_at = NOW()
WHERE alias_norm IS DISTINCT FROM public.normalize_skill_alias(alias);

ALTER TABLE public.skills_taxonomy_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills_taxonomy_alias_conflicts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access to skills taxonomy aliases" ON public.skills_taxonomy_aliases;
CREATE POLICY "Public read access to skills taxonomy aliases"
  ON public.skills_taxonomy_aliases
  FOR SELECT
  USING (status = 'active');

DROP POLICY IF EXISTS "Service role full access to skills taxonomy aliases" ON public.skills_taxonomy_aliases;
CREATE POLICY "Service role full access to skills taxonomy aliases"
  ON public.skills_taxonomy_aliases
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access to skills taxonomy alias conflicts" ON public.skills_taxonomy_alias_conflicts;
CREATE POLICY "Service role full access to skills taxonomy alias conflicts"
  ON public.skills_taxonomy_alias_conflicts
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

COMMENT ON TABLE public.skills_taxonomy_aliases IS 'Alias terms mapped to canonical skills for robust search and synonym handling.';
COMMENT ON TABLE public.skills_taxonomy_alias_conflicts IS 'Review queue for alias collisions rejected by uniqueness rules.';
COMMENT ON COLUMN public.skills_taxonomy_aliases.alias_norm IS 'Normalized alias used for dedupe and active global uniqueness checks.';
