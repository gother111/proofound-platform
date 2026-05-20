import { z } from 'zod';

export const OPERATIONAL_FALLBACK_MODE_VALUES = [
  'browse_only_low_candidate_supply',
  'browse_only_low_assignment_supply',
  'proof_building_weak_coverage',
  'trust_pending_verification',
  'fairness_suppressed_ranking',
  'intro_hold_insufficient_qualified_intros',
] as const;

export type OperationalFallbackMode = (typeof OPERATIONAL_FALLBACK_MODE_VALUES)[number];
export const OperationalFallbackModeSchema = z.enum(OPERATIONAL_FALLBACK_MODE_VALUES);

export const FEATURE_FLAG_TAXONOMY_VALUES = [
  'default_on',
  'hidden_behind_flag',
  'pilot_only',
  'admin_operator_only',
  'post_mvp',
  'emergency_kill_switch',
] as const;

export type FeatureFlagTaxonomy = (typeof FEATURE_FLAG_TAXONOMY_VALUES)[number];
export const FeatureFlagTaxonomySchema = z.enum(FEATURE_FLAG_TAXONOMY_VALUES);

export const FEATURE_FLAG_CONTROL_TYPE_VALUES = [
  'temporary_rollout_control',
  'durable_scope_control',
] as const;

export type FeatureFlagControlType = (typeof FEATURE_FLAG_CONTROL_TYPE_VALUES)[number];
export const FeatureFlagControlTypeSchema = z.enum(FEATURE_FLAG_CONTROL_TYPE_VALUES);

export const STRUCTURED_FEEDBACK_AUDIENCE_VALUES = ['candidate', 'organization'] as const;

export type StructuredFeedbackAudience = (typeof STRUCTURED_FEEDBACK_AUDIENCE_VALUES)[number];
export const StructuredFeedbackAudienceSchema = z.enum(STRUCTURED_FEEDBACK_AUDIENCE_VALUES);

export const STRUCTURED_FEEDBACK_AUTHOR_ROLE_VALUES = [
  'candidate',
  'organization_member',
  'platform_operator',
  'system',
] as const;

export type StructuredFeedbackAuthorRole = (typeof STRUCTURED_FEEDBACK_AUTHOR_ROLE_VALUES)[number];
export const StructuredFeedbackAuthorRoleSchema = z.enum(STRUCTURED_FEEDBACK_AUTHOR_ROLE_VALUES);

export const STRUCTURED_FEEDBACK_DECISION_STATE_VALUES = [
  'pending',
  'under_review',
  'not_now',
  'closed',
  'passed',
  'shortlisted',
  'intro_on_hold',
  'verification_pending',
] as const;

export type StructuredFeedbackDecisionState =
  (typeof STRUCTURED_FEEDBACK_DECISION_STATE_VALUES)[number];
export const StructuredFeedbackDecisionStateSchema = z.enum(
  STRUCTURED_FEEDBACK_DECISION_STATE_VALUES
);

export const CANDIDATE_FEEDBACK_REASON_CODE_VALUES = [
  'proof_strength_incomplete',
  'verification_pending',
  'constraints_incomplete',
  'assignment_supply_thin',
  'shortlist_quality_protected',
  'focus_alignment_partial',
  'availability_constraints_mismatch',
] as const;

export type CandidateFeedbackReasonCode = (typeof CANDIDATE_FEEDBACK_REASON_CODE_VALUES)[number];
export const CandidateFeedbackReasonCodeSchema = z.enum(CANDIDATE_FEEDBACK_REASON_CODE_VALUES);

export const ORGANIZATION_FEEDBACK_REASON_CODE_VALUES = [
  'candidate_constraints_not_met',
  'candidate_verification_incomplete',
  'candidate_proof_coverage_insufficient',
  'assignment_scope_too_narrow',
  'candidate_supply_thin',
  'shortlist_quality_protected',
  'fairness_protected_band_only',
] as const;

export type OrganizationFeedbackReasonCode =
  (typeof ORGANIZATION_FEEDBACK_REASON_CODE_VALUES)[number];
export const OrganizationFeedbackReasonCodeSchema = z.enum(
  ORGANIZATION_FEEDBACK_REASON_CODE_VALUES
);

export const StructuredFeedbackReasonCodeSchema = z.union([
  CandidateFeedbackReasonCodeSchema,
  OrganizationFeedbackReasonCodeSchema,
]);

export type StructuredFeedbackReasonCode = z.infer<typeof StructuredFeedbackReasonCodeSchema>;

export const StructuredFeedbackRubricSubscoresSchema = z
  .record(z.number().min(0).max(5))
  .optional();

export const StructuredFeedbackSchema = z
  .object({
    decisionState: StructuredFeedbackDecisionStateSchema,
    audienceVariant: StructuredFeedbackAudienceSchema,
    reasonCode: StructuredFeedbackReasonCodeSchema,
    personalizedNote: z.string().trim().min(12).max(1200),
    suggestedNextStep: z.string().trim().min(6).max(400),
    authorRole: StructuredFeedbackAuthorRoleSchema,
    submittedAt: z.string().datetime().optional(),
    rubricVersion: z.string().trim().min(1).max(40).default('structured-feedback/v1'),
    rubricSubscores: StructuredFeedbackRubricSubscoresSchema,
    reusableTemplateId: z.string().uuid().optional(),
    operatorOverrideReason: z.string().trim().min(3).max(400).optional(),
    internalNote: z.string().trim().min(3).max(1200).optional(),
  })
  .superRefine((value, ctx) => {
    if (
      value.audienceVariant === 'candidate' &&
      !CANDIDATE_FEEDBACK_REASON_CODE_VALUES.includes(
        value.reasonCode as CandidateFeedbackReasonCode
      )
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reasonCode'],
        message: 'Candidate feedback must use a candidate-facing reason code.',
      });
    }

    if (
      value.audienceVariant === 'organization' &&
      !ORGANIZATION_FEEDBACK_REASON_CODE_VALUES.includes(
        value.reasonCode as OrganizationFeedbackReasonCode
      )
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reasonCode'],
        message: 'Organization feedback must use an organization-facing reason code.',
      });
    }
  });

