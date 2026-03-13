import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

import { db } from '@/db';
import { individualProfiles } from '@/db/schema';
import { requireMobileAuth } from '@/lib/api/mobile/auth';
import { mobileError, mobileSuccess } from '@/lib/api/mobile/response';
import { buildVerificationStatusContract } from '@/lib/verification/status-contract';

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
      return mobileSuccess(await buildVerificationStatusContract(auth.user.id, null));
    }

    return mobileSuccess(
      await buildVerificationStatusContract(auth.user.id, {
        verified: profile.verified,
        verificationMethod: profile.verificationMethod,
        verificationStatus: profile.verificationStatus,
        verificationTier: profile.verificationTier,
        verificationTierSource: profile.verificationTierSource,
        verifiedAt: profile.verifiedAt?.toISOString() || null,
        workEmail: profile.workEmail,
        workEmailVerified: profile.workEmailVerified,
        workEmailVerifiedAt: profile.workEmailVerifiedAt?.toISOString() || null,
        workEmailReverifyDueAt: profile.workEmailReverifyDueAt?.toISOString() || null,
        workEmailToken: profile.workEmailToken,
        workEmailTokenExpires: profile.workEmailTokenExpires?.toISOString() || null,
        linkedinVerificationStatus: profile.linkedinVerificationStatus,
        linkedinVerificationLevel: profile.linkedinVerificationLevel,
        linkedinVerifiedAt: profile.linkedinVerifiedAt?.toISOString() || null,
        linkedinVerificationData: profile.linkedinVerificationData,
      })
    );
  } catch (error) {
    console.error('[mobile.verification.status.get] failed', error);
    return mobileError('internal_error', 'Failed to load verification status', 500);
  }
}
