-- Harden high-risk findings verified on 2026-05-20.

-- Base profile rows should not be globally enumerable. Keep owner access and
-- preserve public-profile discoverability only when the paired individual
-- profile is explicitly public.
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own or public profiles" ON public.profiles;

CREATE POLICY "Users can view own or public profiles"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1
      FROM public.individual_profiles
      WHERE individual_profiles.user_id = profiles.id
        AND individual_profiles.visibility = 'public'
    )
  );

-- Taxonomy tables are intentionally public-read, but writes must stay
-- service-role-only.
ALTER TABLE IF EXISTS public.skills_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.skills_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.skills_l3 ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.skills_taxonomy ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.skill_adjacency ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to categories" ON public.skills_categories;
DROP POLICY IF EXISTS "Service role full access to subcategories" ON public.skills_subcategories;
DROP POLICY IF EXISTS "Service role full access to L3" ON public.skills_l3;
DROP POLICY IF EXISTS "Service role full access to taxonomy" ON public.skills_taxonomy;
DROP POLICY IF EXISTS "Service role full access to adjacency" ON public.skill_adjacency;

CREATE POLICY "Service role full access to categories"
  ON public.skills_categories
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access to subcategories"
  ON public.skills_subcategories
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access to L3"
  ON public.skills_l3
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access to taxonomy"
  ON public.skills_taxonomy
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access to adjacency"
  ON public.skill_adjacency
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
