import { POLICY_VERSIONS } from '@/lib/privacy/policy-version-config';

/**
 * Consent types tracked for legal and product consent flows.
 */
export const CONSENT_TYPES = {
  TOS: 'gdpr_terms_of_service',
  PRIVACY: 'gdpr_privacy_policy',
  MARKETING: 'marketing_emails',
  ANALYTICS: 'analytics_tracking',
  ML_MATCHING: 'ml_matching',
} as const;

export type ConsentTypeValue = (typeof CONSENT_TYPES)[keyof typeof CONSENT_TYPES];

/**
 * Resolve policy version by consent type from the canonical version map.
 */
export function getPolicyVersionForConsentType(consentType: ConsentTypeValue): string {
  switch (consentType) {
    case CONSENT_TYPES.TOS:
      return POLICY_VERSIONS.tos;
    case CONSENT_TYPES.PRIVACY:
      return POLICY_VERSIONS.privacy;
    case CONSENT_TYPES.ANALYTICS:
    case CONSENT_TYPES.MARKETING:
      return POLICY_VERSIONS.cookie;
    case CONSENT_TYPES.ML_MATCHING:
      return POLICY_VERSIONS.privacy;
    default:
      return POLICY_VERSIONS.privacy;
  }
}
