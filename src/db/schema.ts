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
  customType,
  foreignKey,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Custom types for PostgreSQL-specific data types
const bit = customType<{ data: string; notNull?: boolean; default?: boolean }>({
  dataType(config) {
    const dimensions = (config as { dimensions?: number } | undefined)?.dimensions;
    return dimensions ? `bit(${dimensions})` : 'bit';
  },
});

const vector = customType<{ data: number[]; notNull?: boolean; default?: boolean }>({
  dataType(config) {
    const dimensions = (config as { dimensions?: number } | undefined)?.dimensions;
    return dimensions ? `vector(${dimensions})` : 'vector';
  },
});

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
  // Platform admin role (tiered authorization)
  platformRole: text('platform_role', {
    enum: ['platform_admin', 'super_admin'],
  }),
  // User preferences and onboarding
  tourCompleted: boolean('tour_completed').default(false),
  // GDPR Account Deletion Support (Article 17: Right to Erasure)
  deletionRequestedAt: timestamp('deletion_requested_at'),
  deletionScheduledFor: timestamp('deletion_scheduled_for'),
  deletionReason: text('deletion_reason'),
  deleted: boolean('deleted').default(false),
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
  vision: text('vision'),
  coverImageUrl: text('cover_image_url'),
  verified: boolean('verified').default(false),
  joinedDate: timestamp('joined_date').defaultNow(),
  values: jsonb('values'), // Array of {icon: string, label: string, verified: boolean}
  causes: text('causes').array(),
  // Identity verification fields
  verificationMethod: text('verification_method', {
    enum: ['veriff', 'work_email', 'linkedin'],
  }),
  verificationStatus: text('verification_status', {
    enum: ['unverified', 'pending', 'verified', 'failed'],
  }).default('unverified'),
  veriffSessionId: text('veriff_session_id'),
  verifiedAt: timestamp('verified_at'),
  workEmail: text('work_email'),
  workEmailVerified: boolean('work_email_verified').default(false),
  workEmailOrgId: uuid('work_email_org_id').references(() => organizations.id, {
    onDelete: 'set null',
  }),
  workEmailToken: text('work_email_token'),
  workEmailTokenExpires: timestamp('work_email_token_expires'),
  // Field-level visibility controls (PRD: Fine-grained privacy)
  fieldVisibility: jsonb('field_visibility'), // { fieldName: 'public' | 'network' | 'private' | 'hidden' }
  redactMode: boolean('redact_mode').default(false), // Quick-hide sensitive info
  // LinkedIn verification fields
  linkedinProfileUrl: text('linkedin_profile_url'),
  linkedinVerificationData: jsonb('linkedin_verification_data'),
  // Stores: {
  //   hasVerificationBadge: boolean,
  //   automatedCheck: { confidence: number, signals: {...}, checkedAt: timestamp },
  //   thirdPartyData: {...} (optional),
  //   adminReviewed: boolean,
  //   adminNotes: string
  // }
});

// Dashboard layouts - user customizable dashboard tiles (F2 requirement)
export const dashboardLayouts = pgTable(
  'dashboard_layouts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),
    widgetId: text('widget_id').notNull(), // e.g., 'goals', 'tasks', 'matching-results', 'gap-map', 'next-best-actions'
    position: integer('position').notNull(), // display order (0-indexed)
    visible: boolean('visible').default(true).notNull(),
    size: text('size', {
      enum: ['small', 'default', 'large'],
    }).default('default'),
    settings: jsonb('settings').default(sql`'{}'::jsonb`), // widget-specific settings
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    uniqueUserWidget: unique().on(table.userId, table.widgetId),
  })
);

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
  coverImageUrl: text('cover_image_url'),
  tagline: text('tagline'),
  mission: text('mission'),
  vision: text('vision'),
  website: text('website'),
  // Business details
  industry: text('industry'),
  organizationSize: text('organization_size', {
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5001+'],
  }),
  impactArea: text('impact_area'),
  legalForm: text('legal_form', {
    enum: [
      'sole_proprietorship',
      'partnership',
      'llc',
      'corporation',
      'nonprofit',
      'cooperative',
      'benefit_corporation',
      'other',
    ],
  }),
  foundedDate: date('founded_date'),
  registrationCountry: text('registration_country'),
  registrationRegion: text('registration_region'),
  organizationNumber: text('organization_number'),
  locations: text('locations').array(),
  // Culture and values
  values: jsonb('values'), // Array of {icon: string, label: string, description: string}
  causes: text('causes').array(),
  workCulture: jsonb('work_culture'), // {collaboration, decision_making, learning, wellbeing, inclusion}
  // Impact tracking
  impactEntries: jsonb('impact_entries').default(sql`'[]'::jsonb`), // Array of impact entries
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

