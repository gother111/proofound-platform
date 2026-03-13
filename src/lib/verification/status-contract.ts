import { resolveHasLinkedInIdentityVerification } from '@/lib/linkedin-verified';
import {
  listVerificationRecordsForOwner,
  summarizeVerificationPolicy,
  type VerificationPolicySummary,
} from '@/lib/verification/policy';
import { resolveLinkedInVerificationLevel } from '@/lib/verification/tier';
import { resolveWorkEmailValidity } from '@/lib/verification/work-email-validity';
import { buildWorkflowView } from '@/lib/workflow/service';

type LegacyVerificationMethod = 'veriff' | 'work_email' | 'linkedin' | null;
type LegacyVerificationStatus = 'unverified' | 'pending' | 'verified' | 'failed' | null;
type LegacyVerificationTier = 'unverified' | 'workplace_verified' | 'identity_verified' | null;
type LegacyVerificationTierSource =
  | 'linkedin_identity'
  | 'linkedin_workplace'
  | 'work_email'
  | 'veriff'
  | 'unknown'
  | null;
type LinkedInVerificationStatus = 'unverified' | 'pending' | 'verified' | 'failed' | null;
type LinkedInVerificationLevel =
  | 'unverified'
  | 'pending'
  | 'workplace'
  | 'identity'
  | 'failed'
  | null;

export type VerificationStatusProfile = {
  verified?: boolean | null;
  verificationMethod?: LegacyVerificationMethod;
  verificationStatus?: LegacyVerificationStatus;
  verificationTier?: LegacyVerificationTier;
  verificationTierSource?: LegacyVerificationTierSource;
  verifiedAt?: string | null;
  workEmail?: string | null;
  workEmailVerified?: boolean | null;
  workEmailVerifiedAt?: string | null;
  workEmailReverifyDueAt?: string | null;
  workEmailToken?: string | null;
  workEmailTokenExpires?: string | null;
  linkedinVerificationStatus?: LinkedInVerificationStatus;
  linkedinVerificationLevel?: LinkedInVerificationLevel;
  linkedinVerifiedAt?: string | null;
  linkedinVerificationData?: unknown;
};

type WorkflowView = ReturnType<typeof buildWorkflowView>;

export type VerificationStatusContract = {
  summary: Pick<
    VerificationPolicySummary,
    | 'badgeSemanticsVersion'
    | 'publicBadges'
    | 'orgReviewBadges'
    | 'internalBadges'
    | 'slots'
    | 'activeIssues'
  >;
  workflow: WorkflowView | null;
  channels: {
    workEmail: {
      email: string | null;
      state:
        | 'unverified'
        | 'pending'
        | 'verified'
        | 'expired'
        | 'superseded'
        | 'downgraded'
        | 'contradicted'
        | 'disputed'
        | 'revoked'
        | 'declined'
        | 'cancelled'
        | 'failed';
      verifiedAt: string | null;
      reverifyDueAt: string | null;
      needsReverify: boolean;
    };
    linkedin: {
      state: 'unverified' | 'pending' | 'verified' | 'failed';
      signalLevel: 'none' | 'workplace' | 'identity';
      verifiedAt: string | null;
      hasIdentitySignal: boolean;
    };
  };
};

function hasActiveWorkEmailToken(profile: VerificationStatusProfile) {
  if (!profile.workEmailToken || profile.workEmailVerified) {
    return false;
  }

  if (!profile.workEmailTokenExpires) {
    return false;
  }

  const expiresAtMs = new Date(profile.workEmailTokenExpires).getTime();
  if (!Number.isFinite(expiresAtMs)) {
    return false;
  }

  return expiresAtMs > Date.now();
}

function toSummaryPayload(summary: VerificationPolicySummary) {
  return {
    badgeSemanticsVersion: summary.badgeSemanticsVersion,
    publicBadges: summary.publicBadges,
    orgReviewBadges: summary.orgReviewBadges,
    internalBadges: summary.internalBadges,
    slots: summary.slots,
    activeIssues: summary.activeIssues,
  };
}

function normalizeExplicitWorkflowState(
  status: string | null | undefined
):
  | 'pending'
  | 'verified'
  | 'expired'
  | 'superseded'
  | 'downgraded'
  | 'contradicted'
  | 'disputed'
  | 'revoked'
  | 'declined'
  | 'cancelled'
  | 'failed'
  | null {
  if (
    status === 'pending' ||
    status === 'verified' ||
    status === 'expired' ||
    status === 'superseded' ||
    status === 'downgraded' ||
    status === 'contradicted' ||
    status === 'disputed' ||
    status === 'revoked' ||
    status === 'declined' ||
    status === 'cancelled' ||
    status === 'failed'
  ) {
    return status;
  }

  return null;
}

