import { z } from 'zod';

import { emitAnalyticsEvent } from '@/lib/analytics/events';
import type { EventTypeValue } from '@/lib/analytics/constants';
import {
  OperationalFallbackModeSchema,
  StructuredFeedbackAudienceSchema,
  StructuredFeedbackAuthorRoleSchema,
  StructuredFeedbackDecisionStateSchema,
} from '@/lib/contracts/launch-operations';

const actorTypeSchema = z.enum([
  'candidate',
  'organization_member',
  'platform_admin',
  'system',
  'service_account',
  'verifier',
]);

const sourceSchema = z.string().trim().min(1).max(80);
const uuidSchema = z.string().uuid();

const lifecycleEventSchemas = {
  proof_artifact_created: z
    .object({
      proof_artifact_id: uuidSchema,
      owner_type: z.enum(['individual_profile', 'organization']),
      owner_id: uuidSchema,
      subject_type: z.enum([
        'individual_profile',
        'skill',
        'project',
        'impact_story',
        'experience',
        'education',
        'volunteering',
        'organization',
      ]),
      subject_id: uuidSchema.nullable(),
      artifact_kind: z.enum([
        'link',
        'document',
        'image',
        'video',
        'credential',
        'reference',
        'assessment',
        'other',
      ]),
      visibility: z.enum(['public', 'link_only', 'matched_org', 'owner_only']),
      reveal_gate: z.enum(['none', 'match_exists', 'conversation_started']),
      actor_type: actorTypeSchema,
      source: sourceSchema,
    })
    .strict(),
  proof_artifact_updated: z
    .object({
      proof_artifact_id: uuidSchema,
      owner_type: z.enum(['individual_profile', 'organization']),
      owner_id: uuidSchema,
      subject_type: z.enum([
        'individual_profile',
        'skill',
        'project',
        'impact_story',
        'experience',
        'education',
        'volunteering',
        'organization',
      ]),
      subject_id: uuidSchema.nullable(),
      artifact_kind: z.enum([
        'link',
        'document',
        'image',
        'video',
        'credential',
        'reference',
        'assessment',
        'other',
      ]),
      visibility: z.enum(['public', 'link_only', 'matched_org', 'owner_only']),
      reveal_gate: z.enum(['none', 'match_exists', 'conversation_started']),
      changed_fields: z.array(z.string().min(1).max(50)).max(20),
      actor_type: actorTypeSchema,
      source: sourceSchema,
    })
    .strict(),
  proof_artifact_deleted: z
    .object({
      proof_artifact_id: uuidSchema,
      owner_type: z.enum(['individual_profile', 'organization']),
      owner_id: uuidSchema,
      subject_type: z.enum([
        'individual_profile',
        'skill',
        'project',
        'impact_story',
        'experience',
        'education',
        'volunteering',
        'organization',
      ]),
      subject_id: uuidSchema.nullable(),
      artifact_kind: z.enum([
        'link',
        'document',
        'image',
        'video',
        'credential',
        'reference',
        'assessment',
        'other',
        'unknown',
      ]),
      visibility: z.enum(['public', 'link_only', 'matched_org', 'owner_only', 'unknown']),
      reveal_gate: z.enum(['none', 'match_exists', 'conversation_started', 'unknown']),
      actor_type: actorTypeSchema,
      source: sourceSchema,
    })
    .strict(),
  proof_freshness_state_changed: z
    .object({
      proof_artifact_id: uuidSchema,
      subject_id: uuidSchema,
      freshness_state: z.enum(['fresh', 'review_soon', 'stale', 'expired']),
      age_bucket_days: z.enum(['0_90', '91_180', '181_365', '366_plus', 'expired']),
      expiry_state: z.enum(['active', 'expiring', 'expired', 'unknown']),
      trigger: z.string().min(1).max(60),
      actor_type: actorTypeSchema,
      source: sourceSchema,
    })
    .strict(),
  proof_freshness_nudge_queued: z
    .object({
      proof_artifact_id: uuidSchema,
      subject_id: uuidSchema,
      freshness_state: z.enum(['fresh', 'review_soon', 'stale', 'expired']),
      age_bucket_days: z.enum(['0_90', '91_180', '181_365', '366_plus', 'expired']),
      expiry_state: z.enum(['active', 'expiring', 'expired', 'unknown']),
      trigger: z.string().min(1).max(60),
      actor_type: actorTypeSchema,
      source: sourceSchema,
    })
    .strict(),
  proof_freshness_nudge_sent: z
    .object({
      proof_artifact_id: uuidSchema,
      subject_id: uuidSchema,
      freshness_state: z.enum(['fresh', 'review_soon', 'stale', 'expired']),
      age_bucket_days: z.enum(['0_90', '91_180', '181_365', '366_plus', 'expired']),
      expiry_state: z.enum(['active', 'expiring', 'expired', 'unknown']),
      trigger: z.string().min(1).max(60),
      actor_type: actorTypeSchema,
      source: sourceSchema,
    })
    .strict(),
  verification_request_created: z
    .object({
      verification_record_id: uuidSchema,
      verification_kind: z.string().min(1).max(40),
      subject_type: z.string().min(1).max(40),
      subject_id: uuidSchema,
      proof_artifact_id: uuidSchema.nullable(),
      status: z.string().min(1).max(40),
      integrity_status: z.string().min(1).max(40),
      expires_in_days: z.number().int().min(0).max(3650),
      actor_type: actorTypeSchema,
      source: sourceSchema,
    })
    .strict(),
  verification_request_resent: z
    .object({
      verification_record_id: uuidSchema,
      verification_kind: z.string().min(1).max(40),
      subject_type: z.string().min(1).max(40),
      subject_id: uuidSchema,
      proof_artifact_id: uuidSchema.nullable(),
      status: z.string().min(1).max(40),
      integrity_status: z.string().min(1).max(40),
      expires_in_days: z.number().int().min(0).max(3650),
      actor_type: actorTypeSchema,
      source: sourceSchema,
    })
    .strict(),
  verification_request_expired: z
    .object({
      verification_record_id: uuidSchema,
      verification_kind: z.string().min(1).max(40),
      subject_type: z.string().min(1).max(40),
      subject_id: uuidSchema,
      proof_artifact_id: uuidSchema.nullable(),
      status: z.string().min(1).max(40),
      integrity_status: z.string().min(1).max(40),
      expires_in_days: z.number().int().min(0).max(3650),
      actor_type: actorTypeSchema,
      source: sourceSchema,
    })
    .strict(),
  verification_response_recorded: z
    .object({
      verification_record_id: uuidSchema,
      verification_kind: z.string().min(1).max(40),
      subject_type: z.string().min(1).max(40),
      subject_id: uuidSchema,
      proof_artifact_id: uuidSchema.nullable(),
      status: z.string().min(1).max(40),
      integrity_status: z.string().min(1).max(40),
      expires_in_days: z.number().int().min(0).max(3650),
      actor_type: actorTypeSchema,
      source: sourceSchema,
    })
    .strict(),
  verification_record_completed: z
    .object({
      verification_record_id: uuidSchema,
      verification_kind: z.string().min(1).max(40),
      subject_type: z.string().min(1).max(40),
      subject_id: uuidSchema,
      proof_artifact_id: uuidSchema.nullable(),
      status: z.string().min(1).max(40),
      integrity_status: z.string().min(1).max(40),
      expires_in_days: z.number().int().min(0).max(3650),
      time_to_verified_hours: z
        .number()
        .nonnegative()
        .max(3650 * 24),
      actor_type: actorTypeSchema,
      source: sourceSchema,
    })
    .strict(),
  verification_record_failed: z
    .object({
      verification_record_id: uuidSchema,
      verification_kind: z.string().min(1).max(40),
      subject_type: z.string().min(1).max(40),
      subject_id: uuidSchema,
      proof_artifact_id: uuidSchema.nullable(),
      status: z.string().min(1).max(40),
      integrity_status: z.string().min(1).max(40),
      expires_in_days: z.number().int().min(0).max(3650),
      actor_type: actorTypeSchema,
      source: sourceSchema,
    })
    .strict(),
  reveal_requested: z
    .object({
      reveal_event_id: uuidSchema,
      match_id: uuidSchema,
      assignment_id: uuidSchema,
      profile_id: uuidSchema,
      org_id: uuidSchema,
      requested_scope: z.enum(['blind', 'shortlist_identity', 'full_identity']),
      granted_scope: z.enum(['blind', 'shortlist_identity', 'full_identity']),
      trigger_type: z.enum(['user', 'system', 'policy', 'automatic']),
      reason_code: z.string().min(1).max(80),
      source_surface: z.string().min(1).max(80).nullable(),
      outcome: z.enum(['granted', 'denied', 'no_op']),
      actor_type: actorTypeSchema,
      source: sourceSchema,
    })
    .strict(),
  reveal_granted: z
    .object({
      reveal_event_id: uuidSchema,
      match_id: uuidSchema,
      assignment_id: uuidSchema,
      profile_id: uuidSchema,
      org_id: uuidSchema,
      requested_scope: z.enum(['blind', 'shortlist_identity', 'full_identity']),
      granted_scope: z.enum(['blind', 'shortlist_identity', 'full_identity']),
      trigger_type: z.enum(['user', 'system', 'policy', 'automatic']),
      reason_code: z.string().min(1).max(80),
      source_surface: z.string().min(1).max(80).nullable(),
      outcome: z.enum(['granted', 'denied', 'no_op']),
      actor_type: actorTypeSchema,
      source: sourceSchema,
    })
    .strict(),
  reveal_denied: z
    .object({
      reveal_event_id: uuidSchema,
      match_id: uuidSchema,
      assignment_id: uuidSchema,
      profile_id: uuidSchema,
      org_id: uuidSchema,
      requested_scope: z.enum(['blind', 'shortlist_identity', 'full_identity']),
      granted_scope: z.enum(['blind', 'shortlist_identity', 'full_identity']),
      trigger_type: z.enum(['user', 'system', 'policy', 'automatic']),
      reason_code: z.string().min(1).max(80),
      source_surface: z.string().min(1).max(80).nullable(),
      outcome: z.enum(['granted', 'denied', 'no_op']),
      actor_type: actorTypeSchema,
      source: sourceSchema,
    })
    .strict(),
  intro_workflow_expired: z
    .object({
      intro_workflow_id: uuidSchema,
      assignment_id: uuidSchema,
      candidate_profile_id: uuidSchema,
      org_id: uuidSchema,
      from_state: z.string().min(1).max(60),
      expiry_reason: z.string().min(1).max(80),
      age_hours: z
        .number()
        .nonnegative()
        .max(3650 * 24),
      actor_type: actorTypeSchema,
      source: sourceSchema,
    })
    .strict(),
  intro_workflow_withdrawn: z
    .object({
      intro_workflow_id: uuidSchema,
      assignment_id: uuidSchema,
      actor_id: uuidSchema.nullable(),
      from_state: z.string().min(1).max(60),
      withdraw_reason_code: z.string().min(1).max(80),
      actor_type: actorTypeSchema,
      source: sourceSchema,
    })
    .strict(),
  interview_no_show_recorded: z
    .object({
      interview_id: uuidSchema,
      intro_workflow_id: uuidSchema.nullable(),
      assignment_id: uuidSchema.nullable(),
      participant_role: z.enum(['candidate', 'organization_member']),
      recorded_by_actor_type: actorTypeSchema,
      resolution_state: z.string().min(1).max(60),
      actor_type: actorTypeSchema,
      source: sourceSchema,
    })
    .strict(),
  review_override_applied: z
    .object({
      match_id: uuidSchema,
      assignment_id: uuidSchema,
      org_id: uuidSchema,
      override_reason_code: z.enum([
        'override_keep_under_review',
        'override_shortlist_manual',
        'override_reject_manual',
      ]),
      previous_stage: z.string().min(1).max(60),
      new_stage: z.string().min(1).max(60),
      requested_scope: z.enum(['blind', 'shortlist_identity', 'full_identity']),
      actor_type: actorTypeSchema,
      source: sourceSchema,
    })
    .strict(),
  review_override_reverted: z
    .object({
      match_id: uuidSchema,
      assignment_id: uuidSchema,
      org_id: uuidSchema,
      override_reason_code: z.enum([
        'override_keep_under_review',
        'override_shortlist_manual',
        'override_reject_manual',
      ]),
      previous_stage: z.string().min(1).max(60),
      new_stage: z.string().min(1).max(60),
      requested_scope: z.enum(['blind', 'shortlist_identity', 'full_identity']),
      actor_type: actorTypeSchema,
      source: sourceSchema,
    })
    .strict(),
  portfolio_publication_state_changed: z
    .object({
      subject_type: z.enum(['individual_profile', 'organization']),
      subject_id: uuidSchema,
      publication_state: z.enum([
        'unavailable',
        'public_link_only',
        'public_noindex',
        'public_indexable',
      ]),
      indexing_state: z.enum(['unavailable', 'noindex', 'indexable']),
      robots_state: z.enum(['noindex_nofollow', 'index_follow']),
      sitemap_state: z.enum(['excluded', 'included']),
      reason_code: z.string().min(1).max(80),
      trigger: z.string().min(1).max(80),
      actor_type: actorTypeSchema,
      source: sourceSchema,
    })
    .strict(),
  portfolio_indexing_state_changed: z
    .object({
      subject_type: z.enum(['individual_profile', 'organization']),
      subject_id: uuidSchema,
      publication_state: z.enum([
        'unavailable',
        'public_link_only',
        'public_noindex',
        'public_indexable',
      ]),
      indexing_state: z.enum(['unavailable', 'noindex', 'indexable']),
      robots_state: z.enum(['noindex_nofollow', 'index_follow']),
      sitemap_state: z.enum(['excluded', 'included']),
      reason_code: z.string().min(1).max(80),
      trigger: z.string().min(1).max(80),
      actor_type: actorTypeSchema,
      source: sourceSchema,
    })
    .strict(),
  fallback_entered: z
    .object({
      fallback_mode: OperationalFallbackModeSchema,
      subject_type: z.enum(['individual_profile', 'organization', 'assignment', 'review']),
      subject_id: uuidSchema,
      reason_code: z.string().min(1).max(80),
      operator_assisted: z.boolean(),
      actor_type: actorTypeSchema,
      source: sourceSchema,
    })
    .strict(),
  fallback_resolved: z
    .object({
      fallback_mode: OperationalFallbackModeSchema,
      subject_type: z.enum(['individual_profile', 'organization', 'assignment', 'review']),
      subject_id: uuidSchema,
      resolution_code: z.string().min(1).max(80),
      operator_assisted: z.boolean(),
      actor_type: actorTypeSchema,
      source: sourceSchema,
    })
    .strict(),
  intro_hold_created: z
    .object({
      assignment_id: uuidSchema,
      hold_reason_code: z.string().min(1).max(80),
      fallback_mode: OperationalFallbackModeSchema,
      current_qualified_intro_count: z.number().int().min(0).max(10000),
      target_qualified_intro_count: z.number().int().min(0).max(10000),
      actor_type: actorTypeSchema,
      source: sourceSchema,
    })
    .strict(),
  intro_hold_released: z
    .object({
      assignment_id: uuidSchema,
      hold_reason_code: z.string().min(1).max(80),
      fallback_mode: OperationalFallbackModeSchema,
      released_to_state: z.string().min(1).max(80),
      actor_type: actorTypeSchema,
      source: sourceSchema,
    })
    .strict(),
  structured_feedback_submitted: z
    .object({
      feedback_response_id: uuidSchema,
      interview_id: uuidSchema,
      direction: z.enum(['candidate_to_org', 'org_to_candidate']),
      audience_variant: StructuredFeedbackAudienceSchema,
      decision_state: StructuredFeedbackDecisionStateSchema,
      reason_code: z.string().min(1).max(80),
      author_role: StructuredFeedbackAuthorRoleSchema,
      actor_type: actorTypeSchema,
      source: sourceSchema,
    })
    .strict(),
  operator_override_logged: z
    .object({
      action_log_id: uuidSchema,
      action_type: z.string().min(1).max(80),
      target_type: z.enum(['assignment', 'review', 'verification', 'feedback', 'feature_flag']),
      target_id: z.string().min(1).max(120),
      actor_type: actorTypeSchema,
      source: sourceSchema,
    })
    .strict(),
  synthetic_check_failed: z
    .object({
      monitor_run_id: uuidSchema,
      monitor_key: z.string().min(1).max(80),
      severity: z.enum(['p1', 'p2', 'p3']),
      failure_class: z.string().min(1).max(80),
      actor_type: actorTypeSchema,
      source: sourceSchema,
    })
    .strict(),
} as const;

