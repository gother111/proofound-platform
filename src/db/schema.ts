import {
  pgTable,
  text,
  uuid,
  timestamp,
  boolean,
  jsonb,
  bigint,
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

export const canonicalVisibilityLevels = [
  'public',
  'link_only',
  'matched_org',
  'owner_only',
] as const;
export const canonicalRevealGates = ['none', 'match_exists', 'conversation_started'] as const;
export const canonicalOwnerTypes = ['individual_profile', 'organization'] as const;
export const canonicalProofSubjectTypes = [
  'individual_profile',
  'skill',
  'project',
  'impact_story',
  'experience',
  'education',
  'volunteering',
  'organization',
] as const;
export const canonicalProofArtifactKinds = [
  'link',
  'document',
  'image',
  'video',
  'credential',
  'reference',
  'assessment',
  'other',
] as const;
export const canonicalProofPackKinds = [
  'profile_export',
  'organization_export',
  'verification_bundle',
] as const;
export const canonicalProofPackPrimaryClaimTypes = [
  'contribution',
  'outcome',
  'credential_fact',
  'engagement_fact',
] as const;
export const canonicalProofPackLifecycleStates = [
  'draft',
  'ready',
  'published',
  'submitted',
  'withdrawn',
  'superseded',
  'archived',
] as const;
export const canonicalProofPackVerificationStatuses = [
  'unverified',
  'partially_verified',
  'verified',
  'disputed',
] as const;
export const canonicalProofPackItemClasses = [
  'file_upload',
  'url_link',
  'repo_activity',
  'case_fragment',
  'credential_evidence',
  'engagement_evidence',
  'reviewer_note',
] as const;
export const canonicalSubmissionKinds = [
  'assignment_section',
  'proof_card',
  'application_proof',
  'intro_proof',
  'verification_response_payload',
  'manual_upload',
] as const;
export const canonicalSubmissionStatuses = [
  'draft',
  'submitted',
  'under_review',
  'accepted',
  'rejected',
  'withdrawn',
  'superseded',
] as const;
export const canonicalSubmissionContextTypes = [
  'assignment',
  'assignment_invitation',
  'candidate_invite',
  'match',
  'intro',
  'application',
  'verification_request',
  'manual',
] as const;
export const canonicalVerificationKinds = [
  'veriff_identity',
  'linkedin_identity',
  'linkedin_workplace',
  'work_email',
  'skill_attestation_peer',
  'skill_attestation_manager',
  'impact_attestation',
  'org_domain',
  'org_registry_manual',
  'platform_manual_review',
] as const;
export const canonicalVerificationStatuses = [
  'pending',
  'verified',
  'expired',
  'superseded',
  'downgraded',
  'contradicted',
  'disputed',
  'revoked',
  'declined',
  'cancelled',
  'failed',
] as const;
export const canonicalVerificationSlots = [
  'individual.identity',
  'individual.workplace',
  'skill.attestation',
  'impact_story.attestation',
  'artifact.attestation',
  'organization.domain',
  'organization.platform_review',
] as const;
export const canonicalVerifierClasses = [
  'system_provider',
  'system_signal',
  'authenticated_manager',
  'authenticated_peer',
  'authenticated_external',
  'manual_platform_reviewer',
] as const;
export const canonicalAssignmentWorkflowStates = ['draft', 'active', 'hold', 'closed'] as const;
export const canonicalOrganizationReadinessStates = ['draft', 'org_ready'] as const;
export const canonicalAssignmentReadinessStates = [
  'draft',
  'assignment_ready',
  'review_ready',
] as const;
export const canonicalIntroWorkflowStates = [
  'pending_candidate_interest',
  'pending_org_interest',
  'mutual',
  'conversation_open',
  'interview_handoff',
  'withdrawn',
  'expired',
  'duplicate_candidate',
  'closed',
] as const;
export const canonicalInterviewWorkflowStates = [
  'scheduled',
  'completed',
  'cancelled',
  'no_show',
] as const;
export const canonicalDecisionWorkflowStates = [
  'pending',
  'advance',
  'hire',
  'hold',
  'hold_expired',
  'reject',
  'withdraw',
  'closed',
] as const;
export const canonicalEngagementTypeValues = [
  'full_time',
  'part_time',
  'contract_consulting',
  'fractional_project',
] as const;
export const canonicalEngagementVerificationWorkflowStates = [
  'pending_both_confirmations',
  'pending_candidate_confirmation',
  'pending_organization_confirmation',
  'verified',
] as const;
export const canonicalEngagementProofHookStatuses = ['not_ready', 'eligible'] as const;
export const canonicalInternalOpsQueueTypes = [
  'verification',
  'privacy_reveal_exception',
  'correction_revocation',
  'pilot_ops',
] as const;
export const canonicalInternalOpsQueueStatuses = [
  'open',
  'in_progress',
  'resolved',
  'cancelled',
] as const;
export const canonicalInternalOpsQueuePriorities = ['low', 'normal', 'high', 'urgent'] as const;
export const canonicalInternalOpsQueueEntityTypes = [
  'verification_request',
  'verification_bundle',
  'conversation',
  'decision',
  'engagement_verification',
  'match',
  'organization',
  'uploaded_file',
] as const;
export const canonicalConsentObligationStates = [
  'active',
  'expiring',
  'expired',
  'revoked',
] as const;
export const canonicalProfileLifecycleStates = [
  'draft',
  'active_private',
  'active_matchable',
  'restricted',
  'deleted',
] as const;
export const canonicalProofArtifactLifecycleStates = [
  'draft',
  'active',
  'expiring',
  'expired',
  'revoked',
  'deleted',
] as const;
export const canonicalMatchLifecycleStates = [
  'generated',
  'shortlisted',
  'passed',
  'intro_in_progress',
  'interview_in_progress',
  'stale',
  'hidden_due_to_policy',
  'closed',
] as const;
export const canonicalVerificationInviteLifecycleStates = [
  'pending',
  'opened',
  'accepted',
  'declined',
  'expired',
  'revoked',
  'cancelled',
] as const;
export const canonicalImpactVerificationInviteLifecycleStates = [
  ...canonicalVerificationInviteLifecycleStates,
  'failed',
] as const;
export const canonicalOrgInviteLifecycleStates = [
  'pending',
  'accepted',
  'expired',
  'revoked',
] as const;
export const canonicalCapabilityTokenStates = ['issued', 'redeemed', 'expired', 'revoked'] as const;
export const canonicalUploadMetadataStates = [
  'pending',
  'extracted',
  'suppressed',
  'failed',
] as const;
export const canonicalUploadAttachStates = [
  'pending',
  'attachable',
  'attached',
  'rejected',
] as const;
export const canonicalOrgRoleValues = ['org_owner', 'org_manager', 'org_reviewer'] as const;
export const canonicalOrgMembershipStates = [
  'invited_pending',
  'active',
  'inactive',
  'ownership_transfer_pending',
  'suspended',
  'removed',
  'declined',
  'expired',
  'revoked',
] as const;
export const canonicalExportLifecycleStates = [
  'requested',
  'preparing',
  'ready',
  'downloaded',
  'expired',
  'failed',
  'cancelled',
] as const;
export const canonicalImportLifecycleStates = [
  'uploaded',
  'validating',
  'awaiting_confirmation',
  'applying',
  'completed',
  'rejected',
  'expired',
  'failed',
  'cancelled',
] as const;
export const canonicalDeletionLifecycleStates = [
  'requested',
  'blocked_legal_hold',
  'processing',
  'deleted',
  'failed_requires_manual_review',
] as const;
export const canonicalResidualLifecycleObjectTypes = [
  'profile',
  'proof_artifact',
  'match',
  'verification_invite',
  'org_invite',
  'export',
  'import',
  'deletion',
] as const;
export const canonicalWorkflowActorTypes = [
  'candidate',
  'organization_member',
  'platform_admin',
  'system',
  'service_account',
] as const;
export const canonicalWorkflowAsyncJobTypes = [
  'intro_reminder',
  'decision_reminder',
  'expiry_transition',
  'verification_follow_up',
  'proof_freshness_nudge',
  'portfolio_index_refresh',
  'consent_prompt',
  'workflow_fanout',
] as const;
export const canonicalWorkflowAsyncJobStatuses = [
  'pending',
  'leased',
  'completed',
  'failed',
  'cancelled',
] as const;
export const publicPortfolioStates = [
  'unavailable',
  'public_link_only',
  'public_noindex',
  'public_indexable',
] as const;
export const orgTrustStatusValues = [
  'unverified',
  'pending',
  'domain_verified',
  'platform_reviewed',
] as const;
export const orgTrustTierValues = [
  'unreviewed',
  'basic_trusted',
  'reviewed',
  'restricted',
] as const;
export const assignmentCreatorRightsValues = ['default_creator_rights', 'alternate_terms'] as const;
export const assignmentOrgUsageRightsValues = [
  'default_org_usage_rights',
  'alternate_terms',
] as const;
export const assignmentCompensationTypeValues = [
  'unknown',
  'paid',
  'unpaid',
  'volunteer',
  'sponsored',
] as const;
export const assignmentCommercialityValues = [
  'unknown',
  'non_commercial',
  'commercial',
  'operationally_significant',
] as const;
export const assignmentSponsorCommercialStatusValues = [
  'not_required',
  'required',
  'satisfied',
] as const;
export const assignmentCrossBorderStatusValues = [
  'not_required',
  'required',
  'approved',
  'restricted',
] as const;
export const assignmentJurisdictionStatusValues = ['allowed', 'restricted'] as const;
export const assignmentSensitiveDomainValues = [
  'standard',
  'child_facing',
  'healthcare_care',
  'housing_crisis',
  'legal_immigration',
  'vulnerable_population',
] as const;
export const assignmentSensitiveDomainReviewValues = [
  'not_required',
  'required',
  'approved',
] as const;
export const assignmentPolicyAuditStateValues = ['clear', 'hold', 'blocked'] as const;
export const canonicalVerifierPrincipalTypes = [
  'user_account',
  'organization',
  'external_email',
  'platform_admin',
  'system',
] as const;
export const canonicalIntegrityStatuses = ['unknown', 'clear', 'warning', 'contradicted'] as const;
export const canonicalDisputeStates = [
  'none',
  'open',
  'under_review',
  'resolved_upheld',
  'resolved_downgraded',
  'resolved_revoked',
] as const;
export const canonicalContradictionTypes = [
  'identity_mismatch',
  'workplace_mismatch',
  'verifier_identity_mismatch',
  'relationship_mismatch',
  'subject_chronology_mismatch',
  'artifact_authenticity_concern',
  'org_domain_control_mismatch',
  'platform_review_evidence_invalidated',
] as const;
export const canonicalDisputeReasonCodes = [
  'wrong_person',
  'wrong_organization',
  'outdated_employment_or_role',
  'verifier_misattributed',
  'artifact_forged_or_incorrect',
  'unauthorized_or_abusive_request',
  'admin_review_error',
] as const;
export const canonicalDisputeResolutionActions = [
  'uphold',
  'request_refresh',
  'downgrade',
  'revoke',
  'supersede_with_corrected_record',
] as const;
export const verificationLogEntryTypes = [
  'record_created',
  'state_transition',
  'refresh_requested',
  'refresh_completed',
  'expired',
  'downgraded',
  'contradiction_detected',
  'dispute_opened',
  'dispute_updated',
  'dispute_resolved',
  'revoked',
  'superseded',
  'restored',
  'recomputed',
] as const;
export const matchReviewStageValues = [
  'blind_review',
  'shortlisted',
  'passed',
  'rejected',
  'closed',
] as const;
export const matchRevealScopeValues = ['blind', 'shortlist_identity', 'full_identity'] as const;
export const matchFullIdentityUnlockTriggerValues = [
  'mutual_interest',
  'conversation_reveal',
  'interview_scheduled',
  'policy_override',
] as const;
export const revealActorTypeValues = [
  'user_account',
  'organization',
  'platform_admin',
  'system',
] as const;
export const revealTriggerTypeValues = ['user', 'system', 'policy', 'automatic'] as const;
export const revealEventOutcomeValues = ['granted', 'denied', 'no_op'] as const;
export const matchReasonCategoryValues = [
  'positive_match',
  'constraint_mismatch',
  'workflow_decision',
  'manual_override',
  'fairness',
] as const;
export const matchReasonSourceValues = ['system', 'reviewer', 'policy'] as const;
export const fairnessStatusValues = ['pass', 'unavailable', 'elevated', 'breach'] as const;
export const matchScoreStateValues = [
  'generated',
  'stale',
  'recomputed',
  'hidden_due_to_policy',
] as const;
export const fairnessEvaluationScopeValues = ['ranking_snapshot'] as const;
export const fairnessRemediationActionValues = [
  'warning_issued',
  'ranking_suppressed',
  'admin_alert_sent',
  'acknowledged',
  'resolved',
  'recheck_requested',
] as const;
export const zenMilestoneTypes = [
  'rejection',
  'interview',
  'offer',
  'withdrawal',
  'no_show',
] as const;
export const zenAuditEventTypes = [
  'zen_opt_in_changed',
  'zen_export_requested',
  'zen_export_completed',
  'zen_delete_requested',
  'zen_delete_completed',
  'zen_checkin_written',
  'zen_reflection_written',
] as const;
export const proofTrustSnapshotContexts = ['portfolio', 'matching'] as const;
export const proofFreshnessStates = ['fresh', 'review_soon', 'stale', 'expired'] as const;
export const proofTrustMetricTypes = [
  'proof_coverage',
  'proof_quality',
  'proof_freshness',
  'verification_coverage',
  'time_to_verified',
  'trust_signal_coverage',
  'reveal_rate',
  'intro_expiry_rate',
  'withdrawal_rate',
  'no_show_rate',
  'override_rate',
  'portfolio_indexing_coverage',
] as const;
export const portfolioIndexingStates = ['unavailable', 'noindex', 'indexable'] as const;
export const portfolioRobotsStates = ['noindex_nofollow', 'index_follow'] as const;
export const portfolioSitemapStates = ['excluded', 'included'] as const;

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
  lifecycleState: text('lifecycle_state', {
    enum: canonicalProfileLifecycleStates,
  })
    .default('draft')
    .notNull(),
  publicPortfolioState: text('public_portfolio_state', {
    enum: publicPortfolioStates,
  })
    .default('unavailable')
    .notNull(),
  searchIndexingEnabledAt: timestamp('search_indexing_enabled_at'),
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
  matchingEnabled: boolean('matching_enabled').default(true),
  isBetaTesting: boolean('is_beta_testing').default(false).notNull(),
  // GDPR Account Deletion Support (Article 17: Right to Erasure)
  activatedAt: timestamp('activated_at'),
  matchableAt: timestamp('matchable_at'),
  restrictedAt: timestamp('restricted_at'),
  deletionRequestedAt: timestamp('deletion_requested_at'),
  deletionScheduledFor: timestamp('deletion_scheduled_for'),
  deletionReason: text('deletion_reason'),
  deletedAt: timestamp('deleted_at'),
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
  missionLinks: jsonb('mission_links'), // { values: string[], causes: string[] }
  visionLinks: jsonb('vision_links'), // { values: string[], causes: string[] }
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
  verificationTier: text('verification_tier', {
    enum: ['unverified', 'workplace_verified', 'identity_verified'],
  }).default('unverified'),
  verificationTierSource: text('verification_tier_source', {
    enum: ['linkedin_identity', 'linkedin_workplace', 'work_email', 'veriff', 'unknown'],
  }).default('unknown'),
  veriffSessionId: text('veriff_session_id'),
  verifiedAt: timestamp('verified_at'),
  workEmail: text('work_email'),
  workEmailVerified: boolean('work_email_verified').default(false),
  workEmailVerifiedAt: timestamp('work_email_verified_at'),
  workEmailReverifyDueAt: timestamp('work_email_reverify_due_at'),
  workEmailOrgId: uuid('work_email_org_id').references(() => organizations.id, {
    onDelete: 'set null',
  }),
  workEmailToken: text('work_email_token'),
  workEmailTokenHash: text('work_email_token_hash'),
  workEmailTokenExpires: timestamp('work_email_token_expires'),
  // Field-level visibility controls (PRD: Fine-grained privacy)
  fieldVisibility: jsonb('field_visibility'), // { fieldName: 'public' | 'network' | 'private' | 'hidden' }
  redactMode: boolean('redact_mode').default(false), // Quick-hide sensitive info
  // LinkedIn verification fields
  linkedinProfileUrl: text('linkedin_profile_url'),
  linkedinVerificationStatus: text('linkedin_verification_status', {
    enum: ['unverified', 'pending', 'verified', 'failed'],
  }).default('unverified'),
  linkedinVerificationLevel: text('linkedin_verification_level', {
    enum: ['unverified', 'pending', 'workplace', 'identity', 'failed'],
  }).default('unverified'),
  linkedinVerifiedAt: timestamp('linkedin_verified_at'),
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
  publicPortfolioState: text('public_portfolio_state', {
    enum: publicPortfolioStates,
  })
    .default('unavailable')
    .notNull(),
  searchIndexingEnabledAt: timestamp('search_indexing_enabled_at'),
  trustStatus: text('trust_status', {
    enum: orgTrustStatusValues,
  })
    .default('unverified')
    .notNull(),
  orgTrustTier: text('org_trust_tier', {
    enum: orgTrustTierValues,
  })
    .default('unreviewed')
    .notNull(),
  orgTrustTierReasonCode: text('org_trust_tier_reason_code'),
  orgTrustTierUpdatedAt: timestamp('org_trust_tier_updated_at'),
  trustStatusUpdatedAt: timestamp('trust_status_updated_at'),
  websiteVerifiedAt: timestamp('website_verified_at'),
  orgReadiness: text('org_readiness', {
    enum: canonicalOrganizationReadinessStates,
  })
    .default('draft')
    .notNull(),
  operatingRegion: text('operating_region'),
  legalName: text('legal_name'),
  displayName: text('display_name').notNull(),
  verified: boolean('verified').default(false),
  type: text('type', {
    enum: ['company', 'ngo', 'government', 'network', 'other'],
  }),
  logoUrl: text('logo_url'),
  coverImageUrl: text('cover_image_url'),
  tagline: text('tagline'),
  mission: text('mission'),
  workingContext: text('working_context'),
  hiringProcessSummary: text('hiring_process_summary'),
  vision: text('vision'),
  missionLinks: jsonb('mission_links'), // { values: string[], causes: string[] }
  visionLinks: jsonb('vision_links'), // { values: string[], causes: string[] }
  website: text('website'),
  // Business details
  industry: text('industry'),
  industryKey: text('industry_key'),
  industryLabel: text('industry_label'),
  industryLegacyText: text('industry_legacy_text'),
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

export const organizationTrustTierTransitions = pgTable(
  'organization_trust_tier_transitions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    previousTier: text('previous_tier', {
      enum: orgTrustTierValues,
    }),
    newTier: text('new_tier', {
      enum: orgTrustTierValues,
    }).notNull(),
    reasonCode: text('reason_code'),
    actorType: text('actor_type', {
      enum: canonicalWorkflowActorTypes,
    }).notNull(),
    actorId: uuid('actor_id').references(() => profiles.id, { onDelete: 'set null' }),
    metadata: jsonb('metadata')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    orgCreatedIdx: index('organization_trust_tier_transitions_org_created_idx').on(
      table.orgId,
      table.createdAt
    ),
  })
);

