import { normalizeOrganizationWebsite } from '@/lib/organizations/normalizeWebsite';

type OrganizationTrustProfileInput = {
  displayName?: string | null;
  mission?: string | null;
  whyWorkMatters?: string | null;
  operatingContext?: string | null;
  website?: string | null;
  websiteVerifiedAt?: string | Date | null;
  trustStatus?: string | null;
  verified?: boolean | null;
};

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

export function hasVerifiedOrganizationDomainSignal(input: OrganizationTrustProfileInput) {
  return Boolean(
    input.website &&
      (input.websiteVerifiedAt ||
        input.trustStatus === 'domain_verified' ||
        input.trustStatus === 'platform_reviewed' ||
        input.verified === true)
  );
}

export function getVerifiedOrganizationDomainPath(input: OrganizationTrustProfileInput) {
  if (!hasVerifiedOrganizationDomainSignal(input)) {
    return null;
  }

  const normalizedWebsite = normalizeOrganizationWebsite(input.website);
  if (!normalizedWebsite.value) {
    return null;
  }

  try {
    const parsed = new URL(normalizedWebsite.value);
    const normalizedPath = parsed.pathname === '/' ? '' : parsed.pathname.replace(/\/$/, '');
    return `${parsed.hostname}${normalizedPath}`;
  } catch {
    return null;
  }
}

export function resolveOrganizationReadiness(input: OrganizationTrustProfileInput) {
  return hasText(input.displayName) &&
    hasText(input.mission) &&
    hasText(input.whyWorkMatters) &&
    hasText(input.operatingContext) &&
    getVerifiedOrganizationDomainPath(input)
    ? 'org_ready'
    : 'draft';
}
