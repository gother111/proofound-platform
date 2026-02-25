import {
  buildPurposeLinks,
  normalizePurposeLinks,
  prunePurposeLinks,
  type PurposeLinksShape,
} from '@/lib/purpose/normalizePurposeLinks';
import { normalizeOrganizationValues } from '@/lib/organizations/normalizeValues';

export function normalizeOrganizationCauses(causes: unknown): string[] {
  if (!Array.isArray(causes)) {
    return [];
  }

  const normalized: string[] = [];
  const seen = new Set<string>();

  for (const cause of causes) {
    if (typeof cause !== 'string') {
      continue;
    }

    const trimmed = cause.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }

    seen.add(trimmed);
    normalized.push(trimmed);
  }

  return normalized;
}

export function normalizeOrganizationPurposeLinks(links: unknown): PurposeLinksShape {
  return normalizePurposeLinks(links);
}

export function createOrganizationDefaultPurposeLinks(
  values: unknown,
  causes: unknown
): PurposeLinksShape {
  return buildPurposeLinks(
    normalizeOrganizationValues(values),
    normalizeOrganizationCauses(causes)
  );
}

export function pruneOrganizationPurposeLinks(
  links: PurposeLinksShape,
  values: unknown,
  causes: unknown
): PurposeLinksShape {
  return prunePurposeLinks(
    links,
    normalizeOrganizationValues(values),
    normalizeOrganizationCauses(causes)
  );
}