// Organization members
const organizationMembersBase = pgTable(
  'organization_members',
  {
    id: uuid('id').defaultRandom().notNull().unique(),
    orgId: uuid('org_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),
    role: text('role', {
      enum: canonicalOrgRoleValues,
    }).notNull(),
    state: text('state', {
      enum: canonicalOrgMembershipStates,
    })
      .default('invited_pending')
      .notNull(),
    invitedBy: uuid('invited_by').references(() => profiles.id, { onDelete: 'set null' }),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
    inactiveAt: timestamp('inactive_at', { withTimezone: true }),
    suspendedAt: timestamp('suspended_at', { withTimezone: true }),
    removedAt: timestamp('removed_at', { withTimezone: true }),
    removedBy: uuid('removed_by').references(() => profiles.id, { onDelete: 'set null' }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    declinedAt: timestamp('declined_at', { withTimezone: true }),
    expiredAt: timestamp('expired_at', { withTimezone: true }),
    ownershipTransferInitiatedAt: timestamp('ownership_transfer_initiated_at', {
      withTimezone: true,
    }),
    ownershipTransferAcceptedAt: timestamp('ownership_transfer_accepted_at', {
      withTimezone: true,
    }),
    ownershipTransferFromMembershipId: uuid('ownership_transfer_from_membership_id'),
    ownershipTransferTargetUserId: uuid('ownership_transfer_target_user_id').references(
      () => profiles.id,
      {
        onDelete: 'set null',
      }
    ),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    orgUserIdx: index('idx_organization_members_org_user').on(table.orgId, table.userId),
    orgStateIdx: index('idx_organization_members_org_state').on(table.orgId, table.state),
    userStateIdx: index('idx_organization_members_user_state').on(table.userId, table.state),
  })
);

export const organizationMembers = Object.assign(organizationMembersBase, {
  // Compatibility alias while callers migrate from status -> state.
  status: organizationMembersBase.state,
});

// Organization invitations
export const orgInvitations = pgTable('org_invitations', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id')
    .references(() => organizations.id, { onDelete: 'cascade' })
    .notNull(),
  membershipId: uuid('membership_id').references(() => organizationMembers.id, {
    onDelete: 'set null',
  }),
  email: text('email').notNull(),
  role: text('role', {
    enum: canonicalOrgRoleValues,
  }).notNull(),
  status: text('status', {
    enum: canonicalOrgInviteLifecycleStates,
  })
    .default('pending')
    .notNull(),
  token: text('token').unique(),
  tokenHash: text('token_hash'),
  capabilityTokenId: uuid('capability_token_id'),
  lastSentAt: timestamp('last_sent_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  acceptedAt: timestamp('accepted_at'),
  expiredAt: timestamp('expired_at'),
  acceptedByProfileId: uuid('accepted_by_profile_id').references(() => profiles.id, {
    onDelete: 'set null',
  }),
  revokedAt: timestamp('revoked_at'),
  revokedReason: text('revoked_reason'),
  invitedBy: uuid('invited_by').references(() => profiles.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Organization candidate invites (BYOC flow)
export const orgCandidateInvites = pgTable(
  'org_candidate_invites',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    inviteeEmail: text('invitee_email').notNull(),
    inviteeEmailNormalized: text('invitee_email_normalized').notNull(),
    tokenHash: text('token_hash').notNull().unique(),
    status: text('status', {
      enum: ['pending', 'claimed', 'proof_submitted', 'revoked', 'expired'],
    })
      .default('pending')
      .notNull(),
    flowType: text('flow_type', {
      enum: ['proof_card', 'test_match'],
    })
      .default('proof_card')
      .notNull(),
    assignmentId: uuid('assignment_id').references(() => assignments.id, { onDelete: 'set null' }),
    expiresAt: timestamp('expires_at').notNull(),
    invitedBy: uuid('invited_by').references(() => profiles.id, { onDelete: 'set null' }),
    claimedByProfileId: uuid('claimed_by_profile_id').references(() => profiles.id, {
      onDelete: 'set null',
    }),
    claimedAt: timestamp('claimed_at'),
    acceptedByProfileId: uuid('accepted_by_profile_id').references(() => profiles.id, {
      onDelete: 'set null',
    }),
    acceptedAt: timestamp('accepted_at'),
    matchId: uuid('match_id').references(() => matches.id, { onDelete: 'set null' }),
    conversationId: uuid('conversation_id').references(() => conversations.id, {
      onDelete: 'set null',
    }),
    proofSnippetId: uuid('proof_snippet_id'),
    capabilityTokenId: uuid('capability_token_id'),
    proofCapabilityTokenId: uuid('proof_capability_token_id'),
    proofShareToken: text('proof_share_token'),
    proofSubmittedAt: timestamp('proof_submitted_at'),
    revokedAt: timestamp('revoked_at'),
    publicSurfaceDisabledAt: timestamp('public_surface_disabled_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index('idx_org_candidate_invites_org_id').on(table.orgId),
    statusIdx: index('idx_org_candidate_invites_status').on(table.status),
    flowTypeIdx: index('idx_org_candidate_invites_flow_type').on(table.flowType),
    assignmentIdIdx: index('idx_org_candidate_invites_assignment_id').on(table.assignmentId),
    matchIdIdx: index('idx_org_candidate_invites_match_id').on(table.matchId),
    conversationIdIdx: index('idx_org_candidate_invites_conversation_id').on(table.conversationId),
    expiresAtIdx: index('idx_org_candidate_invites_expires_at').on(table.expiresAt),
  })
);

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
  experiences: text('experiences').default('private').notNull(),
  education: text('education').default('private').notNull(),
  volunteering: text('volunteering').default('private').notNull(),
  skills: text('skills').default('public').notNull(),
  impactStories: text('impact_stories').default('match_only').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const profileHandleHistory = pgTable(
  'profile_handle_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    profileId: uuid('profile_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),
    slug: text('slug').notNull().unique(),
    isActive: boolean('is_active').default(true).notNull(),
    redirectTargetSlug: text('redirect_target_slug'),
    retiredAt: timestamp('retired_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    profileIdIdx: index('idx_profile_handle_history_profile_id').on(table.profileId),
  })
);

export const organizationSlugHistory = pgTable(
  'organization_slug_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    slug: text('slug').notNull().unique(),
    isActive: boolean('is_active').default(true).notNull(),
    redirectTargetSlug: text('redirect_target_slug'),
    retiredAt: timestamp('retired_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index('idx_organization_slug_history_org_id').on(table.orgId),
  })
);

export const profileSnippets = pgTable(
  'profile_snippets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),
    shareToken: text('share_token').notNull().unique(),
    fields: jsonb('fields')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    theme: text('theme', {
      enum: ['light', 'dark', 'auto'],
    })
      .default('auto')
      .notNull(),
    format: text('format', {
      enum: ['card', 'mini', 'full'],
    })
      .default('card')
      .notNull(),
    profileType: text('profile_type', {
      enum: ['individual', 'organization'],
    })
      .default('individual')
      .notNull(),
    orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('idx_profile_snippets_user_id').on(table.userId),
    shareTokenIdx: index('idx_profile_snippets_share_token').on(table.shareToken),
    profileTypeIdx: index('idx_profile_snippets_profile_type').on(table.profileType),
    orgIdIdx: index('idx_profile_snippets_org_id').on(table.orgId),
    expiresAtIdx: index('idx_profile_snippets_expires_at').on(table.expiresAt),
  })
);

export const profileSnippetViews = pgTable(
  'profile_snippet_views',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    snippetId: uuid('snippet_id')
      .references(() => profileSnippets.id, { onDelete: 'cascade' })
      .notNull(),
    viewerIp: text('viewer_ip'),
    viewerUserAgent: text('viewer_user_agent'),
    referrer: text('referrer'),
    viewedAt: timestamp('viewed_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    snippetIdIdx: index('idx_profile_snippet_views_snippet_id').on(table.snippetId),
    viewedAtIdx: index('idx_profile_snippet_views_viewed_at').on(table.viewedAt),
  })
);

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

export const capabilityTokens = pgTable(
  'capability_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tokenClass: text('token_class').notNull(),
    tokenHash: text('token_hash').notNull().unique(),
    state: text('state', {
      enum: canonicalCapabilityTokenStates,
    })
      .default('issued')
      .notNull(),
    sourceTable: text('source_table'),
    sourceId: uuid('source_id'),
    actionScope: text('action_scope').notNull(),
    scopeKey: text('scope_key'),
    subjectType: text('subject_type').notNull(),
    subjectId: uuid('subject_id'),
    actorBinding: text('actor_binding', {
      enum: [
        'none',
        'email_hash',
        'authenticated_profile',
        'authenticated_principal',
        'email_then_profile_lock',
      ],
    })
      .default('none')
      .notNull(),
    actorEmailHash: text('actor_email_hash'),
    actorProfileId: uuid('actor_profile_id').references(() => profiles.id, {
      onDelete: 'set null',
    }),
    actorOrgId: uuid('actor_org_id').references(() => organizations.id, {
      onDelete: 'set null',
    }),
    principalType: text('principal_type', {
      enum: ['user_account', 'organization', 'external_email', 'platform_admin', 'system'],
    }),
    singleUse: boolean('single_use').default(true).notNull(),
    maxUses: integer('max_uses').default(1).notNull(),
    redeemedCount: integer('redeemed_count').default(0).notNull(),
    attemptCount: integer('attempt_count').default(0).notNull(),
    lastAttemptAt: timestamp('last_attempt_at', { withTimezone: true }),
    suspiciousFlag: boolean('suspicious_flag').default(false).notNull(),
    redeemSessionNonceHash: text('redeem_session_nonce_hash'),
    redeemSessionNonceExpiresAt: timestamp('redeem_session_nonce_expires_at', {
      withTimezone: true,
    }),
    issuedAt: timestamp('issued_at', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    firstRedeemedAt: timestamp('first_redeemed_at', { withTimezone: true }),
    lastRedeemedAt: timestamp('last_redeemed_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    revokedReason: text('revoked_reason'),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
    lastSeenIpHash: text('last_seen_ip_hash'),
    lastSeenUserAgentHash: text('last_seen_user_agent_hash'),
    metadata: jsonb('metadata')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    classHashIdx: index('capability_tokens_class_hash_idx').on(table.tokenClass, table.tokenHash),
    sourceIdx: index('capability_tokens_source_idx').on(table.sourceTable, table.sourceId),
    subjectIdx: index('capability_tokens_subject_idx').on(table.subjectType, table.subjectId),
    expiryIdx: index('capability_tokens_expiry_idx').on(table.expiresAt, table.revokedAt),
    stateIdx: index('capability_tokens_state_idx').on(
      table.state,
      table.tokenClass,
      table.expiresAt
    ),
    scopeIdx: index('capability_tokens_scope_idx').on(
      table.tokenClass,
      table.scopeKey,
      table.actorEmailHash
    ),
  })
);

