const SYMBOL_PATTERNS: Array<[RegExp, string]> = [
  [/(^|[^a-z0-9])c\s*\+\+([^a-z0-9]|$)/g, '$1 cplusplus $2'],
  [/(^|[^a-z0-9])c\s*#([^a-z0-9]|$)/g, '$1 csharp $2'],
  [/(^|[^a-z0-9])(?:\.\s*net|dot\s*net|dotnet)([^a-z0-9]|$)/g, '$1 dotnet $2'],
  [/(^|[^a-z0-9])node\s*(?:\.\s*js|\s+js|js)([^a-z0-9]|$)/g, '$1 nodejs $2'],
  [/(^|[^a-z0-9])react\s*(?:\.\s*js|\s+js|js)([^a-z0-9]|$)/g, '$1 reactjs $2'],
  [/(^|[^a-z0-9])next\s*(?:\.\s*js|\s+js|js)([^a-z0-9]|$)/g, '$1 nextjs $2'],
  [/(^|[^a-z0-9])ci\s*(?:\/\s*|\s+)cd([^a-z0-9]|$)/g, '$1 cicd $2'],
];

function normalizeDiacritics(value: string): string {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
}

export function normalizeTaxonomyAlias(value: string): string {
  let normalized = normalizeDiacritics(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[\u2019\u2018'`]+/g, '');

  for (const [pattern, replacement] of SYMBOL_PATTERNS) {
    normalized = normalized.replace(pattern, replacement);
  }

  return normalized
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function normalizeTaxonomyComparison(value: string): string {
  return normalizeTaxonomyAlias(value);
}
