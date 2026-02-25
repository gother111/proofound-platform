export type PurposeLinksShape = {
  values: string[];
  causes: string[];
};

export const EMPTY_PURPOSE_LINKS: PurposeLinksShape = {
  values: [],
  causes: [],
};

function normalizeStringList(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of input) {
    if (typeof item !== 'string') {
      continue;
    }

    const trimmed = item.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }

    seen.add(trimmed);
    result.push(trimmed);
  }

  return result;
}

export function normalizePurposeLinks(input: unknown): PurposeLinksShape {
  if (!input || typeof input !== 'object') {
    return { ...EMPTY_PURPOSE_LINKS };
  }

  const raw = input as { values?: unknown; causes?: unknown };

  return {
    values: normalizeStringList(raw.values),
    causes: normalizeStringList(raw.causes),
  };
}

export function buildPurposeLinks(values: unknown, causes: unknown): PurposeLinksShape {
  return {
    values: normalizeStringList(values),
    causes: normalizeStringList(causes),
  };
}

export function prunePurposeLinks(
  links: PurposeLinksShape,
  availableValues: string[],
  availableCauses: string[]
): PurposeLinksShape {
  const valuesSet = new Set(availableValues);
  const causesSet = new Set(availableCauses);

  return {
    values: links.values.filter((value) => valuesSet.has(value)),
    causes: links.causes.filter((cause) => causesSet.has(cause)),
  };
}

export function hasRequiredPurposeLinks(links: PurposeLinksShape): boolean {
  return links.values.length > 0 && links.causes.length > 0;
}
