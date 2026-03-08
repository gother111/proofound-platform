ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS public_portfolio_state text NOT NULL DEFAULT 'unavailable',
  ADD COLUMN IF NOT EXISTS search_indexing_enabled_at timestamp;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS public_portfolio_state text NOT NULL DEFAULT 'unavailable',
  ADD COLUMN IF NOT EXISTS search_indexing_enabled_at timestamp,
  ADD COLUMN IF NOT EXISTS trust_status text NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS trust_status_updated_at timestamp,
  ADD COLUMN IF NOT EXISTS website_verified_at timestamp,
  ADD COLUMN IF NOT EXISTS operating_region text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_public_portfolio_state_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_public_portfolio_state_check
      CHECK (public_portfolio_state IN ('unavailable', 'public_link_only', 'public_noindex', 'public_indexable'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'organizations_public_portfolio_state_check'
  ) THEN
    ALTER TABLE public.organizations
      ADD CONSTRAINT organizations_public_portfolio_state_check
      CHECK (public_portfolio_state IN ('unavailable', 'public_link_only', 'public_noindex', 'public_indexable'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'organizations_trust_status_check'
  ) THEN
    ALTER TABLE public.organizations
      ADD CONSTRAINT organizations_trust_status_check
      CHECK (trust_status IN ('unverified', 'pending', 'domain_verified', 'platform_reviewed'));
  END IF;
END $$;

UPDATE public.profiles p
SET public_portfolio_state = CASE
  WHEN p.deleted = true THEN 'unavailable'
  WHEN ip.visibility = 'public' THEN 'public_link_only'
  ELSE 'unavailable'
END
FROM public.individual_profiles ip
WHERE ip.user_id = p.id
  AND (
    p.public_portfolio_state IS NULL
    OR p.public_portfolio_state = 'unavailable'
  );

UPDATE public.organizations
SET public_portfolio_state = CASE
    WHEN coalesce(nullif(trim(slug), ''), '') <> '' THEN 'public_link_only'
    ELSE 'unavailable'
  END,
  trust_status = CASE
    WHEN verified = true THEN 'platform_reviewed'
    ELSE 'pending'
  END,
  trust_status_updated_at = CASE
    WHEN trust_status_updated_at IS NULL THEN now()
    ELSE trust_status_updated_at
  END
WHERE public_portfolio_state IS NULL
   OR public_portfolio_state = 'unavailable'
   OR trust_status = 'unverified';

CREATE TABLE IF NOT EXISTS public.profile_handle_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  redirect_target_slug text,
  retired_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profile_handle_history_profile_id
  ON public.profile_handle_history(profile_id);

INSERT INTO public.profile_handle_history (profile_id, slug, is_active)
SELECT id, handle, true
FROM public.profiles
WHERE handle IS NOT NULL
  AND length(trim(handle)) > 0
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.organization_slug_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  redirect_target_slug text,
  retired_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_organization_slug_history_org_id
  ON public.organization_slug_history(org_id);

INSERT INTO public.organization_slug_history (org_id, slug, is_active)
SELECT id, slug, true
FROM public.organizations
WHERE slug IS NOT NULL
  AND length(trim(slug)) > 0
ON CONFLICT (slug) DO NOTHING;
