CREATE TABLE IF NOT EXISTS "assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"role" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"values_required" text[] DEFAULT '{}'::text[],
	"cause_tags" text[] DEFAULT '{}'::text[],
	"must_have_skills" jsonb DEFAULT '[]'::jsonb,
	"nice_to_have_skills" jsonb DEFAULT '[]'::jsonb,
	"min_language" jsonb,
	"location_mode" text,
	"radius_km" integer,
	"country" text,
	"city" text,
	"comp_min" integer,
	"comp_max" integer,
	"currency" text DEFAULT 'USD',
	"hours_min" integer,
	"hours_max" integer,
	"start_earliest" date,
	"start_latest" date,
	"verification_gates" text[] DEFAULT '{}'::text[],
	"weights" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "capabilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"skill_record_id" uuid,
	"privacy_level" text DEFAULT 'team' NOT NULL,
	"verification_status" text DEFAULT 'unverified' NOT NULL,
	"verification_source" text,
	"summary" text,
	"highlights" text[] DEFAULT '{}'::text[],
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"evidence_count" integer DEFAULT 0 NOT NULL,
	"last_validated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"capability_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"evidence_type" text DEFAULT 'document' NOT NULL,
	"url" text,
	"file_path" text,
	"issued_at" timestamp,
	"verified" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "growth_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"capability_id" uuid,
	"title" text NOT NULL,
	"goal" text,
	"target_level" integer,
	"target_date" date,
	"status" text DEFAULT 'planned' NOT NULL,
	"milestones" jsonb DEFAULT '[]'::jsonb,
	"support_needs" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "match_interest" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_profile_id" uuid NOT NULL,
	"assignment_id" uuid NOT NULL,
	"target_profile_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "match_interest_actor_profile_id_assignment_id_target_profile_id_unique" UNIQUE("actor_profile_id","assignment_id","target_profile_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignment_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"score" numeric NOT NULL,
	"vector" jsonb NOT NULL,
	"weights" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "matches_assignment_id_profile_id_unique" UNIQUE("assignment_id","profile_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "matching_profiles" (
	"profile_id" uuid PRIMARY KEY NOT NULL,
	"values_tags" text[] DEFAULT '{}'::text[],
	"cause_tags" text[] DEFAULT '{}'::text[],
	"timezone" text,
	"languages" jsonb DEFAULT '[]'::jsonb,
	"verified" jsonb DEFAULT '{}'::jsonb,
	"right_to_work" text,
	"country" text,
	"city" text,
	"availability_earliest" date,
	"availability_latest" date,
	"work_mode" text,
	"radius_km" integer,
	"hours_min" integer,
	"hours_max" integer,
	"comp_min" integer,
	"comp_max" integer,
	"currency" text DEFAULT 'USD',
	"weights" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "skill_endorsements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"capability_id" uuid NOT NULL,
	"endorser_profile_id" uuid NOT NULL,
	"owner_profile_id" uuid NOT NULL,
	"message" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"visibility" text DEFAULT 'owner_only' NOT NULL,
	"responded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"skill_id" text NOT NULL,
	"level" integer NOT NULL,
	"months_experience" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "skills_profile_id_skill_id_unique" UNIQUE("profile_id","skill_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "assignments" ADD CONSTRAINT "assignments_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "capabilities" ADD CONSTRAINT "capabilities_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "capabilities" ADD CONSTRAINT "capabilities_skill_record_id_skills_id_fk" FOREIGN KEY ("skill_record_id") REFERENCES "skills"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "evidence" ADD CONSTRAINT "evidence_capability_id_capabilities_id_fk" FOREIGN KEY ("capability_id") REFERENCES "capabilities"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "evidence" ADD CONSTRAINT "evidence_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "growth_plans" ADD CONSTRAINT "growth_plans_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "growth_plans" ADD CONSTRAINT "growth_plans_capability_id_capabilities_id_fk" FOREIGN KEY ("capability_id") REFERENCES "capabilities"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "match_interest" ADD CONSTRAINT "match_interest_actor_profile_id_profiles_id_fk" FOREIGN KEY ("actor_profile_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "match_interest" ADD CONSTRAINT "match_interest_assignment_id_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "match_interest" ADD CONSTRAINT "match_interest_target_profile_id_profiles_id_fk" FOREIGN KEY ("target_profile_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "matches" ADD CONSTRAINT "matches_assignment_id_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "matches" ADD CONSTRAINT "matches_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "matching_profiles" ADD CONSTRAINT "matching_profiles_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "skill_endorsements" ADD CONSTRAINT "skill_endorsements_capability_id_capabilities_id_fk" FOREIGN KEY ("capability_id") REFERENCES "capabilities"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "skill_endorsements" ADD CONSTRAINT "skill_endorsements_endorser_profile_id_profiles_id_fk" FOREIGN KEY ("endorser_profile_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "skill_endorsements" ADD CONSTRAINT "skill_endorsements_owner_profile_id_profiles_id_fk" FOREIGN KEY ("owner_profile_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "skills" ADD CONSTRAINT "skills_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
