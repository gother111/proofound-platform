import { createAdminClient } from '@/lib/supabase/admin';
import { log } from '@/lib/log';
import { hashPII } from '@/lib/utils/privacy';

export const VERIFICATION_INTEGRITY_REASONS = {
  SELF_VERIFICATION_BLOCKED: 'self_verification_blocked',
  SUSPECTED_COLLUSION: 'suspected_collusion',
  VERIFIER_PROFILE_CONTRADICTION: 'verifier_profile_contradiction',
  SAME_DEVICE_SIGNAL: 'same_device_signal',
} as const;

export type VerificationIntegrityReason =
  (typeof VERIFICATION_INTEGRITY_REASONS)[keyof typeof VERIFICATION_INTEGRITY_REASONS];

export type VerificationIntegrityStatus = 'clear' | 'flagged';

export type VerificationRiskSignals = {
  same_canonical_email: boolean;
  same_profile: boolean;
  same_non_free_domain: boolean;
  shared_organization: boolean;
  same_device_signal: boolean;
};

export type VerificationSource = 'peer' | 'manager' | 'external';

export type VerificationIntegrityPolicy = {
  blockSelf: boolean;
  requiresAuthenticatedVerifier: boolean;
  integrityStatus: VerificationIntegrityStatus;
  integrityReason: VerificationIntegrityReason | null;
};

export type RequestFingerprints = {
  ipHash: string | null;
  userAgentHash: string | null;
};

export type VerificationRequestIntegrityAssessment = {
  normalizedRequesterEmail: string | null;
  normalizedVerifierEmail: string;
  requesterDomain: string | null;
  verifierDomain: string | null;
  verifierProfileId: string | null;
  riskSignals: VerificationRiskSignals;
  policy: VerificationIntegrityPolicy;
  requesterFingerprints: RequestFingerprints;
};

const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'icloud.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
  'pm.me',
  'yandex.com',
  'mail.com',
]);

function isMissingColumnError(error: unknown, column: string): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const e = error as { code?: string; message?: string; details?: string; hint?: string };
  const text = `${e.message || ''} ${e.details || ''} ${e.hint || ''}`.toLowerCase();
  return (e.code === 'PGRST204' || e.code === '42703') && text.includes(column.toLowerCase());
}

function createAdminClientSafe() {
  try {
    return createAdminClient();
  } catch (error) {
    log.warn('verification.integrity.admin_client_unavailable', { error });
    return null;
  }
}

function safeHashPII(value: string | null): string | null {
  if (!value) {
    return null;
  }

  try {
    return hashPII(value);
  } catch {
    return null;
  }
}

function canonicalizeLocalPart(localPart: string, domain: string): string {
  const plusIndex = localPart.indexOf('+');
  const withoutAlias = plusIndex >= 0 ? localPart.slice(0, plusIndex) : localPart;

  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    return withoutAlias.replace(/\./g, '');
  }

  return withoutAlias;
}

export function normalizeEmail(email: string | null | undefined): string | null {
  if (!email || typeof email !== 'string') {
    return null;
  }

  const normalized = email.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

export function canonicalizeEmailForIdentity(email: string | null | undefined): string | null {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return null;
  }

  const atIndex = normalized.lastIndexOf('@');
  if (atIndex <= 0 || atIndex === normalized.length - 1) {
    return normalized;
  }

  const localPart = normalized.slice(0, atIndex);
  const domain = normalized.slice(atIndex + 1);
  return `${canonicalizeLocalPart(localPart, domain)}@${domain}`;
}

export function getEmailDomain(email: string | null | undefined): string | null {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return null;
  }

  const atIndex = normalized.lastIndexOf('@');
  if (atIndex <= 0 || atIndex === normalized.length - 1) {
    return null;
  }

  return normalized.slice(atIndex + 1);
}

export function isFreeEmailDomain(domain: string | null | undefined): boolean {
  if (!domain) {
    return false;
  }

  return FREE_EMAIL_DOMAINS.has(domain.toLowerCase());
}

function getClientIp(headers: Headers): string | null {
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    const [first] = forwardedFor.split(',');
    const ip = first?.trim();
    if (ip) {
      return ip;
    }
  }

  const realIp = headers.get('x-real-ip')?.trim();
  return realIp || null;
}