export const capabilityTokenEvents = pgTable(
  'capability_token_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    capabilityTokenId: uuid('capability_token_id').references(() => capabilityTokens.id, {
      onDelete: 'set null',
    }),
    eventType: text('event_type').notNull(),
    actorProfileId: uuid('actor_profile_id').references(() => profiles.id, {
      onDelete: 'set null',
    }),
    actorOrgId: uuid('actor_org_id').references(() => organizations.id, {
      onDelete: 'set null',
    }),
    actorEmailHash: text('actor_email_hash'),
    ipHash: text('ip_hash'),
    userAgentHash: text('user_agent_hash'),
    metadata: jsonb('metadata')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tokenCreatedIdx: index('capability_token_events_token_created_idx').on(
      table.capabilityTokenId,
      table.createdAt
    ),
    typeCreatedIdx: index('capability_token_events_type_created_idx').on(
      table.eventType,
      table.createdAt
    ),
  })
);

export const uploadedFiles = pgTable(
  'uploaded_files',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerType: text('owner_type').notNull(),
    ownerId: uuid('owner_id').notNull(),
    sourceSurface: text('source_surface').notNull(),
    uploadKind: text('upload_kind').notNull(),
    originalFilename: text('original_filename').notNull(),
    originalFilenameSensitive: boolean('original_filename_sensitive').default(true).notNull(),
    sanitizedFilename: text('sanitized_filename').notNull(),
    declaredMime: text('declared_mime'),
    detectedMime: text('detected_mime'),
    sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
    sha256: text('sha256').notNull(),
    quarantineBucket: text('quarantine_bucket'),
    quarantinePath: text('quarantine_path'),
    durableBucket: text('durable_bucket'),
    durablePath: text('durable_path'),
    publicBucket: text('public_bucket'),
    publicPath: text('public_path'),
    lifecycleState: text('lifecycle_state').notNull(),
    safetyStatus: text('safety_status').default('pending').notNull(),
    safetyReason: text('safety_reason'),
    scanEngine: text('scan_engine'),
    scanCompletedAt: timestamp('scan_completed_at', { withTimezone: true }),
    metadataStatus: text('metadata_status', {
      enum: canonicalUploadMetadataStates,
    })
      .default('pending')
      .notNull(),
    attachStatus: text('attach_status', {
      enum: canonicalUploadAttachStates,
    })
      .default('pending')
      .notNull(),
    safeForPublic: boolean('safe_for_public').default(false).notNull(),
    metadataExtractedAt: timestamp('metadata_extracted_at', { withTimezone: true }),
    promotedAt: timestamp('promoted_at', { withTimezone: true }),
    attachedAt: timestamp('attached_at', { withTimezone: true }),
    attachedSubjectType: text('attached_subject_type'),
    attachedSubjectId: uuid('attached_subject_id'),
    proofPackId: uuid('proof_pack_id').references(() => proofPacks.id, { onDelete: 'set null' }),
    replacedByFileId: uuid('replaced_by_file_id'),
    deleteRequestedAt: timestamp('delete_requested_at', { withTimezone: true }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    metadata: jsonb('metadata')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    ownerIdx: index('uploaded_files_owner_idx').on(table.ownerType, table.ownerId, table.createdAt),
    lifecycleIdx: index('uploaded_files_lifecycle_idx').on(
      table.lifecycleState,
      table.safetyStatus,
      table.createdAt
    ),
    subjectIdx: index('uploaded_files_subject_idx').on(
      table.attachedSubjectType,
      table.attachedSubjectId
    ),
    attachStatusIdx: index('uploaded_files_attach_status_idx').on(
      table.attachStatus,
      table.metadataStatus,
      table.lifecycleState,
      table.createdAt
    ),
  })
);

export const uploadedFileEvents = pgTable(
  'uploaded_file_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    uploadedFileId: uuid('uploaded_file_id')
      .references(() => uploadedFiles.id, { onDelete: 'cascade' })
      .notNull(),
    eventType: text('event_type').notNull(),
    metadata: jsonb('metadata')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    fileCreatedIdx: index('uploaded_file_events_file_created_idx').on(
      table.uploadedFileId,
      table.createdAt
    ),
  })
);

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
  engagementType: text('engagement_type'),
  radiusKm: integer('radius_km'),
  hoursMin: integer('hours_min'),
  hoursMax: integer('hours_max'),
  compMin: integer('comp_min'),
  compMax: integer('comp_max'),
  compPeriod: text('comp_period', {
    enum: ['annual', 'monthly', 'hourly'],
  })
    .default('annual')
    .notNull(),
  currency: text('currency').default('USD'),
  desiredRoles: text('desired_roles')
    .array()
    .default(sql`'{}'::text[]`)
    .notNull(),
  desiredIndustries: text('desired_industries')
    .array()
    .default(sql`'{}'::text[]`)
    .notNull(),
  preferredIndustryKeys: text('preferred_industry_keys')
    .array()
    .default(sql`'{}'::text[]`)
    .notNull(),
  preferredIndustryLabels: text('preferred_industry_labels')
    .array()
    .default(sql`'{}'::text[]`)
    .notNull(),
  preferredIndustryLegacy: text('preferred_industry_legacy')
    .array()
    .default(sql`'{}'::text[]`)
    .notNull(),
  avoidIndustryKeys: text('avoid_industry_keys')
    .array()
    .default(sql`'{}'::text[]`)
    .notNull(),
  avoidIndustryLabels: text('avoid_industry_labels')
    .array()
    .default(sql`'{}'::text[]`)
    .notNull(),
  avoidIndustryLegacy: text('avoid_industry_legacy')
    .array()
    .default(sql`'{}'::text[]`)
    .notNull(),
  orgTypes: text('org_types')
    .array()
    .default(sql`'{}'::text[]`)
    .notNull(),
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
    enum: ['project', 'certification', 'media', 'reference', 'link', 'document'],
  })
    .notNull()
    .default('link'),
  title: text('title').notNull(),
  description: text('description'),
  url: text('url'),
  filePath: text('file_path'),
  issuedDate: date('issued_date'),
  expiresDate: date('expires_date'),
  verified: boolean('verified').default(false).notNull(),
  metadata: jsonb('metadata').default(sql`'{}'::jsonb`),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const proofArtifacts = pgTable(
  'proof_artifacts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerType: text('owner_type', {
      enum: canonicalOwnerTypes,
    }).notNull(),
    ownerId: uuid('owner_id').notNull(),
    subjectType: text('subject_type', {
      enum: canonicalProofSubjectTypes,
    }).notNull(),
    subjectId: uuid('subject_id'),
    artifactKind: text('artifact_kind', {
      enum: canonicalProofArtifactKinds,
    }).notNull(),
    lifecycleState: text('lifecycle_state', {
      enum: canonicalProofArtifactLifecycleStates,
    })
      .default('draft')
      .notNull(),
    title: text('title').notNull(),
    description: text('description'),
    sourceUrl: text('source_url'),
    storagePath: text('storage_path'),
    uploadedFileId: uuid('uploaded_file_id'),
    mimeType: text('mime_type'),
    activatedAt: timestamp('activated_at', { withTimezone: true }),
    issuedAt: timestamp('issued_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    expiredAt: timestamp('expired_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    visibility: text('visibility', {
      enum: canonicalVisibilityLevels,
    })
      .default('owner_only')
      .notNull(),
    revealGate: text('reveal_gate', {
      enum: canonicalRevealGates,
    })
      .default('none')
      .notNull(),
    metadata: jsonb('metadata')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    legacySourceTable: text('legacy_source_table'),
    legacySourceId: uuid('legacy_source_id'),
    legacySourcePath: text('legacy_source_path'),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    deleteReason: text('delete_reason'),
    cleanupStartedAt: timestamp('cleanup_started_at', { withTimezone: true }),
    cleanupCompletedAt: timestamp('cleanup_completed_at', { withTimezone: true }),
    exportExcludedReason: text('export_excluded_reason'),
    publicSurfaceDisabledAt: timestamp('public_surface_disabled_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    ownerIdx: index('idx_proof_artifacts_owner').on(table.ownerType, table.ownerId),
    subjectIdx: index('idx_proof_artifacts_subject').on(table.subjectType, table.subjectId),
    visibilityIdx: index('idx_proof_artifacts_visibility').on(table.visibility, table.revealGate),
    legacySourceUnique: unique().on(
      table.legacySourceTable,
      table.legacySourceId,
      table.legacySourcePath
    ),
  })
);

export const proofPacks = pgTable(
  'proof_packs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerType: text('owner_type', {
      enum: canonicalOwnerTypes,
    }).notNull(),
    ownerId: uuid('owner_id').notNull(),
    packKind: text('pack_kind', {
      enum: canonicalProofPackKinds,
    }).notNull(),
    primarySubjectType: text('primary_subject_type', {
      enum: canonicalProofSubjectTypes,
    }).notNull(),
    primarySubjectId: uuid('primary_subject_id').notNull(),
    lifecycleState: text('lifecycle_state', {
      enum: canonicalProofPackLifecycleStates,
    })
      .default('draft')
      .notNull(),
    primaryClaimType: text('primary_claim_type', {
      enum: canonicalProofPackPrimaryClaimTypes,
    }).default('contribution'),
    title: text('title').notNull(),
    summary: text('summary'),
    contextJson: jsonb('context_json')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    roleContext: text('role_context'),
    ownershipStatement: text('ownership_statement'),
    timeframeStart: date('timeframe_start'),
    timeframeEnd: date('timeframe_end'),
    timeframeLabel: text('timeframe_label'),
    evidenceSummary: text('evidence_summary'),
    outcomesSummary: text('outcomes_summary'),
    verificationSummary: text('verification_summary'),
    visibility: text('visibility', {
      enum: canonicalVisibilityLevels,
    })
      .default('owner_only')
      .notNull(),
    revealGate: text('reveal_gate', {
      enum: canonicalRevealGates,
    })
      .default('none')
      .notNull(),
    shareTokenHash: text('share_token_hash'),
    shareExpiresAt: timestamp('share_expires_at', { withTimezone: true }),
    createdBy: uuid('created_by').references(() => profiles.id, { onDelete: 'set null' }),
    verificationStatus: text('verification_status', {
      enum: canonicalProofPackVerificationStatuses,
    })
      .default('unverified')
      .notNull(),
    freshnessState: text('freshness_state', {
      enum: proofFreshnessStates,
    })
      .default('stale')
      .notNull(),
    proofQualityScore: numeric('proof_quality_score'),
    schemaVersion: text('schema_version').default('proof_pack/v2').notNull(),
    freshnessEvaluatedAt: timestamp('freshness_evaluated_at', { withTimezone: true }),
    lastVerifiedAt: timestamp('last_verified_at', { withTimezone: true }),
    lastRefreshedAt: timestamp('last_refreshed_at', { withTimezone: true }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    withdrawnAt: timestamp('withdrawn_at', { withTimezone: true }),
    supersededAt: timestamp('superseded_at', { withTimezone: true }),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    portabilityMeta: jsonb('portability_meta')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    metadata: jsonb('metadata')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    legacySourceTable: text('legacy_source_table'),
    legacySourceId: uuid('legacy_source_id'),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    deleteReason: text('delete_reason'),
    cleanupStartedAt: timestamp('cleanup_started_at', { withTimezone: true }),
    cleanupCompletedAt: timestamp('cleanup_completed_at', { withTimezone: true }),
    exportExcludedReason: text('export_excluded_reason'),
    publicSurfaceDisabledAt: timestamp('public_surface_disabled_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    ownerIdx: index('idx_proof_packs_owner').on(table.ownerType, table.ownerId),
    subjectIdx: index('idx_proof_packs_primary_subject').on(
      table.primarySubjectType,
      table.primarySubjectId
    ),
    visibilityIdx: index('idx_proof_packs_visibility').on(table.visibility, table.revealGate),
    shareTokenHashIdx: index('idx_proof_packs_share_token_hash').on(table.shareTokenHash),
    legacySourceUnique: unique().on(table.legacySourceTable, table.legacySourceId),
  })
);

export const proofPackItems = pgTable(
  'proof_pack_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    packId: uuid('pack_id')
      .references(() => proofPacks.id, { onDelete: 'cascade' })
      .notNull(),
    artifactId: uuid('artifact_id')
      .references(() => proofArtifacts.id, { onDelete: 'cascade' })
      .notNull(),
    position: integer('position').default(0).notNull(),
    itemClass: text('item_class', {
      enum: canonicalProofPackItemClasses,
    }).default('file_upload'),
    subtypeMetadata: jsonb('subtype_metadata')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    includedFields: jsonb('included_fields')
      .default(sql`'[]'::jsonb`)
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    packIdx: index('idx_proof_pack_items_pack').on(table.packId, table.position),
    artifactIdx: index('idx_proof_pack_items_artifact').on(table.artifactId),
    packArtifactUnique: unique().on(table.packId, table.artifactId),
  })
);

