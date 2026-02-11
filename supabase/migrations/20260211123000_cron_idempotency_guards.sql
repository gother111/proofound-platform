-- Cron idempotency hardening
-- Purpose: prevent duplicate reminder rows from repeated cron execution.

BEGIN;

-- 1) decision_reminders: keep one row per (interview_id, reminder_type)
DO $$
BEGIN
  IF to_regclass('public.decision_reminders') IS NOT NULL THEN
    WITH ranked_reminders AS (
      SELECT
        id,
        ROW_NUMBER() OVER (
          PARTITION BY interview_id, reminder_type
          ORDER BY sent_at ASC, id ASC
        ) AS rn
      FROM decision_reminders
    )
    DELETE FROM decision_reminders dr
    USING ranked_reminders rr
    WHERE dr.id = rr.id
      AND rr.rn > 1;

    EXECUTE '
      CREATE UNIQUE INDEX IF NOT EXISTS decision_reminders_interview_type_unique_idx
      ON decision_reminders (interview_id, reminder_type)
    ';
  END IF;
END
$$;

-- 2) analytics_events: keep one deletion reminder event per user + scheduled date
DO $$
BEGIN
  IF to_regclass('public.analytics_events') IS NOT NULL THEN
    WITH ranked_events AS (
      SELECT
        id,
        ROW_NUMBER() OVER (
          PARTITION BY user_id, COALESCE(properties->>'scheduledFor', '')
          ORDER BY created_at ASC, id ASC
        ) AS rn
      FROM analytics_events
      WHERE event_type = 'account_deletion_reminder_sent'
        AND user_id IS NOT NULL
    )
    DELETE FROM analytics_events ae
    USING ranked_events re
    WHERE ae.id = re.id
      AND re.rn > 1;

    EXECUTE '
      CREATE UNIQUE INDEX IF NOT EXISTS analytics_events_deletion_reminder_once_idx
      ON analytics_events (user_id, (COALESCE(properties->>''scheduledFor'', '''')))
      WHERE event_type = ''account_deletion_reminder_sent''
        AND user_id IS NOT NULL
    ';
  END IF;
END
$$;

COMMIT;

-- Rollback SQL (manual)
-- DROP INDEX IF EXISTS analytics_events_deletion_reminder_once_idx;
-- DROP INDEX IF EXISTS decision_reminders_interview_type_unique_idx;
