-- Add manual meeting provider metadata for manual interview scheduling.
ALTER TABLE interviews
ADD COLUMN IF NOT EXISTS manual_meeting_provider TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'interviews_manual_meeting_provider_check'
  ) THEN
    ALTER TABLE interviews
    ADD CONSTRAINT interviews_manual_meeting_provider_check
    CHECK (
      manual_meeting_provider IS NULL
      OR manual_meeting_provider IN ('teams', 'zoom', 'google_meet', 'other')
    );
  END IF;
END
$$;
