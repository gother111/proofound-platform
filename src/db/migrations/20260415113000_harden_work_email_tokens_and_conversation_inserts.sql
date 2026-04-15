ALTER TABLE public.individual_profiles
  ADD COLUMN IF NOT EXISTS work_email_token_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS individual_profiles_work_email_token_hash_idx
  ON public.individual_profiles(work_email_token_hash)
  WHERE work_email_token_hash IS NOT NULL;

UPDATE public.individual_profiles
SET
  work_email_token = NULL,
  work_email_token_hash = NULL,
  work_email_token_expires = NULL
WHERE
  work_email_verified = FALSE
  AND (
    work_email_token IS NOT NULL
    OR work_email_token_hash IS NOT NULL
    OR work_email_token_expires IS NOT NULL
  );

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Conversations - participants can insert" ON public.conversations;

CREATE POLICY "Conversations - participants can insert"
  ON public.conversations FOR INSERT
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
