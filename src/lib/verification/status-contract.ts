import { resolveHasLinkedInIdentityVerification } from '@/lib/linkedin-verified';
import {
  listVerificationRecordsForOwner,
  summarizeVerificationPolicy,
  type VerificationPolicySummary,
} from '@/lib/verification/policy';
import { resolveLinkedInVerificationLevel } from '@/lib/verification/tier';
import { resolveWorkEmailValidity } from '@/lib/verification/work-email-validity';
import { buildWorkflowView } from '@/lib/workflow/service';

type LinkedInVerificationStatus = 'unverified' | 'pending' | 'verified' | 'failed' | null;
type LinkedInVerificationLevel =
  | 'unverified'
  | 'pending'
  | 'workplace'
  | 'identity'
  | 'failed'
  | null;

export type VerificationStatusProfile = {
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
type WorkEmailChannelState =
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
type LinkedInChannelState = 'unverified' | 'pending' | 'verified' | 'failed';
type LinkedInSignalLevel = 'none' | 'workplace' | 'identity';

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
      state: WorkEmailChannelState;
      verifiedAt: string | null;
      reverifyDueAt: string | null;
      needsReverify: boolean;
    };
    linkedin: {
      state: LinkedInChannelState;
      signalLevel: LinkedInSignalLevel;
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

function mapSlotStateToWorkEmailChannelState(
  state: VerificationPolicySummary['slots']['workplace']['state']
): WorkEmailChannelState {
  if (
    state === 'pending' ||
    state === 'verified' ||
    state === 'expired' ||
    state === 'superseded' ||
    state === 'downgraded' ||
    state === 'contradicted' ||
    state === 'disputed' ||
    state === 'revoked' ||
    state === 'declined' ||
    state === 'cancelled' ||
    state === 'failed'
  ) {
    return state;
  }

  return 'unverified';
}

function mapSlotStateToLinkedInChannelState(
  state: VerificationPolicySummary['slots']['identity']['state']
): LinkedInChannelState {
  if (state === 'verified') {
    return 'verified';
  }

  if (state === 'pending' || state === 'disputed') {
    return 'pending';
  }

  if (state === 'failed') {
    return 'failed';
  }

  return 'unverified';
}

export async function buildVerificationStatusContract(
  ownerId: string,
  profile: VerificationStatusProfile | null
): Promise<VerificationStatusContract> {
  const canonicalRecords = await listVerificationRecordsForOwner(
    'individual_profile',
    ownerId
  ).catch(() => []);
  const summary = summarizeVerificationPolicy({ records: canonicalRecords });

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
  const canonicalWorkEmailSlot =
    summary.slots.workplace.kind === 'work_email' ? summary.slots.workplace : null;
  const canonicalLinkedInVerification =
    canonicalRecords.find(
      (record) =>
        record.verificationKind === 'linkedin_identity' ||
        record.verificationKind === 'linkedin_workplace'
    ) ?? null;
  const canonicalLinkedInSlot =
    canonicalLinkedInVerification?.verificationKind === 'linkedin_identity'
      ? summary.slots.identity.kind === 'linkedin_identity'
        ? summary.slots.identity
        : null
      : canonicalLinkedInVerification?.verificationKind === 'linkedin_workplace'
        ? summary.slots.workplace.kind === 'linkedin_workplace'
          ? summary.slots.workplace
          : null
        : null;

  const workEmailValidity = resolveWorkEmailValidity({
    work_email_verified: profile.workEmailVerified,
    work_email_verified_at: profile.workEmailVerifiedAt ?? null,
    work_email_reverify_due_at: profile.workEmailReverifyDueAt ?? null,
  });
  const pendingWorkEmailToken = hasActiveWorkEmailToken(profile);
  const fallbackWorkEmailState: WorkEmailChannelState = workEmailValidity.needsReverify
    ? 'expired'
    : workEmailValidity.isCurrentlyVerified
      ? 'verified'
      : pendingWorkEmailToken
        ? 'pending'
        : 'unverified';
  const workEmailState = canonicalWorkEmailSlot
    ? mapSlotStateToWorkEmailChannelState(canonicalWorkEmailSlot.state)
    : fallbackWorkEmailState;

  const linkedinVerificationLevel =
    profile.linkedinVerificationLevel ??
    resolveLinkedInVerificationLevel({
      linkedinVerificationStatus: profile.linkedinVerificationStatus,
      linkedinVerificationData: profile.linkedinVerificationData,
    });
  const fallbackLinkedInState: LinkedInChannelState =
    profile.linkedinVerificationStatus === 'failed'
      ? 'failed'
      : profile.linkedinVerificationStatus === 'pending'
        ? 'pending'
        : linkedinVerificationLevel === 'identity' || linkedinVerificationLevel === 'workplace'
          ? 'verified'
          : 'unverified';
  const fallbackLinkedInSignalLevel: LinkedInSignalLevel =
    fallbackLinkedInState === 'verified' || fallbackLinkedInState === 'pending'
      ? linkedinVerificationLevel === 'identity'
        ? 'identity'
        : linkedinVerificationLevel === 'workplace'
          ? 'workplace'
          : 'none'
      : 'none';
  const linkedInState = canonicalLinkedInSlot
    ? mapSlotStateToLinkedInChannelState(canonicalLinkedInSlot.state)
    : fallbackLinkedInState;
  const linkedInSignalLevel = canonicalLinkedInSlot
    ? linkedInState === 'verified' || linkedInState === 'pending'
      ? canonicalLinkedInVerification?.verificationKind === 'linkedin_identity'
        ? 'identity'
        : 'workplace'
      : 'none'
    : fallbackLinkedInSignalLevel;
  const linkedinHasIdentitySignal = canonicalLinkedInSlot
    ? linkedInSignalLevel === 'identity'
    : linkedInSignalLevel === 'identity' ||
      (fallbackLinkedInState !== 'failed' &&
        fallbackLinkedInState !== 'unverified' &&
        resolveHasLinkedInIdentityVerification(profile.linkedinVerificationData));

  return {
    summary: toSummaryPayload(summary),
    workflow:
      canonicalWorkEmailVerification && canonicalWorkEmailSlot
        ? buildWorkflowView({
            machine: 'verification',
            state: mapSlotStateToWorkEmailChannelState(canonicalWorkEmailSlot.state),
            reasonCode: canonicalWorkEmailVerification.failureCode ?? null,
            timestamps: {
              requestedAt: canonicalWorkEmailVerification.requestedAt?.toISOString(),
              expiresAt: canonicalWorkEmailVerification.expiresAt?.toISOString(),
              requestExpiresAt: canonicalWorkEmailVerification.requestExpiresAt?.toISOString(),
              followUpDueAt: canonicalWorkEmailVerification.followUpDueAt?.toISOString(),
              completedAt: canonicalWorkEmailVerification.completedAt?.toISOString(),
              expiredAt: canonicalWorkEmailVerification.expiredAt?.toISOString(),
              downgradedAt: canonicalWorkEmailVerification.downgradedAt?.toISOString(),
              contradictedAt: canonicalWorkEmailVerification.contradictedAt?.toISOString(),
              disputedAt: canonicalWorkEmailVerification.disputedAt?.toISOString(),
              revokedAt: canonicalWorkEmailVerification.revokedAt?.toISOString(),
              cancelledAt: canonicalWorkEmailVerification.cancelledAt?.toISOString(),
              verifiedAt:
                canonicalWorkEmailVerification.verifiedAt?.toISOString() ??
                canonicalWorkEmailSlot.verifiedAt ??
                null,
            },
          })
        : null,
    channels: {
      workEmail: {
        email: profile.workEmail ?? null,
        state: workEmailState,
        verifiedAt:
          canonicalWorkEmailSlot?.verifiedAt ??
          canonicalWorkEmailVerification?.verifiedAt?.toISOString() ??
          profile.workEmailVerifiedAt ??
          null,
        reverifyDueAt: canonicalWorkEmailSlot?.expiresAt ?? workEmailValidity.reverifyDueAt,
        needsReverify: canonicalWorkEmailSlot
          ? canonicalWorkEmailSlot.state === 'expired'
          : workEmailValidity.needsReverify,
      },
      linkedin: {
        state: linkedInState,
        signalLevel: linkedInSignalLevel,
        verifiedAt:
          canonicalLinkedInSlot?.verifiedAt ??
          canonicalLinkedInVerification?.verifiedAt?.toISOString() ??
          profile.linkedinVerifiedAt ??
          null,
        hasIdentitySignal: linkedinHasIdentitySignal,
      },
    },
  };
}
