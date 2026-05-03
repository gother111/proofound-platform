-- General AI usage controls for assistive features.
-- Stores cost-control/audit metadata without raw prompt text.

BEGIN;

CREATE TABLE IF NOT EXISTS public.ai_monthly_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'gemini',
  scope_type text NOT NULL,
  scope_key text NOT NULL,
  month_start date NOT NULL,
  currency text NOT NULL DEFAULT 'SEK',
  monthly_limit_ore integer NOT NULL,
  spent_ore integer NOT NULL DEFAULT 0,
  reserved_ore integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_monthly_budgets_provider_ck CHECK (provider IN ('gemini')),
  CONSTRAINT ai_monthly_budgets_scope_ck CHECK (
    scope_type IN ('global', 'production', 'feature', 'organization', 'user')
  ),
  CONSTRAINT ai_monthly_budgets_currency_ck CHECK (currency = 'SEK'),
  CONSTRAINT ai_monthly_budgets_status_ck CHECK (status IN ('active', 'exhausted', 'disabled')),
  CONSTRAINT ai_monthly_budgets_limit_ck CHECK (monthly_limit_ore >= 0),
  CONSTRAINT ai_monthly_budgets_spent_ck CHECK (spent_ore >= 0),
  CONSTRAINT ai_monthly_budgets_reserved_ck CHECK (reserved_ore >= 0),
  CONSTRAINT ai_monthly_budgets_unique UNIQUE (provider, scope_type, scope_key, month_start)
);

CREATE INDEX IF NOT EXISTS idx_ai_monthly_budgets_month_start
  ON public.ai_monthly_budgets(month_start DESC);

CREATE INDEX IF NOT EXISTS idx_ai_monthly_budgets_scope_status
  ON public.ai_monthly_budgets(provider, scope_type, scope_key, status);

CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id text NOT NULL,
  idempotency_key text NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  feature text NOT NULL,
  entity_type text,
  entity_id text,
  provider text NOT NULL DEFAULT 'gemini',
  model text,
  prompt_version text NOT NULL,
  input_hash text NOT NULL,
  output_hash text,
  status text NOT NULL DEFAULT 'in_progress',
  prompt_tokens integer,
  output_tokens integer,
  total_tokens integer,
  estimated_cost_ore integer NOT NULL DEFAULT 0,
  reserved_ore integer NOT NULL DEFAULT 0,
  cost_ore integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'SEK',
  redaction_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  safe_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_code text,
  latency_ms integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_usage_logs_status_ck CHECK (
    status IN (
      'in_progress',
      'success',
      'cache_hit',
      'budget_blocked',
      'rate_limited',
      'model_error',
      'invalid_json',
      'validation_failed',
      'failed'
    )
  ),
  CONSTRAINT ai_usage_logs_provider_ck CHECK (provider IN ('gemini')),
  CONSTRAINT ai_usage_logs_currency_ck CHECK (currency = 'SEK'),
  CONSTRAINT ai_usage_logs_estimated_cost_ck CHECK (estimated_cost_ore >= 0),
  CONSTRAINT ai_usage_logs_reserved_ck CHECK (reserved_ore >= 0),
  CONSTRAINT ai_usage_logs_cost_ck CHECK (cost_ore >= 0),
  CONSTRAINT ai_usage_logs_tokens_in_ck CHECK (prompt_tokens IS NULL OR prompt_tokens >= 0),
  CONSTRAINT ai_usage_logs_tokens_out_ck CHECK (output_tokens IS NULL OR output_tokens >= 0),
  CONSTRAINT ai_usage_logs_tokens_total_ck CHECK (total_tokens IS NULL OR total_tokens >= 0),
  CONSTRAINT ai_usage_logs_latency_ck CHECK (latency_ms IS NULL OR latency_ms >= 0)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at
  ON public.ai_usage_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_created_at
  ON public.ai_usage_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_org_created_at
  ON public.ai_usage_logs(org_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_feature_created_at
  ON public.ai_usage_logs(feature, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_input_hash
  ON public.ai_usage_logs(input_hash);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_idempotency_lookup
  ON public.ai_usage_logs(user_id, org_id, feature, entity_type, entity_id, idempotency_key);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_usage_logs_idempotency_replay
  ON public.ai_usage_logs(
    coalesce(user_id::text, '__none__'),
    coalesce(org_id::text, '__none__'),
    feature,
    coalesce(entity_type, '__none__'),
    coalesce(entity_id, '__none__'),
    idempotency_key
  );

CREATE TABLE IF NOT EXISTS public.ai_suggestion_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text NOT NULL UNIQUE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  feature text NOT NULL,
  entity_type text,
  entity_id text,
  provider text NOT NULL DEFAULT 'gemini',
  model text NOT NULL,
  prompt_version text NOT NULL,
  input_hash text NOT NULL,
  output_hash text NOT NULL,
  response_payload jsonb NOT NULL,
  token_usage jsonb NOT NULL DEFAULT '{}'::jsonb,
  cost_ore integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'SEK',
  redaction_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_suggestion_cache_provider_ck CHECK (provider IN ('gemini')),
  CONSTRAINT ai_suggestion_cache_currency_ck CHECK (currency = 'SEK'),
  CONSTRAINT ai_suggestion_cache_cost_ck CHECK (cost_ore >= 0)
);

CREATE INDEX IF NOT EXISTS idx_ai_suggestion_cache_feature_input
  ON public.ai_suggestion_cache(feature, prompt_version, input_hash);

CREATE INDEX IF NOT EXISTS idx_ai_suggestion_cache_org_feature
  ON public.ai_suggestion_cache(org_id, feature, created_at DESC);

CREATE TABLE IF NOT EXISTS public.ai_suggestion_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usage_log_id uuid REFERENCES public.ai_usage_logs(id) ON DELETE SET NULL,
  cache_id uuid REFERENCES public.ai_suggestion_cache(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  feature text NOT NULL,
  entity_type text,
  entity_id text,
  input_hash text NOT NULL,
  safe_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_suggestion_events_type_ck CHECK (
    event_type IN (
      'cache_hit',
      'cache_miss',
      'reservation_created',
      'reservation_released',
      'finalized',
      'budget_blocked',
      'rate_limited',
      'provider_failed'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_ai_suggestion_events_usage_log
  ON public.ai_suggestion_events(usage_log_id);

CREATE INDEX IF NOT EXISTS idx_ai_suggestion_events_feature_created_at
  ON public.ai_suggestion_events(feature, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_suggestion_events_user_created_at
  ON public.ai_suggestion_events(user_id, created_at DESC);

ALTER TABLE public.ai_monthly_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_suggestion_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_suggestion_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "AI monthly budgets service all" ON public.ai_monthly_budgets;
CREATE POLICY "AI monthly budgets service all"
  ON public.ai_monthly_budgets FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "AI monthly budgets admin read" ON public.ai_monthly_budgets;
CREATE POLICY "AI monthly budgets admin read"
  ON public.ai_monthly_budgets FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.platform_role IN ('platform_admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "AI usage logs service all" ON public.ai_usage_logs;
CREATE POLICY "AI usage logs service all"
  ON public.ai_usage_logs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "AI usage logs admin read" ON public.ai_usage_logs;
CREATE POLICY "AI usage logs admin read"
  ON public.ai_usage_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.platform_role IN ('platform_admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "AI suggestion cache service all" ON public.ai_suggestion_cache;
CREATE POLICY "AI suggestion cache service all"
  ON public.ai_suggestion_cache FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "AI suggestion cache admin read" ON public.ai_suggestion_cache;
CREATE POLICY "AI suggestion cache admin read"
  ON public.ai_suggestion_cache FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.platform_role IN ('platform_admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "AI suggestion events service all" ON public.ai_suggestion_events;
CREATE POLICY "AI suggestion events service all"
  ON public.ai_suggestion_events FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "AI suggestion events admin read" ON public.ai_suggestion_events;
CREATE POLICY "AI suggestion events admin read"
  ON public.ai_suggestion_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.platform_role IN ('platform_admin', 'super_admin')
    )
  );

COMMIT;
