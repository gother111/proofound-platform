CREATE OR REPLACE FUNCTION public.is_valid_conversation_link(
  p_match_id UUID,
  p_assignment_id UUID,
  p_participant_one_id UUID,
  p_participant_two_id UUID
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.matches m
    INNER JOIN public.assignments a ON a.id = m.assignment_id
    WHERE m.id = p_match_id
      AND p_assignment_id = m.assignment_id
      AND p_participant_one_id = m.profile_id
      AND EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.org_id = a.org_id
          AND om.user_id = p_participant_two_id
          AND om.state = 'active'
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_valid_conversation_link(UUID, UUID, UUID, UUID)
  TO authenticated, service_role;

DROP POLICY IF EXISTS "Conversations - participants can insert" ON public.conversations;

CREATE POLICY "Conversations - participants can insert"
  ON public.conversations FOR INSERT
  WITH CHECK (
    (
      participant_one_id = auth.uid()
      OR participant_two_id = auth.uid()
    )
    AND public.is_valid_conversation_link(
      match_id,
      assignment_id,
      participant_one_id,
      participant_two_id
    )
  );

DROP POLICY IF EXISTS "Conversations - participants can update canonical rows" ON public.conversations;

CREATE POLICY "Conversations - participants can update canonical rows"
  ON public.conversations FOR UPDATE
  USING (
    (
      participant_one_id = auth.uid()
      OR participant_two_id = auth.uid()
    )
  )
  WITH CHECK (
    (
      participant_one_id = auth.uid()
      OR participant_two_id = auth.uid()
    )
    AND public.is_valid_conversation_link(
      match_id,
      assignment_id,
      participant_one_id,
      participant_two_id
    )
  );
