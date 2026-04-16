ALTER TABLE notification_preferences
  ALTER COLUMN email_weekly_digest SET DEFAULT false;

ALTER TABLE notification_preferences
  ALTER COLUMN digest_frequency SET DEFAULT 'disabled';

UPDATE notification_preferences
SET
  email_weekly_digest = false,
  digest_frequency = 'disabled',
  updated_at = NOW()
WHERE
  email_weekly_digest IS DISTINCT FROM false
  OR digest_frequency IS DISTINCT FROM 'disabled';

INSERT INTO notification_preferences (
  user_id,
  email_weekly_digest,
  digest_frequency,
  created_at,
  updated_at
)
SELECT
  p.id,
  false,
  'disabled',
  NOW(),
  NOW()
FROM profiles p
WHERE p.deleted = false
ON CONFLICT (user_id) DO UPDATE
SET
  email_weekly_digest = EXCLUDED.email_weekly_digest,
  digest_frequency = EXCLUDED.digest_frequency,
  updated_at = NOW();
