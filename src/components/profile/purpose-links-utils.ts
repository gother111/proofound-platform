import type { PurposeLinks } from '@/types/profile';
import { normalizeUniqueStringList } from '@/lib/purpose/normalizePurposeLinks';

export function normalizeLabels(items: string[]): string[] {
  return normalizeUniqueStringList(items);
}

export function normalizeLinks(
  links: PurposeLinks | undefined,
  values: string[],
  causes: string[]
): PurposeLinks {
  const valueSet = new Set(values);
  const causeSet = new Set(causes);

  return {
    values: (links?.values ?? []).filter((value) => valueSet.has(value)),
    causes: (links?.causes ?? []).filter((cause) => causeSet.has(cause)),
  };
}

export function toggleItem(items: string[], target: string): string[] {
  if (items.includes(target)) {
    return items.filter((item) => item !== target);
  }

  return [...items, target];
}
