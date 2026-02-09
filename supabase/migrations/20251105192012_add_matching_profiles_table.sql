CREATE TABLE IF NOT EXISTS "matching_profiles" (
  "profile_id" uuid PRIMARY KEY REFERENCES "profiles"("id") ON DELETE CASCADE,
  "desired_roles" text[] DEFAULT '{}',
  "desired_industries" text[] DEFAULT '{}',
  "org_types" text[] DEFAULT '{}',
  "weights" jsonb DEFAULT '{"mission": 30, "expertise": 40, "tools": 10, "logistics": 10, "recency": 10}',
  "work_mode" text DEFAULT 'remote' CHECK ("work_mode" IN ('remote', 'hybrid', 'onsite')),
  "preferred_locations" text[] DEFAULT '{}',
  "min_salary" integer DEFAULT 0,
  "max_salary" integer DEFAULT 0,
  "currency" text DEFAULT 'USD',
  "hours_min" integer DEFAULT 0,
  "hours_max" integer DEFAULT 40,
  "availability_earliest" date,
  "availability_latest" date,
  "visibility" jsonb DEFAULT '{"showExactSalary": false, "showExactLocation": true, "allowNameRedaction": false, "showFullSkillLevels": true}',
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "matching_profiles_profile_id_idx" ON "matching_profiles"("profile_id");
