CREATE TABLE IF NOT EXISTS "assignment_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"token" text NOT NULL,
	"stakeholder_email" text NOT NULL,
	"stakeholder_name" text,
	"assigned_sections" jsonb NOT NULL,
	"message" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"completed_at" timestamp,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "assignment_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "assignment_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invitation_id" uuid NOT NULL,
	"section_name" text NOT NULL,
	"section_data" jsonb NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"review_status" text DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"review_notes" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "assignment_version_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"section_data" jsonb NOT NULL,
	"changed_by" text NOT NULL,
	"changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dashboard_layouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"widget_id" text NOT NULL,
	"position" integer NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"size" text DEFAULT 'default',
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dashboard_layouts_user_id_widget_id_unique" UNIQUE("user_id","widget_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "demographic_opt_ins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"opted_in" boolean DEFAULT false NOT NULL,
	"gender" text,
	"ethnicity" text,
	"age_range" text,
	"disability" text,
	"veteran_status" text,
	"data_usage_consent" boolean DEFAULT true NOT NULL,
	"consented_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "demographic_opt_ins_profile_id_unique" UNIQUE("profile_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fairness_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignment_id" uuid NOT NULL,
	"cohorts" jsonb NOT NULL,
	"total_applicants" integer NOT NULL,
	"total_opted_in" integer NOT NULL,
	"total_selected" integer NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"min_sample_size" integer DEFAULT 30 NOT NULL,
	"has_significant_gaps" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"in_app_match_suggested" boolean DEFAULT true NOT NULL,
	"in_app_intro_accepted" boolean DEFAULT true NOT NULL,
	"in_app_message_received" boolean DEFAULT true NOT NULL,
	"in_app_verification_requested" boolean DEFAULT true NOT NULL,
	"in_app_verification_completed" boolean DEFAULT true NOT NULL,
	"in_app_assignment_published" boolean DEFAULT true NOT NULL,
	"in_app_interview_scheduled" boolean DEFAULT true NOT NULL,
	"in_app_contract_signed" boolean DEFAULT true NOT NULL,
	"email_match_suggested" boolean DEFAULT true NOT NULL,
	"email_intro_accepted" boolean DEFAULT true NOT NULL,
	"email_message_received" boolean DEFAULT false NOT NULL,
	"email_verification_requested" boolean DEFAULT true NOT NULL,
	"email_verification_completed" boolean DEFAULT true NOT NULL,
	"email_assignment_published" boolean DEFAULT true NOT NULL,
	"email_interview_scheduled" boolean DEFAULT true NOT NULL,
	"email_contract_signed" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"action_url" text,
	"entity_type" text,
	"entity_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "individual_profiles" ADD COLUMN "field_visibility" jsonb;--> statement-breakpoint
ALTER TABLE "individual_profiles" ADD COLUMN "redact_mode" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "snoozed_until" timestamp;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "assignment_invitations" ADD CONSTRAINT "assignment_invitations_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "assignment_invitations" ADD CONSTRAINT "assignment_invitations_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_invitation_id_assignment_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "assignment_invitations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_reviewed_by_profiles_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "assignment_version_history" ADD CONSTRAINT "assignment_version_history_submission_id_assignment_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "assignment_submissions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dashboard_layouts" ADD CONSTRAINT "dashboard_layouts_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "demographic_opt_ins" ADD CONSTRAINT "demographic_opt_ins_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fairness_metrics" ADD CONSTRAINT "fairness_metrics_assignment_id_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