export const submissions = pgTable(
  'submissions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    submissionKind: text('submission_kind', {
      enum: canonicalSubmissionKinds,
    }).notNull(),
    status: text('status', {
      enum: canonicalSubmissionStatuses,
    })
      .default('submitted')
      .notNull(),
    ownerType: text('owner_type', {
      enum: canonicalOwnerTypes,
    }).notNull(),
    ownerId: uuid('owner_id').notNull(),
    submittedByUserId: uuid('submitted_by_user_id').references(() => profiles.id, {
      onDelete: 'set null',
    }),
    submittedByOrgId: uuid('submitted_by_org_id').references(() => organizations.id, {
      onDelete: 'set null',
    }),
    assignmentId: uuid('assignment_id').references(() => assignments.id, {
      onDelete: 'set null',
    }),
    proofPackId: uuid('proof_pack_id').references(() => proofPacks.id, {
      onDelete: 'set null',
    }),
    requestContextType: text('request_context_type', {
      enum: canonicalSubmissionContextTypes,
    }).notNull(),
    requestContextId: uuid('request_context_id'),
    matchId: uuid('match_id').references(() => matches.id, {
      onDelete: 'set null',
    }),
    introId: uuid('intro_id').references(() => introWorkflows.id, {
      onDelete: 'set null',
    }),
    applicationId: uuid('application_id'),
    legacySourceTable: text('legacy_source_table'),
    legacySourceId: uuid('legacy_source_id'),
    submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    withdrawnAt: timestamp('withdrawn_at', { withTimezone: true }),
    supersededAt: timestamp('superseded_at', { withTimezone: true }),
    supersededBySubmissionId: uuid('superseded_by_submission_id'),
    metadata: jsonb('metadata')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    ownerSubmittedIdx: index('idx_submissions_owner_submitted').on(
      table.ownerType,
      table.ownerId,
      table.submittedAt
    ),
    assignmentSubmittedIdx: index('idx_submissions_assignment_submitted').on(
      table.assignmentId,
      table.submittedAt
    ),
    requestContextIdx: index('idx_submissions_request_context').on(
      table.requestContextType,
      table.requestContextId
    ),
    proofPackIdx: index('idx_submissions_proof_pack').on(table.proofPackId),
    legacySourceUnique: unique().on(table.legacySourceTable, table.legacySourceId),
  })
);

export const submissionArtifacts = pgTable(
  'submission_artifacts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    submissionId: uuid('submission_id')
      .references(() => submissions.id, { onDelete: 'cascade' })
      .notNull(),
    artifactId: uuid('artifact_id')
      .references(() => proofArtifacts.id, { onDelete: 'cascade' })
      .notNull(),
    position: integer('position').default(0).notNull(),
    includedFields: jsonb('included_fields')
      .default(sql`'[]'::jsonb`)
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    submissionIdx: index('idx_submission_artifacts_submission').on(
      table.submissionId,
      table.position
    ),
    artifactIdx: index('idx_submission_artifacts_artifact').on(table.artifactId),
    submissionArtifactUnique: unique().on(table.submissionId, table.artifactId),
  })
);

// Skill Verification Requests - peer/manager/external verification requests
export const customVerificationRequests = pgTable('custom_verification_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  requesterProfileId: uuid('requester_profile_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  verifierEmail: text('verifier_email').notNull(),
  verifierProfileId: uuid('verifier_profile_id').references(() => profiles.id, {
    onDelete: 'set null',
  }),
  verifierRelationship: text('verifier_relationship', {
    enum: [
      'colleague',
      'peer',
      'manager',
      'skip_level_manager',
      'direct_report',
      'client',
      'partner',
      'mentor_coach',
      'external',
    ],
  }).notNull(),
  message: text('message'),
  requestKind: text('request_kind', {
    enum: ['generic_verification', 'human_observed_attestation'],
  })
    .notNull()
    .default('generic_verification'),
  attestationRequest: jsonb('attestation_request'),
  attestationResponse: jsonb('attestation_response'),
  tokenHash: text('token_hash').notNull().unique(),
  status: text('status', {
    enum: canonicalVerificationInviteLifecycleStates,
  })
    .notNull()
    .default('pending'),
  capabilityTokenId: uuid('capability_token_id'),
  openedAt: timestamp('opened_at'),
  respondedAt: timestamp('responded_at'),
  responseMessage: text('response_message'),
  expiresAt: timestamp('expires_at')
    .default(sql`NOW() + INTERVAL '14 days'`)
    .notNull(),
  expiredAt: timestamp('expired_at'),
  revokedAt: timestamp('revoked_at'),
  revokedReason: text('revoked_reason'),
  cancelledAt: timestamp('cancelled_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const customVerificationRequestItems = pgTable(
  'custom_verification_request_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    requestId: uuid('request_id')
      .references(() => customVerificationRequests.id, { onDelete: 'cascade' })
      .notNull(),
    artifactType: text('artifact_type', {
      enum: ['skill', 'experience', 'education', 'impact_story', 'project', 'volunteering'],
    }).notNull(),
    artifactId: uuid('artifact_id').notNull(),
    displayLabel: text('display_label').notNull(),
    status: text('status', {
      enum: ['pending', 'accepted', 'declined', 'expired'],
    })
      .notNull()
      .default('pending'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    requestArtifactUnique: unique().on(table.requestId, table.artifactType, table.artifactId),
  })
);

export const skillVerificationRequests = pgTable('skill_verification_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  skillId: uuid('skill_id')
    .references(() => skills.id, { onDelete: 'cascade' })
    .notNull(),
  requesterProfileId: uuid('requester_profile_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  requesterEmailSnapshot: text('requester_email_snapshot'),
  requesterDomainSnapshot: text('requester_domain_snapshot'),
  verificationToken: text('verification_token').notNull(),
  verifierEmail: text('verifier_email').notNull(),
  verifierDomainSnapshot: text('verifier_domain_snapshot'),
  verifierProfileId: uuid('verifier_profile_id').references(() => profiles.id, {
    onDelete: 'set null',
  }),
  verifierSource: text('verifier_source', {
    enum: ['peer', 'manager', 'external'],
  }).notNull(),
  verifierRelationship: text('verifier_relationship'),
  message: text('message'),
  requestKind: text('request_kind', {
    enum: ['generic_verification', 'human_observed_attestation'],
  })
    .notNull()
    .default('generic_verification'),
  attestationRequest: jsonb('attestation_request'),
  attestationResponse: jsonb('attestation_response'),
  riskSignals: jsonb('risk_signals')
    .default(sql`'{}'::jsonb`)
    .notNull(),
  requiresAuthenticatedVerifier: boolean('requires_authenticated_verifier')
    .default(false)
    .notNull(),
  integrityStatus: text('integrity_status', {
    enum: ['clear', 'flagged'],
  })
    .default('clear')
    .notNull(),
  integrityReason: text('integrity_reason'),
  integrityMeta: jsonb('integrity_meta')
    .default(sql`'{}'::jsonb`)
    .notNull(),
  integrityFlaggedAt: timestamp('integrity_flagged_at'),
  requesterIpHash: text('requester_ip_hash'),
  requesterUserAgentHash: text('requester_user_agent_hash'),
  customRequestId: uuid('custom_request_id').references(() => customVerificationRequests.id, {
    onDelete: 'set null',
  }),
  status: text('status', {
    enum: canonicalVerificationInviteLifecycleStates,
  })
    .notNull()
    .default('pending'),
  capabilityTokenId: uuid('capability_token_id'),
  openedAt: timestamp('opened_at'),
  respondedAt: timestamp('responded_at'),
  responseMessage: text('response_message'),
  responderIpHash: text('responder_ip_hash'),
  responderUserAgentHash: text('responder_user_agent_hash'),
  responseAuthMethod: text('response_auth_method', {
    enum: ['token', 'authenticated'],
  }),
  responseActorEmail: text('response_actor_email'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').default(sql`NOW() + INTERVAL '30 days'`),
  expiredAt: timestamp('expired_at'),
  revokedAt: timestamp('revoked_at'),
  revokedReason: text('revoked_reason'),
  cancelledAt: timestamp('cancelled_at'),
});

// Impact Story Verification Requests - claim-based verification for impact stories
export const impactStoryVerificationRequests = pgTable('impact_story_verification_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  impactStoryId: uuid('impact_story_id')
    .references(() => impactStories.id, { onDelete: 'cascade' })
    .notNull(),
  requesterProfileId: uuid('requester_profile_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  requesterEmailSnapshot: text('requester_email_snapshot'),
  requesterDomainSnapshot: text('requester_domain_snapshot'),
  verifierEmail: text('verifier_email').notNull(),
  verifierDomainSnapshot: text('verifier_domain_snapshot'),
  verifierProfileId: uuid('verifier_profile_id').references(() => profiles.id, {
    onDelete: 'set null',
  }),
  verifierName: text('verifier_name'),
  verifierRelationship: text('verifier_relationship'),
  message: text('message'),
  token: text('token').notNull().unique(),
  status: text('status', {
    enum: canonicalImpactVerificationInviteLifecycleStates,
  })
    .notNull()
    .default('pending'),
  capabilityTokenId: uuid('capability_token_id'),
  riskSignals: jsonb('risk_signals')
    .default(sql`'{}'::jsonb`)
    .notNull(),
  requiresAuthenticatedVerifier: boolean('requires_authenticated_verifier')
    .default(false)
    .notNull(),
  integrityStatus: text('integrity_status', {
    enum: ['clear', 'flagged'],
  })
    .notNull()
    .default('clear'),
  integrityReason: text('integrity_reason'),
  integrityMeta: jsonb('integrity_meta')
    .default(sql`'{}'::jsonb`)
    .notNull(),
  integrityFlaggedAt: timestamp('integrity_flagged_at'),
  requesterIpHash: text('requester_ip_hash'),
  requesterUserAgentHash: text('requester_user_agent_hash'),
  expiresAt: timestamp('expires_at').notNull(),
  openedAt: timestamp('opened_at'),
  expiredAt: timestamp('expired_at'),
  claimSnapshot: jsonb('claim_snapshot')
    .default(sql`'{}'::jsonb`)
    .notNull(),
  responseMessage: text('response_message'),
  respondedAt: timestamp('responded_at'),
  responderIpHash: text('responder_ip_hash'),
  responderUserAgentHash: text('responder_user_agent_hash'),
  responseAuthMethod: text('response_auth_method', {
    enum: ['token', 'authenticated'],
  }),
  responseActorEmail: text('response_actor_email'),
  revokedAt: timestamp('revoked_at'),
  revokedReason: text('revoked_reason'),
  cancelledAt: timestamp('cancelled_at'),
  emailSentAt: timestamp('email_sent_at'),
  emailError: text('email_error'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Impact Story Verification Responses - verifier-level claim confirmations
export const impactStoryVerificationResponses = pgTable('impact_story_verification_responses', {
  id: uuid('id').defaultRandom().primaryKey(),
  requestId: uuid('request_id')
    .references(() => impactStoryVerificationRequests.id, { onDelete: 'cascade' })
    .notNull(),
  responderEmail: text('responder_email'),
  action: text('action', {
    enum: ['accept', 'decline'],
  }).notNull(),
  confirmedRole: boolean('confirmed_role').default(false).notNull(),
  confirmedArtifacts: boolean('confirmed_artifacts').default(false).notNull(),
  confirmedOutcomeIds: text('confirmed_outcome_ids')
    .array()
    .default(sql`'{}'::text[]`)
    .notNull(),
  responseNote: text('response_note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const residualLifecycleTransitions = pgTable(
  'residual_lifecycle_transitions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    objectType: text('object_type', {
      enum: canonicalResidualLifecycleObjectTypes,
    }).notNull(),
    objectId: uuid('object_id').notNull(),
    fromState: text('from_state'),
    toState: text('to_state').notNull(),
    trigger: text('trigger').notNull(),
    reasonCode: text('reason_code'),
    actorType: text('actor_type', {
      enum: canonicalWorkflowActorTypes,
    }).notNull(),
    actorId: uuid('actor_id').references(() => profiles.id, { onDelete: 'set null' }),
    metadata: jsonb('metadata')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    objectCreatedIdx: index('residual_lifecycle_transitions_object_created_idx').on(
      table.objectType,
      table.objectId,
      table.createdAt
    ),
  })
);

export const dataPortabilityExports = pgTable(
  'data_portability_exports',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    profileId: uuid('profile_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),
    lifecycleState: text('lifecycle_state', {
      enum: canonicalExportLifecycleStates,
    })
      .default('requested')
      .notNull(),
    requestedBy: uuid('requested_by').references(() => profiles.id, { onDelete: 'set null' }),
    lifecycleOperationId: uuid('lifecycle_operation_id'),
    exportFormat: text('export_format').default('json').notNull(),
    payloadVersion: text('payload_version').default('3.0.0').notNull(),
    payloadChecksum: text('payload_checksum'),
    requestedAt: timestamp('requested_at', { withTimezone: true }).defaultNow().notNull(),
    preparingAt: timestamp('preparing_at', { withTimezone: true }),
    readyAt: timestamp('ready_at', { withTimezone: true }),
    downloadedAt: timestamp('downloaded_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    failedAt: timestamp('failed_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    failureCode: text('failure_code'),
    metadata: jsonb('metadata')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    profileRequestedIdx: index('data_portability_exports_profile_requested_idx').on(
      table.profileId,
      table.requestedAt
    ),
    lifecycleIdx: index('data_portability_exports_lifecycle_idx').on(
      table.lifecycleState,
      table.expiresAt
    ),
  })
);

export const dataPortabilityImports = pgTable(
  'data_portability_imports',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    profileId: uuid('profile_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),
    lifecycleState: text('lifecycle_state', {
      enum: canonicalImportLifecycleStates,
    })
      .default('uploaded')
      .notNull(),
    requestedBy: uuid('requested_by').references(() => profiles.id, { onDelete: 'set null' }),
    sourceFilename: text('source_filename'),
    sourceChecksum: text('source_checksum'),
    importMode: text('import_mode', {
      enum: ['merge', 'replace'],
    })
      .default('merge')
      .notNull(),
    uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow().notNull(),
    validatedAt: timestamp('validated_at', { withTimezone: true }),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    consentConfirmedAt: timestamp('consent_confirmed_at', { withTimezone: true }),
    appliedAt: timestamp('applied_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    expiredAt: timestamp('expired_at', { withTimezone: true }),
    failedAt: timestamp('failed_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    failureCode: text('failure_code'),
    metadata: jsonb('metadata')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    profileUploadedIdx: index('data_portability_imports_profile_uploaded_idx').on(
      table.profileId,
      table.uploadedAt
    ),
    lifecycleIdx: index('data_portability_imports_lifecycle_idx').on(
      table.lifecycleState,
      table.uploadedAt
    ),
  })
);

export const profileDeletionRequests = pgTable(
  'profile_deletion_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    profileId: uuid('profile_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),
    lifecycleState: text('lifecycle_state', {
      enum: canonicalDeletionLifecycleStates,
    })
      .default('requested')
      .notNull(),
    requestedBy: uuid('requested_by').references(() => profiles.id, { onDelete: 'set null' }),
    lifecycleOperationId: uuid('lifecycle_operation_id'),
    reason: text('reason'),
    requestedAt: timestamp('requested_at', { withTimezone: true }).defaultNow().notNull(),
    processingStartedAt: timestamp('processing_started_at', { withTimezone: true }),
    blockedAt: timestamp('blocked_at', { withTimezone: true }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    failedAt: timestamp('failed_at', { withTimezone: true }),
    failureCode: text('failure_code'),
    blockReason: text('block_reason'),
    metadata: jsonb('metadata')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    profileRequestedIdx: index('profile_deletion_requests_profile_requested_idx').on(
      table.profileId,
      table.requestedAt
    ),
    lifecycleIdx: index('profile_deletion_requests_lifecycle_idx').on(
      table.lifecycleState,
      table.requestedAt
    ),
  })
);

export const verificationRecords = pgTable(
  'verification_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerType: text('owner_type', {
      enum: canonicalOwnerTypes,
    }).notNull(),
    ownerId: uuid('owner_id').notNull(),
    subjectType: text('subject_type', {
      enum: canonicalProofSubjectTypes,
    }).notNull(),
    subjectId: uuid('subject_id').notNull(),
    proofArtifactId: uuid('proof_artifact_id').references(() => proofArtifacts.id, {
      onDelete: 'set null',
    }),
    verificationSlot: text('verification_slot', {
      enum: canonicalVerificationSlots,
    }),
    verificationKind: text('verification_kind', {
      enum: canonicalVerificationKinds,
    }).notNull(),
    status: text('status', {
      enum: canonicalVerificationStatuses,
    })
      .default('pending')
      .notNull(),
    verifierPrincipalType: text('verifier_principal_type', {
      enum: canonicalVerifierPrincipalTypes,
    }).notNull(),
    verifierClass: text('verifier_class', {
      enum: canonicalVerifierClasses,
    }).default('system_signal'),
    verifierProfileId: uuid('verifier_profile_id').references(() => profiles.id, {
      onDelete: 'set null',
    }),
    verifierOrgId: uuid('verifier_org_id').references(() => organizations.id, {
      onDelete: 'set null',
    }),
    verifierEmailHash: text('verifier_email_hash'),
    verifierDomainSnapshot: text('verifier_domain_snapshot'),
    integrityStatus: text('integrity_status', {
      enum: canonicalIntegrityStatuses,
    })
      .default('unknown')
      .notNull(),
    integrityReason: text('integrity_reason'),
    disputeState: text('dispute_state', {
      enum: canonicalDisputeStates,
    })
      .default('none')
      .notNull(),
    badgeSemanticsVersion: integer('badge_semantics_version').default(2).notNull(),
    riskSignals: jsonb('risk_signals')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    claimSnapshot: jsonb('claim_snapshot')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    sourceRequestTable: text('source_request_table'),
    sourceRequestId: uuid('source_request_id'),
    sourceResponseTable: text('source_response_table'),
    sourceResponseId: uuid('source_response_id'),
    requestedAt: timestamp('requested_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    requestExpiresAt: timestamp('request_expires_at', { withTimezone: true }),
    followUpDueAt: timestamp('follow_up_due_at', { withTimezone: true }),
    lastFollowUpAt: timestamp('last_follow_up_at', { withTimezone: true }),
    lastRefreshedAt: timestamp('last_refreshed_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    expiredAt: timestamp('expired_at', { withTimezone: true }),
    supersededAt: timestamp('superseded_at', { withTimezone: true }),
    supersededByVerificationId: uuid('superseded_by_verification_id'),
    downgradedAt: timestamp('downgraded_at', { withTimezone: true }),
    contradictedAt: timestamp('contradicted_at', { withTimezone: true }),
    contradictedByVerificationId: uuid('contradicted_by_verification_id'),
    disputedAt: timestamp('disputed_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    failureCode: text('failure_code'),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    metadata: jsonb('metadata')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    ownerIdx: index('idx_verification_records_owner').on(table.ownerType, table.ownerId),
    subjectIdx: index('idx_verification_records_subject').on(table.subjectType, table.subjectId),
    proofArtifactIdx: index('idx_verification_records_artifact').on(table.proofArtifactId),
    statusIdx: index('idx_verification_records_status').on(table.status, table.verificationKind),
    slotIdx: index('idx_verification_records_slot').on(
      table.ownerType,
      table.ownerId,
      table.verificationSlot,
      table.updatedAt
    ),
    sourceRequestUnique: unique().on(
      table.sourceRequestTable,
      table.sourceRequestId,
      table.subjectType,
      table.subjectId
    ),
  })
);

