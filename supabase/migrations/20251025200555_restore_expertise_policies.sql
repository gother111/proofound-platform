ALTER TABLE public.capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own capabilities" ON public.capabilities;
DROP POLICY IF EXISTS "Users can insert their own capabilities" ON public.capabilities;
DROP POLICY IF EXISTS "Users can update their own capabilities" ON public.capabilities;
DROP POLICY IF EXISTS "Users can delete their own capabilities" ON public.capabilities;

CREATE POLICY "Users can view their own capabilities"
  ON public.capabilities FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Users can insert their own capabilities"
  ON public.capabilities FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update their own capabilities"
  ON public.capabilities FOR UPDATE
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can delete their own capabilities"
  ON public.capabilities FOR DELETE
  USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their own evidence" ON public.evidence;
DROP POLICY IF EXISTS "Users can insert their own evidence" ON public.evidence;
DROP POLICY IF EXISTS "Users can update their own evidence" ON public.evidence;
DROP POLICY IF EXISTS "Users can delete their own evidence" ON public.evidence;

CREATE POLICY "Users can view their own evidence"
  ON public.evidence FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Users can insert their own evidence"
  ON public.evidence FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update their own evidence"
  ON public.evidence FOR UPDATE
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can delete their own evidence"
  ON public.evidence FOR DELETE
  USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "Owners and endorsers can view endorsements" ON public.skill_endorsements;
DROP POLICY IF EXISTS "Endorsers can insert endorsements" ON public.skill_endorsements;
DROP POLICY IF EXISTS "Owners and endorsers can update endorsements" ON public.skill_endorsements;
DROP POLICY IF EXISTS "Owners can delete endorsements" ON public.skill_endorsements;

CREATE POLICY "Owners and endorsers can view endorsements"
  ON public.skill_endorsements FOR SELECT
  USING (
    owner_profile_id = auth.uid()
    OR endorser_profile_id = auth.uid()
  );

CREATE POLICY "Endorsers can insert endorsements"
  ON public.skill_endorsements FOR INSERT
  WITH CHECK (endorser_profile_id = auth.uid());

CREATE POLICY "Owners and endorsers can update endorsements"
  ON public.skill_endorsements FOR UPDATE
  USING (
    owner_profile_id = auth.uid()
    OR endorser_profile_id = auth.uid()
  )
  WITH CHECK (
    owner_profile_id = auth.uid()
    OR endorser_profile_id = auth.uid()
  );

CREATE POLICY "Owners can delete endorsements"
  ON public.skill_endorsements FOR DELETE
  USING (owner_profile_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their own growth plans" ON public.growth_plans;
DROP POLICY IF EXISTS "Users can insert their own growth plans" ON public.growth_plans;
DROP POLICY IF EXISTS "Users can update their own growth plans" ON public.growth_plans;
DROP POLICY IF EXISTS "Users can delete their own growth plans" ON public.growth_plans;

CREATE POLICY "Users can view their own growth plans"
  ON public.growth_plans FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Users can insert their own growth plans"
  ON public.growth_plans FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update their own growth plans"
  ON public.growth_plans FOR UPDATE
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can delete their own growth plans"
  ON public.growth_plans FOR DELETE
  USING (profile_id = auth.uid());
