ALTER TABLE public.profile_handle_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_slug_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profile handle history service role full access" ON public.profile_handle_history;
CREATE POLICY "Profile handle history service role full access"
ON public.profile_handle_history
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Profile handle history public redirect lookup" ON public.profile_handle_history;
CREATE POLICY "Profile handle history public redirect lookup"
ON public.profile_handle_history
FOR SELECT
TO anon, authenticated
USING (
  is_active = false
  AND redirect_target_slug IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = profile_handle_history.profile_id
      AND p.deleted = false
      AND p.public_portfolio_state IN ('public_link_only', 'public_noindex', 'public_indexable')
  )
);

DROP POLICY IF EXISTS "Organization slug history service role full access" ON public.organization_slug_history;
CREATE POLICY "Organization slug history service role full access"
ON public.organization_slug_history
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Organization slug history public redirect lookup" ON public.organization_slug_history;
CREATE POLICY "Organization slug history public redirect lookup"
ON public.organization_slug_history
FOR SELECT
TO anon, authenticated
USING (
  is_active = false
  AND redirect_target_slug IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.organizations o
    WHERE o.id = organization_slug_history.org_id
      AND o.public_portfolio_state IN ('public_link_only', 'public_noindex', 'public_indexable')
  )
);
