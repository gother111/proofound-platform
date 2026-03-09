ALTER TABLE matches
  ADD COLUMN score_total integer,
  ADD COLUMN score_state text,
  ADD COLUMN stale_reason_codes text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN stale_at timestamptz,
  ADD COLUMN recomputed_at timestamptz,
  ADD COLUMN hidden_due_to_policy_at timestamptz,
  ADD COLUMN hidden_due_to_policy_reason_codes text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN subscores_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN score_snapshot_json jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX matches_score_total_idx ON matches (score_total);
CREATE INDEX matches_score_state_idx ON matches (score_state);
CREATE INDEX matches_stale_at_idx ON matches (stale_at);

UPDATE matches
SET
  score_total = CASE
    WHEN score::numeric <= 1 THEN round(score::numeric * 10000)
    ELSE round(score::numeric)
  END,
  score_state = COALESCE(score_state, 'stale'),
  stale_reason_codes = CASE
    WHEN cardinality(stale_reason_codes) > 0 THEN stale_reason_codes
    ELSE ARRAY['legacy_match_requires_recompute']::text[]
  END,
  generated_at = COALESCE(generated_at, created_at::timestamptz)
WHERE score_total IS NULL OR score_state IS NULL;

CREATE OR REPLACE FUNCTION proofound_append_distinct_text(
  current_values text[],
  appended_value text
)
RETURNS text[]
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT ARRAY(
    SELECT DISTINCT value
    FROM unnest(COALESCE(current_values, '{}'::text[]) || ARRAY[appended_value]) AS value
    WHERE value IS NOT NULL AND btrim(value) <> ''
    ORDER BY value
  );
$$;

