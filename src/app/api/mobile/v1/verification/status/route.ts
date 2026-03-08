import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

import { db } from '@/db';
import { individualProfiles } from '@/db/schema';
import { requireMobileAuth } from '@/lib/api/mobile/auth';
import { mobileError, mobileSuccess } from '@/lib/api/mobile/response';
import { resolveHasLinkedInIdentityVerification } from '@/lib/linkedin-verified';
import {
  listVerificationRecordsForOwner,
  summarizeVerificationPolicy,
} from '@/lib/verification/policy';
import { resolveWorkEmailValidity } from '@/lib/verification/work-email-validity';

export const dynamic = 'force-dynamic';

function hasActiveWorkEmailToken(profile: {
  workEmailToken?: string | null;
  workEmailTokenExpires?: Date | null;
  workEmailVerified?: boolean | null;
}) {
  if (!profile.workEmailToken || profile.workEmailVerified) {
    return false;
  }

  if (!profile.workEmailTokenExpires) {
    return false;
  }

  const expiresAtMs = profile.workEmailTokenExpires.getTime();
  if (!Number.isFinite(expiresAtMs)) {
    return false;
  }

  return expiresAtMs > Date.now();
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireMobileAuth(request);
    if ('status' in auth) {
      return auth;
    }

    const [profile] = await db
      .select({
        verified: individualProfiles.verified,
        verificationMethod: individualProfiles.verificationMethod,
        verificationStatus: individualProfiles.verificationStatus,
        verificationTier: individualProfiles.verificationTier,
        verificationTierSource: individualProfiles.verificationTierSource,
        verifiedAt: individualProfiles.verifiedAt,
        linkedinVerificationStatus: individualProfiles.linkedinVerificationStatus,
        linkedinVerificationLevel: individualProfiles.linkedinVerificationLevel,
        linkedinVerifiedAt: individualProfiles.linkedinVerifiedAt,
        linkedinVerificationData: individualProfiles.linkedinVerificationData,
        workEmail: individualProfiles.workEmail,
        workEmailVerified: individualProfiles.workEmailVerified,
        workEmailVerifiedAt: individualProfiles.workEmailVerifiedAt,
        workEmailReverifyDueAt: individualProfiles.workEmailReverifyDueAt,
        workEmailToken: individualProfiles.workEmailToken,
        workEmailTokenExpires: individualProfiles.workEmailTokenExpires,
      })
      .from(individualProfiles)
      .where(eq(individualProfiles.userId, auth.user.id))
      .limit(1);

    if (!profile) {
      return mobileSuccess({
        verified: false,
        verificationMethod: null,
        verificationStatus: 'unverified',
        verificationTier: 'unverified',
        verificationTierSource: 'unknown',
        verifiedAt: null,
        linkedinVerificationStatus: 'unverified',
        linkedinVerificationLevel: 'unverified',
        linkedinHasIdentityVerification: false,
        linkedinVerifiedAt: null,
        workEmail: null,
        workEmailVerified: false,
        workEmailReverifyDueAt: null,
        workEmailNeedsReverify: false,
      });
    }

    const workEmailValidity = resolveWorkEmailValidity({
      work_email_verified: profile.workEmailVerified,
      work_email_verified_at: profile.workEmailVerifiedAt?.toISOString() || null,
      work_email_reverify_due_at: profile.workEmailReverifyDueAt?.toISOString() || null,
      verified_at: profile.verifiedAt?.toISOString() || null,
    });
    const canonicalRecords = await listVerificationRecordsForOwner(
      'individual_profile',
      auth.user.id
    ).catch(() => []);
    const policySummary = summarizeVerificationPolicy({
      records: canonicalRecords,
      legacyProfile: {
        verified: profile.verified,
        verificationMethod: profile.verificationMethod,
        verificationStatus: profile.verificationStatus,
        verificationTier: profile.verificationTier,
        verificationTierSource: profile.verificationTierSource,
        workEmailCurrentlyVerified: workEmailValidity.isCurrentlyVerified,
        linkedinVerificationStatus: profile.linkedinVerificationStatus,
        linkedinHasIdentityVerification: resolveHasLinkedInIdentityVerification(
          profile.linkedinVerificationData
        ),
      },
    });
    const hasPendingToken = hasActiveWorkEmailToken(profile);
    const effectiveIdentityVerified =
      policySummary.compatibility.verificationTier === 'identity_verified';
    const linkedinVerificationStatus = profile.linkedinVerificationStatus || 'unverified';
    const linkedinVerificationLevel =
      profile.linkedinVerificationLevel ||
      (policySummary.compatibility.verificationTier === 'identity_verified'
        ? 'identity'
        : policySummary.compatibility.verificationTier === 'workplace_verified'
          ? 'workplace'
          : 'unverified');
    const linkedinHasIdentityVerification =
      linkedinVerificationLevel === 'identity' ||
      resolveHasLinkedInIdentityVerification(profile.linkedinVerificationData);
    const verificationStatus =
      hasPendingToken && policySummary.compatibility.verificationStatus === 'unverified'
        ? 'pending'
        : policySummary.compatibility.verificationStatus;
    const verificationMethod =
      verificationStatus === 'pending' &&
      hasPendingToken &&
      !policySummary.compatibility.verificationMethod
        ? 'work_email'
        : policySummary.compatibility.verificationMethod;

    return mobileSuccess({
      verified: effectiveIdentityVerified,
      verificationMethod,
      verificationStatus,
      verificationTier: policySummary.compatibility.verificationTier,
      verificationTierSource: policySummary.compatibility.verificationTierSource,
      verifiedAt: profile.verifiedAt,
      linkedinVerificationStatus,
      linkedinVerificationLevel,
      linkedinHasIdentityVerification,
      linkedinVerifiedAt: profile.linkedinVerifiedAt,
      workEmail: profile.workEmail,
      workEmailVerified:
        workEmailValidity.isCurrentlyVerified || policySummary.compatibility.workEmailVerified,
      workEmailReverifyDueAt: workEmailValidity.reverifyDueAt,
      workEmailNeedsReverify: workEmailValidity.needsReverify,
      summary: {
        badgeSemanticsVersion: policySummary.badgeSemanticsVersion,
        publicBadges: policySummary.publicBadges,
        activeIssues: policySummary.activeIssues,
        slots: policySummary.slots,
      },
    });
  } catch (error) {
    console.error('[mobile.verification.status.get] failed', error);
    return mobileError('internal_error', 'Failed to load verification status', 500);
  }
}
