-- =========================================================================
-- Analytics Events Hardening
-- Date: 2026-02-05
-- Purpose:
--   - Add missing columns referenced by the codebase
--   - Enforce "emit once" semantics for selected milestone events
-- =========================================================================

-- Columns used by the app / Drizzle schema (safe + idempotent)
ALTER TABLE analytics_events
  ADD COLUMN IF NOT EXISTS session_id TEXT,
  ADD COLUMN IF NOT EXISTS ip_hash TEXT,
  ADD COLUMN IF NOT EXISTS user_agent_hash TEXT;

-- Keep org_id in sync if the legacy organization_id column exists (one-time backfill)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'analytics_events' AND column_name = 'organization_id'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'analytics_events' AND column_name = 'org_id'
  ) THEN
    UPDATE analytics_events
    SET org_id = organization_id
    WHERE org_id IS NULL AND organization_id IS NOT NULL;
  END IF;
END $$;

-- Enforce "emit once" (idempotency) for milestone events
CREATE UNIQUE INDEX IF NOT EXISTS analytics_events_profile_activated_once_idx
  ON analytics_events (entity_id)
  WHERE event_type = 'profile_activated' AND entity_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS analytics_events_ttfqi_warning_emitted_once_idx
  ON analytics_events (entity_id)
  WHERE event_type = 'ttfqi_warning_emitted' AND entity_id IS NOT NULL;

