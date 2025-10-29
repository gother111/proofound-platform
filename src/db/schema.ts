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
  projectId: uuid('project_id').references(() => sql`projects(id)`, {
    onDelete: 'set null',
  }),
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
  projectId: uuid('project_id').references(() => sql`projects(id)`, {
    onDelete: 'set null',
  }),
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
  projectId: uuid('project_id').references(() => sql`projects(id)`, {
    onDelete: 'set null',
  }),
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
  projectId: uuid('project_id').references(() => sql`projects(id)`, {
    onDelete: 'set null',
  }),
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
  workCulture: jsonb('work_culture'), // {collaboration, decision_making, learning, wellbeing, inclusion}
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
    skillCode: text('skill_code'), // New L4 skill code (references skills_taxonomy)
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
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    profileSkillUnique: unique().on(table.profileId, table.skillId),
    levelCheck: check('level_check', sql`${table.level} BETWEEN 0 AND 5`),
    monthsCheck: check('months_check', sql`${table.monthsExperience} >= 0`),
    evidenceCheck: check('evidence_check', sql`${table.evidenceStrength} BETWEEN 0 AND 1`),
    recencyCheck: check('recency_check', sql`${table.recencyMultiplier} > 0 AND ${table.recencyMultiplier} <= 1`),
    impactCheck: check('impact_check', sql`${table.impactScore} BETWEEN 0 AND 1`),
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
// SKILLS TAXONOMY SYSTEM
// ============================================================================

// Skills categories (L1) - top-level domains
export const skillsCategories = pgTable('skills_categories', {
  catId: integer('cat_id').primaryKey(),
  slug: text('slug').unique().notNull(),
  nameI18n: jsonb('name_i18n').notNull(), // {en: string, ...}
  descriptionI18n: jsonb('description_i18n'),
  icon: text('icon'),
  version: integer('version').default(1).notNull(),
  status: text('status', {
    enum: ['active', 'deprecated', 'merged'],
  })
    .default('active')
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Skills subcategories (L2)
export const skillsSubcategories = pgTable('skills_subcategories', {
  subcatId: integer('subcat_id').primaryKey(),
  catId: integer('cat_id')
    .references(() => skillsCategories.catId)
    .notNull(),
  slug: text('slug').unique().notNull(),
  nameI18n: jsonb('name_i18n').notNull(),
  descriptionI18n: jsonb('description_i18n'),
  version: integer('version').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Skills L3 categories
export const skillsL3 = pgTable('skills_l3', {
  l3Id: integer('l3_id').primaryKey(),
  subcatId: integer('subcat_id')
    .references(() => skillsSubcategories.subcatId)
    .notNull(),
  slug: text('slug').unique().notNull(),
  nameI18n: jsonb('name_i18n').notNull(),
  descriptionI18n: jsonb('description_i18n'),
  version: integer('version').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Skills taxonomy (L4) - granular skills
export const skillsTaxonomy = pgTable('skills_taxonomy', {
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
});

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
    proficiencyCheck: check(
      'proficiency_check',
      sql`${table.proficiencyLevel} BETWEEN 1 AND 5`
    ),
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
export const assignmentOutcomes = pgTable('assignment_outcomes', {
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
  dependsOn: uuid('depends_on').references(() => sql`assignment_outcomes(id)`, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

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

// Verification requests - workflow for proof verification
export const verificationRequests = pgTable('verification_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  claimType: text('claim_type', {
    enum: ['experience', 'education', 'volunteering', 'impact_story', 'capability'],
  }).notNull(),
  claimId: uuid('claim_id').notNull(), // ID of the claim being verified
  profileId: uuid('profile_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  verifierEmail: text('verifier_email').notNull(),
  verifierName: text('verifier_name'),
  verifierOrg: text('verifier_org'),
  status: text('status', {
    enum: ['pending', 'accepted', 'declined', 'cannot_verify', 'expired', 'appealed'],
  })
    .default('pending')
    .notNull(),
  token: text('token').unique().notNull(),
  sentAt: timestamp('sent_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  lastNudgedAt: timestamp('last_nudged_at'),
  respondedAt: timestamp('responded_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

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

// Conversations - chat threads between matched users
export const conversations = pgTable('conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  matchId: uuid('match_id')
    .references(() => matches.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  assignmentId: uuid('assignment_id')
    .references(() => assignments.id, { onDelete: 'cascade' })
    .notNull(),
  participantOneId: uuid('participant_one_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  participantTwoId: uuid('participant_two_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  stage: integer('stage').default(1).notNull(), // 1 = masked basics, 2 = full reveal
  status: text('status', {
    enum: ['active', 'archived', 'closed'],
  })
    .default('active')
    .notNull(),
  lastMessageAt: timestamp('last_message_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Messages - individual messages in conversations
export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id')
    .references(() => conversations.id, { onDelete: 'cascade' })
    .notNull(),
  senderId: uuid('sender_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  content: text('content').notNull(),
  attachments: jsonb('attachments').default(sql`'[]'::jsonb`), // [{type: 'link' | 'pdf', url: string, name: string, size?: number}]
  isSystemMessage: boolean('is_system_message').default(false).notNull(),
  readAt: timestamp('read_at'),
  flaggedForModeration: boolean('flagged_for_moderation').default(false).notNull(),
  sentAt: timestamp('sent_at').defaultNow().notNull(),
});

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
export const analyticsEvents = pgTable('analytics_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventType: text('event_type').notNull(), // signed_up, match_accepted, etc.
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }),
  entityType: text('entity_type'), // match, assignment, profile, etc.
  entityId: uuid('entity_id'),
  properties: jsonb('properties').default(sql`'{}'::jsonb`), // Additional event data
  sessionId: text('session_id'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

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
export type AssignmentFieldVisibilityDefaults = typeof assignmentFieldVisibilityDefaults.$inferSelect;
export type InsertAssignmentFieldVisibilityDefaults = typeof assignmentFieldVisibilityDefaults.$inferInsert;
