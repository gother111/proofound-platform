import type { Value } from '@/types/profile';
import {
  buildPurposeLinks,
  normalizePurposeLinks,
  prunePurposeLinks,
  type PurposeLinksShape,
} from '@/lib/purpose/normalizePurposeLinks';

const FALLBACK_VALUE_ICON = 'Heart';

export function parseJsonStringSafely(input: unknown): unknown {
  if (typeof input !== 'string') {
    return input;
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return input;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return input;
  }
}

function normalizeFallbackValueId(index: number, label: string): string {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `legacy-${index}-${slug || 'value'}`;
}

export function normalizeIndividualValues(values: unknown): Value[] {
  const parsedValues = parseJsonStringSafely(values);

  if (!Array.isArray(parsedValues)) {
    return [];
  }

  const normalized: Value[] = [];
  const seenLabels = new Set<string>();

  for (let index = 0; index < parsedValues.length; index += 1) {
    const item = parsedValues[index];

    if (typeof item === 'string') {
      const trimmed = item.trim();
      if (!trimmed || seenLabels.has(trimmed)) {
        continue;
      }

      seenLabels.add(trimmed);
      normalized.push({
        id: normalizeFallbackValueId(index, trimmed),
        icon: FALLBACK_VALUE_ICON,
        label: trimmed,
        verified: false,
      });
      continue;
    }

    if (!item || typeof item !== 'object') {
      continue;
    }

    const raw = item as Partial<Value>;
    const label = typeof raw.label === 'string' ? raw.label.trim() : '';
    if (!label || seenLabels.has(label)) {
      continue;
    }

    seenLabels.add(label);
    normalized.push({
      id:
        typeof raw.id === 'string' && raw.id.trim()
          ? raw.id.trim()
          : normalizeFallbackValueId(index, label),
      icon: typeof raw.icon === 'string' && raw.icon.trim() ? raw.icon.trim() : FALLBACK_VALUE_ICON,
      label,
      verified: raw.verified === true,
    });
  }

  return normalized;
}

export function normalizeIndividualValueLabels(values: unknown): string[] {
  const parsedValues = parseJsonStringSafely(values);

  if (!Array.isArray(parsedValues)) {
    return [];
  }

  const labels: string[] = [];
  const seen = new Set<string>();

  for (const item of parsedValues) {
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
  return normalizePurposeLinks(parseJsonStringSafely(links));
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
