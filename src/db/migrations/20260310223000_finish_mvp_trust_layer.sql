ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS org_trust_tier text NOT NULL DEFAULT 'unreviewed',
  ADD COLUMN IF NOT EXISTS org_trust_tier_reason_code text,
  ADD COLUMN IF NOT EXISTS org_trust_tier_updated_at timestamp;

CREATE TABLE IF NOT EXISTS organization_trust_tier_transitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  previous_tier text,
  new_tier text NOT NULL,
  reason_code text,
  actor_type text NOT NULL,
  actor_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS organization_trust_tier_transitions_org_created_idx
  ON organization_trust_tier_transitions (org_id, created_at);

ALTER TABLE assignments
  ADD COLUMN IF NOT EXISTS policy_version text NOT NULL DEFAULT 'mvp_trust_v1',
  ADD COLUMN IF NOT EXISTS creator_rights_policy text NOT NULL DEFAULT 'default_creator_rights',
  ADD COLUMN IF NOT EXISTS org_usage_rights_policy text NOT NULL DEFAULT 'default_org_usage_rights',
  ADD COLUMN IF NOT EXISTS alternate_terms_recorded_at timestamptz,
  ADD COLUMN IF NOT EXISTS alternate_terms_summary text,
  ADD COLUMN IF NOT EXISTS compensation_type text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS commerciality text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS sponsor_commercial_status text NOT NULL DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS cross_border_status text NOT NULL DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS jurisdiction_status text NOT NULL DEFAULT 'allowed',
  ADD COLUMN IF NOT EXISTS sensitive_domain text NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS sensitive_domain_review_status text NOT NULL DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS policy_audit_state text NOT NULL DEFAULT 'clear',
  ADD COLUMN IF NOT EXISTS policy_reason_codes text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS policy_audit_meta jsonb NOT NULL DEFAULT '{}'::jsonb;
