import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

import { db } from '@/db';
import { individualProfiles } from '@/db/schema';
import { requireMobileAuth } from '@/lib/api/mobile/auth';
import { mobileError, mobileSuccess } from '@/lib/api/mobile/response';
import { resolveHasLinkedInIdentityVerification } from '@/lib/linkedin-verified';
import { resolveCanonicalVerificationTier } from '@/lib/verification/tier';
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
    const canonicalTier = resolveCanonicalVerificationTier({
      currentTier: profile.verificationTier,
      currentTierSource: profile.verificationTierSource,
      verificationMethod: profile.verificationMethod,
      verificationStatus: profile.verificationStatus,
      verified: profile.verified,
      linkedinVerificationStatus: profile.linkedinVerificationStatus,
      linkedinVerificationData: profile.linkedinVerificationData,
      workEmailCurrentlyVerified: workEmailValidity.isCurrentlyVerified,
    });
    const hasPendingToken = hasActiveWorkEmailToken(profile);
    const effectiveIdentityVerified = canonicalTier.verificationTier === 'identity_verified';
    const linkedinVerificationStatus = profile.linkedinVerificationStatus || 'unverified';
    const linkedinVerificationLevel =
      profile.linkedinVerificationLevel || canonicalTier.linkedinVerificationLevel;
    const linkedinHasIdentityVerification =
      linkedinVerificationLevel === 'identity' ||
      resolveHasLinkedInIdentityVerification(profile.linkedinVerificationData);

    let verificationStatus: 'unverified' | 'pending' | 'verified' | 'failed' = 'unverified';
    let verificationMethod: 'veriff' | 'work_email' | 'linkedin' | null = null;

    if (effectiveIdentityVerified) {
      verificationStatus = 'verified';
      verificationMethod =
        canonicalTier.verificationTierSource === 'veriff' ? 'veriff' : 'linkedin';
    } else if (profile.verificationStatus === 'failed') {
      verificationStatus = 'failed';
      verificationMethod = profile.verificationMethod;
    } else if (
      linkedinVerificationStatus === 'pending' ||
      canonicalTier.linkedinVerificationLevel === 'pending' ||
      profile.verificationStatus === 'pending' ||
      hasPendingToken
    ) {
      verificationStatus = 'pending';
      verificationMethod = profile.verificationMethod === 'work_email' ? 'work_email' : 'linkedin';
    } else {
      verificationStatus = 'unverified';
      verificationMethod =
        canonicalTier.verificationTierSource === 'work_email' ||
        profile.verificationMethod === 'work_email'
          ? 'work_email'
          : null;
    }

    return mobileSuccess({
      verified: effectiveIdentityVerified,
      verificationMethod,
      verificationStatus,
      verificationTier: canonicalTier.verificationTier,
      verificationTierSource: canonicalTier.verificationTierSource,
      verifiedAt: profile.verifiedAt,
      linkedinVerificationStatus,
      linkedinVerificationLevel,
      linkedinHasIdentityVerification,
      linkedinVerifiedAt: profile.linkedinVerifiedAt,
      workEmail: profile.workEmail,
      workEmailVerified: workEmailValidity.isCurrentlyVerified,
      workEmailReverifyDueAt: workEmailValidity.reverifyDueAt,
      workEmailNeedsReverify: workEmailValidity.needsReverify,
    });
  } catch (error) {
    console.error('[mobile.verification.status.get] failed', error);
    return mobileError('internal_error', 'Failed to load verification status', 500);
  }
}
