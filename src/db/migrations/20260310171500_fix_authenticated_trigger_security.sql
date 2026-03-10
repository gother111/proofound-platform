BEGIN;

CREATE OR REPLACE FUNCTION public.auto_populate_field_visibility()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.assignment_field_visibility (
    assignment_id,
    field_name,
    visibility_level,
    redaction_type,
    generic_label
  )
  SELECT
    NEW.id,
    d.field_name,
    d.default_visibility,
    d.default_redaction_type,
    d.default_generic_label
  FROM public.assignment_field_visibility_defaults d
  ON CONFLICT (assignment_id, field_name) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.proofound_enqueue_matching_refresh_job(
  target_profile_id uuid,
  refresh_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF target_profile_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.matching_refresh_jobs (
    profile_id,
    status,
    source,
    payload
  )
  VALUES (
    target_profile_id,
    'pending',
    'match_score_contract_v1',
    jsonb_build_object(
      'reason', refresh_reason,
      'enqueued_at', now()
    )
  )
  ON CONFLICT DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.proofound_mark_matches_stale_for_profiles(
  target_profile_ids uuid[],
  stale_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_profile_id uuid;
BEGIN
  IF target_profile_ids IS NULL OR array_length(target_profile_ids, 1) IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.matches
  SET
    score_state = CASE
      WHEN score_state = 'hidden_due_to_policy' THEN score_state
      ELSE 'stale'
    END,
    stale_at = CASE
      WHEN score_state = 'hidden_due_to_policy' THEN stale_at
      ELSE now()
    END,
    stale_reason_codes = CASE
      WHEN score_state = 'hidden_due_to_policy' THEN stale_reason_codes
      ELSE public.proofound_append_distinct_text(stale_reason_codes, stale_reason)
    END
  WHERE profile_id = ANY(target_profile_ids);

  FOREACH target_profile_id IN ARRAY target_profile_ids
  LOOP
    PERFORM public.proofound_enqueue_matching_refresh_job(target_profile_id, stale_reason);
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.proofound_mark_matches_stale_for_assignment(
  target_assignment_id uuid,
  stale_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_profile_ids uuid[];
BEGIN
  SELECT ARRAY(
    SELECT DISTINCT profile_id
    FROM public.matches
    WHERE assignment_id = target_assignment_id
  )
  INTO target_profile_ids;

  PERFORM public.proofound_mark_matches_stale_for_profiles(target_profile_ids, stale_reason);
END;
$$;

CREATE OR REPLACE FUNCTION public.proofound_hide_matches_due_to_policy_for_profile(
  target_profile_id uuid,
  hide_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.matches
  SET
    score_state = 'hidden_due_to_policy',
    hidden_due_to_policy_at = now(),
    hidden_due_to_policy_reason_codes = public.proofound_append_distinct_text(
      hidden_due_to_policy_reason_codes,
      hide_reason
    )
  WHERE profile_id = target_profile_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.proofound_restore_hidden_matches_for_profile(
  target_profile_id uuid,
  stale_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.matches
  SET
    score_state = 'stale',
    stale_at = now(),
    stale_reason_codes = public.proofound_append_distinct_text(stale_reason_codes, stale_reason),
    hidden_due_to_policy_at = NULL,
    hidden_due_to_policy_reason_codes = '{}'::text[]
  WHERE profile_id = target_profile_id
    AND score_state = 'hidden_due_to_policy';

  PERFORM public.proofound_enqueue_matching_refresh_job(target_profile_id, stale_reason);
END;
$$;

COMMIT;
