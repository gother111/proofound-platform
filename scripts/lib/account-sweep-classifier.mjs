const TEST_TOKEN_REGEX = /(e2e|strict|test|demo|qa|smoke|direct-signup|rls_test)/i;

const HUMAN_DISPLAY_NAME_REGEX = /^\p{L}[\p{L}'".-]*(?:\s+\p{L}[\p{L}'".-]*)+$/u;

const TEST_EMAIL_DOMAINS = new Set([
  'test.proofound.com',
  'proofound-demo.com',
  'example.com',
  'test.com',
  'test-domain.com',
  'proofound-test.local',
]);

const KNOWN_SEEDED_EMAILS = new Set([
  'sofia.martinez@proofound-demo.com',
  'james.chen@proofound-demo.com',
  'amara.okafor@proofound-demo.com',
  'yuki.tanaka@proofound-demo.com',
  'alex.rivera@proofound-demo.com',
  'demo@greenpath-ngo.org',
  'demo@skillbridge.tech',
  'demo@circularcraft.eu',
  'nenah@proofound-demo.com',
  'mateo@proofound-demo.com',
  'ola@proofound-demo.com',
  'dmitry@proofound-demo.com',
  'priya@proofound-demo.com',
  'ops@greengrid-demo.com',
  'talent@bridges-demo.org',
  'sourcing@cityworks-demo.gov',
]);

function normalizeArray(values) {
  if (!Array.isArray(values)) return [];
  return values
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter((value) => value.length > 0);
}

function toLowerSet(values) {
  return new Set(values.map((value) => value.toLowerCase()));
}

export function normalizeEmail(email) {
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

export function extractEmailParts(email) {
  const normalized = normalizeEmail(email);
  const atIndex = normalized.indexOf('@');
  if (atIndex < 0) {
    return { normalized, localPart: normalized, domain: '' };
  }

  return {
    normalized,
    localPart: normalized.slice(0, atIndex),
    domain: normalized.slice(atIndex + 1),
  };
}

export function isHumanDisplayName(value) {
  if (typeof value !== 'string') return false;
  const normalized = value.trim();
  if (!normalized) return false;
  return HUMAN_DISPLAY_NAME_REGEX.test(normalized);
}

export function buildAllowlist(rawAllowlist = {}) {
  const emails = normalizeArray(rawAllowlist.emails || rawAllowlist.allowEmails);
  const userIds = normalizeArray(rawAllowlist.userIds || rawAllowlist.allowUserIds);
  const profileIds = normalizeArray(rawAllowlist.profileIds || rawAllowlist.allowProfileIds);

  return {
    emails: toLowerSet(emails),
    userIds: new Set(userIds),
    profileIds: new Set(profileIds),
  };
}

export function detectAuthUserIndicators({ id, email, displayName, handle }) {
  const indicators = [];
  const { normalized, localPart, domain } = extractEmailParts(email);

  if (KNOWN_SEEDED_EMAILS.has(normalized)) {
    indicators.push('known_seed_email');
  }

  if (TEST_EMAIL_DOMAINS.has(domain)) {
    indicators.push('email_domain_test_pattern');
  }

  if (TEST_TOKEN_REGEX.test(localPart)) {
    indicators.push('email_local_test_pattern');
  }

  if (TEST_TOKEN_REGEX.test(displayName || '')) {
    indicators.push('profile_display_name_test_pattern');
  }

  if (TEST_TOKEN_REGEX.test(handle || '')) {
    indicators.push('profile_handle_test_pattern');
  }

  return {
    indicators,
    emailDomain: domain,
    emailLocalPart: localPart,
    normalizedEmail: normalized,
    isKnownSeedEmail: KNOWN_SEEDED_EMAILS.has(normalized),
    isAllowlistedByEmail: false,
    isAllowlistedById: false,
    hasTestIndicators: indicators.length > 0,
    hasHumanDisplayName: isHumanDisplayName(displayName),
    userId: id,
  };
}

export function detectOrphanProfileIndicators({ id, displayName, handle }) {
  const indicators = [];

  if (TEST_TOKEN_REGEX.test(displayName || '')) {
    indicators.push('profile_display_name_test_pattern');
  }

  if (TEST_TOKEN_REGEX.test(handle || '')) {
    indicators.push('profile_handle_test_pattern');
  }

  return {
    indicators,
    hasTestIndicators: indicators.length > 0,
    hasHumanDisplayName: isHumanDisplayName(displayName),
    profileId: id,
  };
}

export function classifyAuthUser(user, allowlist) {
  const details = detectAuthUserIndicators(user);
  const normalizedEmail = details.normalizedEmail;
  const isAllowlistedByEmail = allowlist.emails.has(normalizedEmail);
  const isAllowlistedById = allowlist.userIds.has(user.id);
  const allowlisted = isAllowlistedByEmail || isAllowlistedById;

  const reasons = [];

  if (allowlisted) {
    reasons.push('allowlisted');
    return {
      decision: 'keep',
      keepReason: 'allowlisted',
      deleteReasons: [],
      allowlisted,
      indicators: details.indicators,
      hasHumanDisplayName: details.hasHumanDisplayName,
      emailDomain: details.emailDomain,
      emailLocalPart: details.emailLocalPart,
      metadata: {
        isAllowlistedByEmail,
        isAllowlistedById,
        isKnownSeedEmail: details.isKnownSeedEmail,
      },
    };
  }

  if (details.hasTestIndicators) {
    reasons.push(...details.indicators);
  }

  if (!details.hasHumanDisplayName) {
    reasons.push('strict_non_human_display_name');
  }

  if (reasons.length === 0) {
    return {
      decision: 'keep',
      keepReason: 'strict_human_name_without_test_indicators',
      deleteReasons: [],
      allowlisted: false,
      indicators: details.indicators,
      hasHumanDisplayName: true,
      emailDomain: details.emailDomain,
      emailLocalPart: details.emailLocalPart,
      metadata: {
        isAllowlistedByEmail: false,
        isAllowlistedById: false,
        isKnownSeedEmail: details.isKnownSeedEmail,
      },
    };
  }

  return {
    decision: 'delete',
    keepReason: null,
    deleteReasons: reasons,
    allowlisted: false,
    indicators: details.indicators,
    hasHumanDisplayName: details.hasHumanDisplayName,
    emailDomain: details.emailDomain,
    emailLocalPart: details.emailLocalPart,
    metadata: {
      isAllowlistedByEmail: false,
      isAllowlistedById: false,
      isKnownSeedEmail: details.isKnownSeedEmail,
    },
  };
}

export function classifyOrphanProfile(profile, allowlist) {
  const details = detectOrphanProfileIndicators(profile);
  const isAllowlistedByProfileId = allowlist.profileIds.has(profile.id);
  const isAllowlistedByUserId = allowlist.userIds.has(profile.id);
  const allowlisted = isAllowlistedByProfileId || isAllowlistedByUserId;

  if (allowlisted) {
    return {
      decision: 'keep',
      keepReason: 'allowlisted',
      deleteReasons: [],
      allowlisted: true,
      indicators: details.indicators,
      hasHumanDisplayName: details.hasHumanDisplayName,
      metadata: {
        isAllowlistedByProfileId,
        isAllowlistedByUserId,
      },
    };
  }

  const deleteReasons = ['orphan_profile_missing_auth_user'];
  deleteReasons.push(...details.indicators);
  if (!details.hasHumanDisplayName) {
    deleteReasons.push('strict_non_human_display_name');
  }

  return {
    decision: 'delete',
    keepReason: null,
    deleteReasons,
    allowlisted: false,
    indicators: details.indicators,
    hasHumanDisplayName: details.hasHumanDisplayName,
    metadata: {
      isAllowlistedByProfileId: false,
      isAllowlistedByUserId: false,
    },
  };
}

export function summarizeIndicatorCounts(entries) {
  const counts = {};
  for (const entry of entries) {
    const indicators = Array.isArray(entry.indicators) ? entry.indicators : [];
    for (const indicator of indicators) {
      counts[indicator] = (counts[indicator] || 0) + 1;
    }
  }
  return counts;
}

export function getKnownSeedEmails() {
  return Array.from(KNOWN_SEEDED_EMAILS);
}

export function getTestEmailDomains() {
  return Array.from(TEST_EMAIL_DOMAINS);
}

