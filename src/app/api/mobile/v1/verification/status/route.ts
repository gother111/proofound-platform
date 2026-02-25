import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

import { db } from '@/db';
import { individualProfiles } from '@/db/schema';
import { requireMobileAuth } from '@/lib/api/mobile/auth';
import { mobileError, mobileSuccess } from '@/lib/api/mobile/response';
import { resolveWorkEmailValidity } from '@/lib/verification/work-email-validity';

export const dynamic = 'force-dynamic';

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
        verifiedAt: individualProfiles.verifiedAt,
        workEmail: individualProfiles.workEmail,
        workEmailVerified: individualProfiles.workEmailVerified,
        workEmailVerifiedAt: individualProfiles.workEmailVerifiedAt,
        workEmailReverifyDueAt: individualProfiles.workEmailReverifyDueAt,
      })
      .from(individualProfiles)
      .where(eq(individualProfiles.userId, auth.user.id))
      .limit(1);

    if (!profile) {
      return mobileSuccess({
        verified: false,
        verificationMethod: null,
        verificationStatus: 'unverified',
        verifiedAt: null,
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
    const isWorkEmailPrimaryVerification = profile.verificationMethod === 'work_email';
    const effectiveIdentityVerified =
      Boolean(profile.verified) &&
      !(isWorkEmailPrimaryVerification && workEmailValidity.needsReverify);
    const effectiveVerificationStatus =
      isWorkEmailPrimaryVerification && workEmailValidity.needsReverify
        ? 'unverified'
        : profile.verificationStatus;

    return mobileSuccess({
      verified: effectiveIdentityVerified,
      verificationMethod: profile.verificationMethod,
      verificationStatus: effectiveVerificationStatus,
      verifiedAt: profile.verifiedAt,
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
