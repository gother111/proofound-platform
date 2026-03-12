import {
  buildPurposeLinks,
  normalizePurposeLinks,
  normalizeUniqueStringList,
  prunePurposeLinks,
  type PurposeLinksShape,
} from '@/lib/purpose/normalizePurposeLinks';
import { normalizeOrganizationValues } from '@/lib/organizations/normalizeValues';

export function normalizeOrganizationCauses(causes: unknown): string[] {
  return normalizeUniqueStringList(causes);
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
