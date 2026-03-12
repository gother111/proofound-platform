import type { Value } from '@/types/profile';
import {
  buildPurposeLinks,
  normalizePurposeLinks,
  normalizeUniqueStringList,
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

function normalizeLabel(input: unknown): string | null {
  if (typeof input !== 'string') {
    return null;
  }

  const trimmed = input.trim();
  return trimmed ? trimmed : null;
}

function extractValueLabel(input: unknown): string | null {
  if (typeof input === 'string') {
    return normalizeLabel(input);
  }

  if (input && typeof input === 'object' && 'label' in input) {
    return normalizeLabel((input as { label?: unknown }).label);
  }

  return null;
}

function normalizeFallbackValueId(index: number, label: string): string {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `legacy-${index}-${slug || 'value'}`;
}

function collectUniqueValueLabels(items: unknown[]): string[] {
  const labels: string[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    const label = extractValueLabel(item);
    if (!label || seen.has(label)) {
      continue;
    }

    seen.add(label);
    labels.push(label);
  }

  return labels;
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
    const label = extractValueLabel(item);

    if (!label || seenLabels.has(label)) {
      continue;
    }

    seenLabels.add(label);

    if (typeof item === 'string') {
      normalized.push({
        id: normalizeFallbackValueId(index, label),
        icon: FALLBACK_VALUE_ICON,
        label,
        verified: false,
      });
      continue;
    }

    if (!item || typeof item !== 'object') {
      continue;
    }

    const raw = item as Partial<Value>;
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

  return collectUniqueValueLabels(parsedValues);
}

export function normalizeIndividualCauses(causes: unknown): string[] {
  return normalizeUniqueStringList(causes);
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
