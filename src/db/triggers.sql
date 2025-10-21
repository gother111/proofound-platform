-- Trigger to create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- Keep profile personas in sync with organization membership
CREATE OR REPLACE FUNCTION public.ensure_org_member_persona()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' THEN
    UPDATE public.profiles
    SET persona = 'org_member'
    WHERE id = NEW.user_id
      AND persona IS DISTINCT FROM 'org_member';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_persona_on_org_member_insert ON public.organization_members;
CREATE TRIGGER set_persona_on_org_member_insert
  AFTER INSERT ON public.organization_members
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_org_member_persona();

DROP TRIGGER IF EXISTS set_persona_on_org_member_update ON public.organization_members;
CREATE TRIGGER set_persona_on_org_member_update
  AFTER UPDATE ON public.organization_members
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_org_member_persona();

-- Backfill personas for existing active organization members
UPDATE public.profiles
SET persona = 'org_member'
WHERE id IN (
  SELECT user_id
  FROM public.organization_members
  WHERE status = 'active'
)
AND persona IS DISTINCT FROM 'org_member';

