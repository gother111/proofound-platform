/**
 * Privacy Policy Version Tracking
 *
 * Tracks versions of Terms of Service and Privacy Policy.
 * Ensures users re-consent when policies are updated.
 */

import { db, userConsents } from '@/db';
import { eq, and, desc } from 'drizzle-orm';
import { POLICY_VERSIONS, POLICY_EFFECTIVE_DATES } from '@/lib/privacy/policy-version-config';
import {
  CONSENT_TYPES,
  getPolicyVersionForConsentType,
  type ConsentTypeValue,
} from '@/lib/privacy/consent-contract';

export { CONSENT_TYPES, getPolicyVersionForConsentType };
export type { ConsentTypeValue };

/**
 * Policy changelog for in-product transparency.
 */
export const POLICY_CHANGELOG = {
  tos: [
    {
      version: 'v1.1.2026-02-12',
      date: '2026-02-12',
      changes: [
        'Added EU launch compliance clarifications for moderation and transparency.',
        'Clarified account termination and immediate deletion behavior.',
        'Aligned acceptable use and appeal rights language with current moderation flows.',
      ],
    },
    {
      version: 'v1.0.2025-11-06',
      date: '2025-11-06',
      changes: ['Initial Terms of Service.'],
    },
  ],
  privacy: [
    {
      version: 'v1.3.2026-02-12',
      date: '2026-02-12',
      changes: [
        'Aligned cookie and analytics consent controls with runtime telemetry gating.',
        'Clarified non-diagnostic wellbeing data handling and matching exclusions.',
        'Updated retention and deletion language to immediate account deletion workflow.',
      ],
    },
    {
      version: 'v1.2.2025-11-06',
      date: '2025-11-06',
      changes: [
        'Added staged identity reveal messaging privacy controls.',
        'Enhanced verification privacy protections.',
      ],
    },
    {
      version: 'v1.1.2025-01-30',
      date: '2025-01-30',
      changes: ['Added CCPA compliance section.', 'Enhanced data portability rights.'],
    },
  ],
} as const;

/**
 * Check if user has consented to latest policy versions.
 */
export async function checkPolicyConsent(userId: string): Promise<{
  needsConsent: boolean;
  tosUpToDate: boolean;
  privacyUpToDate: boolean;
  missingConsents: string[];
}> {
  try {
    const consents = await db
      .select()
      .from(userConsents)
      .where(eq(userConsents.profileId, userId))
      .orderBy(desc(userConsents.createdAt));

    const tosConsent = consents.find((c) => c.consentType === CONSENT_TYPES.TOS);
    const tosUpToDate = tosConsent?.version === POLICY_VERSIONS.tos && tosConsent.consented;

    const privacyConsent = consents.find((c) => c.consentType === CONSENT_TYPES.PRIVACY);
    const privacyUpToDate =
      privacyConsent?.version === POLICY_VERSIONS.privacy && privacyConsent.consented;

    const missingConsents: string[] = [];
    if (!tosUpToDate) missingConsents.push('Terms of Service');
    if (!privacyUpToDate) missingConsents.push('Privacy Policy');

    return {
      needsConsent: !tosUpToDate || !privacyUpToDate,
      tosUpToDate,
      privacyUpToDate,
      missingConsents,
    };
  } catch (error) {
    console.error('Failed to check policy consent:', error);
    return {
      needsConsent: true,
      tosUpToDate: false,
      privacyUpToDate: false,
      missingConsents: ['Terms of Service', 'Privacy Policy'],
    };
  }
}

/**
 * Record user consent for a policy.
 */
export async function recordPolicyConsent(
  userId: string,
  consentType: keyof typeof CONSENT_TYPES,
  consented: boolean,
  ipAddress?: string,
  userAgent?: string
): Promise<any> {
  const resolvedConsentType = CONSENT_TYPES[consentType];
  const version = getPolicyVersionForConsentType(resolvedConsentType);

  const ipHash = ipAddress ? await hashString(ipAddress) : null;
  const userAgentHash = userAgent ? await hashString(userAgent) : null;

  const [consent] = await db
    .insert(userConsents)
    .values({
      profileId: userId,
      consentType: resolvedConsentType,
      consented,
      version,
      ipHash,
      userAgentHash,
    })
    .returning();

  return consent;
}

/**
 * Get consent history for a user.
 */
export async function getConsentHistory(
  userId: string,
  consentType?: keyof typeof CONSENT_TYPES
): Promise<any[]> {
  let query = db
    .select()
    .from(userConsents)
    .where(eq(userConsents.profileId, userId))
    .orderBy(desc(userConsents.createdAt));

  if (consentType) {
    query = db
      .select()
      .from(userConsents)
      .where(
        and(
          eq(userConsents.profileId, userId),
          eq(userConsents.consentType, CONSENT_TYPES[consentType])
        )
      )
      .orderBy(desc(userConsents.createdAt));
  }

  return await query;
}

async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function getPolicyChangelog(
  policyType: 'tos' | 'privacy',
  version: string
): { version: string; date: string; changes: readonly string[] } | null {
  const changelog = POLICY_CHANGELOG[policyType];
  return changelog.find((entry) => entry.version === version) || null;
}

export function getAllPolicyVersions(policyType: 'tos' | 'privacy') {
  return POLICY_CHANGELOG[policyType];
}
