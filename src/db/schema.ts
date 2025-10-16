import {
  pgTable,
  text,
  uuid,
  timestamp,
  boolean,
  jsonb,
  bigserial,
  primaryKey,
} from 'drizzle-orm/pg-core';

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
