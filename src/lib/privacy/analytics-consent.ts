import { and, desc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { userConsents } from '@/db/schema';
import { CONSENT_TYPES } from '@/lib/privacy/consent-contract';

/**
 * Returns the most recent analytics consent state for a profile.
 * Missing consent records are treated as "not consented".
 */
export async function getLatestAnalyticsConsent(profileId: string): Promise<boolean> {
  const [latest] = await db
    .select({
      consented: userConsents.consented,
    })
    .from(userConsents)
    .where(
      and(
        eq(userConsents.profileId, profileId),
        eq(userConsents.consentType, CONSENT_TYPES.ANALYTICS)
      )
    )
    .orderBy(desc(userConsents.consentedAt))
    .limit(1);

  return latest?.consented === true;
}

/**
 * Convenience wrapper used by telemetry routes.
 * Kept separate so route call-sites are explicit and readable.
 */
export async function requireAnalyticsConsentForUser(profileId: string): Promise<boolean> {
  return getLatestAnalyticsConsent(profileId);
}
