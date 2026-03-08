BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.capability_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_class TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  source_table TEXT,
  source_id UUID,
  action_scope TEXT NOT NULL,
  subject_type TEXT NOT NULL,
  subject_id UUID,
  actor_binding TEXT NOT NULL DEFAULT 'none',
  actor_email_hash TEXT,
  actor_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  principal_type TEXT,
  single_use BOOLEAN NOT NULL DEFAULT true,
  max_uses INTEGER NOT NULL DEFAULT 1,
  redeemed_count INTEGER NOT NULL DEFAULT 0,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  first_redeemed_at TIMESTAMPTZ,
  last_redeemed_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,
  last_seen_at TIMESTAMPTZ,
  last_seen_ip_hash TEXT,
  last_seen_user_agent_hash TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'capability_tokens_actor_binding_ck'
      AND conrelid = 'public.capability_tokens'::regclass
  ) THEN
    ALTER TABLE public.capability_tokens
      ADD CONSTRAINT capability_tokens_actor_binding_ck
      CHECK (
        actor_binding IN (
          'none',
          'email_hash',
          'authenticated_profile',
          'authenticated_principal',
          'email_then_profile_lock'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'capability_tokens_principal_type_ck'
      AND conrelid = 'public.capability_tokens'::regclass
  ) THEN
    ALTER TABLE public.capability_tokens
      ADD CONSTRAINT capability_tokens_principal_type_ck
      CHECK (
        principal_type IS NULL
        OR principal_type IN (
          'user_account',
          'organization',
          'external_email',
          'platform_admin',
          'system'
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS capability_tokens_class_hash_idx
  ON public.capability_tokens(token_class, token_hash);

CREATE INDEX IF NOT EXISTS capability_tokens_source_idx
  ON public.capability_tokens(source_table, source_id);

CREATE INDEX IF NOT EXISTS capability_tokens_subject_idx
  ON public.capability_tokens(subject_type, subject_id);

CREATE INDEX IF NOT EXISTS capability_tokens_expiry_idx
  ON public.capability_tokens(expires_at, revoked_at);

CREATE TABLE IF NOT EXISTS public.capability_token_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capability_token_id UUID REFERENCES public.capability_tokens(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  actor_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  actor_email_hash TEXT,
  ip_hash TEXT,
  user_agent_hash TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'capability_token_events_type_ck'
      AND conrelid = 'public.capability_token_events'::regclass
  ) THEN
    ALTER TABLE public.capability_token_events
      ADD CONSTRAINT capability_token_events_type_ck
      CHECK (
        event_type IN (
          'issued',
          'inspected',
          'redeem_attempted',
          'redeemed',
          'expired',
          'revoked',
          'replay_blocked',
          'invalid_blocked',
          'actor_mismatch_blocked'
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS capability_token_events_token_created_idx
  ON public.capability_token_events(capability_token_id, created_at);

CREATE INDEX IF NOT EXISTS capability_token_events_type_created_idx
  ON public.capability_token_events(event_type, created_at);

CREATE TABLE IF NOT EXISTS public.uploaded_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type TEXT NOT NULL,
  owner_id UUID NOT NULL,
  source_surface TEXT NOT NULL,
  upload_kind TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  sanitized_filename TEXT NOT NULL,
  declared_mime TEXT,
  detected_mime TEXT,
  size_bytes BIGINT NOT NULL,
  sha256 TEXT NOT NULL,
  quarantine_bucket TEXT,
  quarantine_path TEXT,
  durable_bucket TEXT,
  durable_path TEXT,
  public_bucket TEXT,
  public_path TEXT,
  lifecycle_state TEXT NOT NULL DEFAULT 'received',
  safety_status TEXT NOT NULL DEFAULT 'pending',
  safety_reason TEXT,
  scan_engine TEXT,
  scan_completed_at TIMESTAMPTZ,
  promoted_at TIMESTAMPTZ,
  attached_subject_type TEXT,
  attached_subject_id UUID,
  replaced_by_file_id UUID REFERENCES public.uploaded_files(id) ON DELETE SET NULL,
  delete_requested_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uploaded_files_lifecycle_state_ck'
      AND conrelid = 'public.uploaded_files'::regclass
  ) THEN
    ALTER TABLE public.uploaded_files
      ADD CONSTRAINT uploaded_files_lifecycle_state_ck
      CHECK (
        lifecycle_state IN (
          'received',
          'quarantined',
          'validated',
          'ready_private',
          'ready_public',
          'rejected',
          'delete_pending',
          'deleted'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uploaded_files_safety_status_ck'
      AND conrelid = 'public.uploaded_files'::regclass
  ) THEN
    ALTER TABLE public.uploaded_files
      ADD CONSTRAINT uploaded_files_safety_status_ck
      CHECK (
        safety_status IN ('pending', 'clean', 'rejected', 'failed', 'manual_review')
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS uploaded_files_owner_idx
  ON public.uploaded_files(owner_type, owner_id, created_at);

CREATE INDEX IF NOT EXISTS uploaded_files_lifecycle_idx
  ON public.uploaded_files(lifecycle_state, safety_status, created_at);

CREATE INDEX IF NOT EXISTS uploaded_files_subject_idx
  ON public.uploaded_files(attached_subject_type, attached_subject_id);

CREATE TABLE IF NOT EXISTS public.uploaded_file_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_file_id UUID NOT NULL REFERENCES public.uploaded_files(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uploaded_file_events_type_ck'
      AND conrelid = 'public.uploaded_file_events'::regclass
  ) THEN
    ALTER TABLE public.uploaded_file_events
      ADD CONSTRAINT uploaded_file_events_type_ck
      CHECK (
        event_type IN (
          'received',
          'validated',
          'scan_clean',
          'scan_failed',
          'promotion_started',
          'promoted_private',
          'promoted_public',
          'attach_blocked',
          'deleted',
          'cleanup_failed'
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS uploaded_file_events_file_created_idx
  ON public.uploaded_file_events(uploaded_file_id, created_at);

CREATE TABLE IF NOT EXISTS public.lifecycle_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type TEXT NOT NULL,
  subject_type TEXT NOT NULL,
  subject_id UUID NOT NULL,
  requested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending',
  summary_code TEXT,
  visible_status TEXT NOT NULL DEFAULT 'processing',
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'lifecycle_operations_type_ck'
      AND conrelid = 'public.lifecycle_operations'::regclass
  ) THEN
    ALTER TABLE public.lifecycle_operations
      ADD CONSTRAINT lifecycle_operations_type_ck
      CHECK (operation_type IN ('delete', 'unpublish', 'revoke', 'export'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'lifecycle_operations_status_ck'
      AND conrelid = 'public.lifecycle_operations'::regclass
  ) THEN
    ALTER TABLE public.lifecycle_operations
      ADD CONSTRAINT lifecycle_operations_status_ck
      CHECK (
        status IN ('pending', 'processing', 'completed', 'partial', 'failed', 'failed_requires_manual_review')
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS lifecycle_operations_subject_idx
  ON public.lifecycle_operations(subject_type, subject_id, requested_at);

CREATE INDEX IF NOT EXISTS lifecycle_operations_status_idx
  ON public.lifecycle_operations(status, operation_type, requested_at);

CREATE TABLE IF NOT EXISTS public.lifecycle_operation_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id UUID NOT NULL REFERENCES public.lifecycle_operations(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_ref TEXT NOT NULL,
  desired_state TEXT NOT NULL,
  actual_state TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  failure_code TEXT,
  failure_detail TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'lifecycle_operation_targets_type_ck'
      AND conrelid = 'public.lifecycle_operation_targets'::regclass
  ) THEN
    ALTER TABLE public.lifecycle_operation_targets
      ADD CONSTRAINT lifecycle_operation_targets_type_ck
      CHECK (
        target_type IN (
          'db_record',
          'legacy_record',
          'storage_object',
          'proof_pack',
          'snippet',
          'public_portfolio',
          'sitemap_metadata',
          'search_index_state',
          'analytics_snapshot',
          'audit_retention',
          'export_manifest_entry'
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS lifecycle_operation_targets_operation_idx
  ON public.lifecycle_operation_targets(operation_id, target_type, created_at);

CREATE INDEX IF NOT EXISTS lifecycle_operation_targets_pending_idx
  ON public.lifecycle_operation_targets(target_type, resolved_at, last_attempt_at);

ALTER TABLE public.org_invitations
  ADD COLUMN IF NOT EXISTS token_hash TEXT,
  ADD COLUMN IF NOT EXISTS capability_token_id UUID REFERENCES public.capability_tokens(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS accepted_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revoked_reason TEXT;

ALTER TABLE public.org_invitations
  ALTER COLUMN token DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS org_invitations_token_hash_unique_idx
  ON public.org_invitations(token_hash)
  WHERE token_hash IS NOT NULL;

ALTER TABLE public.org_candidate_invites
  ADD COLUMN IF NOT EXISTS capability_token_id UUID REFERENCES public.capability_tokens(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS proof_capability_token_id UUID REFERENCES public.capability_tokens(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS public_surface_disabled_at TIMESTAMPTZ;

ALTER TABLE public.profile_snippets
  ADD COLUMN IF NOT EXISTS capability_token_id UUID REFERENCES public.capability_tokens(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revoked_reason TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS public_surface_disabled_at TIMESTAMPTZ;

ALTER TABLE public.profile_snippets
  ALTER COLUMN share_token DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profile_snippets_capability_token_idx
  ON public.profile_snippets(capability_token_id)
  WHERE capability_token_id IS NOT NULL;

ALTER TABLE public.skill_verification_requests
  ADD COLUMN IF NOT EXISTS capability_token_id UUID REFERENCES public.capability_tokens(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revoked_reason TEXT;

ALTER TABLE public.skill_verification_requests
  ALTER COLUMN verification_token DROP NOT NULL;

ALTER TABLE public.impact_story_verification_requests
  ADD COLUMN IF NOT EXISTS capability_token_id UUID REFERENCES public.capability_tokens(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revoked_reason TEXT;

ALTER TABLE public.impact_story_verification_requests
  ALTER COLUMN token DROP NOT NULL;

ALTER TABLE public.custom_verification_requests
  ADD COLUMN IF NOT EXISTS capability_token_id UUID REFERENCES public.capability_tokens(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revoked_reason TEXT;

ALTER TABLE public.proof_artifacts
  ADD COLUMN IF NOT EXISTS uploaded_file_id UUID REFERENCES public.uploaded_files(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delete_reason TEXT,
  ADD COLUMN IF NOT EXISTS cleanup_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cleanup_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS export_excluded_reason TEXT,
  ADD COLUMN IF NOT EXISTS public_surface_disabled_at TIMESTAMPTZ;

ALTER TABLE public.proof_packs
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delete_reason TEXT,
  ADD COLUMN IF NOT EXISTS cleanup_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cleanup_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS export_excluded_reason TEXT,
  ADD COLUMN IF NOT EXISTS public_surface_disabled_at TIMESTAMPTZ;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'feedback_tokens'
  ) THEN
    ALTER TABLE public.feedback_tokens
      ADD COLUMN IF NOT EXISTS token_hash TEXT,
      ADD COLUMN IF NOT EXISTS capability_token_id UUID REFERENCES public.capability_tokens(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS revoked_reason TEXT;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint constraint_row
      JOIN pg_attribute attribute_row
        ON attribute_row.attrelid = constraint_row.conrelid
       AND attribute_row.attnum = ANY (constraint_row.conkey)
      WHERE constraint_row.conrelid = 'public.feedback_tokens'::regclass
        AND constraint_row.contype = 'p'
        AND attribute_row.attname = 'token'
    ) THEN
      ALTER TABLE public.feedback_tokens
        ALTER COLUMN token DROP NOT NULL;
    END IF;

    CREATE UNIQUE INDEX IF NOT EXISTS feedback_tokens_token_hash_unique_idx
      ON public.feedback_tokens(token_hash)
      WHERE token_hash IS NOT NULL;
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'user-uploads-quarantine',
    'user-uploads-quarantine',
    false,
    10485760,
    ARRAY[
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heif',
      'image/heic',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]::text[]
  ),
  (
    'user-uploads-private',
    'user-uploads-private',
    false,
    10485760,
    ARRAY[
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heif',
      'image/heic',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]::text[]
  )
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Block8 quarantine service select" ON storage.objects;
CREATE POLICY "Block8 quarantine service select"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'user-uploads-quarantine' AND auth.role() = 'service_role'
);

DROP POLICY IF EXISTS "Block8 quarantine service insert" ON storage.objects;
CREATE POLICY "Block8 quarantine service insert"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'user-uploads-quarantine' AND auth.role() = 'service_role'
);

DROP POLICY IF EXISTS "Block8 quarantine service update" ON storage.objects;
CREATE POLICY "Block8 quarantine service update"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'user-uploads-quarantine' AND auth.role() = 'service_role'
)
WITH CHECK (
  bucket_id = 'user-uploads-quarantine' AND auth.role() = 'service_role'
);

DROP POLICY IF EXISTS "Block8 quarantine service delete" ON storage.objects;
CREATE POLICY "Block8 quarantine service delete"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'user-uploads-quarantine' AND auth.role() = 'service_role'
);

DROP POLICY IF EXISTS "Block8 private uploads service select" ON storage.objects;
CREATE POLICY "Block8 private uploads service select"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'user-uploads-private' AND auth.role() = 'service_role'
);

DROP POLICY IF EXISTS "Block8 private uploads service insert" ON storage.objects;
CREATE POLICY "Block8 private uploads service insert"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'user-uploads-private' AND auth.role() = 'service_role'
);

DROP POLICY IF EXISTS "Block8 private uploads service update" ON storage.objects;
CREATE POLICY "Block8 private uploads service update"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'user-uploads-private' AND auth.role() = 'service_role'
)
WITH CHECK (
  bucket_id = 'user-uploads-private' AND auth.role() = 'service_role'
);

DROP POLICY IF EXISTS "Block8 private uploads service delete" ON storage.objects;
CREATE POLICY "Block8 private uploads service delete"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'user-uploads-private' AND auth.role() = 'service_role'
);

INSERT INTO public.capability_tokens (
  token_class,
  token_hash,
  source_table,
  source_id,
  action_scope,
  subject_type,
  subject_id,
  actor_binding,
  actor_email_hash,
  single_use,
  max_uses,
  issued_at,
  expires_at,
  metadata
)
SELECT
  'org_member_invite',
  encode(extensions.digest(trim(token), 'sha256'), 'hex'),
  'org_invitations',
  id,
  'org_invitation.accept',
  'organization',
  org_id,
  'email_hash',
  encode(extensions.digest(lower(trim(email)), 'sha256'), 'hex'),
  true,
  1,
  created_at,
  expires_at,
  jsonb_build_object('role', role, 'email', lower(trim(email)))
FROM public.org_invitations
WHERE token IS NOT NULL
  AND capability_token_id IS NULL
ON CONFLICT (token_hash) DO NOTHING;

UPDATE public.org_invitations invite
SET
  token_hash = encode(extensions.digest(trim(invite.token), 'sha256'), 'hex'),
  capability_token_id = tokens.id
FROM public.capability_tokens tokens
WHERE invite.token IS NOT NULL
  AND tokens.source_table = 'org_invitations'
  AND tokens.source_id = invite.id;

INSERT INTO public.capability_tokens (
  token_class,
  token_hash,
  source_table,
  source_id,
  action_scope,
  subject_type,
  subject_id,
  actor_binding,
  single_use,
  max_uses,
  issued_at,
  expires_at,
  metadata
)
SELECT
  'profile_snippet_share',
  encode(extensions.digest(trim(share_token), 'sha256'), 'hex'),
  'profile_snippets',
  id,
  'profile_snippet.read',
  'profile_snippet',
  id,
  'none',
  false,
  2147483647,
  created_at,
  COALESCE(expires_at, NOW() + INTERVAL '30 days'),
  jsonb_build_object('profile_type', profile_type, 'org_id', org_id)
FROM public.profile_snippets
WHERE share_token IS NOT NULL
  AND capability_token_id IS NULL
ON CONFLICT (token_hash) DO NOTHING;

UPDATE public.profile_snippets snippet
SET capability_token_id = tokens.id
FROM public.capability_tokens tokens
WHERE snippet.share_token IS NOT NULL
  AND tokens.source_table = 'profile_snippets'
  AND tokens.source_id = snippet.id;

INSERT INTO public.capability_tokens (
  token_class,
  token_hash,
  source_table,
  source_id,
  action_scope,
  subject_type,
  subject_id,
  actor_binding,
  actor_email_hash,
  actor_profile_id,
  single_use,
  max_uses,
  issued_at,
  expires_at,
  metadata
)
SELECT
  'skill_verification_response',
  encode(extensions.digest(trim(verification_token), 'sha256'), 'hex'),
  'skill_verification_requests',
  id,
  'skill_verification.respond',
  'skill_verification_request',
  id,
  CASE
    WHEN requires_authenticated_verifier THEN 'email_then_profile_lock'
    ELSE 'email_hash'
  END,
  CASE
    WHEN verifier_email IS NULL THEN NULL
    ELSE encode(extensions.digest(lower(trim(verifier_email)), 'sha256'), 'hex')
  END,
  verifier_profile_id,
  true,
  1,
  created_at,
  COALESCE(expires_at, NOW() + INTERVAL '7 days'),
  jsonb_build_object('verifier_source', verifier_source, 'custom_request_id', custom_request_id)
FROM public.skill_verification_requests
WHERE verification_token IS NOT NULL
  AND capability_token_id IS NULL
ON CONFLICT (token_hash) DO NOTHING;

UPDATE public.skill_verification_requests request_row
SET capability_token_id = tokens.id
FROM public.capability_tokens tokens
WHERE request_row.verification_token IS NOT NULL
  AND tokens.source_table = 'skill_verification_requests'
  AND tokens.source_id = request_row.id;

INSERT INTO public.capability_tokens (
  token_class,
  token_hash,
  source_table,
  source_id,
  action_scope,
  subject_type,
  subject_id,
  actor_binding,
  actor_email_hash,
  actor_profile_id,
  single_use,
  max_uses,
  issued_at,
  expires_at,
  metadata
)
SELECT
  'impact_verification_response',
  encode(extensions.digest(trim(token), 'sha256'), 'hex'),
  'impact_story_verification_requests',
  id,
  'impact_verification.respond',
  'impact_verification_request',
  id,
  CASE
    WHEN requires_authenticated_verifier THEN 'email_then_profile_lock'
    ELSE 'email_hash'
  END,
  CASE
    WHEN verifier_email IS NULL THEN NULL
    ELSE encode(extensions.digest(lower(trim(verifier_email)), 'sha256'), 'hex')
  END,
  verifier_profile_id,
  true,
  1,
  created_at,
  expires_at,
  jsonb_build_object('impact_story_id', impact_story_id)
FROM public.impact_story_verification_requests
WHERE token IS NOT NULL
  AND capability_token_id IS NULL
ON CONFLICT (token_hash) DO NOTHING;

UPDATE public.impact_story_verification_requests request_row
SET capability_token_id = tokens.id
FROM public.capability_tokens tokens
WHERE request_row.token IS NOT NULL
  AND tokens.source_table = 'impact_story_verification_requests'
  AND tokens.source_id = request_row.id;

INSERT INTO public.capability_tokens (
  token_class,
  token_hash,
  source_table,
  source_id,
  action_scope,
  subject_type,
  subject_id,
  actor_binding,
  actor_email_hash,
  actor_profile_id,
  single_use,
  max_uses,
  issued_at,
  expires_at,
  metadata
)
SELECT
  'candidate_invite_claim',
  token_hash,
  'org_candidate_invites',
  id,
  'candidate_invite.claim',
  'candidate_invite',
  id,
  'email_then_profile_lock',
  encode(extensions.digest(lower(trim(invitee_email_normalized)), 'sha256'), 'hex'),
  claimed_by_profile_id,
  true,
  1,
  created_at,
  expires_at,
  jsonb_build_object('flow_type', flow_type, 'assignment_id', assignment_id)
FROM public.org_candidate_invites
WHERE capability_token_id IS NULL
ON CONFLICT (token_hash) DO NOTHING;

UPDATE public.org_candidate_invites invite_row
SET capability_token_id = tokens.id
FROM public.capability_tokens tokens
WHERE tokens.source_table = 'org_candidate_invites'
  AND tokens.source_id = invite_row.id;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'feedback_tokens'
  ) THEN
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'feedback_tokens'
        AND column_name = 'id'
    ) THEN
      INSERT INTO public.capability_tokens (
        token_class,
        token_hash,
        source_table,
        source_id,
        action_scope,
        subject_type,
        subject_id,
        actor_binding,
        actor_email_hash,
        single_use,
        max_uses,
        issued_at,
        expires_at,
        metadata
      )
      SELECT
        'feedback_response',
        encode(extensions.digest(trim(token), 'sha256'), 'hex'),
        'feedback_tokens',
        id,
        'feedback.submit',
        'interview_feedback',
        interview_id,
        CASE
          WHEN recipient_email IS NULL THEN 'none'
          ELSE 'email_hash'
        END,
        CASE
          WHEN recipient_email IS NULL THEN NULL
          ELSE encode(extensions.digest(lower(trim(recipient_email)), 'sha256'), 'hex')
        END,
        true,
        1,
        COALESCE(created_at, NOW()),
        expires_at,
        jsonb_build_object('direction', direction, 'template_id', template_id)
      FROM public.feedback_tokens
      WHERE token IS NOT NULL
        AND capability_token_id IS NULL
      ON CONFLICT (token_hash) DO NOTHING;

      UPDATE public.feedback_tokens feedback_token
      SET
        token_hash = encode(extensions.digest(trim(feedback_token.token), 'sha256'), 'hex'),
        capability_token_id = tokens.id
      FROM public.capability_tokens tokens
      WHERE feedback_token.token IS NOT NULL
        AND tokens.source_table = 'feedback_tokens'
        AND tokens.source_id = feedback_token.id;
    ELSE
      INSERT INTO public.capability_tokens (
        token_class,
        token_hash,
        source_table,
        source_id,
        action_scope,
        subject_type,
        subject_id,
        actor_binding,
        actor_email_hash,
        single_use,
        max_uses,
        issued_at,
        expires_at,
        metadata
      )
      SELECT
        'feedback_response',
        encode(extensions.digest(trim(token), 'sha256'), 'hex'),
        'feedback_tokens',
        NULL::uuid,
        'feedback.submit',
        'interview_feedback',
        interview_id,
        CASE
          WHEN recipient_email IS NULL THEN 'none'
          ELSE 'email_hash'
        END,
        CASE
          WHEN recipient_email IS NULL THEN NULL
          ELSE encode(extensions.digest(lower(trim(recipient_email)), 'sha256'), 'hex')
        END,
        true,
        1,
        COALESCE(created_at, NOW()),
        expires_at,
        jsonb_build_object('direction', direction, 'template_id', template_id)
      FROM public.feedback_tokens
      WHERE token IS NOT NULL
        AND capability_token_id IS NULL
      ON CONFLICT (token_hash) DO NOTHING;

      UPDATE public.feedback_tokens feedback_token
      SET
        token_hash = encode(extensions.digest(trim(feedback_token.token), 'sha256'), 'hex'),
        capability_token_id = tokens.id
      FROM public.capability_tokens tokens
      WHERE feedback_token.token IS NOT NULL
        AND tokens.source_table = 'feedback_tokens'
        AND tokens.token_hash = encode(extensions.digest(trim(feedback_token.token), 'sha256'), 'hex');
    END IF;
  END IF;
END $$;

COMMIT;
