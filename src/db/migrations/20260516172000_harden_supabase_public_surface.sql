-- Close the production public-schema Data API exposure found on 2026-05-16.
-- Server code keeps access through direct database connections and service-role paths.

DO $$
DECLARE
  target_table text;
  resolved_table regclass;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'public.capability_token_events',
    'public.capability_tokens',
    'public.internal_ops_queue_items',
    'public.lifecycle_operation_targets',
    'public.lifecycle_operations',
    'public.operator_action_logs',
    'public.organization_trust_tier_transitions',
    'public.portfolio_publication_states',
    'public.proof_trust_snapshots',
    'public.submission_artifacts',
    'public.submissions',
    'public.synthetic_monitor_runs',
    'public.verification_log_entries',
    'public.zen_audit_events'
  ]
  LOOP
    resolved_table := to_regclass(target_table);
    IF resolved_table IS NOT NULL THEN
      EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', resolved_table);
      EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE %s FROM anon, authenticated', resolved_table);
    END IF;
  END LOOP;
END $$;

DO $$
DECLARE
  target_view text;
  resolved_view regclass;
BEGIN
  FOREACH target_view IN ARRAY ARRAY[
    'public.l4_skills',
    'public.matching_results',
    'public.skills_l1_categories',
    'public.user_audit_log'
  ]
  LOOP
    resolved_view := to_regclass(target_view);
    IF resolved_view IS NOT NULL THEN
      EXECUTE format('ALTER VIEW %s SET (security_invoker = true)', resolved_view);
      EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE %s FROM anon, authenticated', resolved_view);
    END IF;
  END LOOP;

  IF to_regclass('public.l4_skills') IS NOT NULL THEN
    GRANT SELECT ON TABLE public.l4_skills TO anon, authenticated;
  END IF;

  IF to_regclass('public.skills_l1_categories') IS NOT NULL THEN
    GRANT SELECT ON TABLE public.skills_l1_categories TO anon, authenticated;
  END IF;
END $$;

DO $$
DECLARE
  owner_role text;
BEGIN
  FOREACH owner_role IN ARRAY ARRAY['postgres', 'supabase_admin']
  LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = owner_role) THEN
      BEGIN
        EXECUTE format(
          'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public REVOKE SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLES FROM anon, authenticated',
          owner_role
        );
        EXECUTE format(
          'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated',
          owner_role
        );
        EXECUTE format(
          'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public REVOKE USAGE, SELECT, UPDATE ON SEQUENCES FROM anon, authenticated',
          owner_role
        );
      EXCEPTION
        WHEN insufficient_privilege THEN
          RAISE WARNING 'Skipping default privilege hardening for role % due to insufficient privilege', owner_role;
      END;
    END IF;
  END LOOP;
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
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon, authenticated', resolved_function);
    END IF;
  END LOOP;
END $$;
