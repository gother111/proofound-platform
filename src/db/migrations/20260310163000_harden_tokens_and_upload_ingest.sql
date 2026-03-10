BEGIN;

ALTER TABLE public.capability_tokens
  ADD COLUMN IF NOT EXISTS state TEXT NOT NULL DEFAULT 'issued',
  ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspicious_flag BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS scope_key TEXT,
  ADD COLUMN IF NOT EXISTS redeem_session_nonce_hash TEXT,
  ADD COLUMN IF NOT EXISTS redeem_session_nonce_expires_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'capability_tokens_state_ck'
      AND conrelid = 'public.capability_tokens'::regclass
  ) THEN
    ALTER TABLE public.capability_tokens
      ADD CONSTRAINT capability_tokens_state_ck
      CHECK (state IN ('issued', 'redeemed', 'expired', 'revoked'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS capability_tokens_state_idx
  ON public.capability_tokens(state, token_class, expires_at);

CREATE INDEX IF NOT EXISTS capability_tokens_scope_idx
  ON public.capability_tokens(token_class, scope_key, actor_email_hash)
  WHERE state = 'issued' AND revoked_at IS NULL;

UPDATE public.capability_tokens
SET
  state = CASE
    WHEN revoked_at IS NOT NULL THEN 'revoked'
    WHEN expires_at <= NOW() THEN 'expired'
    WHEN first_redeemed_at IS NOT NULL OR redeemed_count > 0 THEN 'redeemed'
    ELSE 'issued'
  END,
  attempt_count = COALESCE(attempt_count, 0);

ALTER TABLE public.uploaded_files
  ADD COLUMN IF NOT EXISTS metadata_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS attach_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS safe_for_public BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS metadata_extracted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS attached_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS proof_pack_id UUID REFERENCES public.proof_packs(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uploaded_files_metadata_status_ck'
      AND conrelid = 'public.uploaded_files'::regclass
  ) THEN
    ALTER TABLE public.uploaded_files
      ADD CONSTRAINT uploaded_files_metadata_status_ck
      CHECK (metadata_status IN ('pending', 'extracted', 'rejected'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uploaded_files_attach_status_ck'
      AND conrelid = 'public.uploaded_files'::regclass
  ) THEN
    ALTER TABLE public.uploaded_files
      ADD CONSTRAINT uploaded_files_attach_status_ck
      CHECK (attach_status IN ('pending', 'attachable', 'attached', 'rejected'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS uploaded_files_attach_status_idx
  ON public.uploaded_files(attach_status, metadata_status, lifecycle_state, created_at);

ALTER TABLE public.assignment_invitations
  ADD COLUMN IF NOT EXISTS token_hash TEXT,
  ADD COLUMN IF NOT EXISTS capability_token_id UUID REFERENCES public.capability_tokens(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS assignment_invitations_token_hash_idx
  ON public.assignment_invitations(token_hash)
  WHERE token_hash IS NOT NULL;

ALTER TABLE public.admin_invitations
  ADD COLUMN IF NOT EXISTS token_hash TEXT,
  ADD COLUMN IF NOT EXISTS capability_token_id UUID REFERENCES public.capability_tokens(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS admin_invitations_token_hash_idx
  ON public.admin_invitations(token_hash)
  WHERE token_hash IS NOT NULL;

ALTER TABLE public.verification_requests
  ADD COLUMN IF NOT EXISTS token_hash TEXT,
  ADD COLUMN IF NOT EXISTS capability_token_id UUID REFERENCES public.capability_tokens(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revoked_reason TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS verification_requests_token_hash_idx
  ON public.verification_requests(token_hash)
  WHERE token_hash IS NOT NULL;

UPDATE public.assignment_invitations
SET token_hash = encode(extensions.digest(trim(token), 'sha256'), 'hex')
WHERE token IS NOT NULL
  AND token_hash IS NULL;

UPDATE public.admin_invitations
SET token_hash = encode(extensions.digest(trim(token), 'sha256'), 'hex')
WHERE token IS NOT NULL
  AND token_hash IS NULL;

UPDATE public.verification_requests
SET token_hash = encode(extensions.digest(trim(token), 'sha256'), 'hex')
WHERE token IS NOT NULL
  AND token_hash IS NULL;

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
  first_redeemed_at,
  revoked_at,
  revoked_reason,
  state,
  scope_key,
  metadata
)
SELECT
  'org_member_invite',
  invitation.token_hash,
  'org_invitations',
  invitation.id,
  'org_invitation.accept',
  'organization',
  invitation.org_id,
  'email_hash',
  encode(extensions.digest(trim(lower(invitation.email)), 'sha256'), 'hex'),
  TRUE,
  1,
  invitation.created_at,
  invitation.expires_at,
  invitation.accepted_at,
  invitation.revoked_at,
  invitation.revoked_reason,
  CASE
    WHEN invitation.revoked_at IS NOT NULL OR invitation.status = 'revoked' THEN 'revoked'
    WHEN invitation.expires_at <= NOW() OR invitation.status = 'expired' THEN 'expired'
    WHEN invitation.accepted_at IS NOT NULL OR invitation.status = 'accepted' THEN 'redeemed'
    ELSE 'issued'
  END,
  concat_ws(':', 'org_member_invite', invitation.org_id::text, lower(trim(invitation.email))),
  jsonb_build_object('role', invitation.role, 'backfill', TRUE)
FROM public.org_invitations invitation
WHERE invitation.token_hash IS NOT NULL
  AND invitation.capability_token_id IS NULL
ON CONFLICT (token_hash) DO NOTHING;

UPDATE public.org_invitations invitation
SET capability_token_id = tokens.id
FROM public.capability_tokens tokens
WHERE invitation.capability_token_id IS NULL
  AND invitation.token_hash IS NOT NULL
  AND tokens.source_table = 'org_invitations'
  AND tokens.source_id = invitation.id;

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
  first_redeemed_at,
  revoked_at,
  state,
  scope_key,
  metadata
)
SELECT
  'candidate_invite_claim',
  invite.token_hash,
  'org_candidate_invites',
  invite.id,
  'candidate_invite.claim',
  'organization',
  invite.org_id,
  'email_hash',
  encode(extensions.digest(trim(lower(invite.invitee_email_normalized)), 'sha256'), 'hex'),
  TRUE,
  1,
  invite.created_at,
  invite.expires_at,
  invite.accepted_at,
  invite.revoked_at,
  CASE
    WHEN invite.revoked_at IS NOT NULL OR invite.status = 'revoked' THEN 'revoked'
    WHEN invite.expires_at <= NOW() OR invite.status = 'expired' THEN 'expired'
    WHEN invite.accepted_at IS NOT NULL OR invite.status IN ('claimed', 'proof_submitted') THEN 'redeemed'
    ELSE 'issued'
  END,
  concat_ws(':', 'candidate_invite', invite.org_id::text, coalesce(invite.assignment_id::text, 'none'), lower(trim(invite.invitee_email_normalized))),
  jsonb_build_object('flowType', invite.flow_type, 'backfill', TRUE)
FROM public.org_candidate_invites invite
WHERE invite.token_hash IS NOT NULL
  AND invite.capability_token_id IS NULL
ON CONFLICT (token_hash) DO NOTHING;

UPDATE public.org_candidate_invites invite
SET capability_token_id = tokens.id
FROM public.capability_tokens tokens
WHERE invite.capability_token_id IS NULL
  AND invite.token_hash IS NOT NULL
  AND tokens.source_table = 'org_candidate_invites'
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
  actor_email_hash,
  single_use,
  max_uses,
  issued_at,
  expires_at,
  first_redeemed_at,
  revoked_at,
  state,
  scope_key,
  metadata
)
SELECT
  'impact_verification_response',
  request.token_hash,
  'custom_verification_requests',
  request.id,
  'custom_verification.respond',
  'custom_verification_request',
  request.id,
  'email_hash',
  encode(extensions.digest(trim(lower(request.verifier_email)), 'sha256'), 'hex'),
  TRUE,
  1,
  request.created_at,
  request.expires_at,
  request.responded_at,
  request.revoked_at,
  CASE
    WHEN request.revoked_at IS NOT NULL OR request.status = 'revoked' THEN 'revoked'
    WHEN request.expires_at <= NOW() OR request.status = 'expired' THEN 'expired'
    WHEN request.responded_at IS NOT NULL OR request.status IN ('accepted', 'declined') THEN 'redeemed'
    ELSE 'issued'
  END,
  concat_ws(':', 'custom_verification', request.requester_profile_id::text, lower(trim(request.verifier_email))),
  jsonb_build_object('backfill', TRUE)
FROM public.custom_verification_requests request
WHERE request.token_hash IS NOT NULL
  AND request.capability_token_id IS NULL
ON CONFLICT (token_hash) DO NOTHING;

UPDATE public.custom_verification_requests request
SET capability_token_id = tokens.id
FROM public.capability_tokens tokens
WHERE request.capability_token_id IS NULL
  AND request.token_hash IS NOT NULL
  AND tokens.source_table = 'custom_verification_requests'
  AND tokens.source_id = request.id;

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
  first_redeemed_at,
  revoked_at,
  state,
  scope_key,
  metadata
)
SELECT
  'impact_verification_response',
  request.token_hash,
  'verification_requests',
  request.id,
  'verification_request.respond',
  'verification_request',
  request.id,
  'email_hash',
  encode(extensions.digest(trim(lower(request.verifier_email)), 'sha256'), 'hex'),
  TRUE,
  1,
  request.created_at,
  request.expires_at,
  request.responded_at,
  request.revoked_at,
  CASE
    WHEN request.revoked_at IS NOT NULL OR request.status = 'cancelled' THEN 'revoked'
    WHEN request.expires_at <= NOW() OR request.status = 'expired' THEN 'expired'
    WHEN request.responded_at IS NOT NULL OR request.used_at IS NOT NULL OR request.status IN ('verified', 'declined') THEN 'redeemed'
    ELSE 'issued'
  END,
  concat_ws(':', 'verification_request', request.profile_id::text, lower(trim(request.verifier_email))),
  jsonb_build_object('claimType', request.claim_type, 'backfill', TRUE)
FROM public.verification_requests request
WHERE request.token_hash IS NOT NULL
  AND request.capability_token_id IS NULL
ON CONFLICT (token_hash) DO NOTHING;

UPDATE public.verification_requests request
SET capability_token_id = tokens.id
FROM public.capability_tokens tokens
WHERE request.capability_token_id IS NULL
  AND request.token_hash IS NOT NULL
  AND tokens.source_table = 'verification_requests'
  AND tokens.source_id = request.id;

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
  state,
  scope_key,
  metadata
)
SELECT
  'consent_reveal',
  invitation.token_hash,
  'assignment_invitations',
  invitation.id,
  'assignment_invitation.submit',
  'assignment_invitation',
  invitation.id,
  'email_hash',
  encode(extensions.digest(trim(lower(invitation.stakeholder_email)), 'sha256'), 'hex'),
  FALSE,
  2147483647,
  invitation.created_at,
  invitation.expires_at,
  CASE
    WHEN invitation.revoked_at IS NOT NULL THEN 'revoked'
    WHEN invitation.expires_at <= NOW() OR invitation.status = 'expired' THEN 'expired'
    WHEN invitation.status = 'completed' THEN 'redeemed'
    ELSE 'issued'
  END,
  concat_ws(':', 'assignment_invitation', invitation.org_id::text, lower(trim(invitation.stakeholder_email))),
  jsonb_build_object('assignedSections', invitation.assigned_sections, 'backfill', TRUE)
FROM public.assignment_invitations invitation
WHERE invitation.token_hash IS NOT NULL
  AND invitation.capability_token_id IS NULL
ON CONFLICT (token_hash) DO NOTHING;

UPDATE public.assignment_invitations invitation
SET capability_token_id = tokens.id
FROM public.capability_tokens tokens
WHERE invitation.capability_token_id IS NULL
  AND invitation.token_hash IS NOT NULL
  AND tokens.source_table = 'assignment_invitations'
  AND tokens.source_id = invitation.id;

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
  first_redeemed_at,
  revoked_at,
  state,
  scope_key,
  metadata
)
SELECT
  'org_member_invite',
  invitation.token_hash,
  'admin_invitations',
  invitation.id,
  'admin_invitation.accept',
  'admin_invitation',
  invitation.id,
  'email_hash',
  encode(extensions.digest(trim(lower(invitation.email)), 'sha256'), 'hex'),
  TRUE,
  1,
  invitation.invited_at,
  invitation.expires_at,
  invitation.accepted_at,
  invitation.revoked_at,
  CASE
    WHEN invitation.revoked_at IS NOT NULL OR invitation.status = 'revoked' THEN 'revoked'
    WHEN invitation.expires_at <= NOW() OR invitation.status = 'expired' THEN 'expired'
    WHEN invitation.accepted_at IS NOT NULL OR invitation.status = 'accepted' THEN 'redeemed'
    ELSE 'issued'
  END,
  concat_ws(':', 'admin_invitation', lower(trim(invitation.email))),
  jsonb_build_object('role', invitation.role, 'backfill', TRUE)
FROM public.admin_invitations invitation
WHERE invitation.token_hash IS NOT NULL
  AND invitation.capability_token_id IS NULL
ON CONFLICT (token_hash) DO NOTHING;

UPDATE public.admin_invitations invitation
SET capability_token_id = tokens.id
FROM public.capability_tokens tokens
WHERE invitation.capability_token_id IS NULL
  AND invitation.token_hash IS NOT NULL
  AND tokens.source_table = 'admin_invitations'
  AND tokens.source_id = invitation.id;

COMMIT;
