-- Keep match-score maintenance helpers off the public RPC surface without breaking
-- authenticated writes that fire the matching-refresh triggers.

CREATE OR REPLACE FUNCTION public.proofound_match_score_contract_profile_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.proofound_mark_matches_stale_for_profiles(
    ARRAY[COALESCE(NEW.profile_id, OLD.profile_id)],
    'matching_profile_changed'
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.proofound_match_score_contract_skill_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.proofound_mark_matches_stale_for_profiles(
    ARRAY[COALESCE(NEW.profile_id, OLD.profile_id)],
    'skill_inputs_changed'
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.proofound_match_score_contract_assignment_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.proofound_mark_matches_stale_for_assignment(
    COALESCE(NEW.id, OLD.id),
    'assignment_inputs_changed'
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.proofound_match_score_contract_assignment_matrix_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.proofound_mark_matches_stale_for_assignment(
    COALESCE(NEW.assignment_id, OLD.assignment_id),
    'assignment_expertise_matrix_changed'
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.proofound_match_score_contract_verification_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(NEW.owner_type, OLD.owner_type) = 'individual_profile' THEN
    PERFORM public.proofound_mark_matches_stale_for_profiles(
      ARRAY[COALESCE(NEW.owner_id, OLD.owner_id)],
      'verification_inputs_changed'
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.proofound_match_score_contract_user_consent_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(NEW.consent_type, OLD.consent_type) <> 'ml_matching' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF COALESCE(NEW.consented, FALSE) = FALSE THEN
    PERFORM public.proofound_hide_matches_due_to_policy_for_profile(
      COALESCE(NEW.profile_id, OLD.profile_id),
      'matching_consent_inactive'
    );
  ELSE
    PERFORM public.proofound_restore_hidden_matches_for_profile(
      COALESCE(NEW.profile_id, OLD.profile_id),
      'matching_consent_restored'
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.proofound_match_score_contract_consent_obligation_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(NEW.consent_type, OLD.consent_type) <> 'ml_matching' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF COALESCE(NEW.state, 'expired') <> 'active' THEN
    PERFORM public.proofound_hide_matches_due_to_policy_for_profile(
      COALESCE(NEW.profile_id, OLD.profile_id),
      'matching_consent_inactive'
    );
  ELSE
    PERFORM public.proofound_restore_hidden_matches_for_profile(
      COALESCE(NEW.profile_id, OLD.profile_id),
      'matching_consent_restored'
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.proofound_match_score_contract_profile_trigger()
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.proofound_match_score_contract_skill_trigger()
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.proofound_match_score_contract_assignment_trigger()
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.proofound_match_score_contract_assignment_matrix_trigger()
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.proofound_match_score_contract_verification_trigger()
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.proofound_match_score_contract_user_consent_trigger()
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.proofound_match_score_contract_consent_obligation_trigger()
  FROM PUBLIC, anon, authenticated;
