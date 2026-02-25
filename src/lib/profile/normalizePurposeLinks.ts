import type { Value } from '@/types/profile';
import {
  buildPurposeLinks,
  normalizePurposeLinks,
  prunePurposeLinks,
  type PurposeLinksShape,
} from '@/lib/purpose/normalizePurposeLinks';

export function normalizeIndividualValueLabels(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  const labels: string[] = [];
  const seen = new Set<string>();

  for (const item of values) {
    const label =
      typeof item === 'string'
        ? item
        : item && typeof item === 'object' && 'label' in item
          ? (item as Value).label
          : null;

    if (typeof label !== 'string') {
      continue;
    }

    const trimmed = label.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }

    seen.add(trimmed);
    labels.push(trimmed);
  }

  return labels;
}

export function normalizeIndividualCauses(causes: unknown): string[] {
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

export function normalizeIndividualPurposeLinks(links: unknown): PurposeLinksShape {
  return normalizePurposeLinks(links);
}

export function createIndividualDefaultPurposeLinks(
  values: unknown,
  causes: unknown
): PurposeLinksShape {
  return buildPurposeLinks(
    normalizeIndividualValueLabels(values),
    normalizeIndividualCauses(causes)
  );
}

export function pruneIndividualPurposeLinks(
  links: PurposeLinksShape,
  values: unknown,
  causes: unknown
): PurposeLinksShape {
  return prunePurposeLinks(
    links,
    normalizeIndividualValueLabels(values),
    normalizeIndividualCauses(causes)
  );
}