// Organization ownership structure
export const organizationOwnership = pgTable('organization_ownership', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id')
    .references(() => organizations.id, { onDelete: 'cascade' })
    .notNull(),
  entityType: text('entity_type', {
    enum: ['individual', 'organization', 'collective', 'government'],
  }).notNull(),
  entityName: text('entity_name').notNull(),
  ownershipPercentage: numeric('ownership_percentage', { precision: 5, scale: 2 }),
  controlType: text('control_type', {
    enum: ['voting_rights', 'board_seat', 'veto_power', 'management', 'other'],
  }).notNull(),
  description: text('description'),
  isPublic: boolean('is_public').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Organization certifications and licenses
export const organizationCertifications = pgTable('organization_certifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id')
    .references(() => organizations.id, { onDelete: 'cascade' })
    .notNull(),
  certificationType: text('certification_type', {
    enum: ['license', 'certification', 'accreditation', 'award'],
  }).notNull(),
  name: text('name').notNull(),
  issuer: text('issuer').notNull(),
  issuedDate: date('issued_date'),
  expiryDate: date('expiry_date'),
  credentialId: text('credential_id'),
  credentialUrl: text('credential_url'),
  isVerified: boolean('is_verified').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Organization projects
export const organizationProjects = pgTable('organization_projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id')
    .references(() => organizations.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  impactCreated: text('impact_created').notNull(),
  businessValue: text('business_value').notNull(),
  outcomes: text('outcomes').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  status: text('status', {
    enum: ['planning', 'active', 'completed', 'on_hold', 'cancelled'],
  })
    .default('active')
    .notNull(),
  isVerified: boolean('is_verified').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Organization partnerships
export const organizationPartnerships = pgTable('organization_partnerships', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id')
    .references(() => organizations.id, { onDelete: 'cascade' })
    .notNull(),
  partnerName: text('partner_name').notNull(),
  partnerType: text('partner_type', {
    enum: ['company', 'ngo', 'government', 'academic', 'network', 'other'],
  }),
  partnershipScope: text('partnership_scope').notNull(),
  impactCreated: text('impact_created').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  status: text('status', {
    enum: ['active', 'completed', 'suspended'],
  })
    .default('active')
    .notNull(),
  isVerified: boolean('is_verified').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Organization structure
export const organizationStructure = pgTable('organization_structure', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id')
    .references(() => organizations.id, { onDelete: 'cascade' })
    .notNull(),
  entityType: text('entity_type', {
    enum: ['executive_team', 'department', 'team', 'working_group'],
  }).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  teamSize: integer('team_size'),
  focusArea: text('focus_area'),
  parentId: uuid('parent_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Organization statute
export const organizationStatute = pgTable('organization_statute', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id')
    .references(() => organizations.id, { onDelete: 'cascade' })
    .notNull(),
  sectionTitle: text('section_title').notNull(),
  sectionContent: text('section_content').notNull(),
  sectionOrder: integer('section_order').default(0).notNull(),
  isPublic: boolean('is_public').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Organization goals
export const organizationGoals = pgTable('organization_goals', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id')
    .references(() => organizations.id, { onDelete: 'cascade' })
    .notNull(),
  goalType: text('goal_type', {
    enum: ['sustainability', 'diversity', 'innovation', 'growth', 'impact', 'other'],
  }).notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  targetDate: date('target_date'),
  currentProgress: numeric('current_progress', { precision: 5, scale: 2 }),
  metrics: text('metrics'),
  status: text('status', {
    enum: ['not_started', 'in_progress', 'achieved', 'abandoned'],
  })
    .default('in_progress')
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Organization field visibility - granular privacy controls
export const organizationFieldVisibility = pgTable('organization_field_visibility', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id')
    .references(() => organizations.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  // Visibility levels: public / post_match / post_conversation_start / internal_only
  displayName: text('display_name').default('public').notNull(),
  mission: text('mission').default('public').notNull(),
  vision: text('vision').default('public').notNull(),
  causes: text('causes').default('public').notNull(),
  workCulture: text('work_culture').default('post_match').notNull(),
  structure: text('structure').default('post_match').notNull(),
  projects: text('projects').default('post_match').notNull(),
  partnerships: text('partnerships').default('post_match').notNull(),
  goals: text('goals').default('post_match').notNull(),
  impact: text('impact').default('post_match').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Profile field visibility - granular privacy controls for individual profiles
export const profileFieldVisibility = pgTable('profile_field_visibility', {
  id: uuid('id').defaultRandom().primaryKey(),
  profileId: uuid('profile_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  // Visibility levels: public / network_only / match_only / private
  displayName: text('display_name').default('public').notNull(),
  avatar: text('avatar').default('public').notNull(),
  headline: text('headline').default('public').notNull(),
  location: text('location').default('network_only').notNull(),
  mission: text('mission').default('public').notNull(),
  vision: text('vision').default('public').notNull(),
  values: text('values').default('public').notNull(),
  causes: text('causes').default('public').notNull(),
  experiences: text('experiences').default('network_only').notNull(),
  education: text('education').default('public').notNull(),
  volunteering: text('volunteering').default('public').notNull(),
  skills: text('skills').default('public').notNull(),
  impactStories: text('impact_stories').default('match_only').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
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
  // Work authorization & sponsorship
  needsSponsorship: boolean('needs_sponsorship').default(false),
  wishesSponsorship: boolean('wishes_sponsorship').default(false),
  workAuthorization: jsonb('work_authorization'), // {type: string, countries: string[], expires_at: string, restrictions: string}
  relocationWilling: boolean('relocation_willing').default(false),
  relocationCountries: text('relocation_countries').array(),
  // Availability bitmap (7 days × 48 half-hour slots = 336 bits)
  availabilityBitmap: bit('availability_bitmap', { dimensions: 336 }),
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
    skillId: text('skill_id').notNull(), // Key from taxonomy (legacy)
    skillCode: text('skill_code').references(() => skillsTaxonomy.code, {
      onDelete: 'set null',
    }), // New L4 skill code (references skills_taxonomy)
    level: integer('level').notNull(), // 0-5
    competencyLabel: text('competency_label', {
      enum: ['C1', 'C2', 'C3', 'C4', 'C5'],
    }), // Mapped from level
    monthsExperience: integer('months_experience').notNull().default(0),
    // New computed fields for matching
    evidenceStrength: numeric('evidence_strength').default('0'),
    recencyMultiplier: numeric('recency_multiplier').default('1.0'),
    impactScore: numeric('impact_score').default('0'),
    lastUsedAt: timestamp('last_used_at'),
    relevance: text('relevance', {
      enum: ['obsolete', 'current', 'emerging'],
    }), // Skill currency: obsolete/current/emerging
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    profileSkillUnique: unique().on(table.profileId, table.skillId),
    levelCheck: check('level_check', sql`${table.level} BETWEEN 0 AND 5`),
    monthsCheck: check('months_check', sql`${table.monthsExperience} >= 0`),
    evidenceCheck: check('evidence_check', sql`${table.evidenceStrength} BETWEEN 0 AND 1`),
    recencyCheck: check(
      'recency_check',
      sql`${table.recencyMultiplier} > 0 AND ${table.recencyMultiplier} <= 1`
    ),
    impactCheck: check('impact_check', sql`${table.impactScore} BETWEEN 0 AND 1`),
  })
);

// Skill Proofs - evidence/proofs attached to skills
export const skillProofs = pgTable('skill_proofs', {
  id: uuid('id').defaultRandom().primaryKey(),
  skillId: uuid('skill_id')
    .references(() => skills.id, { onDelete: 'cascade' })
    .notNull(),
  profileId: uuid('profile_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  proofType: text('proof_type', {
    enum: ['project', 'certification', 'media', 'reference', 'link'],
  })
    .notNull()
    .default('link'),
  title: text('title').notNull(),
  description: text('description'),
  url: text('url'),
  filePath: text('file_path'),
  issuedDate: date('issued_date'),
  verified: boolean('verified').default(false).notNull(),
  metadata: jsonb('metadata').default(sql`'{}'::jsonb`),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Skill Verification Requests - peer/manager/external verification requests
export const skillVerificationRequests = pgTable('skill_verification_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  skillId: uuid('skill_id')
    .references(() => skills.id, { onDelete: 'cascade' })
    .notNull(),
  requesterProfileId: uuid('requester_profile_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  verifierEmail: text('verifier_email').notNull(),
  verifierProfileId: uuid('verifier_profile_id').references(() => profiles.id, {
    onDelete: 'set null',
  }),
  verifierSource: text('verifier_source', {
    enum: ['peer', 'manager', 'external'],
  }).notNull(),
  message: text('message'),
  status: text('status', {
    enum: ['pending', 'accepted', 'declined', 'expired'],
  })
    .notNull()
    .default('pending'),
  respondedAt: timestamp('responded_at'),
  responseMessage: text('response_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').default(sql`NOW() + INTERVAL '30 days'`),
});

// Assignment templates - reusable presets for assignment creation
export const assignmentTemplates = pgTable('assignment_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  roleFamily: text('role_family').notNull(),
  summary: text('summary'),
  description: text('description'),
  appliesToSteps: text('applies_to_steps')
    .array()
    .default(sql`'{}'::text[]`)
    .notNull(),
  presetPayload: jsonb('preset_payload')
    .default(sql`'{}'::jsonb`)
    .notNull(),
  isGlobal: boolean('is_global').default(false).notNull(),
  status: text('status', { enum: ['active', 'archived'] })
    .default('active')
    .notNull(),
  createdBy: uuid('created_by').references(() => profiles.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

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
  // Assignment creation workflow fields
  creationStatus: text('creation_status', {
    enum: ['draft', 'pipeline_in_progress', 'pending_review', 'ready_to_publish', 'published'],
  })
    .default('draft')
    .notNull(),
  businessValue: text('business_value'),
  expectedImpact: text('expected_impact'),
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
  // Sponsorship & relocation fields
  canSponsorVisa: boolean('can_sponsor_visa').default(false),
  sponsorshipCountries: text('sponsorship_countries').array(),
  offersRelocationSupport: boolean('offers_relocation_support').default(false),
  relocationPackage: jsonb('relocation_package'),
  // Required availability bitmap
  requiredAvailabilityBitmap: bit('required_availability_bitmap', { dimensions: 336 }),
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
    snoozedUntil: timestamp('snoozed_until'), // When match should reappear (null = not snoozed)
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    assignmentProfileUnique: unique().on(table.assignmentId, table.profileId),
    // Performance indexes
    profileIdIdx: index('matches_profile_id_idx').on(table.profileId),
    assignmentIdIdx: index('matches_assignment_id_idx').on(table.assignmentId),
    scoreIdx: index('matches_score_idx').on(table.score),
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
    // Performance indexes for mutual interest lookups
    actorProfileIdIdx: index('match_interest_actor_profile_id_idx').on(table.actorProfileId),
    assignmentIdIdx: index('match_interest_assignment_id_idx').on(table.assignmentId),
    targetProfileIdIdx: index('match_interest_target_profile_id_idx').on(table.targetProfileId),
  })
);

// ============================================================================
// SKILLS TAXONOMY SYSTEM
// ============================================================================

// Skills categories (L1) - top-level domains
export const skillsCategories = pgTable('skills_categories', {
  catId: integer('cat_id').primaryKey(),
  slug: text('slug').unique().notNull(),
  nameI18n: jsonb('name_i18n').notNull(), // {en: string, ...}
  descriptionI18n: jsonb('description_i18n'),
  icon: text('icon'),
  displayOrder: integer('display_order').notNull(),
  version: integer('version').default(1).notNull(),
  status: text('status', {
    enum: ['active', 'deprecated', 'merged'],
  })
    .default('active')
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Skills subcategories (L2)
export const skillsSubcategories = pgTable(
  'skills_subcategories',
  {
    subcatId: integer('subcat_id').notNull(),
    catId: integer('cat_id')
      .references(() => skillsCategories.catId)
      .notNull(),
    slug: text('slug').unique().notNull(),
    nameI18n: jsonb('name_i18n').notNull(),
    descriptionI18n: jsonb('description_i18n'),
    displayOrder: integer('display_order').notNull(),
    version: integer('version').default(1).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.catId, table.subcatId] }),
  })
);

// Skills L3 categories
export const skillsL3 = pgTable(
  'skills_l3',
  {
    l3Id: integer('l3_id').notNull(),
    subcatId: integer('subcat_id').notNull(),
    catId: integer('cat_id').notNull(),
    slug: text('slug').unique().notNull(),
    nameI18n: jsonb('name_i18n').notNull(),
    descriptionI18n: jsonb('description_i18n'),
    displayOrder: integer('display_order').notNull(),
    version: integer('version').default(1).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.catId, table.subcatId, table.l3Id] }),
    fkSubcat: foreignKey({
      columns: [table.catId, table.subcatId],
      foreignColumns: [skillsSubcategories.catId, skillsSubcategories.subcatId],
    }),
  })
);

// Skills taxonomy (L4) - granular skills
export const skillsTaxonomy = pgTable(
  'skills_taxonomy',
  {
    code: text('code').primaryKey(), // "01.03.01.142"
    catId: integer('cat_id').notNull(),
    subcatId: integer('subcat_id').notNull(),
    l3Id: integer('l3_id').notNull(),
    skillId: integer('skill_id').notNull(),
    slug: text('slug').unique().notNull(),
    nameI18n: jsonb('name_i18n').notNull(),
    aliasesI18n: jsonb('aliases_i18n').default(sql`'[]'::jsonb`),
    descriptionI18n: jsonb('description_i18n'),
    tags: text('tags').array(),
    embedding: vector('embedding', { dimensions: 768 }),
    status: text('status', {
      enum: ['active', 'deprecated', 'merged'],
    })
      .default('active')
      .notNull(),
    mergedInto: text('merged_into'),
    version: integer('version').default(1).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    fkL3: foreignKey({
      columns: [table.catId, table.subcatId, table.l3Id],
      foreignColumns: [skillsL3.catId, skillsL3.subcatId, skillsL3.l3Id],
    }),
  })
);

// Skill adjacency graph
export const skillAdjacency = pgTable('skill_adjacency', {
  id: uuid('id').defaultRandom().primaryKey(),
  fromCode: text('from_code').notNull(),
  toCode: text('to_code').notNull(),
  relationshipType: text('relationship_type', {
    enum: ['sibling', 'parent_child', 'synonym', 'prerequisite', 'related'],
  }).notNull(),
  distance: integer('distance').notNull(),
  strength: numeric('strength').default('1.0'),
  source: text('source', {
    enum: ['auto', 'curated', 'learned'],
  })
    .default('auto')
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// PROJECTS & SKILL LINKAGE
// ============================================================================

// Projects - track ongoing/concluded work for recency calculation
export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  description: text('description'),
  projectType: text('project_type', {
    enum: ['work', 'volunteer', 'education', 'side_project', 'hobby'],
  }).notNull(),
  status: text('status', {
    enum: ['ongoing', 'concluded', 'paused', 'archived'],
  })
    .default('ongoing')
    .notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  organizationName: text('organization_name'),
  organizationId: uuid('organization_id').references(() => organizations.id, {
    onDelete: 'set null',
  }),
  roleTitle: text('role_title'),
  outcomes: jsonb('outcomes')
    .default(sql`'{}'::jsonb`)
    .notNull(), // {metrics: [{name, value, unit}], qualitative: string, impact_score: 0-1}
  impactSummary: text('impact_summary'),
  verified: boolean('verified').default(false).notNull(),
  verificationSource: text('verification_source'),
  verifiedAt: timestamp('verified_at'),
  verifiedBy: uuid('verified_by').references(() => profiles.id),
  artifacts: jsonb('artifacts').default(sql`'[]'::jsonb`), // [{type, url/path, title/name}]
  visibility: text('visibility', {
    enum: ['public', 'network', 'private'],
  })
    .default('public')
    .notNull(),
  tags: text('tags').array(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Impact Stories - verified projects with real outcomes
export const impactStories = pgTable('impact_stories', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
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
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
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
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
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
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
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

// Project-skills linkage
export const projectSkills = pgTable(
  'project_skills',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .references(() => projects.id, { onDelete: 'cascade' })
      .notNull(),
    skillCode: text('skill_code').notNull(), // References skills_taxonomy(code)
    proficiencyLevel: integer('proficiency_level').notNull(),
    usageFrequency: text('usage_frequency', {
      enum: ['daily', 'weekly', 'monthly', 'occasionally'],
    }),
    hoursUsed: integer('hours_used'),
    evidenceRefs: text('evidence_refs').array(),
    achievements: text('achievements'),
    outcomeContribution: numeric('outcome_contribution'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    projectSkillUnique: unique().on(table.projectId, table.skillCode),
    proficiencyCheck: check('proficiency_check', sql`${table.proficiencyLevel} BETWEEN 1 AND 5`),
    contributionCheck: check(
      'contribution_check',
      sql`${table.outcomeContribution} BETWEEN 0 AND 1`
    ),
  })
);

// ============================================================================
// BENEFITS & COMPENSATION
// ============================================================================

// Benefits taxonomy
export const benefitsTaxonomy = pgTable('benefits_taxonomy', {
  code: text('code').primaryKey(),
  nameI18n: jsonb('name_i18n').notNull(),
  category: text('category', {
    enum: [
      'insurance',
      'equity',
      'transport',
      'wellness',
      'learning',
      'time_off',
      'financial',
      'family',
    ],
  }).notNull(),
  descriptionI18n: jsonb('description_i18n'),
  isStandard: boolean('is_standard').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Profile benefits preferences
export const profileBenefitsPrefs = pgTable(
  'profile_benefits_prefs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    profileId: uuid('profile_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),
    benefitCode: text('benefit_code').notNull(), // References benefits_taxonomy(code)
    importance: text('importance', {
      enum: ['required', 'preferred', 'nice_to_have', 'not_important'],
    })
      .default('nice_to_have')
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    profileBenefitUnique: unique().on(table.profileId, table.benefitCode),
  })
);

// Assignment benefits offered
export const assignmentBenefitsOffered = pgTable(
  'assignment_benefits_offered',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    assignmentId: uuid('assignment_id')
      .references(() => assignments.id, { onDelete: 'cascade' })
      .notNull(),
    benefitCode: text('benefit_code').notNull(), // References benefits_taxonomy(code)
    details: text('details'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    assignmentBenefitUnique: unique().on(table.assignmentId, table.benefitCode),
  })
);

// Currency exchange rates
export const currencyExchangeRates = pgTable('currency_exchange_rates', {
  currency: text('currency').primaryKey(),
  toUsd: numeric('to_usd').notNull(),
  source: text('source'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================================
// ASSIGNMENT WORKFLOW SYSTEM
// ============================================================================

// Assignment outcomes
export const assignmentOutcomes = pgTable(
  'assignment_outcomes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    assignmentId: uuid('assignment_id')
      .references(() => assignments.id, { onDelete: 'cascade' })
      .notNull(),
    outcomeType: text('outcome_type', {
      enum: ['continuous', 'milestone'],
    }).notNull(),
    title: text('title').notNull(),
    description: text('description'),
    metrics: jsonb('metrics').default(sql`'[]'::jsonb`), // [{name, target, unit, current}]
    successCriteria: text('success_criteria'),
    dependsOn: uuid('depends_on'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    dependsOnFk: foreignKey({
      columns: [table.dependsOn],
      foreignColumns: [table.id],
      name: 'assignment_outcomes_depends_on_fkey',
    }).onDelete('set null'),
  })
);

// Assignment expertise matrix
export const assignmentExpertiseMatrix = pgTable('assignment_expertise_matrix', {
  id: uuid('id').defaultRandom().primaryKey(),
  assignmentId: uuid('assignment_id')
    .references(() => assignments.id, { onDelete: 'cascade' })
    .notNull(),
  skillCode: text('skill_code').notNull(), // References skills_taxonomy(code)
  requiredLevel: integer('required_level').notNull(),
  stakeholderRole: text('stakeholder_role').notNull(),
  linkedOutcomeId: uuid('linked_outcome_id').references(() => assignmentOutcomes.id, {
    onDelete: 'set null',
  }),
  outcomeRationale: text('outcome_rationale'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Assignment creation pipeline
export const assignmentCreationPipeline = pgTable(
  'assignment_creation_pipeline',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    assignmentId: uuid('assignment_id')
      .references(() => assignments.id, { onDelete: 'cascade' })
      .notNull(),
    stepOrder: integer('step_order').notNull(),
    stepName: text('step_name').notNull(),
    stakeholderRole: text('stakeholder_role').notNull(),
    status: text('status', {
      enum: ['pending', 'in_progress', 'completed', 'skipped', 'rejected'],
    })
      .default('pending')
      .notNull(),
    stepData: jsonb('step_data').default(sql`'{}'::jsonb`),
    completedAt: timestamp('completed_at'),
    completedBy: uuid('completed_by').references(() => profiles.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    assignmentStepUnique: unique().on(table.assignmentId, table.stepOrder),
    stepOrderCheck: check('step_order_check', sql`${table.stepOrder} > 0`),
  })
);

// Assignment field visibility
export const assignmentFieldVisibility = pgTable(
  'assignment_field_visibility',
  {
    assignmentId: uuid('assignment_id')
      .references(() => assignments.id, { onDelete: 'cascade' })
      .notNull(),
    fieldName: text('field_name').notNull(),
    visibilityLevel: text('visibility_level', {
      enum: [
        'public',
        'post_match',
        'post_conversation_start',
        'hidden_used_for_matching',
        'internal_only',
      ],
    }).notNull(),
    revealStage: integer('reveal_stage'),
    redactionType: text('redaction_type', {
      enum: ['hide', 'mask', 'generic_label'],
    }),
    genericLabel: text('generic_label'),
    conditionalRules: jsonb('conditional_rules'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.assignmentId, table.fieldName] }),
    revealStageCheck: check('reveal_stage_check', sql`${table.revealStage} IN (1, 2)`),
  })
);

// Assignment field visibility defaults
export const assignmentFieldVisibilityDefaults = pgTable('assignment_field_visibility_defaults', {
  fieldName: text('field_name').primaryKey(),
  fieldCategory: text('field_category').notNull(),
  defaultVisibility: text('default_visibility', {
    enum: [
      'public',
      'post_match',
      'post_conversation_start',
      'hidden_used_for_matching',
      'internal_only',
    ],
  }).notNull(),
  defaultRedactionType: text('default_redaction_type', {
    enum: ['hide', 'mask', 'generic_label'],
  }),
  defaultGenericLabel: text('default_generic_label'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

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

// ============================================================================
// VERIFICATION SYSTEM TABLES
// ============================================================================

// Verification requests table definition moved to "Verification Privacy System" section (around line 2398)
// The comprehensive version includes privacy protection, one-time tokens, and visibility controls.

// Verification responses - referee's response to verification request
export const verificationResponses = pgTable('verification_responses', {
  id: uuid('id').defaultRandom().primaryKey(),
  requestId: uuid('request_id')
    .references(() => verificationRequests.id, { onDelete: 'cascade' })
    .notNull(),
  responseType: text('response_type', {
    enum: ['accept', 'decline', 'cannot_verify'],
  }).notNull(),
  reason: text('reason'), // Required for decline/cannot_verify
  verifierSeniority: integer('verifier_seniority'), // Derived from Expertise Atlas, not visible to user
  notes: text('notes'), // Private notes for appeal process
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  respondedAt: timestamp('responded_at').defaultNow().notNull(),
});

// Verification appeals - when user contests a declined verification
export const verificationAppeals = pgTable('verification_appeals', {
  id: uuid('id').defaultRandom().primaryKey(),
  requestId: uuid('request_id')
    .references(() => verificationRequests.id, { onDelete: 'cascade' })
    .notNull(),
  profileId: uuid('profile_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  context: text('context').notNull(), // User's explanation (≤500 words)
  status: text('status', {
    enum: ['pending', 'reviewing', 'approved', 'rejected'],
  })
    .default('pending')
    .notNull(),
  reviewerId: uuid('reviewer_id').references(() => profiles.id), // Admin who reviews
  reviewNotes: text('review_notes'),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Organization verification - domain and entity checks
export const orgVerification = pgTable('org_verification', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id')
    .references(() => organizations.id, { onDelete: 'cascade' })
    .notNull(),
  verificationType: text('verification_type', {
    enum: ['domain_email', 'website', 'registry', 'manual'],
  }).notNull(),
  domain: text('domain'),
  registryNumber: text('registry_number'),
  status: text('status', {
    enum: ['pending', 'verified', 'failed', 'expired'],
  })
    .default('pending')
    .notNull(),
  verifiedBy: uuid('verified_by').references(() => profiles.id),
  verifiedAt: timestamp('verified_at'),
  expiresAt: timestamp('expires_at'),
  metadata: jsonb('metadata').default(sql`'{}'::jsonb`),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// MESSAGING SYSTEM TABLES
// ============================================================================
// Note: The conversations table definition is now located further down in this file
// (See "Staged Messaging System" section around line 2360)
// This keeps the more comprehensive privacy-focused version with masked handles.

// Messages table definition moved to "Staged Messaging System" section (around line 2371)
// The comprehensive version includes PII detection and privacy features.

// Blocked users - prevent unwanted communication
export const blockedUsers = pgTable(
  'blocked_users',
  {
    blockerId: uuid('blocker_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),
    blockedId: uuid('blocked_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),
    reason: text('reason'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.blockerId, table.blockedId] }),
  })
);

// ============================================================================
// MODERATION & SAFETY SYSTEM TABLES
// ============================================================================

// Content reports - user-reported content for moderation
export const contentReports = pgTable('content_reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  reporterId: uuid('reporter_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  contentType: text('content_type', {
    enum: [
      'profile',
      'message',
      'assignment',
      'impact_story',
      'experience',
      'education',
      'volunteering',
    ],
  }).notNull(),
  contentId: uuid('content_id').notNull(),
  contentOwnerId: uuid('content_owner_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  reason: text('reason').notNull(), // ≤50 words per PRD
  category: text('category', {
    enum: ['spam', 'harassment', 'misinformation', 'inappropriate', 'political', 'other'],
  }).notNull(),
  status: text('status', {
    enum: ['pending', 'reviewing', 'actioned', 'dismissed'],
  })
    .default('pending')
    .notNull(),
  aiFlag: boolean('ai_flag').default(false).notNull(), // True if AI-flagged
  aiConfidence: numeric('ai_confidence'), // 0-1 score
  reviewedBy: uuid('reviewed_by').references(() => profiles.id),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Moderation actions - actions taken on reported content
export const moderationActions = pgTable('moderation_actions', {
  id: uuid('id').defaultRandom().primaryKey(),
  reportId: uuid('report_id')
    .references(() => contentReports.id, { onDelete: 'cascade' })
    .notNull(),
  moderatorId: uuid('moderator_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  actionType: text('action_type', {
    enum: ['warning', 'content_removed', 'account_suspended', 'dismissed'],
  }).notNull(),
  reason: text('reason').notNull(),
  isAppealable: boolean('is_appealable').default(true).notNull(),
  appealDeadline: timestamp('appeal_deadline'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// User violations - track violation history per user
export const userViolations = pgTable('user_violations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  reportId: uuid('report_id')
    .references(() => contentReports.id, { onDelete: 'set null' })
    .notNull(),
  violationType: text('violation_type', {
    enum: ['spam', 'harassment', 'misinformation', 'inappropriate', 'political', 'other'],
  }).notNull(),
  severity: text('severity', {
    enum: ['low', 'medium', 'high', 'critical'],
  }).notNull(),
  actionTaken: text('action_taken', {
    enum: ['warning', 'content_removed', 'timed_suspension', 'permanent_ban'],
  }).notNull(),
  suspensionExpiresAt: timestamp('suspension_expires_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// ANALYTICS & SUPPORTING TABLES
// ============================================================================

// Analytics events - track key user actions for metrics
// GDPR-compliant: stores hashed IPs instead of raw PII (Article 4(1))
export const analyticsEvents = pgTable(
  'analytics_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventType: text('event_type').notNull(), // signed_up, match_accepted, etc.
    userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
    orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }),
    entityType: text('entity_type'), // match, assignment, profile, etc.
    entityId: uuid('entity_id'),
    properties: jsonb('properties').default(sql`'{}'::jsonb`), // Additional event data
    sessionId: text('session_id'),
    ipHash: text('ip_hash'), // SHA-256 hash of IP (not raw IP - GDPR compliant)
    userAgentHash: text('user_agent_hash'), // SHA-256 hash of User Agent
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    // Performance indexes for analytics queries
    userIdIdx: index('analytics_events_user_id_idx').on(table.userId),
    eventTypeIdx: index('analytics_events_event_type_idx').on(table.eventType),
    createdAtIdx: index('analytics_events_created_at_idx').on(table.createdAt),
    entityIdIdx: index('analytics_events_entity_id_idx').on(table.entityId),
  })
);

// Editorial matches - curated matches for cold-start
export const editorialMatches = pgTable('editorial_matches', {
  id: uuid('id').defaultRandom().primaryKey(),
  assignmentId: uuid('assignment_id')
    .references(() => assignments.id, { onDelete: 'cascade' })
    .notNull(),
  profileId: uuid('profile_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  curatorId: uuid('curator_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  reason: text('reason').notNull(),
  notes: text('notes'),
  priority: integer('priority').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Match suggestions - improvement tips for users
export const matchSuggestions = pgTable('match_suggestions', {
  id: uuid('id').defaultRandom().primaryKey(),
  matchId: uuid('match_id')
    .references(() => matches.id, { onDelete: 'cascade' })
    .notNull(),
  profileId: uuid('profile_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  suggestionType: text('suggestion_type', {
    enum: ['add_proof', 'add_skill', 'update_value', 'complete_profile'],
  }).notNull(),
  description: text('description').notNull(),
  estimatedImpact: numeric('estimated_impact').notNull(), // 0-100 (percentage points)
  actionUrl: text('action_url'),
  isDismissed: boolean('is_dismissed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Active ties - cluster snapshot for algorithms (private)
export const activeTies = pgTable('active_ties', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  tieType: text('tie_type', {
    enum: ['match', 'verification', 'endorsement', 'conversation'],
  }).notNull(),
  relatedUserId: uuid('related_user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  relatedOrgId: uuid('related_org_id').references(() => organizations.id, {
    onDelete: 'cascade',
  }),
  strength: numeric('strength').notNull(), // 0-1 score
  lastInteractionAt: timestamp('last_interaction_at').defaultNow().notNull(),
  isLegacy: boolean('is_legacy').default(false).notNull(), // True if >60 days old
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// GDPR COMPLIANCE TABLES
// ============================================================================

// User consents - track GDPR consent for audit trail
// Reference: CROSS_DOCUMENT_PRIVACY_AUDIT.md Section 5.3
export const userConsents = pgTable('user_consents', {
  id: uuid('id').defaultRandom().primaryKey(),
  profileId: uuid('profile_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  consentType: text('consent_type', {
    enum: [
      'gdpr_terms_of_service',
      'gdpr_privacy_policy',
      'marketing_emails',
      'analytics_tracking',
      'ml_matching',
    ],
  }).notNull(),
  consented: boolean('consented').notNull(),
  consentedAt: timestamp('consented_at').defaultNow().notNull(),
  ipHash: text('ip_hash'), // Hashed IP for audit trail
  userAgentHash: text('user_agent_hash'), // Hashed user agent
  version: text('version'), // Policy version (e.g., "v1.0.2025-01-30")
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ====================================
// Zen Hub - Well-being Tracking (Privacy-First)
// ====================================

// Well-being check-ins - Private, never used in ranking
export const wellbeingCheckins = pgTable('wellbeing_checkins', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  stressLevel: integer('stress_level').notNull(), // 1-5 Likert scale
  controlLevel: integer('control_level').notNull(), // 1-5 Likert scale
  milestoneTriggerId: text('milestone_trigger_id'), // 'rejection', 'interview', 'offer', null
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Well-being reflections - Linked to milestones
export const wellbeingReflections = pgTable('wellbeing_reflections', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  reflectionText: text('reflection_text').notNull(),
  milestoneType: text('milestone_type'), // 'rejection', 'interview', 'offer'
  linkedCheckinId: uuid('linked_checkin_id').references(() => wellbeingCheckins.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Self-assessments - PHQ-2 (depression) and GAD-2 (anxiety) screenings
export const selfAssessments = pgTable('self_assessments', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  assessmentType: text('assessment_type', { enum: ['phq2', 'gad2'] }).notNull(),
  score: integer('score').notNull(), // 0-6 for both PHQ-2 and GAD-2
  severity: text('severity').notNull(), // 'Minimal', 'Mild', 'Moderate to Severe'
  responses: jsonb('responses').notNull(), // Store individual question responses
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Work schedules - Track weekly work hours for burnout monitoring
export const workSchedules = pgTable('work_schedules', {
  userId: uuid('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .primaryKey(),
  monday: numeric('monday').default('0').notNull(),
  tuesday: numeric('tuesday').default('0').notNull(),
  wednesday: numeric('wednesday').default('0').notNull(),
  thursday: numeric('thursday').default('0').notNull(),
  friday: numeric('friday').default('0').notNull(),
  saturday: numeric('saturday').default('0').notNull(),
  sunday: numeric('sunday').default('0').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Well-being opt-ins - User consent for Zen Hub features
export const wellbeingOptIns = pgTable('wellbeing_opt_ins', {
  userId: uuid('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .primaryKey(),
  optedIn: boolean('opted_in').default(false).notNull(),
  privacyBannerAcknowledged: boolean('privacy_banner_acknowledged').default(false),
  optedInAt: timestamp('opted_in_at'),
  optedOutAt: timestamp('opted_out_at'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ====================================
// Notifications System
// ====================================

// Notifications - In-app notification system for user engagement
export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  // Notification type and content
  type: text('type', {
    enum: [
      'match_suggested',
      'intro_accepted',
      'message_received',
      'verification_requested',
      'verification_completed',
      'assignment_published',
      'interview_scheduled',
      'contract_signed',
    ],
  }).notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  // Links and metadata
  actionUrl: text('action_url'), // URL to navigate to when clicked
  entityType: text('entity_type'), // e.g., 'match', 'message', 'assignment'
  entityId: uuid('entity_id'), // ID of related entity
  metadata: jsonb('metadata').default(sql`'{}'::jsonb`),
  // Status
  read: boolean('read').default(false).notNull(),
  readAt: timestamp('read_at'),
  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Notification preferences - User preferences for which notifications to receive
export const notificationPreferences = pgTable('notification_preferences', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  // In-app notification preferences (by type)
  inAppMatchSuggested: boolean('in_app_match_suggested').default(true).notNull(),
  inAppIntroAccepted: boolean('in_app_intro_accepted').default(true).notNull(),
  inAppMessageReceived: boolean('in_app_message_received').default(true).notNull(),
  inAppVerificationRequested: boolean('in_app_verification_requested').default(true).notNull(),
  inAppVerificationCompleted: boolean('in_app_verification_completed').default(true).notNull(),
  inAppAssignmentPublished: boolean('in_app_assignment_published').default(true).notNull(),
  inAppInterviewScheduled: boolean('in_app_interview_scheduled').default(true).notNull(),
  inAppContractSigned: boolean('in_app_contract_signed').default(true).notNull(),
  // Email notification preferences (by type)
  emailMatchSuggested: boolean('email_match_suggested').default(true).notNull(),
  emailIntroAccepted: boolean('email_intro_accepted').default(true).notNull(),
  emailMessageReceived: boolean('email_message_received').default(false).notNull(),
  emailVerificationRequested: boolean('email_verification_requested').default(true).notNull(),
  emailVerificationCompleted: boolean('email_verification_completed').default(true).notNull(),
  emailAssignmentPublished: boolean('email_assignment_published').default(true).notNull(),
  emailInterviewScheduled: boolean('email_interview_scheduled').default(true).notNull(),
  emailContractSigned: boolean('email_contract_signed').default(true).notNull(),
  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ====================================
// Contracts & Metrics Infrastructure
// ====================================

// Contracts - Track signed employment/engagement agreements for TTSC metric
export const contracts = pgTable(
  'contracts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    assignmentId: uuid('assignment_id')
      .references(() => assignments.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),
    orgId: uuid('org_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    // Attestation flags (mutual confirmation model)
    userAttestation: boolean('user_attestation').default(false),
    orgAttestation: boolean('org_attestation').default(false),
    // Contract details
    contractType: text('contract_type', {
      enum: ['full-time', 'part-time', 'contract', 'internship', 'volunteer'],
    }),
    signedAt: timestamp('signed_at').defaultNow().notNull(),
    startDate: date('start_date'),
    endDate: date('end_date'),
    // Compensation details (optional)
    compensationAmount: integer('compensation_amount'),
    compensationCurrency: text('compensation_currency').default('USD'),
    compensationPeriod: text('compensation_period', {
      enum: ['hourly', 'weekly', 'monthly', 'yearly', 'one-time'],
    }),
    // Additional metadata
    metadata: jsonb('metadata').default(sql`'{}'::jsonb`),
    notes: text('notes'),
    // Audit fields
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // Performance indexes for metrics queries
    userIdIdx: index('contracts_user_id_idx').on(table.userId),
    assignmentIdIdx: index('contracts_assignment_id_idx').on(table.assignmentId),
    signedAtIdx: index('contracts_signed_at_idx').on(table.signedAt),
  })
);

// Metric snapshots - Cache calculated metrics for performance
export const metricSnapshots = pgTable('metric_snapshots', {
  id: uuid('id').defaultRandom().primaryKey(),
  // Metric identification
  metricType: text('metric_type', {
    enum: ['ttsc', 'ttfqi', 'ttv', 'pac', 'sus', 'wellbeing_delta'],
  }).notNull(),
  cohort: text('cohort'), // e.g., 'student', 'senior-engineer', 'us-remote'
  // Metric values
  value: numeric('value').notNull(), // Primary metric value (e.g., median days)
  median: numeric('median'),
  p25: numeric('p25'), // 25th percentile
  p75: numeric('p75'), // 75th percentile
  mean: numeric('mean'),
  sampleSize: integer('sample_size'),
  // Time period
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  // Additional metadata
  metadata: jsonb('metadata').default(sql`'{}'::jsonb`),
  // Audit fields
  calculatedAt: timestamp('calculated_at').defaultNow().notNull(),
});

// ====================================
// Video Conferencing Integration
// ====================================

// User integrations for OAuth-connected services
export const userIntegrations = pgTable(
  'user_integrations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),
    provider: text('provider', { enum: ['zoom', 'google', 'linkedin'] }).notNull(),
    accessToken: text('access_token').notNull(),
    refreshToken: text('refresh_token'),
    tokenExpiry: timestamp('token_expiry').notNull(),
    scope: text('scope').array(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userProviderUnique: unique().on(table.userId, table.provider),
  })
);

// Scheduled interviews with video links
export const interviews = pgTable('interviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  matchId: uuid('match_id')
    .references(() => matches.id, { onDelete: 'cascade' })
    .notNull(),
  scheduledAt: timestamp('scheduled_at').notNull(),
  duration: integer('duration').default(30).notNull(), // minutes
  platform: text('platform', { enum: ['zoom', 'google'] }).notNull(),
  meetingId: text('meeting_id').notNull(), // External meeting/event ID
  meetingUrl: text('meeting_url').notNull(),
  timezone: text('timezone').default('UTC'),
  status: text('status', {
    enum: ['scheduled', 'completed', 'cancelled', 'no_show'],
  })
    .default('scheduled')
    .notNull(),
  // Decision tracking (post-interview)
  decision: text('decision', { enum: ['accept', 'decline'] }),
  decidedBy: uuid('decided_by').references(() => profiles.id),
  decidedAt: timestamp('decided_at'),
  feedback: text('feedback'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================================
// ADMIN SYSTEM TABLES
// ============================================================================

// Admin invitations - for inviting new platform admins
export const adminInvitations = pgTable('admin_invitations', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull(),
  role: text('role', {
    enum: ['platform_admin', 'super_admin'],
  }).notNull(),
  token: text('token').unique().notNull(),
  invitedBy: uuid('invited_by')
    .references(() => profiles.id)
    .notNull(),
  invitedAt: timestamp('invited_at').defaultNow().notNull(),
  acceptedAt: timestamp('accepted_at'),
  acceptedBy: uuid('accepted_by').references(() => profiles.id),
  expiresAt: timestamp('expires_at').notNull(),
  status: text('status', {
    enum: ['pending', 'accepted', 'expired', 'revoked'],
  })
    .default('pending')
    .notNull(),
});

// Admin audit log - tracks all admin actions
export const adminAuditLog = pgTable('admin_audit_log', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  adminId: uuid('admin_id')
    .references(() => profiles.id)
    .notNull(),
  action: text('action').notNull(),
  targetType: text('target_type'), // 'user', 'organization', 'assignment', etc.
  targetId: uuid('target_id'),
  changes: jsonb('changes'), // Before/after values
  reason: text('reason'), // Optional reason for action
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Admin system metrics cache - pre-aggregated analytics
export const adminMetricsCache = pgTable(
  'admin_metrics_cache',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    metricType: text('metric_type').notNull(), // 'daily_signups', 'active_users', etc.
    period: text('period').notNull(), // 'day', 'week', 'month'
    periodStart: timestamp('period_start').notNull(),
    periodEnd: timestamp('period_end').notNull(),
    value: jsonb('value').notNull(), // Metric-specific data
    calculatedAt: timestamp('calculated_at').defaultNow().notNull(),
  },
  (table) => ({
    metricPeriodUnique: unique().on(table.metricType, table.periodStart),
  })
);

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

// Verification system types
export type VerificationRequest = typeof verificationRequests.$inferSelect;
export type InsertVerificationRequest = typeof verificationRequests.$inferInsert;
export type VerificationResponse = typeof verificationResponses.$inferSelect;
export type InsertVerificationResponse = typeof verificationResponses.$inferInsert;
export type VerificationAppeal = typeof verificationAppeals.$inferSelect;
export type InsertVerificationAppeal = typeof verificationAppeals.$inferInsert;
export type OrgVerification = typeof orgVerification.$inferSelect;
export type InsertOrgVerification = typeof orgVerification.$inferInsert;

// Messaging system types
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
export type BlockedUser = typeof blockedUsers.$inferSelect;
export type InsertBlockedUser = typeof blockedUsers.$inferInsert;

// Moderation system types
export type ContentReport = typeof contentReports.$inferSelect;
export type InsertContentReport = typeof contentReports.$inferInsert;
export type ModerationAction = typeof moderationActions.$inferSelect;
export type InsertModerationAction = typeof moderationActions.$inferInsert;
export type UserViolation = typeof userViolations.$inferSelect;
export type InsertUserViolation = typeof userViolations.$inferInsert;

// Analytics & supporting types
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = typeof analyticsEvents.$inferInsert;
export type EditorialMatch = typeof editorialMatches.$inferSelect;
export type InsertEditorialMatch = typeof editorialMatches.$inferInsert;
export type MatchSuggestion = typeof matchSuggestions.$inferSelect;
export type InsertMatchSuggestion = typeof matchSuggestions.$inferInsert;
export type ActiveTie = typeof activeTies.$inferSelect;
export type InsertActiveTie = typeof activeTies.$inferInsert;

// GDPR compliance types
export type UserConsent = typeof userConsents.$inferSelect;
export type InsertUserConsent = typeof userConsents.$inferInsert;

// Skills taxonomy system types
export type SkillsCategory = typeof skillsCategories.$inferSelect;
export type InsertSkillsCategory = typeof skillsCategories.$inferInsert;
export type SkillsSubcategory = typeof skillsSubcategories.$inferSelect;
export type InsertSkillsSubcategory = typeof skillsSubcategories.$inferInsert;
export type SkillsL3 = typeof skillsL3.$inferSelect;
export type InsertSkillsL3 = typeof skillsL3.$inferInsert;
export type SkillsTaxonomy = typeof skillsTaxonomy.$inferSelect;
export type InsertSkillsTaxonomy = typeof skillsTaxonomy.$inferInsert;
export type SkillAdjacency = typeof skillAdjacency.$inferSelect;
export type InsertSkillAdjacency = typeof skillAdjacency.$inferInsert;

// Projects & skill linkage types
export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;
export type ProjectSkill = typeof projectSkills.$inferSelect;
export type InsertProjectSkill = typeof projectSkills.$inferInsert;

// Benefits & compensation types
export type BenefitsTaxonomy = typeof benefitsTaxonomy.$inferSelect;
export type InsertBenefitsTaxonomy = typeof benefitsTaxonomy.$inferInsert;
export type ProfileBenefitsPrefs = typeof profileBenefitsPrefs.$inferSelect;
export type InsertProfileBenefitsPrefs = typeof profileBenefitsPrefs.$inferInsert;
export type AssignmentBenefitsOffered = typeof assignmentBenefitsOffered.$inferSelect;
export type InsertAssignmentBenefitsOffered = typeof assignmentBenefitsOffered.$inferInsert;
export type CurrencyExchangeRates = typeof currencyExchangeRates.$inferSelect;
export type InsertCurrencyExchangeRates = typeof currencyExchangeRates.$inferInsert;

// Assignment workflow types
export type AssignmentOutcome = typeof assignmentOutcomes.$inferSelect;
export type InsertAssignmentOutcome = typeof assignmentOutcomes.$inferInsert;
export type AssignmentExpertiseMatrix = typeof assignmentExpertiseMatrix.$inferSelect;
export type InsertAssignmentExpertiseMatrix = typeof assignmentExpertiseMatrix.$inferInsert;
export type AssignmentCreationPipeline = typeof assignmentCreationPipeline.$inferSelect;
export type InsertAssignmentCreationPipeline = typeof assignmentCreationPipeline.$inferInsert;
export type AssignmentFieldVisibility = typeof assignmentFieldVisibility.$inferSelect;
export type InsertAssignmentFieldVisibility = typeof assignmentFieldVisibility.$inferInsert;

// Zen Hub well-being types
export type WellbeingCheckin = typeof wellbeingCheckins.$inferSelect;
export type InsertWellbeingCheckin = typeof wellbeingCheckins.$inferInsert;
export type WellbeingReflection = typeof wellbeingReflections.$inferSelect;
export type InsertWellbeingReflection = typeof wellbeingReflections.$inferInsert;
export type WellbeingOptIn = typeof wellbeingOptIns.$inferSelect;
export type InsertWellbeingOptIn = typeof wellbeingOptIns.$inferInsert;

// Contracts & metrics types
export type Contract = typeof contracts.$inferSelect;
export type InsertContract = typeof contracts.$inferInsert;
export type MetricSnapshot = typeof metricSnapshots.$inferSelect;
export type InsertMetricSnapshot = typeof metricSnapshots.$inferInsert;

// Video integration types
export type UserIntegration = typeof userIntegrations.$inferSelect;
export type InsertUserIntegration = typeof userIntegrations.$inferInsert;
export type Interview = typeof interviews.$inferSelect;
export type InsertInterview = typeof interviews.$inferInsert;

export type AssignmentFieldVisibilityDefaults =
  typeof assignmentFieldVisibilityDefaults.$inferSelect;
export type InsertAssignmentFieldVisibilityDefaults =
  typeof assignmentFieldVisibilityDefaults.$inferInsert;

// Admin system types
export type AdminInvitation = typeof adminInvitations.$inferSelect;
export type InsertAdminInvitation = typeof adminInvitations.$inferInsert;
export type AdminAuditLog = typeof adminAuditLog.$inferSelect;
export type InsertAdminAuditLog = typeof adminAuditLog.$inferInsert;
export type AdminMetricsCache = typeof adminMetricsCache.$inferSelect;
export type InsertAdminMetricsCache = typeof adminMetricsCache.$inferInsert;

// Notification types
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;

// Stakeholder Assignment System (Feature 4)
export const assignmentInvitations = pgTable('assignment_invitations', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id')
    .references(() => organizations.id, { onDelete: 'cascade' })
    .notNull(),
  token: text('token').notNull().unique(),
  stakeholderEmail: text('stakeholder_email').notNull(),
  stakeholderName: text('stakeholder_name'),
  assignedSections: jsonb('assigned_sections').notNull(), // Array of section names
  message: text('message'),
  status: text('status', { enum: ['pending', 'in_progress', 'completed', 'expired'] })
    .default('pending')
    .notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  completedAt: timestamp('completed_at'),
  createdBy: uuid('created_by').references(() => profiles.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const assignmentSubmissions = pgTable('assignment_submissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  invitationId: uuid('invitation_id')
    .references(() => assignmentInvitations.id, { onDelete: 'cascade' })
    .notNull(),
  sectionName: text('section_name').notNull(), // e.g., 'projects', 'partnerships', 'impact'
  sectionData: jsonb('section_data').notNull(), // The submitted data
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
  reviewStatus: text('review_status', {
    enum: ['pending', 'approved', 'rejected', 'needs_changes'],
  })
    .default('pending')
    .notNull(),
  reviewedBy: uuid('reviewed_by').references(() => profiles.id),
  reviewedAt: timestamp('reviewed_at'),
  reviewNotes: text('review_notes'),
});

export const assignmentVersionHistory = pgTable('assignment_version_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  submissionId: uuid('submission_id')
    .references(() => assignmentSubmissions.id, { onDelete: 'cascade' })
    .notNull(),
  version: integer('version').notNull(),
  sectionData: jsonb('section_data').notNull(),
  changedBy: text('changed_by').notNull(), // 'stakeholder' or user email
  changedAt: timestamp('changed_at').defaultNow().notNull(),
});

// Type exports for assignments
export type AssignmentInvitation = typeof assignmentInvitations.$inferSelect;
export type InsertAssignmentInvitation = typeof assignmentInvitations.$inferInsert;
export type AssignmentSubmission = typeof assignmentSubmissions.$inferSelect;
export type InsertAssignmentSubmission = typeof assignmentSubmissions.$inferInsert;
export type AssignmentVersionHistory = typeof assignmentVersionHistory.$inferSelect;
export type InsertAssignmentVersionHistory = typeof assignmentVersionHistory.$inferInsert;

// ============================================================================
// PRIVACY & VISIBILITY
// ============================================================================
// Note: Field-level visibility is now stored as JSONB in individualProfiles.fieldVisibility

// ============================================================================
// FAIRNESS ANALYTICS
// ============================================================================

// Demographic opt-in for fairness analytics
export const demographicOptIns = pgTable('demographic_opt_ins', {
  id: uuid('id').defaultRandom().primaryKey(),
  profileId: uuid('profile_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  optedIn: boolean('opted_in').default(false).notNull(),
  // Demographic data (all optional, anonymized)
  gender: text('gender'),
  ethnicity: text('ethnicity'),
  ageRange: text('age_range'),
  disability: text('disability'),
  veteranStatus: text('veteran_status'),
  // Privacy fields
  dataUsageConsent: boolean('data_usage_consent').default(true).notNull(),
  consentedAt: timestamp('consented_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Fairness metrics per assignment
export const fairnessMetrics = pgTable('fairness_metrics', {
  id: uuid('id').defaultRandom().primaryKey(),
  assignmentId: uuid('assignment_id')
    .references(() => assignments.id, { onDelete: 'cascade' })
    .notNull(),
  // Aggregated metrics (no individual data)
  cohorts: jsonb('cohorts').notNull(), // Array of cohort metrics
  totalApplicants: integer('total_applicants').notNull(),
  totalOptedIn: integer('total_opted_in').notNull(), // How many provided data
  totalSelected: integer('total_selected').notNull(),
  // Metadata
  generatedAt: timestamp('generated_at').defaultNow().notNull(),
  minSampleSize: integer('min_sample_size').default(30).notNull(), // Minimum for statistical validity
  hasSignificantGaps: boolean('has_significant_gaps').default(false).notNull(),
});

// Fairness notes - automated fairness reports per release
export const fairnessNotes = pgTable('fairness_notes', {
  id: uuid('id').defaultRandom().primaryKey(),
  releaseVersion: text('release_version').notNull(),
  generatedAt: timestamp('generated_at').defaultNow().notNull(),
  cohortData: jsonb('cohort_data').notNull(), // Array of cohort analysis results
  findings: jsonb('findings').notNull(), // Array of significant findings
  recommendations: jsonb('recommendations').notNull(), // Array of actionable recommendations
  status: text('status', {
    enum: ['draft', 'published', 'archived'],
  })
    .default('draft')
    .notNull(),
  minSampleSize: integer('min_sample_size').default(40).notNull(),
  hasSignificantGaps: boolean('has_significant_gaps').default(false).notNull(),
  pValue: numeric('p_value'), // Statistical significance threshold
  createdBy: uuid('created_by').references(() => profiles.id),
  publishedAt: timestamp('published_at'),
});

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

// Performance metrics for tracking page load times and API latency
export const performanceMetrics = pgTable('performance_metrics', {
  id: uuid('id').defaultRandom().primaryKey(),
  metricType: text('metric_type', {
    enum: ['page_load', 'api_latency', 'tti', 'fcp', 'lcp', 'cls', 'fid'],
  }).notNull(),
  pageRoute: text('page_route'), // For page load metrics
  apiEndpoint: text('api_endpoint'), // For API latency metrics
  valueMs: numeric('value_ms').notNull(), // Value in milliseconds
  deviceType: text('device_type', {
    enum: ['desktop', 'mobile', 'tablet'],
  }),
  // Aggregated percentiles (computed periodically)
  p50: numeric('p50'),
  p95: numeric('p95'),
  p99: numeric('p99'),
  // Sample metadata
  userAgent: text('user_agent'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  // Aggregation period (for rolled-up metrics)
  periodStart: timestamp('period_start'),
  periodEnd: timestamp('period_end'),
  sampleCount: integer('sample_count').default(1),
});

// Performance alerts for SLA violations
export const performanceAlerts = pgTable('performance_alerts', {
  id: uuid('id').defaultRandom().primaryKey(),
  alertType: text('alert_type', {
    enum: ['sla_violation', 'degradation', 'spike'],
  }).notNull(),
  metricType: text('metric_type').notNull(),
  route: text('route'), // Page route or API endpoint
  thresholdMs: numeric('threshold_ms').notNull(),
  actualValueMs: numeric('actual_value_ms').notNull(),
  percentile: text('percentile'), // e.g., 'p95', 'p99'
  deviceType: text('device_type'),
  severity: text('severity', {
    enum: ['low', 'medium', 'high', 'critical'],
  }).notNull(),
  status: text('status', {
    enum: ['open', 'acknowledged', 'resolved', 'ignored'],
  })
    .default('open')
    .notNull(),
  acknowledgedBy: uuid('acknowledged_by').references(() => profiles.id),
  acknowledgedAt: timestamp('acknowledged_at'),
  resolvedAt: timestamp('resolved_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Type exports for privacy & fairness
// ProfileFieldVisibility types removed - now using JSONB in individualProfiles
export type DemographicOptIn = typeof demographicOptIns.$inferSelect;
export type InsertDemographicOptIn = typeof demographicOptIns.$inferInsert;
export type FairnessMetric = typeof fairnessMetrics.$inferSelect;
export type InsertFairnessMetric = typeof fairnessMetrics.$inferInsert;
export type FairnessNote = typeof fairnessNotes.$inferSelect;
export type InsertFairnessNote = typeof fairnessNotes.$inferInsert;

// Type exports for performance monitoring
export type PerformanceMetric = typeof performanceMetrics.$inferSelect;
export type InsertPerformanceMetric = typeof performanceMetrics.$inferInsert;
export type PerformanceAlert = typeof performanceAlerts.$inferSelect;
export type InsertPerformanceAlert = typeof performanceAlerts.$inferInsert;

// ============================================================================
// USER FEEDBACK & USABILITY
// ============================================================================

// Survey display tracking (to avoid over-surveying users)
export const surveyDisplayLog = pgTable('survey_display_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  surveyType: text('survey_type').notNull(), // 'sus', 'nps', 'feedback', etc.
  task: text('task'), // Task context
  displayedAt: timestamp('displayed_at').defaultNow().notNull(),
  completed: boolean('completed').default(false).notNull(),
});

// Type exports for survey display tracking
export type SurveyDisplayLog = typeof surveyDisplayLog.$inferSelect;
export type InsertSurveyDisplayLog = typeof surveyDisplayLog.$inferInsert;

// Note: SUS surveys are defined below with comprehensive structure

// ====================================
// Staged Messaging System (Privacy-First)
// ====================================
// Reference: DATA_SECURITY_PRIVACY_ARCHITECTURE.md Section 10

// Conversations table - Staged identity reveal messaging
export const conversations = pgTable('conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  matchId: uuid('match_id').references(() => matches.id, { onDelete: 'cascade' }),

  // Participants
  participantOneId: uuid('participant_one_id')
    .references(() => profiles.id)
    .notNull(),
  participantTwoId: uuid('participant_two_id')
    .references(() => profiles.id)
    .notNull(),

  // Staged reveal control
  stage: text('stage', { enum: ['masked', 'revealed'] }).default('masked'),
  revealedAt: timestamp('revealed_at'),

  // Masked identifiers (Stage 1)
  maskedHandleOne: text('masked_handle_one'), // "Contributor #123"
  maskedHandleTwo: text('masked_handle_two'), // "Organization Representative"

  // Reveal requests
  participantOneWantsReveal: boolean('participant_one_wants_reveal').default(false),
  participantTwoWantsReveal: boolean('participant_two_wants_reveal').default(false),
  participantOneRevealRequestedAt: timestamp('participant_one_reveal_requested_at'),
  participantTwoRevealRequestedAt: timestamp('participant_two_reveal_requested_at'),

  // Metadata
  lastMessageAt: timestamp('last_message_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Messages table - Text-only messaging with PII detection
export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id')
    .references(() => conversations.id, { onDelete: 'cascade' })
    .notNull(),
  senderId: uuid('sender_id')
    .references(() => profiles.id)
    .notNull(),

  // Message content (2000 char limit per PRD)
  content: text('content').notNull(),

  // PII detection flags
  containsEmail: boolean('contains_email').default(false),
  containsPhone: boolean('contains_phone').default(false),
  containsUrl: boolean('contains_url').default(false),
  piiWarningShown: boolean('pii_warning_shown').default(false),

  // Metadata
  sentAt: timestamp('sent_at').defaultNow().notNull(),
  readAt: timestamp('read_at'),
  editedAt: timestamp('edited_at'),

  // Message status
  status: text('status', {
    enum: ['sent', 'delivered', 'read', 'deleted'],
  }).default('sent'),
});

// Type exports for messaging
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// ====================================
// Verification Privacy System
// ====================================
// Reference: DATA_SECURITY_PRIVACY_ARCHITECTURE.md Section 11

// Verification requests table - Privacy-protected verification with rate limiting
export const verificationRequests = pgTable('verification_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  profileId: uuid('profile_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),

  // Verifier info (Tier 1 PII - protected)
  verifierEmail: text('verifier_email').notNull(),
  verifierName: text('verifier_name').notNull(),
  verifierRelationship: text('verifier_relationship'), // e.g., "Manager at Acme Corp"

  // Verification details
  claimType: text('claim_type', {
    enum: ['experience', 'skill', 'education', 'achievement', 'project'],
  }).notNull(),
  claimData: text('claim_data').notNull(), // JSON string

  // Privacy protection
  token: text('token').unique().notNull(),
  expiresAt: timestamp('expires_at').notNull(), // 14 days from creation
  oneTimeUse: boolean('one_time_use').default(true),
  usedAt: timestamp('used_at'),

  // Response
  status: text('status', {
    enum: ['pending', 'verified', 'declined', 'expired', 'cancelled'],
  }).default('pending'),
  responseNote: text('response_note'),
  respondedAt: timestamp('responded_at'),

  // Visibility control
  visibility: text('visibility', {
    enum: ['public', 'private'],
  }).default('private'),
  showVerifierName: boolean('show_verifier_name').default(false),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),

  // Badge reference
  badgeId: uuid('badge_id'),
});

// Type exports for verification
export type VerificationRequest = typeof verificationRequests.$inferSelect;
export type InsertVerificationRequest = typeof verificationRequests.$inferInsert;

// ====================================
// Fairness Reporting System
// ====================================
// Implements PRD Gap 3: Automated fairness note generation

export const fairnessReports = pgTable('fairness_reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  releaseVersion: text('release_version').notNull(),
  reportMarkdown: text('report_markdown').notNull(),
  metricsJson: jsonb('metrics_json').notNull(), // Full analysis data
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type FairnessReport = typeof fairnessReports.$inferSelect;
export type InsertFairnessReport = typeof fairnessReports.$inferInsert;

// ====================================
// System Usability Scale (SUS) Surveys
// ====================================
// PRD: Part 2 (lines 83-84), Part 12
// Target: SUS ≥75

export const susSurveys = pgTable('sus_surveys', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),

  // Collection point trigger
  trigger: text('trigger', {
    enum: ['profile_activation', 'first_assignment', '10_matches', 'quarterly_checkin'],
  }).notNull(),

  // Individual question responses (1-5 Likert scale)
  q1: integer('q1').notNull(),
  q2: integer('q2').notNull(),
  q3: integer('q3').notNull(),
  q4: integer('q4').notNull(),
  q5: integer('q5').notNull(),
  q6: integer('q6').notNull(),
  q7: integer('q7').notNull(),
  q8: integer('q8').notNull(),
  q9: integer('q9').notNull(),
  q10: integer('q10').notNull(),

  // Calculated SUS score (0-100)
  score: numeric('score', { precision: 5, scale: 2 }).notNull(),

  // Grade (A, B, C, D, F)
  grade: text('grade', { enum: ['A', 'B', 'C', 'D', 'F'] }).notNull(),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at').defaultNow().notNull(),
});

export const susSurveyPrompts = pgTable('sus_survey_prompts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  trigger: text('trigger', {
    enum: ['profile_activation', 'first_assignment', '10_matches', 'quarterly_checkin'],
  }).notNull(),

  // Status: pending, completed, skipped, expired
  status: text('status', {
    enum: ['pending', 'completed', 'skipped', 'expired'],
  })
    .default('pending')
    .notNull(),

  // When the prompt should be shown
  scheduledAt: timestamp('scheduled_at').defaultNow().notNull(),

  // When the prompt was shown
  shownAt: timestamp('shown_at'),

  // When the user took action (completed/skipped)
  actionedAt: timestamp('actioned_at'),

  // Link to completed survey
  surveyId: uuid('survey_id').references(() => susSurveys.id, { onDelete: 'set null' }),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type SusSurvey = typeof susSurveys.$inferSelect;
export type InsertSusSurvey = typeof susSurveys.$inferInsert;
export type SusSurveyPrompt = typeof susSurveyPrompts.$inferSelect;
export type InsertSusSurveyPrompt = typeof susSurveyPrompts.$inferInsert;

// ====================================
// Purpose Edit Audit Trail
// ====================================
// PRD: Part 2 - Purpose Block auditing requirement
// Tracks changes to mission and vision fields

export const purposeEditLog = pgTable('purpose_edit_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),

  // Which field was changed ('mission' or 'vision')
  fieldName: text('field_name', { enum: ['mission', 'vision'] }).notNull(),

  // Old and new values (full text)
  oldValue: text('old_value'),
  newValue: text('new_value'),

  // When the change occurred
  changedAt: timestamp('changed_at').defaultNow().notNull(),
});

export type PurposeEditLog = typeof purposeEditLog.$inferSelect;
export type InsertPurposeEditLog = typeof purposeEditLog.$inferInsert;