export const verificationContradictions = pgTable(
  'verification_contradictions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    verificationRecordId: uuid('verification_record_id')
      .references(() => verificationRecords.id, { onDelete: 'cascade' })
      .notNull(),
    contradictingVerificationRecordId: uuid('contradicting_verification_record_id').references(
      () => verificationRecords.id,
      { onDelete: 'set null' }
    ),
    contradictionType: text('contradiction_type', {
      enum: canonicalContradictionTypes,
    }).notNull(),
    severity: text('severity', {
      enum: ['warning', 'material'],
    })
      .default('material')
      .notNull(),
    detectedBy: text('detected_by', {
      enum: ['system', 'profile_change', 'verifier_change', 'admin_review', 'imported_update'],
    }).notNull(),
    detectedAt: timestamp('detected_at', { withTimezone: true }).defaultNow().notNull(),
    status: text('status', {
      enum: ['open', 'reviewing', 'resolved'],
    })
      .default('open')
      .notNull(),
    reasonCode: text('reason_code'),
    metadata: jsonb('metadata')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    verificationIdx: index('verification_contradictions_verification_idx').on(
      table.verificationRecordId,
      table.detectedAt
    ),
    contradictingIdx: index('verification_contradictions_contradicting_idx').on(
      table.contradictingVerificationRecordId
    ),
  })
);

export const verificationDisputes = pgTable(
  'verification_disputes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    verificationRecordId: uuid('verification_record_id')
      .references(() => verificationRecords.id, { onDelete: 'cascade' })
      .notNull(),
    disputeState: text('dispute_state', {
      enum: canonicalDisputeStates,
    })
      .default('open')
      .notNull(),
    disputeReasonCode: text('dispute_reason_code', {
      enum: canonicalDisputeReasonCodes,
    }).notNull(),
    openedByType: text('opened_by_type', {
      enum: ['subject_owner', 'organization_admin', 'original_verifier', 'platform_admin'],
    }).notNull(),
    openedByProfileId: uuid('opened_by_profile_id').references(() => profiles.id, {
      onDelete: 'set null',
    }),
    openedByOrgId: uuid('opened_by_org_id').references(() => organizations.id, {
      onDelete: 'set null',
    }),
    openedAt: timestamp('opened_at', { withTimezone: true }).defaultNow().notNull(),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    resolutionAction: text('resolution_action', {
      enum: canonicalDisputeResolutionActions,
    }),
    resolvedByProfileId: uuid('resolved_by_profile_id').references(() => profiles.id, {
      onDelete: 'set null',
    }),
    supersedingVerificationRecordId: uuid('superseding_verification_record_id').references(
      () => verificationRecords.id,
      { onDelete: 'set null' }
    ),
    note: text('note'),
    evidenceSnapshot: jsonb('evidence_snapshot')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    metadata: jsonb('metadata')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    verificationIdx: index('verification_disputes_verification_idx').on(
      table.verificationRecordId,
      table.openedAt
    ),
    stateIdx: index('verification_disputes_state_idx').on(table.disputeState, table.updatedAt),
  })
);

export const verificationStateTransitions = pgTable(
  'verification_state_transitions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    verificationRecordId: uuid('verification_record_id')
      .references(() => verificationRecords.id, { onDelete: 'cascade' })
      .notNull(),
    fromState: text('from_state', {
      enum: canonicalVerificationStatuses,
    }),
    toState: text('to_state', {
      enum: canonicalVerificationStatuses,
    }).notNull(),
    trigger: text('trigger').notNull(),
    reasonCode: text('reason_code'),
    actorType: text('actor_type', {
      enum: canonicalWorkflowActorTypes,
    }).notNull(),
    actorId: uuid('actor_id').references(() => profiles.id, { onDelete: 'set null' }),
    metadata: jsonb('metadata')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    verificationCreatedAtIdx: index(
      'verification_state_transitions_verification_created_at_idx'
    ).on(table.verificationRecordId, table.createdAt),
  })
);

export const verificationLogEntries = pgTable(
  'verification_log_entries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    verificationRecordId: uuid('verification_record_id')
      .references(() => verificationRecords.id, { onDelete: 'cascade' })
      .notNull(),
    sequenceNumber: integer('sequence_number').notNull(),
    entryType: text('entry_type', {
      enum: verificationLogEntryTypes,
    }).notNull(),
    fromStatus: text('from_status', {
      enum: canonicalVerificationStatuses,
    }),
    toStatus: text('to_status', {
      enum: canonicalVerificationStatuses,
    }),
    reasonCode: text('reason_code'),
    actorType: text('actor_type', {
      enum: canonicalWorkflowActorTypes,
    }).notNull(),
    actorId: uuid('actor_id').references(() => profiles.id, { onDelete: 'set null' }),
    relatedContradictionId: uuid('related_contradiction_id').references(
      () => verificationContradictions.id,
      { onDelete: 'set null' }
    ),
    relatedDisputeId: uuid('related_dispute_id').references(() => verificationDisputes.id, {
      onDelete: 'set null',
    }),
    relatedVerificationRecordId: uuid('related_verification_record_id').references(
      () => verificationRecords.id,
      { onDelete: 'set null' }
    ),
    recomputeBatchId: text('recompute_batch_id'),
    metadata: jsonb('metadata')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    verificationSequenceUnique: unique().on(table.verificationRecordId, table.sequenceNumber),
    verificationOccurredIdx: index('idx_verification_log_entries_verification_occurred').on(
      table.verificationRecordId,
      table.occurredAt
    ),
    entryTypeOccurredIdx: index('idx_verification_log_entries_entry_type_occurred').on(
      table.entryType,
      table.occurredAt
    ),
  })
);

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
    enum: canonicalAssignmentWorkflowStates,
  })
    .default('draft')
    .notNull(),
  heldAt: timestamp('held_at', { withTimezone: true }),
  holdUntil: timestamp('hold_until', { withTimezone: true }),
  holdReason: text('hold_reason'),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  closedReason: text('closed_reason'),
  // Assignment creation workflow fields
  creationStatus: text('creation_status', {
    enum: canonicalAssignmentReadinessStates,
  })
    .default('draft')
    .notNull(),
  builderMode: text('builder_mode', { enum: ['basic', 'advanced'] })
    .default('basic')
    .notNull(),
  engagementType: text('engagement_type', {
    enum: canonicalEngagementTypeValues,
  }),
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
  policyVersion: text('policy_version').default('mvp_trust_v1').notNull(),
  creatorRightsPolicy: text('creator_rights_policy', {
    enum: assignmentCreatorRightsValues,
  })
    .default('default_creator_rights')
    .notNull(),
  orgUsageRightsPolicy: text('org_usage_rights_policy', {
    enum: assignmentOrgUsageRightsValues,
  })
    .default('default_org_usage_rights')
    .notNull(),
  alternateTermsRecordedAt: timestamp('alternate_terms_recorded_at', { withTimezone: true }),
  alternateTermsSummary: text('alternate_terms_summary'),
  compensationType: text('compensation_type', {
    enum: assignmentCompensationTypeValues,
  })
    .default('unknown')
    .notNull(),
  commerciality: text('commerciality', {
    enum: assignmentCommercialityValues,
  })
    .default('unknown')
    .notNull(),
  sponsorCommercialStatus: text('sponsor_commercial_status', {
    enum: assignmentSponsorCommercialStatusValues,
  })
    .default('not_required')
    .notNull(),
  crossBorderStatus: text('cross_border_status', {
    enum: assignmentCrossBorderStatusValues,
  })
    .default('not_required')
    .notNull(),
  jurisdictionStatus: text('jurisdiction_status', {
    enum: assignmentJurisdictionStatusValues,
  })
    .default('allowed')
    .notNull(),
  sensitiveDomain: text('sensitive_domain', {
    enum: assignmentSensitiveDomainValues,
  })
    .default('standard')
    .notNull(),
  sensitiveDomainReviewStatus: text('sensitive_domain_review_status', {
    enum: assignmentSensitiveDomainReviewValues,
  })
    .default('not_required')
    .notNull(),
  policyAuditState: text('policy_audit_state', {
    enum: assignmentPolicyAuditStateValues,
  })
    .default('clear')
    .notNull(),
  policyReasonCodes: text('policy_reason_codes')
    .array()
    .default(sql`'{}'::text[]`)
    .notNull(),
  policyAuditMeta: jsonb('policy_audit_meta')
    .default(sql`'{}'::jsonb`)
    .notNull(),
  operationalFallbackMode: text('operational_fallback_mode'),
  introHoldTargetCount: integer('intro_hold_target_count'),
  introHoldCurrentCount: integer('intro_hold_current_count'),
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

