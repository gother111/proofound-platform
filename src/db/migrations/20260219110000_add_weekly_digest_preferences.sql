ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS email_weekly_digest boolean NOT NULL DEFAULT true;

ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS digest_frequency text NOT NULL DEFAULT 'weekly';

ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS last_digest_sent_at timestamp;
