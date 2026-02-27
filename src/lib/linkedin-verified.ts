const LINKEDIN_REST_BASE_URL = 'https://api.linkedin.com/rest';
const LINKEDIN_RESTLI_PROTOCOL_VERSION = '2.0.0';
const DEFAULT_LINKEDIN_API_VERSION = '202510';

function normalizeHttpUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const withScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(withScheme);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function getLinkedInApiVersion(): string {
  const configured = process.env.LINKEDIN_API_VERSION?.trim();
  return configured || DEFAULT_LINKEDIN_API_VERSION;
}

function normalizeVerificationLabel(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const candidates = [
      record.verificationType,
      record.type,
      record.name,
      record.label,
      record.value,
      record.status,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
      }
    }
  }

  return null;
}

function extractVerifications(raw: unknown): string[] {
  if (!raw || typeof raw !== 'object') return [];
  const record = raw as Record<string, unknown>;

  const candidates: unknown[] = [
    record.verifications,
    (record.elements as unknown[] | undefined)?.[0],
    (record.items as unknown[] | undefined)?.[0],
    record.data,
  ];

  const labels = new Set<string>();

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object') continue;
    const typedCandidate = candidate as Record<string, unknown>;

    const verificationEntries = Array.isArray(typedCandidate.verifications)
      ? typedCandidate.verifications
      : Array.isArray(candidate)
        ? candidate
        : [];

    for (const entry of verificationEntries) {
      const label = normalizeVerificationLabel(entry);
      if (label) labels.add(label);
    }
  }

  return [...labels];
}

function hasIdentityVerificationFromLabels(labels: string[]): boolean {
  return labels.some((label) => {
    const normalized = label
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, '_');

    return (
      normalized.includes('IDENTITY') ||
      normalized.includes('GOVERNMENT_ID') ||
      normalized.includes('GOVT_ID')
    );
  });
}

function hasWorkplaceVerificationFromLabels(labels: string[]): boolean {
  return labels.some((label) => {
    const normalized = label
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, '_');
    return normalized.includes('WORKPLACE') || normalized.includes('WORK_EMAIL');
  });
}

export function resolveHasLinkedInIdentityVerification(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  const record = data as Record<string, unknown>;

  if (record.hasIdentityVerification === true) return true;

  const apiReport = record.apiReport;
  if (apiReport && typeof apiReport === 'object') {
    const apiRecord = apiReport as Record<string, unknown>;
    if (apiRecord.hasIdentityVerification === true) return true;

    const apiLabels = extractVerifications(apiRecord);
    if (hasIdentityVerificationFromLabels(apiLabels)) return true;
  }

  const labels = extractVerifications(record);
  return hasIdentityVerificationFromLabels(labels);
}

export function resolveHasLinkedInWorkplaceVerification(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  const record = data as Record<string, unknown>;

  if (record.hasWorkplaceVerification === true) return true;

  const apiReport = record.apiReport;
  if (apiReport && typeof apiReport === 'object') {
    const apiRecord = apiReport as Record<string, unknown>;
    if (apiRecord.hasWorkplaceVerification === true) return true;

    const apiLabels = extractVerifications(apiRecord);
    if (hasWorkplaceVerificationFromLabels(apiLabels)) return true;
  }

  const labels = extractVerifications(record);
  return hasWorkplaceVerificationFromLabels(labels);
}

export class LinkedInRestApiError extends Error {
  status: number;
  endpoint: string;
  details: string | null;

  constructor(endpoint: string, status: number, details: string | null) {
    super(
      `LinkedIn ${endpoint} request failed (${status})${details ? `: ${details.slice(0, 300)}` : ''}`
    );
    this.name = 'LinkedInRestApiError';
    this.status = status;
    this.endpoint = endpoint;
    this.details = details;
  }
}

async function fetchLinkedInRestEndpoint<T>(
  endpoint: string,
  accessToken: string,
  query?: Record<string, string>
): Promise<T> {
  const url = new URL(`${LINKEDIN_REST_BASE_URL}${endpoint}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'LinkedIn-Version': getLinkedInApiVersion(),
      'X-Restli-Protocol-Version': LINKEDIN_RESTLI_PROTOCOL_VERSION,
    },
  });

  if (!response.ok) {
    const details = await response.text().catch(() => null);
    throw new LinkedInRestApiError(endpoint, response.status, details);
  }

  return (await response.json()) as T;
}

export type LinkedInVerificationReport = {
  raw: unknown;
  verifications: string[];
  hasIdentityVerification: boolean;
  hasWorkplaceVerification: boolean;
};

export async function fetchLinkedInVerificationReport(
  accessToken: string
): Promise<LinkedInVerificationReport> {
  const raw = await fetchLinkedInRestEndpoint<unknown>('/verificationReport', accessToken);
  const verifications = extractVerifications(raw);

  return {
    raw,
    verifications,
    hasIdentityVerification: hasIdentityVerificationFromLabels(verifications),
    hasWorkplaceVerification: hasWorkplaceVerificationFromLabels(verifications),
  };
}

function firstString(candidates: unknown[]): string | null {
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }
  return null;
}

export type LinkedInIdentityMe = {
  raw: unknown;
  memberUrn: string | null;
  profileUrl: string | null;
  publicIdentifier: string | null;
};

export async function fetchLinkedInIdentityMe(accessToken: string): Promise<LinkedInIdentityMe> {
  const raw = await fetchLinkedInRestEndpoint<unknown>('/identityMe', accessToken);

  const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const profile = record.profile && typeof record.profile === 'object' ? record.profile : {};
  const basicInfo =
    record.basicInfo && typeof record.basicInfo === 'object' ? record.basicInfo : {};

  const profileRecord = profile as Record<string, unknown>;
  const basicInfoRecord = basicInfo as Record<string, unknown>;

  const publicIdentifier = firstString([
    record.publicIdentifier,
    record.vanityName,
    profileRecord.publicIdentifier,
    profileRecord.vanityName,
    profileRecord.profileHandle,
    basicInfoRecord.publicIdentifier,
    basicInfoRecord.vanityName,
    basicInfoRecord.profileHandle,
  ]);

  const rawProfileUrl = firstString([
    record.profileUrl,
    record.publicProfileUrl,
    profileRecord.profileUrl,
    profileRecord.publicProfileUrl,
    profileRecord.url,
    basicInfoRecord.profileUrl,
    basicInfoRecord.publicProfileUrl,
    basicInfoRecord.url,
  ]);

  const profileUrl =
    normalizeHttpUrl(rawProfileUrl) ||
    (publicIdentifier
      ? normalizeHttpUrl(`https://www.linkedin.com/in/${encodeURIComponent(publicIdentifier)}`)
      : null);

  return {
    raw,
    memberUrn: firstString([
      record.member,
      record.memberUrn,
      record.id,
      record.entityUrn,
      basicInfoRecord.member,
      basicInfoRecord.memberUrn,
      basicInfoRecord.id,
      basicInfoRecord.entityUrn,
    ]),
    profileUrl,
    publicIdentifier,
  };
}
