-- Add interviews table for Zoom/Google Meet scheduling
-- References match_id instead of application_id (corrected)

CREATE TABLE IF NOT EXISTS "interviews" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "match_id" uuid NOT NULL REFERENCES "matches"("id") ON DELETE CASCADE,
  "scheduled_at" timestamp NOT NULL,
  "duration_minutes" integer DEFAULT 30 NOT NULL,
  "platform" text NOT NULL CHECK ("platform" IN ('zoom', 'google_meet')),
  "meeting_link" text,
  "meeting_id" text,
  "host_user_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "participant_user_ids" uuid[] NOT NULL,
  "status" text DEFAULT 'scheduled' CHECK ("status" IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  "rescheduled" boolean DEFAULT false,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "interviews_match_id_idx" ON "interviews"("match_id");
CREATE INDEX IF NOT EXISTS "interviews_host_user_id_idx" ON "interviews"("host_user_id");
CREATE INDEX IF NOT EXISTS "interviews_scheduled_at_idx" ON "interviews"("scheduled_at");
CREATE INDEX IF NOT EXISTS "interviews_status_idx" ON "interviews"("status");

COMMENT ON TABLE "interviews" IS 'Interview scheduling with Zoom/Google Meet integration';
