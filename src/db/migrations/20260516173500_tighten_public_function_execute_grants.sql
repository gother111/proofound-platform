-- Narrow SECURITY DEFINER execute grants that are not intended as public RPCs.
-- RLS helpers and token-submission RPCs stay callable for now and are tracked in the launch review allowlist.

DO $$
BEGIN
  BEGIN
    ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
      REVOKE MAINTAIN ON TABLES FROM anon, authenticated;
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE WARNING 'Skipping postgres default MAINTAIN privilege hardening due to insufficient privilege';
    WHEN undefined_object THEN
      RAISE WARNING 'Skipping default MAINTAIN privilege hardening because this Postgres version does not support MAINTAIN privileges';
  END;
END $$;

DO $$
DECLARE
  target_function text;
  resolved_function regprocedure;
BEGIN
  FOREACH target_function IN ARRAY ARRAY[
    'public.archive_old_messages()',
    'public.archive_old_verifications()',
    'public.auto_populate_field_visibility()',
    'public.check_verification_rate_limit(uuid)',
    'public.dentity()',
    'public.doentity()',
    'public.enforce_platform_role_server_only()',
    'public.handle_new_user()',
    'public.log_conversation_event()',
    'public.log_verification_event()',
    'public.proofound_enqueue_matching_refresh_job(uuid,text)',
    'public.proofound_hide_matches_due_to_policy_for_profile(uuid,text)',
    'public.proofound_mark_matches_stale_for_assignment(uuid,text)',
    'public.proofound_mark_matches_stale_for_profiles(uuid[],text)',
    'public.proofound_restore_hidden_matches_for_profile(uuid,text)',
    'public.update_conversation_timestamp()'
  ]
  LOOP
    resolved_function := to_regprocedure(target_function);
    IF resolved_function IS NOT NULL THEN
      EXECUTE format(
        'REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated',
        resolved_function
      );
    END IF;
  END LOOP;
END $$;
