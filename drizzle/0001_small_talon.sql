CREATE TABLE IF NOT EXISTS "education" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"institution" text NOT NULL,
	"degree" text NOT NULL,
	"duration" text NOT NULL,
	"skills" text NOT NULL,
	"projects" text NOT NULL,
	"verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "experiences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"org_description" text NOT NULL,
	"duration" text NOT NULL,
	"learning" text NOT NULL,
	"growth" text NOT NULL,
	"verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "impact_stories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"org_description" text NOT NULL,
	"impact" text NOT NULL,
	"business_value" text NOT NULL,
	"outcomes" text NOT NULL,
	"timeline" text NOT NULL,
	"verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "volunteering" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"org_description" text NOT NULL,
	"duration" text NOT NULL,
	"cause" text NOT NULL,
	"impact" text NOT NULL,
	"skills_deployed" text NOT NULL,
	"personal_why" text NOT NULL,
	"verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "individual_profiles" ADD COLUMN "tagline" text;--> statement-breakpoint
ALTER TABLE "individual_profiles" ADD COLUMN "mission" text;--> statement-breakpoint
ALTER TABLE "individual_profiles" ADD COLUMN "cover_image_url" text;--> statement-breakpoint
ALTER TABLE "individual_profiles" ADD COLUMN "verified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "individual_profiles" ADD COLUMN "joined_date" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "individual_profiles" ADD COLUMN "values" jsonb;--> statement-breakpoint
ALTER TABLE "individual_profiles" ADD COLUMN "causes" text[];--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "education" ADD CONSTRAINT "education_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "experiences" ADD CONSTRAINT "experiences_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "impact_stories" ADD CONSTRAINT "impact_stories_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "volunteering" ADD CONSTRAINT "volunteering_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