export function extractRequestFingerprints(
  headers: Headers | null | undefined
): RequestFingerprints {
  if (!headers) {
    return {
      ipHash: null,
      userAgentHash: null,
    };
  }

  const ip = getClientIp(headers);
  const userAgent = headers.get('user-agent')?.trim() || null;

  return {
    ipHash: safeHashPII(ip),
    userAgentHash: safeHashPII(userAgent),
  };
}

async function resolveVerifierProfileIdByEmail(verifierEmail: string): Promise<string | null> {
  const adminClient = createAdminClientSafe();
  if (!adminClient) {
    return null;
  }

  const profileLookup = await adminClient
    .from('profiles')
    .select('id')
    .eq('email', verifierEmail)
    .maybeSingle();

  if (!profileLookup.error && profileLookup.data?.id) {
    return profileLookup.data.id as string;
  }

  const shouldFallbackToWorkEmail =
    isMissingColumnError(profileLookup.error, 'email') ||
    profileLookup.error?.code === 'PGRST116' ||
    !profileLookup.data;

  if (!shouldFallbackToWorkEmail) {
    return null;
  }

  const workEmailLookup = await adminClient
    .from('individual_profiles')
    .select('user_id')
    .eq('work_email', verifierEmail)
    .eq('work_email_verified', true)
    .maybeSingle();

  if (workEmailLookup.error || !workEmailLookup.data?.user_id) {
    return null;
  }

  return workEmailLookup.data.user_id as string;
}

async function hasSharedOrganization(
  requesterProfileId: string,
  verifierProfileId: string | null
): Promise<boolean> {
  if (!verifierProfileId) {
    return false;
  }

  const adminClient = createAdminClientSafe();
  if (!adminClient) {
    return false;
  }

  const [requesterMemberships, verifierMemberships] = await Promise.all([
    adminClient
      .from('organization_members')
      .select('org_id')
      .eq('user_id', requesterProfileId)
      .eq('status', 'active'),
    adminClient
      .from('organization_members')
      .select('org_id')
      .eq('user_id', verifierProfileId)
      .eq('status', 'active'),
  ]);

  if (requesterMemberships.error || verifierMemberships.error) {
    return false;
  }

  const requesterOrgIds = new Set(
    (requesterMemberships.data || []).map((row: any) => String(row.org_id || ''))
  );

  if (requesterOrgIds.size === 0) {
    return false;
  }

  for (const row of verifierMemberships.data || []) {
    const orgId = String((row as any).org_id || '');
    if (orgId && requesterOrgIds.has(orgId)) {
      return true;
    }
  }

  return false;
}

export function deriveIntegrityPolicy(
  signals: VerificationRiskSignals
): VerificationIntegrityPolicy {
  const isSelf = signals.same_canonical_email || signals.same_profile;
  if (isSelf) {
    return {
      blockSelf: true,
      requiresAuthenticatedVerifier: false,
      integrityStatus: 'flagged',
      integrityReason: VERIFICATION_INTEGRITY_REASONS.SELF_VERIFICATION_BLOCKED,
    };
  }

  const suspectedCollusion = signals.same_non_free_domain || signals.shared_organization;
  if (suspectedCollusion) {
    return {
      blockSelf: false,
      requiresAuthenticatedVerifier: true,
      integrityStatus: 'flagged',
      integrityReason: VERIFICATION_INTEGRITY_REASONS.SUSPECTED_COLLUSION,
    };
  }

  return {
    blockSelf: false,
    requiresAuthenticatedVerifier: false,
    integrityStatus: 'clear',
    integrityReason: null,
  };
}

