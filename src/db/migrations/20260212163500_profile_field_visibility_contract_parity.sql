-- Ensure profile_field_visibility matches the column-per-field contract used by API routes.
-- This is a compatibility migration for staging databases that still contain the legacy row-per-field shape.

ALTER TABLE IF EXISTS public.profile_field_visibility
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.profile_field_visibility
  ADD COLUMN IF NOT EXISTS display_name TEXT DEFAULT 'public';

ALTER TABLE IF EXISTS public.profile_field_visibility
  ADD COLUMN IF NOT EXISTS avatar TEXT DEFAULT 'public';

ALTER TABLE IF EXISTS public.profile_field_visibility
  ADD COLUMN IF NOT EXISTS headline TEXT DEFAULT 'public';

ALTER TABLE IF EXISTS public.profile_field_visibility
  ADD COLUMN IF NOT EXISTS location TEXT DEFAULT 'network_only';

ALTER TABLE IF EXISTS public.profile_field_visibility
  ADD COLUMN IF NOT EXISTS mission TEXT DEFAULT 'public';

ALTER TABLE IF EXISTS public.profile_field_visibility
  ADD COLUMN IF NOT EXISTS vision TEXT DEFAULT 'public';

ALTER TABLE IF EXISTS public.profile_field_visibility
  ADD COLUMN IF NOT EXISTS values TEXT DEFAULT 'public';

ALTER TABLE IF EXISTS public.profile_field_visibility
  ADD COLUMN IF NOT EXISTS causes TEXT DEFAULT 'public';

ALTER TABLE IF EXISTS public.profile_field_visibility
  ADD COLUMN IF NOT EXISTS experiences TEXT DEFAULT 'network_only';

ALTER TABLE IF EXISTS public.profile_field_visibility
  ADD COLUMN IF NOT EXISTS education TEXT DEFAULT 'public';

ALTER TABLE IF EXISTS public.profile_field_visibility
  ADD COLUMN IF NOT EXISTS volunteering TEXT DEFAULT 'public';

ALTER TABLE IF EXISTS public.profile_field_visibility
  ADD COLUMN IF NOT EXISTS skills TEXT DEFAULT 'public';

ALTER TABLE IF EXISTS public.profile_field_visibility
  ADD COLUMN IF NOT EXISTS impact_stories TEXT DEFAULT 'match_only';

ALTER TABLE IF EXISTS public.profile_field_visibility
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE IF EXISTS public.profile_field_visibility
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE public.profile_field_visibility
SET profile_id = user_id
WHERE profile_id IS NULL
  AND user_id IS NOT NULL;

UPDATE public.profile_field_visibility
SET display_name = COALESCE(display_name, 'public'),
    avatar = COALESCE(avatar, 'public'),
    headline = COALESCE(headline, 'public'),
    location = COALESCE(location, 'network_only'),
    mission = COALESCE(mission, 'public'),
    vision = COALESCE(vision, 'public'),
    values = COALESCE(values, 'public'),
    causes = COALESCE(causes, 'public'),
    experiences = COALESCE(experiences, 'network_only'),
    education = COALESCE(education, 'public'),
    volunteering = COALESCE(volunteering, 'public'),
    skills = COALESCE(skills, 'public'),
    impact_stories = COALESCE(impact_stories, 'match_only'),
    created_at = COALESCE(created_at, NOW()),
    updated_at = COALESCE(updated_at, NOW());

WITH ranked AS (
  SELECT
    id,
    profile_id,
    ROW_NUMBER() OVER (
      PARTITION BY profile_id
      ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id
    ) AS rn
  FROM public.profile_field_visibility
  WHERE profile_id IS NOT NULL
)
DELETE FROM public.profile_field_visibility pfv
USING ranked
WHERE pfv.id = ranked.id
  AND ranked.rn > 1;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'profile_field_visibility'
      AND indexname = 'profile_field_visibility_profile_id_unique'
  ) THEN
    CREATE UNIQUE INDEX profile_field_visibility_profile_id_unique
      ON public.profile_field_visibility (profile_id)
      WHERE profile_id IS NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profile_field_visibility_profile_id
  ON public.profile_field_visibility (profile_id);
