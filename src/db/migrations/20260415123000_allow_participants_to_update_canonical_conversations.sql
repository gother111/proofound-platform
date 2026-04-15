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
    AND EXISTS (
      SELECT 1
      FROM public.matches m
      INNER JOIN public.assignments a ON a.id = m.assignment_id
      WHERE m.id = conversations.match_id
        AND conversations.assignment_id = m.assignment_id
        AND conversations.participant_one_id = m.profile_id
        AND EXISTS (
          SELECT 1
          FROM public.organization_members om
          WHERE om.org_id = a.org_id
            AND om.user_id = conversations.participant_two_id
            AND om.state = 'active'
        )
    )
  );