export const assignmentStateTransitions = pgTable(
  'assignment_state_transitions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    assignmentId: uuid('assignment_id')
      .references(() => assignments.id, { onDelete: 'cascade' })
      .notNull(),
    fromState: text('from_state', {
      enum: canonicalAssignmentWorkflowStates,
    }),
    toState: text('to_state', {
      enum: canonicalAssignmentWorkflowStates,
    }).notNull(),
    trigger: text('trigger').notNull(),
    reasonCode: text('reason_code'),
    actorType: text('actor_type', {
      enum: canonicalWorkflowActorTypes,
    }).notNull(),
    actorId: uuid('actor_id').references(() => profiles.id, { onDelete: 'set null' }),
    metadata: jsonb('metadata')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    assignmentCreatedAtIdx: index('assignment_state_transitions_assignment_created_at_idx').on(
      table.assignmentId,
      table.createdAt
    ),
  })
);

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
    lifecycleState: text('lifecycle_state', {
      enum: canonicalMatchLifecycleStates,
    })
      .default('generated')
      .notNull(),
    score: numeric('score').notNull(),
    scoreTotal: integer('score_total'),
    scoreState: text('score_state', {
      enum: matchScoreStateValues,
    }),
    scoreVersion: text('score_version'),
    modelVersion: text('model_version'),
    explanationVersion: text('explanation_version'),
    fairnessCheckVersion: text('fairness_check_version'),
    fairnessStatus: text('fairness_status', {
      enum: fairnessStatusValues,
    }),
    fairnessEvaluatedAt: timestamp('fairness_evaluated_at', { withTimezone: true }),
    inputsHash: text('inputs_hash'),
    reasonCodes: text('reason_codes')
      .array()
      .default(sql`'{}'::text[]`),
    staleReasonCodes: text('stale_reason_codes')
      .array()
      .default(sql`'{}'::text[]`),
    generatedAt: timestamp('generated_at', { withTimezone: true }),
    shortlistedAt: timestamp('shortlisted_at', { withTimezone: true }),
    passedAt: timestamp('passed_at', { withTimezone: true }),
    introStartedAt: timestamp('intro_started_at', { withTimezone: true }),
    interviewStartedAt: timestamp('interview_started_at', { withTimezone: true }),
    staleAt: timestamp('stale_at', { withTimezone: true }),
    recomputedAt: timestamp('recomputed_at', { withTimezone: true }),
    hiddenDueToPolicyAt: timestamp('hidden_due_to_policy_at', { withTimezone: true }),
    closedAt: timestamp('closed_at', { withTimezone: true }),
    closeReason: text('close_reason'),
    hiddenDueToPolicyReasonCodes: text('hidden_due_to_policy_reason_codes')
      .array()
      .default(sql`'{}'::text[]`),
    subscoresJson: jsonb('subscores_json')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    scoreSnapshotJson: jsonb('score_snapshot_json')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    vector: jsonb('vector').notNull(), // Subscores + details
    weights: jsonb('weights').notNull(),
    isTestMatch: boolean('is_test_match').default(false).notNull(),
    snoozedUntil: timestamp('snoozed_until'), // When match should reappear (null = not snoozed)
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    assignmentProfileUnique: unique().on(table.assignmentId, table.profileId),
    // Performance indexes
    profileIdIdx: index('matches_profile_id_idx').on(table.profileId),
    assignmentIdIdx: index('matches_assignment_id_idx').on(table.assignmentId),
    scoreIdx: index('matches_score_idx').on(table.score),
    scoreTotalIdx: index('matches_score_total_idx').on(table.scoreTotal),
    scoreStateIdx: index('matches_score_state_idx').on(table.scoreState),
    isTestMatchIdx: index('matches_is_test_match_idx').on(table.isTestMatch),
    scoreVersionIdx: index('matches_score_version_idx').on(table.scoreVersion),
    generatedAtIdx: index('matches_generated_at_idx').on(table.generatedAt),
    staleAtIdx: index('matches_stale_at_idx').on(table.staleAt),
    fairnessStatusIdx: index('matches_fairness_status_idx').on(table.fairnessStatus),
  })
);

export const matchReviewStates = pgTable(
  'match_review_states',
  {
    matchId: uuid('match_id')
      .primaryKey()
      .references(() => matches.id, { onDelete: 'cascade' }),
    assignmentId: uuid('assignment_id')
      .references(() => assignments.id, { onDelete: 'cascade' })
      .notNull(),
    profileId: uuid('profile_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),
    orgId: uuid('org_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    reviewStage: text('review_stage', {
      enum: matchReviewStageValues,
    })
      .default('blind_review')
      .notNull(),
    revealScope: text('reveal_scope', {
      enum: matchRevealScopeValues,
    })
      .default('blind')
      .notNull(),
    shortlistedAt: timestamp('shortlisted_at', { withTimezone: true }),
    shortlistedBy: uuid('shortlisted_by').references(() => profiles.id, { onDelete: 'set null' }),
    decisionAt: timestamp('decision_at', { withTimezone: true }),
    decisionBy: uuid('decision_by').references(() => profiles.id, { onDelete: 'set null' }),
    fullIdentityUnlockedAt: timestamp('full_identity_unlocked_at', { withTimezone: true }),
    fullIdentityUnlockedBy: uuid('full_identity_unlocked_by').references(() => profiles.id, {
      onDelete: 'set null',
    }),
    fullIdentityUnlockTrigger: text('full_identity_unlock_trigger', {
      enum: matchFullIdentityUnlockTriggerValues,
    }),
    operationalFallbackMode: text('operational_fallback_mode'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    assignmentStageIdx: index('match_review_states_assignment_stage_idx').on(
      table.assignmentId,
      table.reviewStage
    ),
    orgStageIdx: index('match_review_states_org_stage_idx').on(table.orgId, table.reviewStage),
    profileIdx: index('match_review_states_profile_idx').on(table.profileId),
    revealScopeIdx: index('match_review_states_reveal_scope_idx').on(table.revealScope),
    fallbackModeIdx: index('match_review_states_operational_fallback_mode_idx').on(
      table.operationalFallbackMode,
      table.updatedAt
    ),
  })
);

export const introWorkflows = pgTable(
  'intro_workflows',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    assignmentId: uuid('assignment_id')
      .references(() => assignments.id, { onDelete: 'cascade' })
      .notNull(),
    candidateProfileId: uuid('candidate_profile_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),
    orgId: uuid('org_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    state: text('state', {
      enum: canonicalIntroWorkflowStates,
    })
      .default('pending_org_interest')
      .notNull(),
    matchId: uuid('match_id').references(() => matches.id, { onDelete: 'set null' }),
    conversationId: uuid('conversation_id').references(() => conversations.id, {
      onDelete: 'set null',
    }),
    candidateInviteId: uuid('candidate_invite_id').references(() => orgCandidateInvites.id, {
      onDelete: 'set null',
    }),
    duplicateOfIntroId: uuid('duplicate_of_intro_id'),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    withdrawnAt: timestamp('withdrawn_at', { withTimezone: true }),
    withdrawnByActorType: text('withdrawn_by_actor_type', {
      enum: canonicalWorkflowActorTypes,
    }),
    withdrawnByActorId: uuid('withdrawn_by_actor_id').references(() => profiles.id, {
      onDelete: 'set null',
    }),
    closeReason: text('close_reason'),
    closedAt: timestamp('closed_at', { withTimezone: true }),
    lastActivityAt: timestamp('last_activity_at', { withTimezone: true }).defaultNow().notNull(),
    metadata: jsonb('metadata')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    assignmentCandidateIdx: index('intro_workflows_assignment_candidate_idx').on(
      table.assignmentId,
      table.candidateProfileId
    ),
    orgStateIdx: index('intro_workflows_org_state_idx').on(table.orgId, table.state),
    matchIdx: index('intro_workflows_match_idx').on(table.matchId),
    conversationIdx: index('intro_workflows_conversation_idx').on(table.conversationId),
    inviteIdx: index('intro_workflows_invite_idx').on(table.candidateInviteId),
  })
);

export const introWorkflowStateTransitions = pgTable(
  'intro_workflow_state_transitions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    introWorkflowId: uuid('intro_workflow_id')
      .references(() => introWorkflows.id, { onDelete: 'cascade' })
      .notNull(),
    fromState: text('from_state', {
      enum: canonicalIntroWorkflowStates,
    }),
    toState: text('to_state', {
      enum: canonicalIntroWorkflowStates,
    }).notNull(),
    trigger: text('trigger').notNull(),
    reasonCode: text('reason_code'),
    actorType: text('actor_type', {
      enum: canonicalWorkflowActorTypes,
    }).notNull(),
    actorId: uuid('actor_id').references(() => profiles.id, { onDelete: 'set null' }),
    metadata: jsonb('metadata')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    introCreatedAtIdx: index('intro_workflow_state_transitions_intro_created_at_idx').on(
      table.introWorkflowId,
      table.createdAt
    ),
  })
);

export const revealEvents = pgTable(
  'reveal_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    matchId: uuid('match_id')
      .references(() => matches.id, { onDelete: 'cascade' })
      .notNull(),
    assignmentId: uuid('assignment_id')
      .references(() => assignments.id, { onDelete: 'cascade' })
      .notNull(),
    profileId: uuid('profile_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),
    orgId: uuid('org_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    actorId: uuid('actor_id').references(() => profiles.id, { onDelete: 'set null' }),
    actorRole: text('actor_role'),
    actorType: text('actor_type', {
      enum: revealActorTypeValues,
    }).notNull(),
    triggerType: text('trigger_type', {
      enum: revealTriggerTypeValues,
    }).notNull(),
    requestedScope: text('requested_scope', {
      enum: matchRevealScopeValues,
    }).notNull(),
    grantedScope: text('granted_scope', {
      enum: matchRevealScopeValues,
    }).notNull(),
    reasonCode: text('reason_code').notNull(),
    sourceSurface: text('source_surface'),
    contextJson: jsonb('context_json')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    outcome: text('outcome', {
      enum: revealEventOutcomeValues,
    }).notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    matchOccurredIdx: index('reveal_events_match_occurred_idx').on(table.matchId, table.occurredAt),
    profileOccurredIdx: index('reveal_events_profile_occurred_idx').on(
      table.profileId,
      table.occurredAt
    ),
    orgOccurredIdx: index('reveal_events_org_occurred_idx').on(table.orgId, table.occurredAt),
    outcomeIdx: index('reveal_events_outcome_idx').on(table.outcome, table.occurredAt),
  })
);

export const matchReasonLedger = pgTable(
  'match_reason_ledger',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    matchId: uuid('match_id')
      .references(() => matches.id, { onDelete: 'cascade' })
      .notNull(),
    assignmentId: uuid('assignment_id')
      .references(() => assignments.id, { onDelete: 'cascade' })
      .notNull(),
    profileId: uuid('profile_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),
    category: text('category', {
      enum: matchReasonCategoryValues,
    }).notNull(),
    reasonCode: text('reason_code').notNull(),
    source: text('source', {
      enum: matchReasonSourceValues,
    }).notNull(),
    payloadJson: jsonb('payload_json')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    importance: integer('importance').default(50).notNull(),
    createdBy: uuid('created_by').references(() => profiles.id, { onDelete: 'set null' }),
    noteHash: text('note_hash'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    matchCreatedIdx: index('match_reason_ledger_match_created_idx').on(
      table.matchId,
      table.createdAt
    ),
    assignmentCategoryIdx: index('match_reason_ledger_assignment_category_idx').on(
      table.assignmentId,
      table.category,
      table.createdAt
    ),
    profileCategoryIdx: index('match_reason_ledger_profile_category_idx').on(
      table.profileId,
      table.category,
      table.createdAt
    ),
  })
);

export const fairnessEvaluations = pgTable(
  'fairness_evaluations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    assignmentId: uuid('assignment_id')
      .references(() => assignments.id, { onDelete: 'cascade' })
      .notNull(),
    scope: text('scope', {
      enum: fairnessEvaluationScopeValues,
    })
      .default('ranking_snapshot')
      .notNull(),
    checkVersion: text('check_version').notNull(),
    status: text('status', {
      enum: fairnessStatusValues,
    }).notNull(),
    metricsJson: jsonb('metrics_json')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    thresholdsJson: jsonb('thresholds_json')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    eligibleCohortCount: integer('eligible_cohort_count').default(0).notNull(),
    sampleSizesJson: jsonb('sample_sizes_json')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    insufficientReason: text('insufficient_reason'),
    evaluatedAt: timestamp('evaluated_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    assignmentEvaluatedIdx: index('fairness_evaluations_assignment_evaluated_idx').on(
      table.assignmentId,
      table.evaluatedAt
    ),
    statusIdx: index('fairness_evaluations_status_idx').on(table.status, table.evaluatedAt),
  })
);

export const fairnessRemediationEvents = pgTable(
  'fairness_remediation_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    fairnessEvaluationId: uuid('fairness_evaluation_id').references(() => fairnessEvaluations.id, {
      onDelete: 'cascade',
    }),
    assignmentId: uuid('assignment_id')
      .references(() => assignments.id, { onDelete: 'cascade' })
      .notNull(),
    actorId: uuid('actor_id').references(() => profiles.id, { onDelete: 'set null' }),
    actorType: text('actor_type', {
      enum: revealActorTypeValues,
    }).notNull(),
    actionType: text('action_type', {
      enum: fairnessRemediationActionValues,
    }).notNull(),
    detailsJson: jsonb('details_json')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    assignmentOccurredIdx: index('fairness_remediation_events_assignment_occurred_idx').on(
      table.assignmentId,
      table.occurredAt
    ),
    actionOccurredIdx: index('fairness_remediation_events_action_occurred_idx').on(
      table.actionType,
      table.occurredAt
    ),
  })
);

// Durable queue for background match refresh processing
export const matchingRefreshJobs = pgTable(
  'matching_refresh_jobs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    profileId: uuid('profile_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),
    status: text('status', {
      enum: ['pending', 'leased', 'completed', 'failed'],
    })
      .default('pending')
      .notNull(),
    attempts: integer('attempts').default(0).notNull(),
    maxAttempts: integer('max_attempts').default(3).notNull(),
    nextRunAt: timestamp('next_run_at', { withTimezone: true }).defaultNow().notNull(),
    leaseExpiresAt: timestamp('lease_expires_at', { withTimezone: true }),
    lastError: text('last_error'),
    source: text('source').default('cron').notNull(),
    payload: jsonb('payload')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    statusNextRunIdx: index('matching_refresh_jobs_status_next_run_idx').on(
      table.status,
      table.nextRunAt
    ),
    profileIdIdx: index('matching_refresh_jobs_profile_id_idx').on(table.profileId),
  })
);

// Shared durable queue for internal Python batch and reporting jobs
export const pythonInternalJobs = pgTable(
  'python_internal_jobs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    jobType: text('job_type', {
      enum: [
        'document_intelligence_skill_report',
        'document_intelligence_wizard_report',
        'document_intelligence_quality_report',
        'document_intelligence_extract_only',
      ],
    }).notNull(),
    status: text('status', {
      enum: ['pending', 'leased', 'completed', 'failed'],
    })
      .default('pending')
      .notNull(),
    attempts: integer('attempts').default(0).notNull(),
    maxAttempts: integer('max_attempts').default(3).notNull(),
    nextRunAt: timestamp('next_run_at', { withTimezone: true }).defaultNow().notNull(),
    leaseExpiresAt: timestamp('lease_expires_at', { withTimezone: true }),
    lastError: text('last_error'),
    source: text('source').default('manual').notNull(),
    payload: jsonb('payload')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    result: jsonb('result'),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    statusNextRunIdx: index('python_internal_jobs_status_next_run_idx').on(
      table.status,
      table.nextRunAt
    ),
    typeStatusNextRunIdx: index('python_internal_jobs_type_status_next_run_idx').on(
      table.jobType,
      table.status,
      table.nextRunAt
    ),
  })
);

