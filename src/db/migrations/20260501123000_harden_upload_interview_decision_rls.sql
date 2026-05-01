BEGIN;

ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_file_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS uploaded_files_owner_select ON public.uploaded_files;
CREATE POLICY uploaded_files_owner_select
  ON public.uploaded_files
  FOR SELECT
  TO authenticated
  USING (
    (owner_type = 'individual_profile' AND owner_id = auth.uid())
    OR (owner_type = 'organization' AND public.has_active_org_membership(owner_id))
  );

DROP POLICY IF EXISTS uploaded_files_service_all ON public.uploaded_files;
CREATE POLICY uploaded_files_service_all
  ON public.uploaded_files
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS uploaded_file_events_owner_select ON public.uploaded_file_events;
CREATE POLICY uploaded_file_events_owner_select
  ON public.uploaded_file_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.uploaded_files uf
      WHERE uf.id = uploaded_file_events.uploaded_file_id
        AND (
          (uf.owner_type = 'individual_profile' AND uf.owner_id = auth.uid())
          OR (uf.owner_type = 'organization' AND public.has_active_org_membership(uf.owner_id))
        )
    )
  );

DROP POLICY IF EXISTS uploaded_file_events_service_all ON public.uploaded_file_events;
CREATE POLICY uploaded_file_events_service_all
  ON public.uploaded_file_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS interviews_participant_select ON public.interviews;
CREATE POLICY interviews_participant_select
  ON public.interviews
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.matches m
      INNER JOIN public.assignments a ON a.id = m.assignment_id
      WHERE m.id = interviews.match_id
        AND (
          m.profile_id = auth.uid()
          OR public.has_active_org_membership(a.org_id)
        )
    )
  );

DROP POLICY IF EXISTS interviews_service_all ON public.interviews;
CREATE POLICY interviews_service_all
  ON public.interviews
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS decisions_participant_select ON public.decisions;
CREATE POLICY decisions_participant_select
  ON public.decisions
  FOR SELECT
  TO authenticated
  USING (
    candidate_profile_id = auth.uid()
    OR public.has_active_org_membership(org_id)
  );

DROP POLICY IF EXISTS decisions_service_all ON public.decisions;
CREATE POLICY decisions_service_all
  ON public.decisions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMIT;