export async function assessVerificationRequestIntegrity(args: {
  requesterProfileId: string;
  requesterEmail: string | null;
  verifierEmail: string;
  headers?: Headers | null;
  verifierSource?: VerificationSource | null;
}): Promise<VerificationRequestIntegrityAssessment> {
  const normalizedRequesterEmail = normalizeEmail(args.requesterEmail);
  const normalizedVerifierEmail = normalizeEmail(args.verifierEmail);

  if (!normalizedVerifierEmail) {
    throw new Error('Verifier email normalization failed');
  }

  const requesterCanonicalEmail = canonicalizeEmailForIdentity(normalizedRequesterEmail);
  const verifierCanonicalEmail = canonicalizeEmailForIdentity(normalizedVerifierEmail);
  const requesterDomain = getEmailDomain(normalizedRequesterEmail);
  const verifierDomain = getEmailDomain(normalizedVerifierEmail);

  const verifierProfileId = await resolveVerifierProfileIdByEmail(normalizedVerifierEmail);
  const sharedOrganization = await hasSharedOrganization(
    args.requesterProfileId,
    verifierProfileId
  );

  const sameNonFreeDomain =
    Boolean(requesterDomain) &&
    Boolean(verifierDomain) &&
    requesterDomain === verifierDomain &&
    !isFreeEmailDomain(requesterDomain);

  const riskSignals: VerificationRiskSignals = {
    same_canonical_email: Boolean(
      requesterCanonicalEmail &&
        verifierCanonicalEmail &&
        requesterCanonicalEmail === verifierCanonicalEmail
    ),
    same_profile: Boolean(verifierProfileId && verifierProfileId === args.requesterProfileId),
    same_non_free_domain: sameNonFreeDomain,
    shared_organization: sharedOrganization,
    same_device_signal: false,
  };

  const policy = deriveIntegrityPolicy(riskSignals);

  return {
    normalizedRequesterEmail,
    normalizedVerifierEmail,
    requesterDomain,
    verifierDomain,
    verifierProfileId,
    riskSignals,
    policy,
    requesterFingerprints: extractRequestFingerprints(args.headers),
  };
}

export function hasSameDeviceSignal(args: {
  requesterIpHash: string | null | undefined;
  requesterUserAgentHash: string | null | undefined;
  responderIpHash: string | null | undefined;
  responderUserAgentHash: string | null | undefined;
}): boolean {
  const sameIp =
    Boolean(args.requesterIpHash) &&
    Boolean(args.responderIpHash) &&
    args.requesterIpHash === args.responderIpHash;
  const sameUserAgent =
    Boolean(args.requesterUserAgentHash) &&
    Boolean(args.responderUserAgentHash) &&
    args.requesterUserAgentHash === args.responderUserAgentHash;

  return sameIp && sameUserAgent;
}

export function mergeIntegrityWithResponseSignal(args: {
  currentStatus: string | null | undefined;
  currentReason: string | null | undefined;
  currentSignals: unknown;
  sameDeviceSignal: boolean;
}): {
  integrityStatus: VerificationIntegrityStatus;
  integrityReason: string | null;
  riskSignals: Record<string, unknown>;
  integrityFlaggedAt: string | null;
} {
  const riskSignals =
    args.currentSignals && typeof args.currentSignals === 'object'
      ? { ...(args.currentSignals as Record<string, unknown>) }
      : {};

  riskSignals.same_device_signal = args.sameDeviceSignal;

  if (!args.sameDeviceSignal) {
    const status = args.currentStatus === 'flagged' ? 'flagged' : 'clear';
    return {
      integrityStatus: status,
      integrityReason: args.currentReason || null,
      riskSignals,
      integrityFlaggedAt: status === 'flagged' ? new Date().toISOString() : null,
    };
  }

  return {
    integrityStatus: 'flagged',
    integrityReason: args.currentReason || VERIFICATION_INTEGRITY_REASONS.SAME_DEVICE_SIGNAL,
    riskSignals,
    integrityFlaggedAt: new Date().toISOString(),
  };
}

export async function writeVerificationAuditLog(params: {
  actorId: string | null;
  action: string;
  targetType: string;
  targetId: string;
  meta?: Record<string, unknown>;
}) {
  try {
    const adminClient = createAdminClientSafe();
    if (!adminClient) {
      return;
    }
    const payload = {
      actor_id: params.actorId,
      action: params.action,
      target_type: params.targetType,
      target_id: params.targetId,
      meta: params.meta || {},
    };

    await adminClient.from('audit_logs').insert(payload);
  } catch (error) {
    log.error('verification.integrity.audit_log_insert_failed', {
      error,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
    });
  }
}
