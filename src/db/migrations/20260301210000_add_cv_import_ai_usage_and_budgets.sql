-- Add Gemini CV import budget + usage tracking tables.
-- Supports dual-key monthly budgets, idempotent request replay, and admin analytics.

BEGIN;

CREATE TABLE IF NOT EXISTS public.cv_import_ai_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'gemini',
  key_slot text NOT NULL,
  month_start date NOT NULL,
  currency text NOT NULL DEFAULT 'SEK',
  monthly_limit_ore integer NOT NULL,
  spent_ore integer NOT NULL DEFAULT 0,
  reserved_ore integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cv_import_ai_budgets_provider_ck CHECK (provider IN ('gemini')),
  CONSTRAINT cv_import_ai_budgets_key_slot_ck CHECK (key_slot IN ('primary', 'secondary')),
  CONSTRAINT cv_import_ai_budgets_currency_ck CHECK (currency = 'SEK'),
  CONSTRAINT cv_import_ai_budgets_status_ck CHECK (status IN ('active', 'exhausted', 'disabled')),
  CONSTRAINT cv_import_ai_budgets_limit_ck CHECK (monthly_limit_ore >= 0),
  CONSTRAINT cv_import_ai_budgets_spent_ck CHECK (spent_ore >= 0),
  CONSTRAINT cv_import_ai_budgets_reserved_ck CHECK (reserved_ore >= 0),
  CONSTRAINT cv_import_ai_budgets_unique UNIQUE (provider, key_slot, month_start)
);

CREATE INDEX IF NOT EXISTS idx_cv_import_ai_budgets_month_start
  ON public.cv_import_ai_budgets(month_start DESC);

CREATE INDEX IF NOT EXISTS idx_cv_import_ai_budgets_provider_slot
  ON public.cv_import_ai_budgets(provider, key_slot, status);