export const workflowAsyncJobs = pgTable(
  'workflow_async_jobs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    jobType: text('job_type', {
      enum: canonicalWorkflowAsyncJobTypes,
    }).notNull(),
    status: text('status', {
      enum: canonicalWorkflowAsyncJobStatuses,
    })
      .default('pending')
      .notNull(),
    assignmentId: uuid('assignment_id').references(() => assignments.id, { onDelete: 'set null' }),
    introWorkflowId: uuid('intro_workflow_id').references(() => introWorkflows.id, {
      onDelete: 'set null',
    }),
    interviewId: uuid('interview_id').references(() => interviews.id, { onDelete: 'set null' }),
    decisionId: uuid('decision_id'),
    verificationRecordId: uuid('verification_record_id').references(() => verificationRecords.id, {
      onDelete: 'set null',
    }),
    consentObligationId: uuid('consent_obligation_id'),
    profileId: uuid('profile_id').references(() => profiles.id, { onDelete: 'set null' }),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).defaultNow().notNull(),
    leaseExpiresAt: timestamp('lease_expires_at', { withTimezone: true }),
    attempts: integer('attempts').default(0).notNull(),
    maxAttempts: integer('max_attempts').default(5).notNull(),
    idempotencyKey: text('idempotency_key').notNull().unique(),
    dedupeKey: text('dedupe_key'),
    correlationId: text('correlation_id'),
    sourceState: text('source_state'),
    payload: jsonb('payload')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    result: jsonb('result'),
    lastError: text('last_error'),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    statusScheduledIdx: index('workflow_async_jobs_status_scheduled_idx').on(
      table.status,
      table.scheduledAt
    ),
    typeStatusScheduledIdx: index('workflow_async_jobs_type_status_scheduled_idx').on(
      table.jobType,
      table.status,
      table.scheduledAt
    ),
    dedupeIdx: index('workflow_async_jobs_dedupe_idx').on(table.dedupeKey, table.status),
    correlationIdx: index('workflow_async_jobs_correlation_idx').on(table.correlationId),
  })
);

// CV import AI monthly budgets (Gemini primary/secondary key slots)
export const cvImportAiBudgets = pgTable(
  'cv_import_ai_budgets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    provider: text('provider', { enum: ['gemini'] })
      .default('gemini')
      .notNull(),
    keySlot: text('key_slot', { enum: ['primary', 'secondary'] }).notNull(),
    monthStart: date('month_start').notNull(),
    currency: text('currency').default('SEK').notNull(),
    monthlyLimitOre: integer('monthly_limit_ore').notNull(),
    spentOre: integer('spent_ore').default(0).notNull(),
    reservedOre: integer('reserved_ore').default(0).notNull(),
    status: text('status', { enum: ['active', 'exhausted', 'disabled'] })
      .default('active')
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    providerSlotMonthUnique: unique().on(table.provider, table.keySlot, table.monthStart),
    monthStartIdx: index('idx_cv_import_ai_budgets_month_start').on(table.monthStart),
    providerSlotStatusIdx: index('idx_cv_import_ai_budgets_provider_slot').on(
      table.provider,
      table.keySlot,
      table.status
    ),
  })
);

// CV import AI usage/cost logs (with idempotency replay support)
export const cvImportAiUsageLogs = pgTable(
  'cv_import_ai_usage_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    requestId: text('request_id').notNull(),
    idempotencyKey: text('idempotency_key').notNull(),
    userId: uuid('user_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),
    route: text('route').notNull(),
    status: text('status', {
      enum: [
        'in_progress',
        'success',
        'fallback_success',
        'budget_blocked',
        'quota_failover',
        'invalid_json',
        'model_error',
        'ocr_failed',
        'failed',
      ],
    })
      .default('in_progress')
      .notNull(),
    provider: text('provider', { enum: ['gemini'] })
      .default('gemini')
      .notNull(),
    keySlot: text('key_slot', { enum: ['primary', 'secondary'] }),
    model: text('model'),
    promptTokens: integer('prompt_tokens'),
    outputTokens: integer('output_tokens'),
    totalTokens: integer('total_tokens'),
    costOre: integer('cost_ore').default(0).notNull(),
    reservedOre: integer('reserved_ore').default(0).notNull(),
    currency: text('currency').default('SEK').notNull(),
    errorCode: text('error_code'),
    errorMessage: text('error_message'),
    latencyMs: integer('latency_ms'),
    responsePayload: jsonb('response_payload'),
    metadata: jsonb('metadata')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userRouteIdempotencyUnique: unique().on(table.userId, table.route, table.idempotencyKey),
    createdAtIdx: index('idx_cv_import_ai_usage_logs_created_at').on(table.createdAt),
    userCreatedAtIdx: index('idx_cv_import_ai_usage_logs_user_created_at').on(
      table.userId,
      table.createdAt
    ),
    routeStatusIdx: index('idx_cv_import_ai_usage_logs_route_status').on(
      table.route,
      table.status,
      table.createdAt
    ),
    keySlotIdx: index('idx_cv_import_ai_usage_logs_key_slot').on(table.keySlot, table.createdAt),
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
  timelineStructured: jsonb('timeline_structured')
    .default(sql`'{}'::jsonb`)
    .notNull(),
  affiliationType: text('affiliation_type', {
    enum: ['organization', 'individual'],
  }),
  affiliationDetails: text('affiliation_details'),
  roleTitle: text('role_title'),
  roleScope: text('role_scope', {
    enum: ['owned', 'co_led', 'contributed'],
  }),
  primaryCause: text('primary_cause'),
  secondaryCauses: text('secondary_causes')
    .array()
    .default(sql`'{}'::text[]`)
    .notNull(),
  measuredOutcomes: jsonb('measured_outcomes')
    .default(sql`'[]'::jsonb`)
    .notNull(),
  supportingArtifacts: jsonb('supporting_artifacts')
    .default(sql`'[]'::jsonb`)
    .notNull(),
  verified: boolean('verified').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Experiences - work experience with timeline, outcomes, and collaboration context
export const experiences = pgTable(
  'experiences',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
    title: text('title').notNull(), // "Leading systemic change" not "Director"
    organizationName: text('organization_name'),
    organizationType: text('organization_type', {
      enum: ['company', 'ngo', 'government', 'academic', 'network', 'other'],
    }),
    organizationIndustry: text('organization_industry'),
    organizationIndustryKey: text('organization_industry_key'),
    organizationIndustryLabel: text('organization_industry_label'),
    organizationIndustryLegacyText: text('organization_industry_legacy_text'),
    organizationEmployeeAmount: text('organization_employee_amount', {
      enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5001+'],
    }),
    orgDescription: text('org_description').notNull(), // Size, industry, location
    duration: text('duration').notNull(),
    startDate: date('start_date'),
    endDate: date('end_date'),
    outcomes: text('outcomes').notNull(), // Measurable outcomes
    projects: text('projects').notNull(), // Key projects and initiatives
    measuredOutcomes: jsonb('measured_outcomes')
      .default(sql`'[]'::jsonb`)
      .notNull(),
    projectEntries: jsonb('project_entries')
      .default(sql`'[]'::jsonb`)
      .notNull(),
    colleagues: text('colleagues').notNull(), // Collaboration and team context
    achievements: text('achievements').notNull(), // Notable achievements
    verified: boolean('verified').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    dateOrderCheck: check(
      'experiences_date_order_check',
      sql`${table.endDate} IS NULL OR ${table.startDate} IS NULL OR ${table.endDate} >= ${table.startDate}`
    ),
  })
);

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

export const consentObligations = pgTable(
  'consent_obligations',
  {
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
    state: text('state', {
      enum: canonicalConsentObligationStates,
    })
      .default('expired')
      .notNull(),
    requiredVersion: text('required_version'),
    grantedConsentId: uuid('granted_consent_id').references(() => userConsents.id, {
      onDelete: 'set null',
    }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    expiredAt: timestamp('expired_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    nextPromptAt: timestamp('next_prompt_at', { withTimezone: true }),
    metadata: jsonb('metadata')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    profileConsentUnique: unique().on(table.profileId, table.consentType),
    statePromptIdx: index('consent_obligations_state_prompt_idx').on(
      table.state,
      table.nextPromptAt
    ),
  })
);

export const consentStateTransitions = pgTable(
  'consent_state_transitions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    consentObligationId: uuid('consent_obligation_id')
      .references(() => consentObligations.id, { onDelete: 'cascade' })
      .notNull(),
    fromState: text('from_state', {
      enum: canonicalConsentObligationStates,
    }),
    toState: text('to_state', {
      enum: canonicalConsentObligationStates,
    }).notNull(),
    trigger: text('trigger').notNull(),
    reasonCode: text('reason_code'),
    actorType: text('actor_type', {
      enum: canonicalWorkflowActorTypes,
    }).notNull(),
    actorId: uuid('actor_id').references(() => profiles.id, { onDelete: 'set null' }),
    metadata: jsonb('metadata')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    consentCreatedAtIdx: index('consent_state_transitions_consent_created_at_idx').on(
      table.consentObligationId,
      table.createdAt
    ),
  })
);

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
  milestoneTriggerId: text('milestone_trigger_id', {
    enum: zenMilestoneTypes,
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Well-being reflections - Linked to milestones
export const wellbeingReflections = pgTable('wellbeing_reflections', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  reflectionText: text('reflection_text').notNull(),
  milestoneType: text('milestone_type', {
    enum: zenMilestoneTypes,
  }),
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

export const zenAuditEvents = pgTable(
  'zen_audit_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),
    eventType: text('event_type', {
      enum: zenAuditEventTypes,
    }).notNull(),
    actorType: text('actor_type', {
      enum: canonicalWorkflowActorTypes,
    })
      .default('candidate')
      .notNull(),
    routeSource: text('route_source'),
    metadata: jsonb('metadata')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userCreatedIdx: index('zen_audit_events_user_created_idx').on(table.userId, table.createdAt),
    typeCreatedIdx: index('zen_audit_events_type_created_idx').on(table.eventType, table.createdAt),
  })
);

export const proofTrustSnapshots = pgTable(
  'proof_trust_snapshots',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    subjectType: text('subject_type', {
      enum: canonicalOwnerTypes,
    }).notNull(),
    subjectId: uuid('subject_id').notNull(),
    context: text('context', {
      enum: proofTrustSnapshotContexts,
    }).notNull(),
    proofCoverageRatio: numeric('proof_coverage_ratio').default('0').notNull(),
    proofBackedSkillCount: integer('proof_backed_skill_count').default(0).notNull(),
    publicSkillCount: integer('public_skill_count').default(0).notNull(),
    verificationCoverageRatio: numeric('verification_coverage_ratio').default('0').notNull(),
    timeToVerifiedHoursP50: numeric('time_to_verified_hours_p50'),
    trustSignalCoverageCount: integer('trust_signal_coverage_count').default(0).notNull(),
    trustSignalClassesPresent: text('trust_signal_classes_present')
      .array()
      .default(sql`'{}'::text[]`)
      .notNull(),
    proofFreshnessState: text('proof_freshness_state', {
      enum: proofFreshnessStates,
    })
      .default('fresh')
      .notNull(),
    proofFreshnessDistribution: jsonb('proof_freshness_distribution')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    proofQuality: jsonb('proof_quality')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    proofQualitySummary: numeric('proof_quality_summary'),
    suggestedActions: text('suggested_actions')
      .array()
      .default(sql`'{}'::text[]`)
      .notNull(),
    computedAt: timestamp('computed_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    subjectContextUnique: unique('proof_trust_snapshots_subject_context_unique').on(
      table.subjectType,
      table.subjectId,
      table.context
    ),
    subjectIdx: index('proof_trust_snapshots_subject_idx').on(table.subjectType, table.subjectId),
  })
);

export const portfolioPublicationStates = pgTable(
  'portfolio_publication_states',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    subjectType: text('subject_type', {
      enum: canonicalOwnerTypes,
    }).notNull(),
    subjectId: uuid('subject_id').notNull(),
    requestedState: text('requested_state', {
      enum: publicPortfolioStates,
    }).notNull(),
    effectiveState: text('effective_state', {
      enum: publicPortfolioStates,
    }).notNull(),
    publicationState: text('publication_state', {
      enum: publicPortfolioStates,
    }).notNull(),
    indexingState: text('indexing_state', {
      enum: portfolioIndexingStates,
    }).notNull(),
    robotsState: text('robots_state', {
      enum: portfolioRobotsStates,
    }).notNull(),
    sitemapState: text('sitemap_state', {
      enum: portfolioSitemapStates,
    }).notNull(),
    reasonCodes: text('reason_codes')
      .array()
      .default(sql`'{}'::text[]`)
      .notNull(),
    metadata: jsonb('metadata')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    lastComputedAt: timestamp('last_computed_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    subjectUnique: unique('portfolio_publication_states_subject_unique').on(
      table.subjectType,
      table.subjectId
    ),
    effectiveStateIdx: index('portfolio_publication_states_effective_state_idx').on(
      table.effectiveState,
      table.indexingState
    ),
  })
);

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
      'weekly_digest',
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
  // Push notification preferences (by type)
  pushMatchSuggested: boolean('push_match_suggested').default(true).notNull(),
  pushIntroAccepted: boolean('push_intro_accepted').default(true).notNull(),
  pushMessageReceived: boolean('push_message_received').default(true).notNull(),
  pushVerificationRequested: boolean('push_verification_requested').default(true).notNull(),
  pushVerificationCompleted: boolean('push_verification_completed').default(true).notNull(),
  pushAssignmentPublished: boolean('push_assignment_published').default(true).notNull(),
  pushInterviewScheduled: boolean('push_interview_scheduled').default(true).notNull(),
  pushContractSigned: boolean('push_contract_signed').default(true).notNull(),
  emailWeeklyDigest: boolean('email_weekly_digest').default(false).notNull(),
  digestFrequency: text('digest_frequency', { enum: ['weekly', 'disabled'] })
    .default('disabled')
    .notNull(),
  lastDigestSentAt: timestamp('last_digest_sent_at'),
  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const mobileDeviceTokens = pgTable(
  'mobile_device_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),
    token: text('token').notNull(),
    platform: text('platform', { enum: ['ios'] })
      .default('ios')
      .notNull(),
    environment: text('environment', { enum: ['sandbox', 'production'] })
      .default('sandbox')
      .notNull(),
    enabled: boolean('enabled').default(true).notNull(),
    appVersion: text('app_version'),
    deviceModel: text('device_model'),
    osVersion: text('os_version'),
    lastSeenAt: timestamp('last_seen_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    tokenUnique: unique('mobile_device_tokens_token_unique').on(table.token),
    userIdx: index('mobile_device_tokens_user_idx').on(table.userId),
  })
);

