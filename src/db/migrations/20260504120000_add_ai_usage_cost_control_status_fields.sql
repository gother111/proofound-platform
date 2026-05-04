-- Add explicit cache/provider status to the assistive AI usage ledger.
-- These fields let launch readiness and admin review distinguish charged provider calls,
-- cache replay, budget/rate-limit blocks, and deterministic fallback paths.

BEGIN;

ALTER TABLE public.ai_usage_logs
  ADD COLUMN IF NOT EXISTS cache_status text NOT NULL DEFAULT 'miss',
  ADD COLUMN IF NOT EXISTS provider_status text NOT NULL DEFAULT 'not_called';

ALTER TABLE public.ai_usage_logs
  DROP CONSTRAINT IF EXISTS ai_usage_logs_cache_status_ck;

ALTER TABLE public.ai_usage_logs
  ADD CONSTRAINT ai_usage_logs_cache_status_ck CHECK (
    cache_status IN ('miss', 'hit', 'bypass', 'not_applicable')
  );

ALTER TABLE public.ai_usage_logs
  DROP CONSTRAINT IF EXISTS ai_usage_logs_provider_status_ck;

ALTER TABLE public.ai_usage_logs
  ADD CONSTRAINT ai_usage_logs_provider_status_ck CHECK (
    provider_status IN (
      'not_called',
      'provider_success',
      'provider_error',
      'quota_exhausted',
      'budget_blocked',
      'rate_limited',
      'cache_replay',
      'deterministic_fallback'
    )
  );

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_cache_provider_status
  ON public.ai_usage_logs(cache_status, provider_status, created_at DESC);

COMMIT;