export async function buildVerificationStatusContract(
  ownerId: string,
  profile: VerificationStatusProfile | null
): Promise<VerificationStatusContract> {
  const canonicalRecords = await listVerificationRecordsForOwner(
    'individual_profile',
    ownerId
  ).catch(() => []);

  const summary = summarizeVerificationPolicy({
    records: canonicalRecords,
    legacyProfile: profile
      ? {
          verified: profile.verified,
          verificationMethod: profile.verificationMethod,
          verificationStatus: profile.verificationStatus,
          verificationTier: profile.verificationTier,
          verificationTierSource: profile.verificationTierSource,
          workEmailCurrentlyVerified: resolveWorkEmailValidity({
            work_email_verified: profile.workEmailVerified,
            work_email_verified_at: profile.workEmailVerifiedAt ?? null,
            work_email_reverify_due_at: profile.workEmailReverifyDueAt ?? null,
            verified_at: profile.verifiedAt ?? null,
          }).isCurrentlyVerified,
          linkedinVerificationStatus: profile.linkedinVerificationStatus,
          linkedinHasIdentityVerification: resolveHasLinkedInIdentityVerification(
            profile.linkedinVerificationData
          ),
        }
      : undefined,
  });

  if (!profile) {
    return {
      summary: toSummaryPayload(summary),
      workflow: null,
      channels: {
        workEmail: {
          email: null,
          state: 'unverified',
          verifiedAt: null,
          reverifyDueAt: null,
          needsReverify: false,
        },
        linkedin: {
          state: 'unverified',
          signalLevel: 'none',
          verifiedAt: null,
          hasIdentitySignal: false,
        },
      },
    };
  }

  const canonicalWorkEmailVerification =
    canonicalRecords.find((record) => record.verificationKind === 'work_email') ?? null;
  const workEmailValidity = resolveWorkEmailValidity({
    work_email_verified: profile.workEmailVerified,
    work_email_verified_at: profile.workEmailVerifiedAt ?? null,
    work_email_reverify_due_at: profile.workEmailReverifyDueAt ?? null,
    verified_at: profile.verifiedAt ?? null,
  });
  const pendingWorkEmailToken = hasActiveWorkEmailToken(profile);
  const explicitWorkflowState = normalizeExplicitWorkflowState(profile.verificationStatus ?? null);
  const workflowState =
    canonicalWorkEmailVerification?.status === 'verified' && workEmailValidity.needsReverify
      ? 'expired'
      : (canonicalWorkEmailVerification?.status ??
        (workEmailValidity.needsReverify
          ? 'expired'
          : workEmailValidity.isCurrentlyVerified
            ? 'verified'
            : (explicitWorkflowState ?? (pendingWorkEmailToken ? 'pending' : null))));
  const linkedinVerificationLevel =
    profile.linkedinVerificationLevel ??
    resolveLinkedInVerificationLevel({
      linkedinVerificationStatus: profile.linkedinVerificationStatus,
      linkedinVerificationData: profile.linkedinVerificationData,
    });
  const linkedinHasIdentitySignal =
    linkedinVerificationLevel === 'identity' ||
    resolveHasLinkedInIdentityVerification(profile.linkedinVerificationData);

  return {
    summary: toSummaryPayload(summary),
    workflow:
      workflowState === null
        ? null
        : buildWorkflowView({
            machine: 'verification',
            state: workflowState,
            reasonCode: canonicalWorkEmailVerification?.failureCode ?? null,
            timestamps: {
              requestedAt: canonicalWorkEmailVerification?.requestedAt?.toISOString(),
              expiresAt: canonicalWorkEmailVerification?.expiresAt?.toISOString(),
              requestExpiresAt: canonicalWorkEmailVerification?.requestExpiresAt?.toISOString(),
              followUpDueAt: canonicalWorkEmailVerification?.followUpDueAt?.toISOString(),
              completedAt: canonicalWorkEmailVerification?.completedAt?.toISOString(),
              expiredAt: canonicalWorkEmailVerification?.expiredAt?.toISOString(),
              downgradedAt: canonicalWorkEmailVerification?.downgradedAt?.toISOString(),
              contradictedAt: canonicalWorkEmailVerification?.contradictedAt?.toISOString(),
              disputedAt: canonicalWorkEmailVerification?.disputedAt?.toISOString(),
              revokedAt: canonicalWorkEmailVerification?.revokedAt?.toISOString(),
              cancelledAt: canonicalWorkEmailVerification?.cancelledAt?.toISOString(),
              verifiedAt:
                canonicalWorkEmailVerification?.verifiedAt?.toISOString() ??
                profile.workEmailVerifiedAt ??
                null,
            },
          }),
    channels: {
      workEmail: {
        email: profile.workEmail ?? null,
        state:
          workflowState ??
          (workEmailValidity.needsReverify
            ? 'expired'
            : workEmailValidity.isCurrentlyVerified || summary.compatibility.workEmailVerified
              ? 'verified'
              : pendingWorkEmailToken
                ? 'pending'
                : 'unverified'),
        verifiedAt:
          canonicalWorkEmailVerification?.verifiedAt?.toISOString() ??
          profile.workEmailVerifiedAt ??
          null,
        reverifyDueAt: workEmailValidity.reverifyDueAt,
        needsReverify: workEmailValidity.needsReverify,
      },
      linkedin: {
        state:
          profile.linkedinVerificationStatus === 'failed'
            ? 'failed'
            : profile.linkedinVerificationStatus === 'pending'
              ? 'pending'
              : linkedinVerificationLevel === 'identity' ||
                  linkedinVerificationLevel === 'workplace'
                ? 'verified'
                : 'unverified',
        signalLevel:
          linkedinVerificationLevel === 'identity'
            ? 'identity'
            : linkedinVerificationLevel === 'workplace'
              ? 'workplace'
              : 'none',
        verifiedAt: profile.linkedinVerifiedAt ?? null,
        hasIdentitySignal: linkedinHasIdentitySignal,
      },
    },
  };
}