export const pushDeliveryAttempts = pgTable(
  'push_delivery_attempts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    notificationId: uuid('notification_id')
      .references(() => notifications.id, { onDelete: 'cascade' })
      .notNull(),
    tokenId: uuid('token_id')
      .references(() => mobileDeviceTokens.id, { onDelete: 'cascade' })
      .notNull(),
    status: text('status', { enum: ['pending', 'sent', 'failed'] })
      .default('pending')
      .notNull(),
    errorCode: text('error_code'),
    errorMessage: text('error_message'),
    apnsId: text('apns_id'),
    attemptedAt: timestamp('attempted_at').defaultNow().notNull(),
  },
  (table) => ({
    notificationIdx: index('push_delivery_attempts_notification_idx').on(table.notificationId),
    tokenIdx: index('push_delivery_attempts_token_idx').on(table.tokenId),
    attemptedIdx: index('push_delivery_attempts_attempted_idx').on(table.attemptedAt),
  })
);

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
    enum: ['ttsc', 'ttfqi', 'ttv', 'pac', 'sus', 'wellbeing_delta', ...proofTrustMetricTypes],
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
export const interviews = pgTable(
  'interviews',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    matchId: uuid('match_id')
      .references(() => matches.id, { onDelete: 'cascade' })
      .notNull(),
    scheduledAt: timestamp('scheduled_at').notNull(),
    duration: integer('duration').default(30).notNull(), // minutes
    platform: text('platform', { enum: ['zoom', 'google'] }).notNull(),
    manualMeetingProvider: text('manual_meeting_provider', {
      enum: ['teams', 'zoom', 'google_meet', 'other'],
    }),
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
    completedAt: timestamp('completed_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    cancelledBy: uuid('cancelled_by').references(() => profiles.id, { onDelete: 'set null' }),
    cancelReason: text('cancel_reason'),
    noShowAt: timestamp('no_show_at', { withTimezone: true }),
    noShowRecordedBy: uuid('no_show_recorded_by').references(() => profiles.id, {
      onDelete: 'set null',
    }),
    rescheduleCount: integer('reschedule_count').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    matchIdIdx: index('interviews_match_id_idx').on(table.matchId),
    scheduledAtIdx: index('interviews_scheduled_at_idx').on(table.scheduledAt),
    statusIdx: index('interviews_status_idx').on(table.status),
  })
);

export const interviewStateTransitions = pgTable(
  'interview_state_transitions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    interviewId: uuid('interview_id')
      .references(() => interviews.id, { onDelete: 'cascade' })
      .notNull(),
    fromState: text('from_state', {
      enum: canonicalInterviewWorkflowStates,
    }),
    toState: text('to_state', {
      enum: canonicalInterviewWorkflowStates,
    }).notNull(),
    trigger: text('trigger').notNull(),
    reasonCode: text('reason_code'),
    actorType: text('actor_type', {
      enum: canonicalWorkflowActorTypes,
    }).notNull(),
    actorId: uuid('actor_id').references(() => profiles.id, { onDelete: 'set null' }),
    metadata: jsonb('metadata')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    interviewCreatedAtIdx: index('interview_state_transitions_interview_created_at_idx').on(
      table.interviewId,
      table.createdAt
    ),
  })
);

export const decisions = pgTable(
  'decisions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    interviewId: uuid('interview_id').references(() => interviews.id, { onDelete: 'cascade' }),
    decision: text('decision'),
    feedback: text('feedback'),
    hoursSinceInterview: numeric('hours_since_interview', { precision: 10, scale: 2 }),
    withinSla: boolean('within_sla').default(false).notNull(),
    introId: uuid('intro_id')
      .references(() => introWorkflows.id, { onDelete: 'cascade' })
      .notNull(),
    assignmentId: uuid('assignment_id')
      .references(() => assignments.id, { onDelete: 'cascade' })
      .notNull(),
    candidateProfileId: uuid('candidate_profile_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),
    orgId: uuid('org_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    latestInterviewId: uuid('latest_interview_id').references(() => interviews.id, {
      onDelete: 'set null',
    }),
    state: text('state', {
      enum: canonicalDecisionWorkflowStates,
    })
      .default('pending')
      .notNull(),
    holdUntil: timestamp('hold_until', { withTimezone: true }),
    reasonCode: text('reason_code'),
    internalNote: text('internal_note'),
    madeByActorType: text('made_by_actor_type', {
      enum: canonicalWorkflowActorTypes,
    }),
    madeByActorId: uuid('made_by_actor_id').references(() => profiles.id, { onDelete: 'set null' }),
    supersededByDecisionId: uuid('superseded_by_decision_id'),
    reopenedAt: timestamp('reopened_at', { withTimezone: true }),
    withdrawnAt: timestamp('withdrawn_at', { withTimezone: true }),
    closedAt: timestamp('closed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    introUnique: unique().on(table.introId),
    assignmentStateIdx: index('decisions_assignment_state_idx').on(table.assignmentId, table.state),
    orgStateIdx: index('decisions_org_state_idx').on(table.orgId, table.state),
    candidateStateIdx: index('decisions_candidate_state_idx').on(
      table.candidateProfileId,
      table.state
    ),
    legacyInterviewIdx: index('decisions_interview_id_idx').on(table.interviewId),
    interviewIdx: index('decisions_latest_interview_idx').on(table.latestInterviewId),
  })
);

export const decisionStateTransitions = pgTable(
  'decision_state_transitions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    decisionId: uuid('decision_id')
      .references(() => decisions.id, { onDelete: 'cascade' })
      .notNull(),
    fromState: text('from_state', {
      enum: canonicalDecisionWorkflowStates,
    }),
    toState: text('to_state', {
      enum: canonicalDecisionWorkflowStates,
    }).notNull(),
    trigger: text('trigger').notNull(),
    reasonCode: text('reason_code'),
    actorType: text('actor_type', {
      enum: canonicalWorkflowActorTypes,
    }).notNull(),
    actorId: uuid('actor_id').references(() => profiles.id, { onDelete: 'set null' }),
    metadata: jsonb('metadata')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    decisionCreatedAtIdx: index('decision_state_transitions_decision_created_at_idx').on(
      table.decisionId,
      table.createdAt
    ),
  })
);

export const engagementVerifications = pgTable(
  'engagement_verifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    decisionId: uuid('decision_id')
      .references(() => decisions.id, { onDelete: 'cascade' })
      .notNull(),
    introId: uuid('intro_id')
      .references(() => introWorkflows.id, { onDelete: 'cascade' })
      .notNull(),
    assignmentId: uuid('assignment_id')
      .references(() => assignments.id, { onDelete: 'cascade' })
      .notNull(),
    candidateProfileId: uuid('candidate_profile_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),
    orgId: uuid('org_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    engagementType: text('engagement_type', {
      enum: canonicalEngagementTypeValues,
    }),
    state: text('state', {
      enum: canonicalEngagementVerificationWorkflowStates,
    })
      .default('pending_both_confirmations')
      .notNull(),
    candidateConfirmed: boolean('candidate_confirmed').default(false).notNull(),
    candidateConfirmedAt: timestamp('candidate_confirmed_at', { withTimezone: true }),
    candidateConfirmedBy: uuid('candidate_confirmed_by').references(() => profiles.id, {
      onDelete: 'set null',
    }),
    organizationConfirmed: boolean('organization_confirmed').default(false).notNull(),
    organizationConfirmedAt: timestamp('organization_confirmed_at', { withTimezone: true }),
    organizationConfirmedBy: uuid('organization_confirmed_by').references(() => profiles.id, {
      onDelete: 'set null',
    }),
    uploadedFileId: uuid('uploaded_file_id').references(() => uploadedFiles.id, {
      onDelete: 'set null',
    }),
    evidenceNote: text('evidence_note'),
    proofHookStatus: text('proof_hook_status', {
      enum: canonicalEngagementProofHookStatuses,
    })
      .default('not_ready')
      .notNull(),
    proofHookEligibleAt: timestamp('proof_hook_eligible_at', { withTimezone: true }),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    decisionUnique: unique().on(table.decisionId),
    orgStateIdx: index('engagement_verifications_org_state_idx').on(table.orgId, table.state),
    candidateStateIdx: index('engagement_verifications_candidate_state_idx').on(
      table.candidateProfileId,
      table.state
    ),
    assignmentStateIdx: index('engagement_verifications_assignment_state_idx').on(
      table.assignmentId,
      table.state
    ),
  })
);

export const engagementVerificationStateTransitions = pgTable(
  'engagement_verification_state_transitions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    engagementVerificationId: uuid('engagement_verification_id')
      .references(() => engagementVerifications.id, { onDelete: 'cascade' })
      .notNull(),
    fromState: text('from_state', {
      enum: canonicalEngagementVerificationWorkflowStates,
    }),
    toState: text('to_state', {
      enum: canonicalEngagementVerificationWorkflowStates,
    }).notNull(),
    trigger: text('trigger').notNull(),
    reasonCode: text('reason_code'),
    actorType: text('actor_type', {
      enum: canonicalWorkflowActorTypes,
    }).notNull(),
    actorId: uuid('actor_id').references(() => profiles.id, { onDelete: 'set null' }),
    metadata: jsonb('metadata')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    engagementVerificationCreatedAtIdx: index(
      'engagement_verification_state_transitions_created_at_idx'
    ).on(table.engagementVerificationId, table.createdAt),
  })
);

export const internalOpsQueueItems = pgTable(
  'internal_ops_queue_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    queueType: text('queue_type', {
      enum: canonicalInternalOpsQueueTypes,
    }).notNull(),
    status: text('status', {
      enum: canonicalInternalOpsQueueStatuses,
    })
      .default('open')
      .notNull(),
    priority: text('priority', {
      enum: canonicalInternalOpsQueuePriorities,
    })
      .default('normal')
      .notNull(),
    linkedEntityType: text('linked_entity_type', {
      enum: canonicalInternalOpsQueueEntityTypes,
    }).notNull(),
    linkedEntityId: uuid('linked_entity_id').notNull(),
    summary: text('summary').notNull(),
    metadata: jsonb('metadata')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    createdByActorType: text('created_by_actor_type', {
      enum: canonicalWorkflowActorTypes,
    }).notNull(),
    createdByActorId: uuid('created_by_actor_id').references(() => profiles.id, {
      onDelete: 'set null',
    }),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    resolvedByActorId: uuid('resolved_by_actor_id').references(() => profiles.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    queueTypeStatusIdx: index('internal_ops_queue_type_status_idx').on(
      table.queueType,
      table.status
    ),
    linkedEntityIdx: index('internal_ops_queue_linked_entity_idx').on(
      table.linkedEntityType,
      table.linkedEntityId,
      table.status
    ),
  })
);

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
  tokenHash: text('token_hash'),
  capabilityTokenId: uuid('capability_token_id'),
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
export type OrgCandidateInvite = typeof orgCandidateInvites.$inferSelect;
export type InsertOrgCandidateInvite = typeof orgCandidateInvites.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type FeatureFlag = typeof featureFlags.$inferSelect;

// Matching system types
export type MatchingProfile = typeof matchingProfiles.$inferSelect;
export type InsertMatchingProfile = typeof matchingProfiles.$inferInsert;
export type MatchingRefreshJob = typeof matchingRefreshJobs.$inferSelect;
export type InsertMatchingRefreshJob = typeof matchingRefreshJobs.$inferInsert;
export type PythonInternalJob = typeof pythonInternalJobs.$inferSelect;
export type InsertPythonInternalJob = typeof pythonInternalJobs.$inferInsert;
export type CvImportAiBudget = typeof cvImportAiBudgets.$inferSelect;
export type InsertCvImportAiBudget = typeof cvImportAiBudgets.$inferInsert;
export type CvImportAiUsageLog = typeof cvImportAiUsageLogs.$inferSelect;
export type InsertCvImportAiUsageLog = typeof cvImportAiUsageLogs.$inferInsert;
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
export type CustomVerificationRequest = typeof customVerificationRequests.$inferSelect;
export type InsertCustomVerificationRequest = typeof customVerificationRequests.$inferInsert;
export type CustomVerificationRequestItem = typeof customVerificationRequestItems.$inferSelect;
export type InsertCustomVerificationRequestItem =
  typeof customVerificationRequestItems.$inferInsert;
export type VerificationResponse = typeof verificationResponses.$inferSelect;
export type InsertVerificationResponse = typeof verificationResponses.$inferInsert;
export type ImpactStoryVerificationRequest = typeof impactStoryVerificationRequests.$inferSelect;
export type InsertImpactStoryVerificationRequest =
  typeof impactStoryVerificationRequests.$inferInsert;
export type ImpactStoryVerificationResponse = typeof impactStoryVerificationResponses.$inferSelect;
export type InsertImpactStoryVerificationResponse =
  typeof impactStoryVerificationResponses.$inferInsert;
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
export type ZenAuditEvent = typeof zenAuditEvents.$inferSelect;
export type InsertZenAuditEvent = typeof zenAuditEvents.$inferInsert;
export type ProofTrustSnapshot = typeof proofTrustSnapshots.$inferSelect;
export type InsertProofTrustSnapshot = typeof proofTrustSnapshots.$inferInsert;
export type PortfolioPublicationState = typeof portfolioPublicationStates.$inferSelect;
export type InsertPortfolioPublicationState = typeof portfolioPublicationStates.$inferInsert;
export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = typeof submissions.$inferInsert;
export type SubmissionArtifact = typeof submissionArtifacts.$inferSelect;
export type InsertSubmissionArtifact = typeof submissionArtifacts.$inferInsert;
export type VerificationLogEntry = typeof verificationLogEntries.$inferSelect;
export type InsertVerificationLogEntry = typeof verificationLogEntries.$inferInsert;

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
export type MobileDeviceToken = typeof mobileDeviceTokens.$inferSelect;
export type InsertMobileDeviceToken = typeof mobileDeviceTokens.$inferInsert;
export type PushDeliveryAttempt = typeof pushDeliveryAttempts.$inferSelect;
export type InsertPushDeliveryAttempt = typeof pushDeliveryAttempts.$inferInsert;

// Stakeholder Assignment System (Feature 4)
export const assignmentInvitations = pgTable('assignment_invitations', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id')
    .references(() => organizations.id, { onDelete: 'cascade' })
    .notNull(),
  token: text('token').notNull().unique(),
  tokenHash: text('token_hash'),
  capabilityTokenId: uuid('capability_token_id'),
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
  assignmentId: uuid('assignment_id').references(() => assignments.id, { onDelete: 'set null' }),

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
  tokenHash: text('token_hash'),
  capabilityTokenId: uuid('capability_token_id'),
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
