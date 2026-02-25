const DEFAULT_MAX_VALUES = 5;

/**
 * Accepts legacy organization values shapes and returns normalized labels.
 * Supported item formats:
 * - string
 * - object with a string `label` field
 */
export function normalizeOrganizationValues(values: unknown, options?: { max?: number }): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  const max = options?.max ?? DEFAULT_MAX_VALUES;
  const normalized: string[] = [];
  const seen = new Set<string>();

  for (const item of values) {
    let label: string | null = null;

    if (typeof item === 'string') {
      label = item;
    } else if (item && typeof item === 'object' && 'label' in item) {
      const rawLabel = (item as { label?: unknown }).label;
      if (typeof rawLabel === 'string') {
        label = rawLabel;
      }
    }

    if (!label) {
      continue;
    }

    const trimmed = label.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }

    seen.add(trimmed);
    normalized.push(trimmed);

    if (normalized.length >= max) {
      break;
    }
  }

  return normalized;
}
