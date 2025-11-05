CREATE TABLE IF NOT EXISTS "fairness_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"release_version" text NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"cohort_data" jsonb NOT NULL,
	"findings" jsonb NOT NULL,
	"recommendations" jsonb NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"min_sample_size" integer DEFAULT 40 NOT NULL,
	"has_significant_gaps" boolean DEFAULT false NOT NULL,
	"p_value" numeric,
	"created_by" uuid,
	"published_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "performance_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alert_type" text NOT NULL,
	"metric_type" text NOT NULL,
	"route" text,
	"threshold_ms" numeric NOT NULL,
	"actual_value_ms" numeric NOT NULL,
	"percentile" text,
	"device_type" text,
	"severity" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"acknowledged_by" uuid,
	"acknowledged_at" timestamp,
	"resolved_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "performance_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metric_type" text NOT NULL,
	"page_route" text,
	"api_endpoint" text,
	"value_ms" numeric NOT NULL,
	"device_type" text,
	"p50" numeric,
	"p95" numeric,
	"p99" numeric,
	"user_agent" text,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"period_start" timestamp,
	"period_end" timestamp,
	"sample_count" integer DEFAULT 1
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profile_field_visibility" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"display_name" text DEFAULT 'public' NOT NULL,
	"avatar" text DEFAULT 'public' NOT NULL,
	"headline" text DEFAULT 'public' NOT NULL,
	"location" text DEFAULT 'network_only' NOT NULL,
	"mission" text DEFAULT 'public' NOT NULL,
	"vision" text DEFAULT 'public' NOT NULL,
	"values" text DEFAULT 'public' NOT NULL,
	"causes" text DEFAULT 'public' NOT NULL,
	"experiences" text DEFAULT 'network_only' NOT NULL,
	"education" text DEFAULT 'public' NOT NULL,
	"volunteering" text DEFAULT 'public' NOT NULL,
	"skills" text DEFAULT 'public' NOT NULL,
	"impact_stories" text DEFAULT 'match_only' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profile_field_visibility_profile_id_unique" UNIQUE("profile_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "purpose_edit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"field_name" text NOT NULL,
	"old_value" text,
	"new_value" text NOT NULL,
	"changed_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "survey_display_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"survey_type" text NOT NULL,
	"task" text,
	"displayed_at" timestamp DEFAULT now() NOT NULL,
	"completed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sus_surveys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"task" text,
	"responses" jsonb NOT NULL,
	"score" numeric NOT NULL,
	"dismissed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "interviews" ADD COLUMN "decision" text;--> statement-breakpoint
ALTER TABLE "interviews" ADD COLUMN "decided_by" uuid;--> statement-breakpoint
ALTER TABLE "interviews" ADD COLUMN "decided_at" timestamp;--> statement-breakpoint
ALTER TABLE "interviews" ADD COLUMN "feedback" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_events_user_id_idx" ON "analytics_events" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_events_event_type_idx" ON "analytics_events" ("event_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_events_created_at_idx" ON "analytics_events" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_events_entity_id_idx" ON "analytics_events" ("entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contracts_user_id_idx" ON "contracts" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contracts_assignment_id_idx" ON "contracts" ("assignment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contracts_signed_at_idx" ON "contracts" ("signed_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "match_interest_actor_profile_id_idx" ON "match_interest" ("actor_profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "match_interest_assignment_id_idx" ON "match_interest" ("assignment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "match_interest_target_profile_id_idx" ON "match_interest" ("target_profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "matches_profile_id_idx" ON "matches" ("profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "matches_assignment_id_idx" ON "matches" ("assignment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "matches_score_idx" ON "matches" ("score");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "interviews" ADD CONSTRAINT "interviews_decided_by_profiles_id_fk" FOREIGN KEY ("decided_by") REFERENCES "profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fairness_notes" ADD CONSTRAINT "fairness_notes_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "performance_alerts" ADD CONSTRAINT "performance_alerts_acknowledged_by_profiles_id_fk" FOREIGN KEY ("acknowledged_by") REFERENCES "profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profile_field_visibility" ADD CONSTRAINT "profile_field_visibility_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "purpose_edit_log" ADD CONSTRAINT "purpose_edit_log_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "survey_display_log" ADD CONSTRAINT "survey_display_log_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sus_surveys" ADD CONSTRAINT "sus_surveys_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