export type StructuredFeedback = z.infer<typeof StructuredFeedbackSchema>;

export type FallbackCopyVariant = {
  title: string;
  detail: string;
  statusLabel: string;
  nextActions: [string, string, string];
};

export const FALLBACK_COPY: Record<
  OperationalFallbackMode,
  {
    individual: FallbackCopyVariant;
    organization: FallbackCopyVariant;
  }
> = {
  browse_only_low_candidate_supply: {
    individual: {
      title: 'Browsing stays open while qualified introductions are protected.',
      detail:
        'There are not enough qualified introductions yet. Your portfolio is still doing useful work while we protect quality.',
      statusLabel: 'Qualified intros paused',
      nextActions: [
        'Improve your portfolio or proof',
        'Complete verification checks or constraints',
        'Keep browsing and share your portfolio',
      ],
    },
    organization: {
      title: 'Candidate supply is still thin for this assignment.',
      detail:
        'There are not enough qualified introductions yet for this assignment. Review remains open while quality protections stay on.',
      statusLabel: 'Candidate supply thin',
      nextActions: [
        'Broaden assignment scope',
        'Request more evidence on strong fits',
        'Keep reviewing blind profiles',
      ],
    },
  },
  browse_only_low_assignment_supply: {
    individual: {
      title: 'Your Public Page remains live and shareable.',
      detail:
        'Assignment demand is still thin right now, so qualified introductions are conservative while your Public Page keeps working.',
      statusLabel: 'Assignment supply thin',
      nextActions: [
        'Improve your Public Page or proof',
        'Complete verification checks or constraints',
        'Keep browsing and share your Public Page',
      ],
    },
    organization: {
      title: 'Qualified activity is thin for this assignment set.',
      detail:
        'Browsing stays open while qualified introductions are protected. Narrow supply is being handled as an operational fallback, not hidden demand.',
      statusLabel: 'Activity thin',
      nextActions: [
        'Broaden assignment scope',
        'Request more evidence on strong fits',
        'Keep reviewing blind profiles',
      ],
    },
  },
  proof_building_weak_coverage: {
    individual: {
      title: 'Your Public Page remains shareable with proof context.',
      detail:
        'Add proof or verification checks to strengthen intro readiness. Proof value comes first while stronger assignment-fit corridors remain protected.',
      statusLabel: 'Proof coverage in progress',
      nextActions: [
        'Improve your Public Page or proof',
        'Complete verification checks or constraints',
        'Keep browsing and share your Public Page',
      ],
    },
    organization: {
      title: 'Proof coverage is not strong enough for higher-confidence introductions.',
      detail:
        'Shortlist generation can stay active, but stronger introduction actions stay conservative until proof coverage improves.',
      statusLabel: 'Proof coverage weak',
      nextActions: [
        'Broaden assignment scope',
        'Request more evidence on strong fits',
        'Keep reviewing blind profiles',
      ],
    },
  },
  trust_pending_verification: {
    individual: {
      title: 'Verification is still in progress.',
      detail:
        'We will keep trust labels conservative until it completes, so stronger trust actions stay paused for now.',
      statusLabel: 'Verification pending',
      nextActions: [
        'Improve your portfolio or proof',
        'Complete verification checks or constraints',
        'Keep browsing and share your portfolio',
      ],
    },
    organization: {
      title: 'Verification is still in progress for this review set.',
      detail:
        'Stronger trust actions stay paused while review can continue with conservative trust labels and blind-profile review.',
      statusLabel: 'Trust pending',
      nextActions: [
        'Broaden assignment scope',
        'Request more evidence on strong fits',
        'Keep reviewing blind profiles',
      ],
    },
  },
  fairness_suppressed_ranking: {
    individual: {
      title: 'Shortlist quality is protected right now.',
      detail:
        'Exact ordering is temporarily hidden to protect shortlist quality. Review can continue without exposing brittle comparative detail.',
      statusLabel: 'Review-band mode',
      nextActions: [
        'Improve your portfolio or proof',
        'Complete verification checks or constraints',
        'Keep browsing and share your portfolio',
      ],
    },
    organization: {
      title: 'Shortlist quality is protected right now.',
      detail:
        'Exact ordering is temporarily hidden to protect shortlist quality. Review history stays visible while policy review is active.',
      statusLabel: 'Policy protection active',
      nextActions: [
        'Broaden assignment scope',
        'Request more evidence on strong fits',
        'Keep reviewing blind profiles',
      ],
    },
  },
  intro_hold_insufficient_qualified_intros: {
    individual: {
      title: 'There are not enough qualified introductions yet.',
      detail:
        'Your portfolio is still doing useful work while we protect quality and keep the introduction corridor honest.',
      statusLabel: 'Intro hold',
      nextActions: [
        'Improve your portfolio or proof',
        'Complete verification checks or constraints',
        'Keep browsing and share your portfolio',
      ],
    },
    organization: {
      title: 'There are not enough qualified introductions yet for this assignment.',
      detail:
        'The intro corridor is on hold instead of sending weak introductions. Browse-safe review and assignment edits remain available.',
      statusLabel: 'Intro corridor hold',
      nextActions: [
        'Broaden assignment scope',
        'Request more evidence on strong fits',
        'Keep reviewing blind profiles',
      ],
    },
  },
};
