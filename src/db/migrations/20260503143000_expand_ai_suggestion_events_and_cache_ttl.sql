BEGIN;

ALTER TABLE public.ai_suggestion_events
  DROP CONSTRAINT IF EXISTS ai_suggestion_events_type_ck;

ALTER TABLE public.ai_suggestion_events
  ADD CONSTRAINT ai_suggestion_events_type_ck CHECK (
    event_type IN (
      'cache_hit',
      'cache_miss',
      'reservation_created',
      'reservation_released',
      'finalized',
      'generated',
      'viewed',
      'accepted',
      'edited',
      'dismissed',
      'published',
      'budget_blocked',
      'rate_limited',
      'provider_failed'
    )
  );

CREATE INDEX IF NOT EXISTS idx_ai_suggestion_cache_user_scope
  ON public.ai_suggestion_cache(user_id, org_id, feature, prompt_version, input_hash);

CREATE INDEX IF NOT EXISTS idx_ai_suggestion_events_cache_created_at
  ON public.ai_suggestion_events(cache_id, created_at DESC);

UPDATE public.ai_suggestion_cache
SET expires_at = COALESCE(expires_at, created_at + INTERVAL '30 days')
WHERE expires_at IS NULL;

COMMIT;