CREATE TABLE IF NOT EXISTS public.cv_import_ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id text NOT NULL,
  idempotency_key text NOT NULL,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  route text NOT NULL,
  status text NOT NULL DEFAULT 'in_progress',
  provider text NOT NULL DEFAULT 'gemini',
  key_slot text,
  model text,
  prompt_tokens integer,
  output_tokens integer,
  total_tokens integer,
  cost_ore integer NOT NULL DEFAULT 0,
  reserved_ore integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'SEK',
  error_code text,
  error_message text,
  latency_ms integer,
  response_payload jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cv_import_ai_usage_logs_status_ck CHECK (
    status IN (
      'in_progress',
      'success',
      'fallback_success',
      'budget_blocked',
      'quota_failover',
      'invalid_json',
      'model_error',
      'ocr_failed',
      'failed'
    )
  ),
  CONSTRAINT cv_import_ai_usage_logs_provider_ck CHECK (provider IN ('gemini')),
  CONSTRAINT cv_import_ai_usage_logs_key_slot_ck CHECK (
    key_slot IS NULL OR key_slot IN ('primary', 'secondary')
  ),
  CONSTRAINT cv_import_ai_usage_logs_currency_ck CHECK (currency = 'SEK'),
  CONSTRAINT cv_import_ai_usage_logs_cost_ck CHECK (cost_ore >= 0),
  CONSTRAINT cv_import_ai_usage_logs_reserved_ck CHECK (reserved_ore >= 0),
  CONSTRAINT cv_import_ai_usage_logs_tokens_ck CHECK (
    prompt_tokens IS NULL OR prompt_tokens >= 0
  ),
  CONSTRAINT cv_import_ai_usage_logs_tokens_out_ck CHECK (
    output_tokens IS NULL OR output_tokens >= 0
  ),
  CONSTRAINT cv_import_ai_usage_logs_tokens_total_ck CHECK (
    total_tokens IS NULL OR total_tokens >= 0
  ),
  CONSTRAINT cv_import_ai_usage_logs_latency_ck CHECK (
    latency_ms IS NULL OR latency_ms >= 0
  ),
  CONSTRAINT cv_import_ai_usage_logs_idempotency_unique UNIQUE (user_id, route, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_cv_import_ai_usage_logs_created_at
  ON public.cv_import_ai_usage_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cv_import_ai_usage_logs_user_created_at
  ON public.cv_import_ai_usage_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cv_import_ai_usage_logs_route_status
  ON public.cv_import_ai_usage_logs(route, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cv_import_ai_usage_logs_key_slot
  ON public.cv_import_ai_usage_logs(key_slot, created_at DESC);

ALTER TABLE public.cv_import_ai_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_import_ai_usage_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "CV import AI budgets service select" ON public.cv_import_ai_budgets;
CREATE POLICY "CV import AI budgets service select"
  ON public.cv_import_ai_budgets FOR SELECT
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "CV import AI budgets service insert" ON public.cv_import_ai_budgets;
CREATE POLICY "CV import AI budgets service insert"
  ON public.cv_import_ai_budgets FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "CV import AI budgets service update" ON public.cv_import_ai_budgets;
CREATE POLICY "CV import AI budgets service update"
  ON public.cv_import_ai_budgets FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "CV import AI budgets service delete" ON public.cv_import_ai_budgets;
CREATE POLICY "CV import AI budgets service delete"
  ON public.cv_import_ai_budgets FOR DELETE
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "CV import AI budgets admin read" ON public.cv_import_ai_budgets;
CREATE POLICY "CV import AI budgets admin read"
  ON public.cv_import_ai_budgets FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.platform_role IN ('platform_admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "CV import AI usage service select" ON public.cv_import_ai_usage_logs;
CREATE POLICY "CV import AI usage service select"
  ON public.cv_import_ai_usage_logs FOR SELECT
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "CV import AI usage service insert" ON public.cv_import_ai_usage_logs;
CREATE POLICY "CV import AI usage service insert"
  ON public.cv_import_ai_usage_logs FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "CV import AI usage service update" ON public.cv_import_ai_usage_logs;
CREATE POLICY "CV import AI usage service update"
  ON public.cv_import_ai_usage_logs FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "CV import AI usage service delete" ON public.cv_import_ai_usage_logs;
CREATE POLICY "CV import AI usage service delete"
  ON public.cv_import_ai_usage_logs FOR DELETE
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "CV import AI usage admin read" ON public.cv_import_ai_usage_logs;
CREATE POLICY "CV import AI usage admin read"
  ON public.cv_import_ai_usage_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.platform_role IN ('platform_admin', 'super_admin')
    )
  );

COMMIT;

-- Rollback SQL (manual)
-- DROP POLICY IF EXISTS "CV import AI usage admin read" ON public.cv_import_ai_usage_logs;
-- DROP POLICY IF EXISTS "CV import AI usage service delete" ON public.cv_import_ai_usage_logs;
-- DROP POLICY IF EXISTS "CV import AI usage service update" ON public.cv_import_ai_usage_logs;
-- DROP POLICY IF EXISTS "CV import AI usage service insert" ON public.cv_import_ai_usage_logs;
-- DROP POLICY IF EXISTS "CV import AI usage service select" ON public.cv_import_ai_usage_logs;
-- DROP POLICY IF EXISTS "CV import AI budgets admin read" ON public.cv_import_ai_budgets;
-- DROP POLICY IF EXISTS "CV import AI budgets service delete" ON public.cv_import_ai_budgets;
-- DROP POLICY IF EXISTS "CV import AI budgets service update" ON public.cv_import_ai_budgets;
-- DROP POLICY IF EXISTS "CV import AI budgets service insert" ON public.cv_import_ai_budgets;
-- DROP POLICY IF EXISTS "CV import AI budgets service select" ON public.cv_import_ai_budgets;
-- DROP TABLE IF EXISTS public.cv_import_ai_usage_logs;
-- DROP TABLE IF EXISTS public.cv_import_ai_budgets;
