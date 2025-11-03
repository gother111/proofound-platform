CREATE TABLE IF NOT EXISTS "admin_audit_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"admin_id" uuid NOT NULL,
	"action" text NOT NULL,
	"target_type" text,
	"target_id" uuid,
	"changes" jsonb,
	"reason" text,
	"ip_address" text,
	"user_agent" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"token" text NOT NULL,
	"invited_by" uuid NOT NULL,
	"invited_at" timestamp DEFAULT now() NOT NULL,
	"accepted_at" timestamp,
	"accepted_by" uuid,
	"expires_at" timestamp NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	CONSTRAINT "admin_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_metrics_cache" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"metric_type" text NOT NULL,
	"period" text NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"value" jsonb NOT NULL,
	"calculated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_metrics_cache_metric_type_period_start_unique" UNIQUE("metric_type","period_start")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignment_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"user_attestation" boolean DEFAULT false,
	"org_attestation" boolean DEFAULT false,
	"contract_type" text,
	"signed_at" timestamp DEFAULT now() NOT NULL,
	"start_date" date,
	"end_date" date,
	"compensation_amount" integer,
	"compensation_currency" text DEFAULT 'USD',
	"compensation_period" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "metric_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metric_type" text NOT NULL,
	"cohort" text,
	"value" numeric NOT NULL,
	"median" numeric,
	"p25" numeric,
	"p75" numeric,
	"mean" numeric,
	"sample_size" integer,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"calculated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "individual_profiles" ADD COLUMN "linkedin_profile_url" text;--> statement-breakpoint
ALTER TABLE "individual_profiles" ADD COLUMN "linkedin_verification_data" jsonb;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "platform_role" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "admin_audit_log" ADD CONSTRAINT "admin_audit_log_admin_id_profiles_id_fk" FOREIGN KEY ("admin_id") REFERENCES "profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "admin_invitations" ADD CONSTRAINT "admin_invitations_invited_by_profiles_id_fk" FOREIGN KEY ("invited_by") REFERENCES "profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "admin_invitations" ADD CONSTRAINT "admin_invitations_accepted_by_profiles_id_fk" FOREIGN KEY ("accepted_by") REFERENCES "profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contracts" ADD CONSTRAINT "contracts_assignment_id_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contracts" ADD CONSTRAINT "contracts_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contracts" ADD CONSTRAINT "contracts_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
