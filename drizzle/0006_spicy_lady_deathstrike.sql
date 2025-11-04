CREATE TABLE IF NOT EXISTS "work_schedules" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"monday" numeric DEFAULT '0' NOT NULL,
	"tuesday" numeric DEFAULT '0' NOT NULL,
	"wednesday" numeric DEFAULT '0' NOT NULL,
	"thursday" numeric DEFAULT '0' NOT NULL,
	"friday" numeric DEFAULT '0' NOT NULL,
	"saturday" numeric DEFAULT '0' NOT NULL,
	"sunday" numeric DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "work_schedules" ADD CONSTRAINT "work_schedules_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
