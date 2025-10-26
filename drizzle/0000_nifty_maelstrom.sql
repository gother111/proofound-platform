CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"actor_id" uuid,
	"org_id" uuid,
	"action" text NOT NULL,
	"target_type" text,
	"target_id" text,
	"meta" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "feature_flags" (
	"key" text PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"audience" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "individual_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"headline" text,
	"bio" text,
	"skills" text[],
	"location" text,
	"visibility" text DEFAULT 'network'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "org_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"invited_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "org_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organization_members" (
	"org_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text NOT NULL,
	"status" text DEFAULT 'active',
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organization_members_org_id_user_id_pk" PRIMARY KEY("org_id","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"legal_name" text,
	"display_name" text NOT NULL,
	"type" text,
	"logo_url" text,
	"mission" text,
	"website" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"handle" text,
	"display_name" text,
	"avatar_url" text,
	"locale" text DEFAULT 'en',
	"persona" text DEFAULT 'unknown',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_handle_unique" UNIQUE("handle")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rate_limits" (
	"id" text PRIMARY KEY NOT NULL,
	"attempts" bigserial NOT NULL,
	"reset_at" timestamp NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "individual_profiles" ADD CONSTRAINT "individual_profiles_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "org_invitations" ADD CONSTRAINT "org_invitations_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "org_invitations" ADD CONSTRAINT "org_invitations_invited_by_profiles_id_fk" FOREIGN KEY ("invited_by") REFERENCES "profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organizations" ADD CONSTRAINT "organizations_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
