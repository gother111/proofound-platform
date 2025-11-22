CREATE TABLE IF NOT EXISTS "active_ties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tie_type" text NOT NULL,
	"related_user_id" uuid,
	"related_org_id" uuid,
	"strength" numeric NOT NULL,
	"last_interaction_at" timestamp DEFAULT now() NOT NULL,
	"is_legacy" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE IF NOT EXISTS "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" text NOT NULL,
	"user_id" uuid,
	"org_id" uuid,
	"entity_type" text,
	"entity_id" uuid,
	"properties" jsonb DEFAULT '{}'::jsonb,
	"session_id" text,
	"ip_hash" text,
	"user_agent_hash" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "assignment_benefits_offered" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignment_id" uuid NOT NULL,
	"benefit_code" text NOT NULL,
	"details" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "assignment_benefits_offered_assignment_id_benefit_code_unique" UNIQUE("assignment_id","benefit_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "assignment_creation_pipeline" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignment_id" uuid NOT NULL,
	"step_order" integer NOT NULL,
	"step_name" text NOT NULL,
	"stakeholder_role" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"step_data" jsonb DEFAULT '{}'::jsonb,
	"completed_at" timestamp,
	"completed_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "assignment_creation_pipeline_assignment_id_step_order_unique" UNIQUE("assignment_id","step_order")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "assignment_expertise_matrix" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignment_id" uuid NOT NULL,
	"skill_code" text NOT NULL,
	"required_level" integer NOT NULL,
	"stakeholder_role" text NOT NULL,
	"linked_outcome_id" uuid,
	"outcome_rationale" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "assignment_field_visibility" (
	"assignment_id" uuid NOT NULL,
	"field_name" text NOT NULL,
	"visibility_level" text NOT NULL,
	"reveal_stage" integer,
	"redaction_type" text,
	"generic_label" text,
	"conditional_rules" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "assignment_field_visibility_assignment_id_field_name_pk" PRIMARY KEY("assignment_id","field_name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "assignment_field_visibility_defaults" (
	"field_name" text PRIMARY KEY NOT NULL,
	"field_category" text NOT NULL,
	"default_visibility" text NOT NULL,
	"default_redaction_type" text,
	"default_generic_label" text,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE IF NOT EXISTS "assignment_outcomes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignment_id" uuid NOT NULL,
	"outcome_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"metrics" jsonb DEFAULT '[]'::jsonb,
	"success_criteria" text,
	"depends_on" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
CREATE TABLE IF NOT EXISTS "assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"role" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"creation_status" text DEFAULT 'draft' NOT NULL,
	"business_value" text,
	"expected_impact" text,
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
	"can_sponsor_visa" boolean DEFAULT false,
	"sponsorship_countries" text[],
	"offers_relocation_support" boolean DEFAULT false,
	"relocation_package" jsonb,
	"required_availability_bitmap" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE IF NOT EXISTS "benefits_taxonomy" (
	"code" text PRIMARY KEY NOT NULL,
	"name_i18n" jsonb NOT NULL,
	"category" text NOT NULL,
	"description_i18n" jsonb,
	"is_standard" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "blocked_users" (
	"blocker_id" uuid NOT NULL,
	"blocked_id" uuid NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blocked_users_blocker_id_blocked_id_pk" PRIMARY KEY("blocker_id","blocked_id")
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
CREATE TABLE IF NOT EXISTS "content_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_id" uuid NOT NULL,
	"content_type" text NOT NULL,
	"content_id" uuid NOT NULL,
	"content_owner_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"category" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"ai_flag" boolean DEFAULT false NOT NULL,
	"ai_confidence" numeric,
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
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
CREATE TABLE IF NOT EXISTS "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid,
	"participant_one_id" uuid NOT NULL,
	"participant_two_id" uuid NOT NULL,
	"stage" text DEFAULT 'masked',
	"revealed_at" timestamp,
	"masked_handle_one" text,
	"masked_handle_two" text,
	"participant_one_wants_reveal" boolean DEFAULT false,
	"participant_two_wants_reveal" boolean DEFAULT false,
	"participant_one_reveal_requested_at" timestamp,
	"participant_two_reveal_requested_at" timestamp,
	"last_message_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "currency_exchange_rates" (
	"currency" text PRIMARY KEY NOT NULL,
	"to_usd" numeric NOT NULL,
	"source" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
CREATE TABLE IF NOT EXISTS "editorial_matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignment_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"curator_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"notes" text,
	"priority" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "education" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" uuid,
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
CREATE TABLE IF NOT EXISTS "experiences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" uuid,
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
CREATE TABLE IF NOT EXISTS "fairness_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"release_version" text NOT NULL,
	"report_markdown" text NOT NULL,
	"metrics_json" jsonb NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "feature_flags" (
	"key" text PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"audience" jsonb
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
CREATE TABLE IF NOT EXISTS "impact_stories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" uuid,
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
CREATE TABLE IF NOT EXISTS "individual_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"headline" text,
	"bio" text,
	"skills" text[],
	"location" text,
	"visibility" text DEFAULT 'network',
	"tagline" text,
	"mission" text,
	"vision" text,
	"cover_image_url" text,
	"verified" boolean DEFAULT false,
	"joined_date" timestamp DEFAULT now(),
	"values" jsonb,
	"causes" text[],
	"verification_method" text,
	"verification_status" text DEFAULT 'unverified',
	"veriff_session_id" text,
	"verified_at" timestamp,
	"work_email" text,
	"work_email_verified" boolean DEFAULT false,
	"work_email_org_id" uuid,
	"work_email_token" text,
	"work_email_token_expires" timestamp,
	"field_visibility" jsonb,
	"redact_mode" boolean DEFAULT false,
	"linkedin_profile_url" text,
	"linkedin_verification_data" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "interviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"scheduled_at" timestamp NOT NULL,
	"duration" integer DEFAULT 30 NOT NULL,
	"platform" text NOT NULL,
	"meeting_id" text NOT NULL,
	"meeting_url" text NOT NULL,
	"timezone" text DEFAULT 'UTC',
	"status" text DEFAULT 'scheduled' NOT NULL,
	"decision" text,
	"decided_by" uuid,
	"decided_at" timestamp,
	"feedback" text,
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
CREATE TABLE IF NOT EXISTS "match_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"suggestion_type" text NOT NULL,
	"description" text NOT NULL,
	"estimated_impact" numeric NOT NULL,
	"action_url" text,
	"is_dismissed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignment_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"score" numeric NOT NULL,
	"vector" jsonb NOT NULL,
	"weights" jsonb NOT NULL,
	"snoozed_until" timestamp,
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
	"needs_sponsorship" boolean DEFAULT false,
	"wishes_sponsorship" boolean DEFAULT false,
	"work_authorization" jsonb,
	"relocation_willing" boolean DEFAULT false,
	"relocation_countries" text[],
	"availability_bitmap" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"content" text NOT NULL,
	"contains_email" boolean DEFAULT false,
	"contains_phone" boolean DEFAULT false,
	"contains_url" boolean DEFAULT false,
	"pii_warning_shown" boolean DEFAULT false,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"read_at" timestamp,
	"edited_at" timestamp,
	"status" text DEFAULT 'sent'
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
CREATE TABLE IF NOT EXISTS "moderation_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"moderator_id" uuid NOT NULL,
	"action_type" text NOT NULL,
	"reason" text NOT NULL,
	"is_appealable" boolean DEFAULT true NOT NULL,
	"appeal_deadline" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
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
CREATE TABLE IF NOT EXISTS "org_verification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"verification_type" text NOT NULL,
	"domain" text,
	"registry_number" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"verified_by" uuid,
	"verified_at" timestamp,
	"expires_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organization_certifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"certification_type" text NOT NULL,
	"name" text NOT NULL,
	"issuer" text NOT NULL,
	"issued_date" date,
	"expiry_date" date,
	"credential_id" text,
	"credential_url" text,
	"is_verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE IF NOT EXISTS "organization_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"goal_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"target_date" date,
	"current_progress" numeric(5, 2),
	"metrics" text,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
CREATE TABLE IF NOT EXISTS "organization_ownership" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"entity_name" text NOT NULL,
	"ownership_percentage" numeric(5, 2),
	"control_type" text NOT NULL,
	"description" text,
	"is_public" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organization_partnerships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"partner_name" text NOT NULL,
	"partner_type" text,
	"partnership_scope" text NOT NULL,
	"impact_created" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"status" text DEFAULT 'active' NOT NULL,
	"is_verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organization_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"impact_created" text NOT NULL,
	"business_value" text NOT NULL,
	"outcomes" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"status" text DEFAULT 'active' NOT NULL,
	"is_verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organization_statute" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"section_title" text NOT NULL,
	"section_content" text NOT NULL,
	"section_order" integer DEFAULT 0 NOT NULL,
	"is_public" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organization_structure" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"team_size" integer,
	"focus_area" text,
	"parent_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"legal_name" text,
	"display_name" text NOT NULL,
	"type" text,
	"logo_url" text,
	"cover_image_url" text,
	"tagline" text,
	"mission" text,
	"vision" text,
	"website" text,
	"industry" text,
	"organization_size" text,
	"impact_area" text,
	"legal_form" text,
	"founded_date" date,
	"registration_country" text,
	"registration_region" text,
	"organization_number" text,
	"locations" text[],
	"values" jsonb,
	"causes" text[],
	"work_culture" jsonb,
	"impact_entries" jsonb DEFAULT '[]'::jsonb,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
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
CREATE TABLE IF NOT EXISTS "profile_benefits_prefs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"benefit_code" text NOT NULL,
	"importance" text DEFAULT 'nice_to_have' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profile_benefits_prefs_profile_id_benefit_code_unique" UNIQUE("profile_id","benefit_code")
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
CREATE TABLE IF NOT EXISTS "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"handle" text,
	"display_name" text,
	"avatar_url" text,
	"locale" text DEFAULT 'en',
	"persona" text DEFAULT 'unknown',
	"platform_role" text,
	"tour_completed" boolean DEFAULT false,
	"deletion_requested_at" timestamp,
	"deletion_scheduled_for" timestamp,
	"deletion_reason" text,
	"deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_handle_unique" UNIQUE("handle")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "project_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"skill_code" text NOT NULL,
	"proficiency_level" integer NOT NULL,
	"usage_frequency" text,
	"hours_used" integer,
	"evidence_refs" text[],
	"achievements" text,
	"outcome_contribution" numeric,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "project_skills_project_id_skill_code_unique" UNIQUE("project_id","skill_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"project_type" text NOT NULL,
	"status" text DEFAULT 'ongoing' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"organization_name" text,
	"organization_id" uuid,
	"role_title" text,
	"outcomes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"impact_summary" text,
	"verified" boolean DEFAULT false NOT NULL,
	"verification_source" text,
	"verified_at" timestamp,
	"verified_by" uuid,
	"artifacts" jsonb DEFAULT '[]'::jsonb,
	"visibility" text DEFAULT 'public' NOT NULL,
	"tags" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "purpose_edit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"field_name" text NOT NULL,
	"old_value" text,
	"new_value" text,
	"changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rate_limits" (
	"id" text PRIMARY KEY NOT NULL,
	"attempts" bigserial NOT NULL,
	"reset_at" timestamp NOT NULL
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
CREATE TABLE IF NOT EXISTS "skill_adjacency" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_code" text NOT NULL,
	"to_code" text NOT NULL,
	"relationship_type" text NOT NULL,
	"distance" integer NOT NULL,
	"strength" numeric DEFAULT '1.0',
	"source" text DEFAULT 'auto' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
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
CREATE TABLE IF NOT EXISTS "skill_proofs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"skill_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"proof_type" text DEFAULT 'link' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"url" text,
	"file_path" text,
	"issued_date" date,
	"verified" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "skill_verification_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"skill_id" uuid NOT NULL,
	"requester_profile_id" uuid NOT NULL,
	"verifier_email" text NOT NULL,
	"verifier_profile_id" uuid,
	"verifier_source" text NOT NULL,
	"message" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"responded_at" timestamp,
	"response_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp DEFAULT NOW() + INTERVAL '30 days'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"skill_id" text NOT NULL,
	"skill_code" text,
	"level" integer NOT NULL,
	"competency_label" text,
	"months_experience" integer DEFAULT 0 NOT NULL,
	"evidence_strength" numeric DEFAULT '0',
	"recency_multiplier" numeric DEFAULT '1.0',
	"impact_score" numeric DEFAULT '0',
	"last_used_at" timestamp,
	"relevance" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "skills_profile_id_skill_id_unique" UNIQUE("profile_id","skill_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "skills_categories" (
	"cat_id" integer PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name_i18n" jsonb NOT NULL,
	"description_i18n" jsonb,
	"icon" text,
	"display_order" integer NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "skills_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "skills_l3" (
	"l3_id" integer NOT NULL,
	"subcat_id" integer NOT NULL,
	"cat_id" integer NOT NULL,
	"slug" text NOT NULL,
	"name_i18n" jsonb NOT NULL,
	"description_i18n" jsonb,
	"display_order" integer NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "skills_l3_cat_id_subcat_id_l3_id_pk" PRIMARY KEY("cat_id","subcat_id","l3_id"),
	CONSTRAINT "skills_l3_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "skills_subcategories" (
	"subcat_id" integer NOT NULL,
	"cat_id" integer NOT NULL,
	"slug" text NOT NULL,
	"name_i18n" jsonb NOT NULL,
	"description_i18n" jsonb,
	"display_order" integer NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "skills_subcategories_cat_id_subcat_id_pk" PRIMARY KEY("cat_id","subcat_id"),
	CONSTRAINT "skills_subcategories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "skills_taxonomy" (
	"code" text PRIMARY KEY NOT NULL,
	"cat_id" integer NOT NULL,
	"subcat_id" integer NOT NULL,
	"l3_id" integer NOT NULL,
	"skill_id" integer NOT NULL,
	"slug" text NOT NULL,
	"name_i18n" jsonb NOT NULL,
	"aliases_i18n" jsonb DEFAULT '[]'::jsonb,
	"description_i18n" jsonb,
	"tags" text[],
	"embedding" vector(768),
	"status" text DEFAULT 'active' NOT NULL,
	"merged_into" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "skills_taxonomy_slug_unique" UNIQUE("slug")
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
CREATE TABLE IF NOT EXISTS "sus_survey_prompts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"trigger" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"scheduled_at" timestamp DEFAULT now() NOT NULL,
	"shown_at" timestamp,
	"actioned_at" timestamp,
	"survey_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sus_surveys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"trigger" text NOT NULL,
	"q1" integer NOT NULL,
	"q2" integer NOT NULL,
	"q3" integer NOT NULL,
	"q4" integer NOT NULL,
	"q5" integer NOT NULL,
	"q6" integer NOT NULL,
	"q7" integer NOT NULL,
	"q8" integer NOT NULL,
	"q9" integer NOT NULL,
	"q10" integer NOT NULL,
	"score" numeric(5, 2) NOT NULL,
	"grade" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"consent_type" text NOT NULL,
	"consented" boolean NOT NULL,
	"consented_at" timestamp DEFAULT now() NOT NULL,
	"ip_hash" text,
	"user_agent_hash" text,
	"version" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"token_expiry" timestamp NOT NULL,
	"scope" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_integrations_user_id_provider_unique" UNIQUE("user_id","provider")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_violations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"report_id" uuid NOT NULL,
	"violation_type" text NOT NULL,
	"severity" text NOT NULL,
	"action_taken" text NOT NULL,
	"suspension_expires_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verification_appeals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"context" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewer_id" uuid,
	"review_notes" text,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verification_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"verifier_email" text NOT NULL,
	"verifier_name" text NOT NULL,
	"verifier_relationship" text,
	"claim_type" text NOT NULL,
	"claim_data" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"one_time_use" boolean DEFAULT true,
	"used_at" timestamp,
	"status" text DEFAULT 'pending',
	"response_note" text,
	"responded_at" timestamp,
	"visibility" text DEFAULT 'private',
	"show_verifier_name" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"badge_id" uuid,
	CONSTRAINT "verification_requests_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verification_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"response_type" text NOT NULL,
	"reason" text,
	"verifier_seniority" integer,
	"notes" text,
	"ip_address" text,
	"user_agent" text,
	"responded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "volunteering" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" uuid,
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
CREATE TABLE IF NOT EXISTS "wellbeing_checkins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"stress_level" integer NOT NULL,
	"control_level" integer NOT NULL,
	"milestone_trigger_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wellbeing_opt_ins" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"opted_in" boolean DEFAULT false NOT NULL,
	"privacy_banner_acknowledged" boolean DEFAULT false,
	"opted_in_at" timestamp,
	"opted_out_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wellbeing_reflections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"reflection_text" text NOT NULL,
	"milestone_type" text,
	"linked_checkin_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
 ALTER TABLE "active_ties" ADD CONSTRAINT "active_ties_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "active_ties" ADD CONSTRAINT "active_ties_related_user_id_profiles_id_fk" FOREIGN KEY ("related_user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "active_ties" ADD CONSTRAINT "active_ties_related_org_id_organizations_id_fk" FOREIGN KEY ("related_org_id") REFERENCES "organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
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
 ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "assignment_benefits_offered" ADD CONSTRAINT "assignment_benefits_offered_assignment_id_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "assignment_creation_pipeline" ADD CONSTRAINT "assignment_creation_pipeline_assignment_id_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "assignment_creation_pipeline" ADD CONSTRAINT "assignment_creation_pipeline_completed_by_profiles_id_fk" FOREIGN KEY ("completed_by") REFERENCES "profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "assignment_expertise_matrix" ADD CONSTRAINT "assignment_expertise_matrix_assignment_id_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "assignment_expertise_matrix" ADD CONSTRAINT "assignment_expertise_matrix_linked_outcome_id_assignment_outcomes_id_fk" FOREIGN KEY ("linked_outcome_id") REFERENCES "assignment_outcomes"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "assignment_field_visibility" ADD CONSTRAINT "assignment_field_visibility_assignment_id_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
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
 ALTER TABLE "assignment_outcomes" ADD CONSTRAINT "assignment_outcomes_assignment_id_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "assignment_outcomes" ADD CONSTRAINT "assignment_outcomes_depends_on_fkey" FOREIGN KEY ("depends_on") REFERENCES "assignment_outcomes"("id") ON DELETE set null ON UPDATE no action;
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
 ALTER TABLE "assignments" ADD CONSTRAINT "assignments_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_blocker_id_profiles_id_fk" FOREIGN KEY ("blocker_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_blocked_id_profiles_id_fk" FOREIGN KEY ("blocked_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
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
 ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reporter_id_profiles_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_content_owner_id_profiles_id_fk" FOREIGN KEY ("content_owner_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reviewed_by_profiles_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "profiles"("id") ON DELETE no action ON UPDATE no action;
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
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversations" ADD CONSTRAINT "conversations_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversations" ADD CONSTRAINT "conversations_participant_one_id_profiles_id_fk" FOREIGN KEY ("participant_one_id") REFERENCES "profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversations" ADD CONSTRAINT "conversations_participant_two_id_profiles_id_fk" FOREIGN KEY ("participant_two_id") REFERENCES "profiles"("id") ON DELETE no action ON UPDATE no action;
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
 ALTER TABLE "editorial_matches" ADD CONSTRAINT "editorial_matches_assignment_id_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "editorial_matches" ADD CONSTRAINT "editorial_matches_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "editorial_matches" ADD CONSTRAINT "editorial_matches_curator_id_profiles_id_fk" FOREIGN KEY ("curator_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "education" ADD CONSTRAINT "education_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "education" ADD CONSTRAINT "education_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE set null ON UPDATE no action;
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
 ALTER TABLE "experiences" ADD CONSTRAINT "experiences_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "experiences" ADD CONSTRAINT "experiences_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE set null ON UPDATE no action;
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
 ALTER TABLE "fairness_notes" ADD CONSTRAINT "fairness_notes_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE no action ON UPDATE no action;
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
 ALTER TABLE "impact_stories" ADD CONSTRAINT "impact_stories_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "impact_stories" ADD CONSTRAINT "impact_stories_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "individual_profiles" ADD CONSTRAINT "individual_profiles_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "individual_profiles" ADD CONSTRAINT "individual_profiles_work_email_org_id_organizations_id_fk" FOREIGN KEY ("work_email_org_id") REFERENCES "organizations"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "interviews" ADD CONSTRAINT "interviews_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "interviews" ADD CONSTRAINT "interviews_decided_by_profiles_id_fk" FOREIGN KEY ("decided_by") REFERENCES "profiles"("id") ON DELETE no action ON UPDATE no action;
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
 ALTER TABLE "match_suggestions" ADD CONSTRAINT "match_suggestions_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "match_suggestions" ADD CONSTRAINT "match_suggestions_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
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
 ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_profiles_id_fk" FOREIGN KEY ("sender_id") REFERENCES "profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_report_id_content_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "content_reports"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_moderator_id_profiles_id_fk" FOREIGN KEY ("moderator_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
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
 ALTER TABLE "org_verification" ADD CONSTRAINT "org_verification_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "org_verification" ADD CONSTRAINT "org_verification_verified_by_profiles_id_fk" FOREIGN KEY ("verified_by") REFERENCES "profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_certifications" ADD CONSTRAINT "organization_certifications_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_field_visibility" ADD CONSTRAINT "organization_field_visibility_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_goals" ADD CONSTRAINT "organization_goals_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE cascade ON UPDATE no action;
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
 ALTER TABLE "organization_ownership" ADD CONSTRAINT "organization_ownership_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_partnerships" ADD CONSTRAINT "organization_partnerships_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_projects" ADD CONSTRAINT "organization_projects_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_statute" ADD CONSTRAINT "organization_statute_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_structure" ADD CONSTRAINT "organization_structure_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organizations" ADD CONSTRAINT "organizations_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE no action ON UPDATE no action;
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
 ALTER TABLE "profile_benefits_prefs" ADD CONSTRAINT "profile_benefits_prefs_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
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
 ALTER TABLE "project_skills" ADD CONSTRAINT "project_skills_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "projects" ADD CONSTRAINT "projects_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "projects" ADD CONSTRAINT "projects_verified_by_profiles_id_fk" FOREIGN KEY ("verified_by") REFERENCES "profiles"("id") ON DELETE no action ON UPDATE no action;
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
 ALTER TABLE "self_assessments" ADD CONSTRAINT "self_assessments_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
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
 ALTER TABLE "skill_proofs" ADD CONSTRAINT "skill_proofs_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "skill_proofs" ADD CONSTRAINT "skill_proofs_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "skill_verification_requests" ADD CONSTRAINT "skill_verification_requests_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "skill_verification_requests" ADD CONSTRAINT "skill_verification_requests_requester_profile_id_profiles_id_fk" FOREIGN KEY ("requester_profile_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "skill_verification_requests" ADD CONSTRAINT "skill_verification_requests_verifier_profile_id_profiles_id_fk" FOREIGN KEY ("verifier_profile_id") REFERENCES "profiles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "skills" ADD CONSTRAINT "skills_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "skills" ADD CONSTRAINT "skills_skill_code_skills_taxonomy_code_fk" FOREIGN KEY ("skill_code") REFERENCES "skills_taxonomy"("code") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "skills_l3" ADD CONSTRAINT "skills_l3_cat_id_subcat_id_skills_subcategories_cat_id_subcat_id_fk" FOREIGN KEY ("cat_id","subcat_id") REFERENCES "skills_subcategories"("cat_id","subcat_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "skills_subcategories" ADD CONSTRAINT "skills_subcategories_cat_id_skills_categories_cat_id_fk" FOREIGN KEY ("cat_id") REFERENCES "skills_categories"("cat_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "skills_taxonomy" ADD CONSTRAINT "skills_taxonomy_cat_id_subcat_id_l3_id_skills_l3_cat_id_subcat_id_l3_id_fk" FOREIGN KEY ("cat_id","subcat_id","l3_id") REFERENCES "skills_l3"("cat_id","subcat_id","l3_id") ON DELETE no action ON UPDATE no action;
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
 ALTER TABLE "sus_survey_prompts" ADD CONSTRAINT "sus_survey_prompts_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sus_survey_prompts" ADD CONSTRAINT "sus_survey_prompts_survey_id_sus_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "sus_surveys"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sus_surveys" ADD CONSTRAINT "sus_surveys_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_consents" ADD CONSTRAINT "user_consents_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_integrations" ADD CONSTRAINT "user_integrations_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_violations" ADD CONSTRAINT "user_violations_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_violations" ADD CONSTRAINT "user_violations_report_id_content_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "content_reports"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "verification_appeals" ADD CONSTRAINT "verification_appeals_request_id_verification_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "verification_requests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "verification_appeals" ADD CONSTRAINT "verification_appeals_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "verification_appeals" ADD CONSTRAINT "verification_appeals_reviewer_id_profiles_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "verification_responses" ADD CONSTRAINT "verification_responses_request_id_verification_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "verification_requests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "volunteering" ADD CONSTRAINT "volunteering_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "volunteering" ADD CONSTRAINT "volunteering_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wellbeing_checkins" ADD CONSTRAINT "wellbeing_checkins_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wellbeing_opt_ins" ADD CONSTRAINT "wellbeing_opt_ins_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wellbeing_reflections" ADD CONSTRAINT "wellbeing_reflections_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wellbeing_reflections" ADD CONSTRAINT "wellbeing_reflections_linked_checkin_id_wellbeing_checkins_id_fk" FOREIGN KEY ("linked_checkin_id") REFERENCES "wellbeing_checkins"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "work_schedules" ADD CONSTRAINT "work_schedules_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