export type LifecycleEventName = keyof typeof lifecycleEventSchemas;
export type LifecycleEventPayload<TEventName extends LifecycleEventName> = z.infer<
  (typeof lifecycleEventSchemas)[TEventName]
>;

function getEntityType(eventName: LifecycleEventName) {
  if (eventName.startsWith('proof_')) return 'profile' as const;
  if (eventName.startsWith('verification_')) return 'profile' as const;
  if (eventName.startsWith('reveal_')) return 'match' as const;
  if (eventName.startsWith('intro_hold_')) return 'assignment' as const;
  if (eventName.startsWith('intro_')) return 'match' as const;
  if (eventName.startsWith('interview_')) return 'interview' as const;
  if (eventName.startsWith('review_override_')) return 'match' as const;
  if (eventName.startsWith('structured_feedback_')) return 'interview' as const;
  if (eventName.startsWith('operator_override_')) return 'assignment' as const;
  if (eventName.startsWith('fallback_')) return 'assignment' as const;
  if (eventName.startsWith('synthetic_')) return 'api' as const;
  return 'profile' as const;
}

function getEntityId<TEventName extends LifecycleEventName>(
  _eventName: TEventName,
  payload: LifecycleEventPayload<TEventName>
): string | undefined {
  const record = payload as Record<string, unknown>;
  const candidateKeys = [
    'proof_artifact_id',
    'verification_record_id',
    'reveal_event_id',
    'intro_workflow_id',
    'interview_id',
    'match_id',
    'subject_id',
    'assignment_id',
    'feedback_response_id',
    'action_log_id',
    'monitor_run_id',
  ] as const;

  for (const key of candidateKeys) {
    const value = record[key];
    if (typeof value === 'string') {
      return value;
    }
  }

  return undefined;
}

export async function emitLifecycleEvent<TEventName extends LifecycleEventName>(
  eventName: TEventName,
  payload: LifecycleEventPayload<TEventName>,
  context?: {
    userId?: string | null;
    organizationId?: string | null;
    entityType?:
      | 'match'
      | 'interview'
      | 'contract'
      | 'profile'
      | 'assignment'
      | 'page'
      | 'api'
      | 'web_vital'
      | 'custom';
    entityId?: string | null;
  }
) {
  const validated = lifecycleEventSchemas[eventName].parse(payload);

  await emitAnalyticsEvent({
    eventType: eventName as EventTypeValue,
    userId: context?.userId ?? undefined,
    organizationId: context?.organizationId ?? undefined,
    entityType: context?.entityType ?? getEntityType(eventName),
    entityId: context?.entityId ?? getEntityId(eventName, validated),
    properties: {
      ...validated,
      telemetry_class: 'operational',
      schema_version: 'lifecycle/v1',
    },
  });
}
