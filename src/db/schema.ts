import {
  pgTable,
  text,
  uuid,
  timestamp,
  boolean,
  jsonb,
  bigserial,
  primaryKey,
  integer,
  numeric,
  date,
  check,
  unique,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Profiles table - extends Supabase auth.users
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(), // references auth.users(id)
  handle: text('handle').unique(),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  locale: text('locale').default('en'),
  persona: text('persona', {
    enum: ['individual', 'org_member', 'unknown'],
  }).default('unknown'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Individual profiles
export const individualProfiles = pgTable('individual_profiles', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  headline: text('headline'),
  bio: text('bio'),
  skills: text('skills').array(),
  location: text('location'),
  visibility: text('visibility', {
    enum: ['public', 'network', 'private'],
  }).default('network'),
  // New Proofound profile fields
  tagline: text('tagline'),
  mission: text('mission'),
  coverImageUrl: text('cover_image_url'),
  verified: boolean('verified').default(false),
  joinedDate: timestamp('joined_date').defaultNow(),
  values: jsonb('values'), // Array of {icon: string, label: string, verified: boolean}
  causes: text('causes').array(),
});

// Impact Stories - verified projects with real outcomes
export const impactStories = pgTable('impact_stories', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  orgDescription: text('org_description').notNull(), // e.g., "Mid-size nonprofit, Climate sector, Bay Area"
  impact: text('impact').notNull(), // What changed
  businessValue: text('business_value').notNull(), // Broader impact
  outcomes: text('outcomes').notNull(), // Measurable results
  timeline: text('timeline').notNull(),
  verified: boolean('verified').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Experiences - work experience focused on growth and learning
export const experiences = pgTable('experiences', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(), // "Leading systemic change" not "Director"
  orgDescription: text('org_description').notNull(), // Size, industry, location
  duration: text('duration').notNull(),
  learning: text('learning').notNull(), // What they learned
  growth: text('growth').notNull(), // How they grew
  verified: boolean('verified').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Education - focused on skills and meaningful projects
export const education = pgTable('education', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  institution: text('institution').notNull(),
  degree: text('degree').notNull(),
  duration: text('duration').notNull(),
  skills: text('skills').notNull(), // Skills gained
  projects: text('projects').notNull(), // Meaningful projects
  verified: boolean('verified').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Volunteering - service work with personal connection
export const volunteering = pgTable('volunteering', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  orgDescription: text('org_description').notNull(),
  duration: text('duration').notNull(),
  cause: text('cause').notNull(), // e.g., "Climate Justice - Amplifying youth voices"
  impact: text('impact').notNull(), // What changed
  skillsDeployed: text('skills_deployed').notNull(), // Skills used
  personalWhy: text('personal_why').notNull(), // Personal connection to cause
  verified: boolean('verified').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Organizations
export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').unique().notNull(),
  legalName: text('legal_name'),
  displayName: text('display_name').notNull(),
  type: text('type', {
    enum: ['company', 'ngo', 'government', 'network', 'other'],
  }),
  logoUrl: text('logo_url'),
  mission: text('mission'),
  website: text('website'),
  createdBy: uuid('created_by').references(() => profiles.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Organization members
export const organizationMembers = pgTable(
  'organization_members',
  {
    orgId: uuid('org_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),
    role: text('role', {
      enum: ['owner', 'admin', 'member', 'viewer'],
    }).notNull(),
    status: text('status', {
      enum: ['active', 'invited', 'suspended'],
    }).default('active'),
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.orgId, table.userId] }),
  })
);

// Organization invitations
export const orgInvitations = pgTable('org_invitations', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id')
    .references(() => organizations.id, { onDelete: 'cascade' })
    .notNull(),
  email: text('email').notNull(),
  role: text('role', {
    enum: ['admin', 'member', 'viewer'],
  }).notNull(),
  token: text('token').unique().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  invitedBy: uuid('invited_by').references(() => profiles.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Audit logs
export const auditLogs = pgTable('audit_logs', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  actorId: uuid('actor_id'), // nullable for system actions
  orgId: uuid('org_id'), // nullable for non-org actions
  action: text('action').notNull(),
  targetType: text('target_type'),
  targetId: text('target_id'),
  meta: jsonb('meta'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Feature flags
export const featureFlags = pgTable('feature_flags', {
  key: text('key').primaryKey(),
  enabled: boolean('enabled').default(false).notNull(),
  audience: jsonb('audience'), // rules for targeting
});

// Rate limiter table for tracking rate limits
export const rateLimits = pgTable('rate_limits', {
  id: text('id').primaryKey(), // composite of IP + route
  attempts: bigserial('attempts', { mode: 'number' }).notNull(),
  resetAt: timestamp('reset_at').notNull(),
});

// ============================================================================
// MATCHING SYSTEM TABLES
// ============================================================================

// Matching profiles - 1:1 with profiles, stores matching preferences
export const matchingProfiles = pgTable('matching_profiles', {
  profileId: uuid('profile_id')
    .primaryKey()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  valuesTags: text('values_tags')
    .array()
    .default(sql`'{}'::text[]`),
  causeTags: text('cause_tags')
    .array()
    .default(sql`'{}'::text[]`),
  timezone: text('timezone'),
  languages: jsonb('languages').default(sql`'[]'::jsonb`), // [{code: 'en', level: 'C1'}]
  verified: jsonb('verified').default(sql`'{}'::jsonb`), // {id: true, education: false, ...}
  rightToWork: text('right_to_work'), // 'yes' | 'no' | 'conditional'
  country: text('country'),
  city: text('city'),
  availabilityEarliest: date('availability_earliest'),
  availabilityLatest: date('availability_latest'),
  workMode: text('work_mode'), // 'remote' | 'onsite' | 'hybrid'
  radiusKm: integer('radius_km'),
  hoursMin: integer('hours_min'),
  hoursMax: integer('hours_max'),
  compMin: integer('comp_min'),
  compMax: integer('comp_max'),
  currency: text('currency').default('USD'),
  weights: jsonb('weights'), // User's preferred weights
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Skills - many-to-one with profiles
export const skills = pgTable(
  'skills',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    profileId: uuid('profile_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),
    skillId: text('skill_id').notNull(), // Key from taxonomy
    level: integer('level').notNull(), // 0-5
    monthsExperience: integer('months_experience').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    profileSkillUnique: unique().on(table.profileId, table.skillId),
    levelCheck: check('level_check', sql`${table.level} BETWEEN 0 AND 5`),
    monthsCheck: check('months_check', sql`${table.monthsExperience} >= 0`),
  })
);

// Assignments - job/project postings from organizations
export const assignments = pgTable('assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id')
    .references(() => organizations.id, { onDelete: 'cascade' })
    .notNull(),
  role: text('role').notNull(),
  description: text('description'),
  status: text('status', {
    enum: ['draft', 'active', 'paused', 'closed'],
  })
    .default('draft')
    .notNull(),
  valuesRequired: text('values_required')
    .array()
    .default(sql`'{}'::text[]`),
  causeTags: text('cause_tags')
    .array()
    .default(sql`'{}'::text[]`),
  mustHaveSkills: jsonb('must_have_skills').default(sql`'[]'::jsonb`), // [{id: 'typescript', level: 4}]
  niceToHaveSkills: jsonb('nice_to_have_skills').default(sql`'[]'::jsonb`),
  minLanguage: jsonb('min_language'), // {code: 'en', level: 'B2'}
  locationMode: text('location_mode'), // 'remote' | 'onsite' | 'hybrid'
  radiusKm: integer('radius_km'),
  country: text('country'),
  city: text('city'),
  compMin: integer('comp_min'),
  compMax: integer('comp_max'),
  currency: text('currency').default('USD'),
  hoursMin: integer('hours_min'),
  hoursMax: integer('hours_max'),
  startEarliest: date('start_earliest'),
  startLatest: date('start_latest'),
  verificationGates: text('verification_gates')
    .array()
    .default(sql`'{}'::text[]`),
  weights: jsonb('weights'), // Assignment-specific weights
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Matches - cached match results
export const matches = pgTable(
  'matches',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    assignmentId: uuid('assignment_id')
      .references(() => assignments.id, { onDelete: 'cascade' })
      .notNull(),
    profileId: uuid('profile_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),
    score: numeric('score').notNull(),
    vector: jsonb('vector').notNull(), // Subscores + details
    weights: jsonb('weights').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    assignmentProfileUnique: unique().on(table.assignmentId, table.profileId),
  })
);

// Match interest - tracks "Interested" actions for mutual reveal
export const matchInterest = pgTable(
  'match_interest',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    actorProfileId: uuid('actor_profile_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),
    assignmentId: uuid('assignment_id')
      .references(() => assignments.id, { onDelete: 'cascade' })
      .notNull(),
    targetProfileId: uuid('target_profile_id').references(() => profiles.id, {
      onDelete: 'cascade',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    actorAssignmentTargetUnique: unique().on(
      table.actorProfileId,
      table.assignmentId,
      table.targetProfileId
    ),
  })
);

// ============================================================================
// EXPERTISE SYSTEM TABLES
// ============================================================================

// Capabilities - skill wrappers with privacy/verification
export const capabilities = pgTable('capabilities', {
  id: uuid('id').defaultRandom().primaryKey(),
  profileId: uuid('profile_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  skillRecordId: uuid('skill_record_id').references(() => skills.id, { onDelete: 'cascade' }),
  privacyLevel: text('privacy_level', {
    enum: ['only_me', 'team', 'organization', 'public'],
  })
    .default('team')
    .notNull(),
  verificationStatus: text('verification_status', {
    enum: ['unverified', 'pending', 'verified', 'rejected'],
  })
    .default('unverified')
    .notNull(),
  verificationSource: text('verification_source'),
  summary: text('summary'),
  highlights: text('highlights')
    .array()
    .default(sql`'{}'::text[]`),
  metadata: jsonb('metadata').default(sql`'{}'::jsonb`),
  evidenceCount: integer('evidence_count').default(0).notNull(),
  lastValidatedAt: timestamp('last_validated_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Evidence - proofs for capabilities
export const evidence = pgTable('evidence', {
  id: uuid('id').defaultRandom().primaryKey(),
  capabilityId: uuid('capability_id')
    .references(() => capabilities.id, { onDelete: 'cascade' })
    .notNull(),
  profileId: uuid('profile_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  description: text('description'),
  evidenceType: text('evidence_type', {
    enum: ['document', 'link', 'assessment', 'peer_review', 'credential'],
  })
    .default('document')
    .notNull(),
  url: text('url'),
  filePath: text('file_path'),
  issuedAt: timestamp('issued_at'),
  verified: boolean('verified').default(false).notNull(),
  metadata: jsonb('metadata').default(sql`'{}'::jsonb`),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Skill endorsements - peer validation
export const skillEndorsements = pgTable('skill_endorsements', {
  id: uuid('id').defaultRandom().primaryKey(),
  capabilityId: uuid('capability_id')
    .references(() => capabilities.id, { onDelete: 'cascade' })
    .notNull(),
  endorserProfileId: uuid('endorser_profile_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  ownerProfileId: uuid('owner_profile_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  message: text('message'),
  status: text('status', {
    enum: ['pending', 'accepted', 'declined', 'revoked'],
  })
    .default('pending')
    .notNull(),
  visibility: text('visibility', {
    enum: ['private', 'owner_only', 'shared', 'public'],
  })
    .default('owner_only')
    .notNull(),
  respondedAt: timestamp('responded_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Growth plans - development goals
export const growthPlans = pgTable('growth_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  profileId: uuid('profile_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  capabilityId: uuid('capability_id').references(() => capabilities.id, {
    onDelete: 'cascade',
  }),
  title: text('title').notNull(),
  goal: text('goal'),
  targetLevel: integer('target_level'),
  targetDate: date('target_date'),
  status: text('status', {
    enum: ['planned', 'in_progress', 'blocked', 'completed', 'archived'],
  })
    .default('planned')
    .notNull(),
  milestones: jsonb('milestones').default(sql`'[]'::jsonb`),
  supportNeeds: text('support_needs'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Type exports
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = typeof profiles.$inferInsert;
export type IndividualProfile = typeof individualProfiles.$inferSelect;
export type InsertIndividualProfile = typeof individualProfiles.$inferInsert;
export type ImpactStory = typeof impactStories.$inferSelect;
export type InsertImpactStory = typeof impactStories.$inferInsert;
export type Experience = typeof experiences.$inferSelect;
export type InsertExperience = typeof experiences.$inferInsert;
export type Education = typeof education.$inferSelect;
export type InsertEducation = typeof education.$inferInsert;
export type Volunteering = typeof volunteering.$inferSelect;
export type InsertVolunteering = typeof volunteering.$inferInsert;
export type Organization = typeof organizations.$inferSelect;
export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type OrgInvitation = typeof orgInvitations.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type FeatureFlag = typeof featureFlags.$inferSelect;

// Matching system types
export type MatchingProfile = typeof matchingProfiles.$inferSelect;
export type InsertMatchingProfile = typeof matchingProfiles.$inferInsert;
export type Skill = typeof skills.$inferSelect;
export type InsertSkill = typeof skills.$inferInsert;
export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = typeof assignments.$inferInsert;
export type Match = typeof matches.$inferSelect;
export type InsertMatch = typeof matches.$inferInsert;
export type MatchInterest = typeof matchInterest.$inferSelect;
export type InsertMatchInterest = typeof matchInterest.$inferInsert;

// Expertise system types
export type Capability = typeof capabilities.$inferSelect;
export type InsertCapability = typeof capabilities.$inferInsert;
export type Evidence = typeof evidence.$inferSelect;
export type InsertEvidence = typeof evidence.$inferInsert;
export type SkillEndorsement = typeof skillEndorsements.$inferSelect;
export type InsertSkillEndorsement = typeof skillEndorsements.$inferInsert;
export type GrowthPlan = typeof growthPlans.$inferSelect;
export type InsertGrowthPlan = typeof growthPlans.$inferInsert;