CREATE OR REPLACE FUNCTION proofound_enqueue_matching_refresh_job(
  target_profile_id uuid,
  refresh_reason text
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF target_profile_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO matching_refresh_jobs (
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

CREATE OR REPLACE FUNCTION proofound_mark_matches_stale_for_profiles(
  target_profile_ids uuid[],
  stale_reason text
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  target_profile_id uuid;
BEGIN
  IF target_profile_ids IS NULL OR array_length(target_profile_ids, 1) IS NULL THEN
    RETURN;
  END IF;

  UPDATE matches
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
      ELSE proofound_append_distinct_text(stale_reason_codes, stale_reason)
    END
  WHERE profile_id = ANY(target_profile_ids);

  FOREACH target_profile_id IN ARRAY target_profile_ids
  LOOP
    PERFORM proofound_enqueue_matching_refresh_job(target_profile_id, stale_reason);
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION proofound_mark_matches_stale_for_assignment(
  target_assignment_id uuid,
  stale_reason text
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  target_profile_ids uuid[];
BEGIN
  SELECT ARRAY(
    SELECT DISTINCT profile_id
    FROM matches
    WHERE assignment_id = target_assignment_id
  )
  INTO target_profile_ids;

  PERFORM proofound_mark_matches_stale_for_profiles(target_profile_ids, stale_reason);
END;
$$;

CREATE OR REPLACE FUNCTION proofound_hide_matches_due_to_policy_for_profile(
  target_profile_id uuid,
  hide_reason text
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE matches
  SET
    score_state = 'hidden_due_to_policy',
    hidden_due_to_policy_at = now(),
    hidden_due_to_policy_reason_codes = proofound_append_distinct_text(
      hidden_due_to_policy_reason_codes,
      hide_reason
    )
  WHERE profile_id = target_profile_id;
END;
$$;

CREATE OR REPLACE FUNCTION proofound_restore_hidden_matches_for_profile(
  target_profile_id uuid,
  stale_reason text
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE matches
  SET
    score_state = 'stale',
    stale_at = now(),
    stale_reason_codes = proofound_append_distinct_text(stale_reason_codes, stale_reason),
    hidden_due_to_policy_at = NULL,
    hidden_due_to_policy_reason_codes = '{}'::text[]
  WHERE profile_id = target_profile_id
    AND score_state = 'hidden_due_to_policy';

  PERFORM proofound_enqueue_matching_refresh_job(target_profile_id, stale_reason);
END;
$$;

CREATE OR REPLACE FUNCTION proofound_match_score_contract_profile_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM proofound_mark_matches_stale_for_profiles(
    ARRAY[COALESCE(NEW.profile_id, OLD.profile_id)],
    'matching_profile_changed'
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION proofound_match_score_contract_skill_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM proofound_mark_matches_stale_for_profiles(
    ARRAY[COALESCE(NEW.profile_id, OLD.profile_id)],
    'skill_inputs_changed'
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION proofound_match_score_contract_assignment_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM proofound_mark_matches_stale_for_assignment(
    COALESCE(NEW.id, OLD.id),
    'assignment_inputs_changed'
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION proofound_match_score_contract_assignment_matrix_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM proofound_mark_matches_stale_for_assignment(
    COALESCE(NEW.assignment_id, OLD.assignment_id),
    'assignment_expertise_matrix_changed'
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION proofound_match_score_contract_verification_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF COALESCE(NEW.owner_type, OLD.owner_type) = 'individual_profile' THEN
    PERFORM proofound_mark_matches_stale_for_profiles(
      ARRAY[COALESCE(NEW.owner_id, OLD.owner_id)],
      'verification_inputs_changed'
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION proofound_match_score_contract_user_consent_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF COALESCE(NEW.consent_type, OLD.consent_type) <> 'ml_matching' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF COALESCE(NEW.consented, FALSE) = FALSE THEN
    PERFORM proofound_hide_matches_due_to_policy_for_profile(
      COALESCE(NEW.profile_id, OLD.profile_id),
      'matching_consent_inactive'
    );
  ELSE
    PERFORM proofound_restore_hidden_matches_for_profile(
      COALESCE(NEW.profile_id, OLD.profile_id),
      'matching_consent_restored'
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION proofound_match_score_contract_consent_obligation_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF COALESCE(NEW.consent_type, OLD.consent_type) <> 'ml_matching' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF COALESCE(NEW.state, 'expired') <> 'active' THEN
    PERFORM proofound_hide_matches_due_to_policy_for_profile(
      COALESCE(NEW.profile_id, OLD.profile_id),
      'matching_consent_inactive'
    );
  ELSE
    PERFORM proofound_restore_hidden_matches_for_profile(
      COALESCE(NEW.profile_id, OLD.profile_id),
      'matching_consent_restored'
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS proofound_match_score_contract_profile_trigger ON matching_profiles;
CREATE TRIGGER proofound_match_score_contract_profile_trigger
AFTER INSERT OR UPDATE OR DELETE ON matching_profiles
FOR EACH ROW
EXECUTE FUNCTION proofound_match_score_contract_profile_trigger();

DROP TRIGGER IF EXISTS proofound_match_score_contract_skill_trigger ON skills;
CREATE TRIGGER proofound_match_score_contract_skill_trigger
AFTER INSERT OR UPDATE OR DELETE ON skills
FOR EACH ROW
EXECUTE FUNCTION proofound_match_score_contract_skill_trigger();

DROP TRIGGER IF EXISTS proofound_match_score_contract_assignment_trigger ON assignments;
CREATE TRIGGER proofound_match_score_contract_assignment_trigger
AFTER UPDATE ON assignments
FOR EACH ROW
EXECUTE FUNCTION proofound_match_score_contract_assignment_trigger();

DROP TRIGGER IF EXISTS proofound_match_score_contract_assignment_matrix_trigger ON assignment_expertise_matrix;
CREATE TRIGGER proofound_match_score_contract_assignment_matrix_trigger
AFTER INSERT OR UPDATE OR DELETE ON assignment_expertise_matrix
FOR EACH ROW
EXECUTE FUNCTION proofound_match_score_contract_assignment_matrix_trigger();

DROP TRIGGER IF EXISTS proofound_match_score_contract_verification_trigger ON verification_records;
CREATE TRIGGER proofound_match_score_contract_verification_trigger
AFTER INSERT OR UPDATE OR DELETE ON verification_records
FOR EACH ROW
EXECUTE FUNCTION proofound_match_score_contract_verification_trigger();

DROP TRIGGER IF EXISTS proofound_match_score_contract_user_consent_trigger ON user_consents;
CREATE TRIGGER proofound_match_score_contract_user_consent_trigger
AFTER INSERT OR UPDATE OR DELETE ON user_consents
FOR EACH ROW
EXECUTE FUNCTION proofound_match_score_contract_user_consent_trigger();

DROP TRIGGER IF EXISTS proofound_match_score_contract_consent_obligation_trigger ON consent_obligations;
CREATE TRIGGER proofound_match_score_contract_consent_obligation_trigger
AFTER INSERT OR UPDATE OR DELETE ON consent_obligations
FOR EACH ROW
EXECUTE FUNCTION proofound_match_score_contract_consent_obligation_trigger();
