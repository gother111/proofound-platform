/**
 * Privacy Policy Version Tracking
 * 
 * Tracks versions of Terms of Service and Privacy Policy.
 * Ensures users re-consent when policies are updated.
 * 
 * Reference: DATA_SECURITY_PRIVACY_ARCHITECTURE.md Section 12
 */

import { db, userConsents } from '@/db';
import { eq, and, desc } from 'drizzle-orm';

/**
 * Current policy versions
 * Update these when policies change to trigger re-consent
 */
export const POLICY_VERSIONS = {
  tos: 'v1.0.2025-11-06',
  privacy: 'v1.2.2025-11-06',
  cookie: 'v1.0.2025-11-06',
  verification: 'v1.0.2024',
} as const;

/**
 * Policy changelog - document what changed
 */
export const POLICY_CHANGELOG = {
  tos: [
    {
      version: 'v1.0.2025-11-06',
      date: '2025-11-06',
      changes: [
        'Initial Terms of Service',
        'Added platform usage guidelines',
        'Defined user responsibilities',
        'Added dispute resolution process',
      ],
    },
  ],
  privacy: [
    {
      version: 'v1.2.2025-11-06',
      date: '2025-11-06',
      changes: [
        'Added staged identity reveal messaging privacy controls',
        'Enhanced verification privacy protections',
        'Added 30-day account deletion grace period',
        'Clarified data retention policies',
      ],
    },
    {
      version: 'v1.1.2025-01-30',
      date: '2025-01-30',
      changes: [
        'Added CCPA compliance section',
        'Enhanced data portability rights',
        'Added cookie policy reference',
      ],
    },
    {
      version: 'v1.0.2024',
      date: '2024',
      changes: ['Initial Privacy Policy', 'GDPR compliance framework', 'Data classification system'],
    },
  ],
} as const;

/**
 * Consent types that require tracking
 */
export const CONSENT_TYPES = {
  TOS: 'gdpr_terms_of_service',
  PRIVACY: 'gdpr_privacy_policy',
  MARKETING: 'marketing_emails',
  ANALYTICS: 'analytics_tracking',
  ML_MATCHING: 'ml_matching',
} as const;

/**
 * Check if user has consented to latest policy versions
 * 
 * @param userId - User ID to check
 * @returns Object with consent status for each policy
 */
export async function checkPolicyConsent(userId: string): Promise<{
  needsConsent: boolean;
  tosUpToDate: boolean;
  privacyUpToDate: boolean;
  missingConsents: string[];
}> {
  try {
    // Fetch user's latest consents
    const consents = await db
      .select()
      .from(userConsents)
      .where(eq(userConsents.profileId, userId))
      .orderBy(desc(userConsents.createdAt));

    // Check TOS consent
    const tosConsent = consents.find((c) => c.consentType === CONSENT_TYPES.TOS);
    const tosUpToDate = tosConsent?.version === POLICY_VERSIONS.tos && tosConsent.consented;

    // Check Privacy Policy consent
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
    // Fail closed - require re-consent if check fails
    return {
      needsConsent: true,
      tosUpToDate: false,
      privacyUpToDate: false,
      missingConsents: ['Terms of Service', 'Privacy Policy'],
    };
  }
}

/**
 * Record user consent for a policy
 * 
 * @param userId - User ID
 * @param consentType - Type of consent
 * @param consented - Whether user consented
 * @param ipAddress - User's IP address (will be hashed)
 * @param userAgent - User's user agent (will be hashed)
 * @returns Created consent record
 */
export async function recordPolicyConsent(
  userId: string,
  consentType: keyof typeof CONSENT_TYPES,
  consented: boolean,
  ipAddress?: string,
  userAgent?: string
): Promise<any> {
  const version =
    consentType === 'TOS'
      ? POLICY_VERSIONS.tos
      : consentType === 'PRIVACY'
        ? POLICY_VERSIONS.privacy
        : POLICY_VERSIONS.cookie;

  // Hash IP and user agent for privacy
  const ipHash = ipAddress ? await hashString(ipAddress) : null;
  const userAgentHash = userAgent ? await hashString(userAgent) : null;

  const [consent] = await db
    .insert(userConsents)
    .values({
      profileId: userId,
      consentType: CONSENT_TYPES[consentType],
      consented,
      version,
      ipHash,
      userAgentHash,
    })
    .returning();

  return consent;
}

/**
 * Get consent history for a user
 * 
 * @param userId - User ID
 * @param consentType - Optional: filter by consent type
 * @returns Array of consent records
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

/**
 * Hash a string using Web Crypto API
 * Used for IP addresses and user agents
 */
async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Get what changed in a policy version
 * 
 * @param policyType - 'tos' or 'privacy'
 * @param version - Version to get changes for
 * @returns Changelog entry or null
 */
export function getPolicyChangelog(
  policyType: 'tos' | 'privacy',
  version: string
): { version: string; date: string; changes: string[] } | null {
  const changelog = POLICY_CHANGELOG[policyType];
  return changelog.find((entry) => entry.version === version) || null;
}

/**
 * Get all versions for a policy type
 * 
 * @param policyType - 'tos' or 'privacy'
 * @returns Array of changelog entries
 */
export function getAllPolicyVersions(policyType: 'tos' | 'privacy') {
  return POLICY_CHANGELOG[policyType];
}

