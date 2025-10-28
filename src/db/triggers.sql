-- ============================================================================
-- SECURE DATABASE FUNCTIONS WITH EXPLICIT SEARCH_PATH
-- ============================================================================

-- Handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  user_persona TEXT;
BEGIN
  -- Read persona from user metadata with enhanced fallback handling
  -- NULLIF removes empty strings, TRIM removes whitespace
  user_persona := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'persona'), ''),
    'unknown'
  );
  
  -- Validate persona value
  IF user_persona NOT IN ('individual', 'org_member', 'unknown') THEN
    user_persona := 'unknown';
  END IF;

  INSERT INTO public.profiles (id, display_name, persona, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    user_persona,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Apply updated_at trigger to relevant tables
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_organizations ON public.organizations;
CREATE TRIGGER set_updated_at_organizations
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_impact_stories ON public.impact_stories;
CREATE TRIGGER set_updated_at_impact_stories
  BEFORE UPDATE ON public.impact_stories
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_experiences ON public.experiences;
CREATE TRIGGER set_updated_at_experiences
  BEFORE UPDATE ON public.experiences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_education ON public.education;
CREATE TRIGGER set_updated_at_education
  BEFORE UPDATE ON public.education
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_volunteering ON public.volunteering;
CREATE TRIGGER set_updated_at_volunteering
  BEFORE UPDATE ON public.volunteering
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add triggers for new tables
DROP TRIGGER IF EXISTS set_updated_at_matching_profiles ON public.matching_profiles;
CREATE TRIGGER set_updated_at_matching_profiles
  BEFORE UPDATE ON public.matching_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_skills ON public.skills;
CREATE TRIGGER set_updated_at_skills
  BEFORE UPDATE ON public.skills
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_assignments ON public.assignments;
CREATE TRIGGER set_updated_at_assignments
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_matches ON public.matches;
CREATE TRIGGER set_updated_at_matches
  BEFORE UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_match_interest ON public.match_interest;
CREATE TRIGGER set_updated_at_match_interest
  BEFORE UPDATE ON public.match_interest
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_capabilities ON public.capabilities;
CREATE TRIGGER set_updated_at_capabilities
  BEFORE UPDATE ON public.capabilities
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_evidence ON public.evidence;
CREATE TRIGGER set_updated_at_evidence
  BEFORE UPDATE ON public.evidence
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_skill_endorsements ON public.skill_endorsements;
CREATE TRIGGER set_updated_at_skill_endorsements
  BEFORE UPDATE ON public.skill_endorsements
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_growth_plans ON public.growth_plans;
CREATE TRIGGER set_updated_at_growth_plans
  BEFORE UPDATE ON public.growth_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

