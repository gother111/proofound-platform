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
