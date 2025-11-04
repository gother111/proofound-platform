CREATE TABLE IF NOT EXISTS "organization_field_visibility" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"display_name" text DEFAULT 'public' NOT NULL,
	"mission" text DEFAULT 'public' NOT NULL,
	"vision" text DEFAULT 'public' NOT NULL,
	"causes" text DEFAULT 'public' NOT NULL,
	"work_culture" text DEFAULT 'post_match' NOT NULL,
	"structure" text DEFAULT 'post_match' NOT NULL,
	"projects" text DEFAULT 'post_match' NOT NULL,
	"partnerships" text DEFAULT 'post_match' NOT NULL,
	"goals" text DEFAULT 'post_match' NOT NULL,
	"impact" text DEFAULT 'post_match' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organization_field_visibility_org_id_unique" UNIQUE("org_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "self_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"assessment_type" text NOT NULL,
	"score" integer NOT NULL,
	"severity" text NOT NULL,
	"responses" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "impact_entries" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_field_visibility" ADD CONSTRAINT "organization_field_visibility_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "self_assessments" ADD CONSTRAINT "self_assessments_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
