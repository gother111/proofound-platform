type ErrorWithMetadata = {
  code?: string | number;
  message?: string;
  details?: string | null;
  hint?: string | null;
};

function normalizeColumnHint(value: string): string {
  return value
    .toLowerCase()
    .replace(/[.\s"]/g, '_')
    .replace(/_+/g, '_');
}

function collectErrorText(error: ErrorWithMetadata): string {
  return [error.message, error.details, error.hint]
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .join(' ')
    .toLowerCase();
}

export function isMissingColumnError(error: unknown, columns: string[]): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const typed = error as ErrorWithMetadata;
  const code = typeof typed.code === 'string' ? typed.code : String(typed.code ?? '');
  const fullText = collectErrorText(typed);

  if (!fullText) {
    return false;
  }

  const genericMissingColumnSignal =
    fullText.includes('does not exist') ||
    fullText.includes('undefined column') ||
    (fullText.includes('schema cache') && fullText.includes('column')) ||
    fullText.includes('could not find the');

  if (!genericMissingColumnSignal && code !== '42703' && code !== 'PGRST204') {
    return false;
  }

  const normalizedText = normalizeColumnHint(fullText);
  return columns.some((column) => {
    const normalizedColumn = normalizeColumnHint(column);
    return (
      normalizedText.includes(normalizedColumn) ||
      normalizedText.includes(`individual_profiles_${normalizedColumn}`) ||
      normalizedText.includes(`organizations_${normalizedColumn}`)
    );
  });
}

export function isMissingRelationError(error: unknown, relations: string[]): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const typed = error as ErrorWithMetadata;
  const code = typeof typed.code === 'string' ? typed.code : String(typed.code ?? '');
  const fullText = collectErrorText(typed);

  if (!fullText) {
    return false;
  }

  const genericMissingRelationSignal =
    fullText.includes('does not exist') ||
    fullText.includes('undefined table') ||
    fullText.includes('relation');

  if (!genericMissingRelationSignal && code !== '42P01') {
    return false;
  }

  const normalizedText = normalizeColumnHint(fullText);
  return relations.some((relation) => normalizedText.includes(normalizeColumnHint(relation)));
}

export function isSchemaCompatibilityError(
  error: unknown,
  options: {
    columns?: string[];
    relations?: string[];
  }
): boolean {
  const { columns = [], relations = [] } = options;

  return (
    (columns.length > 0 && isMissingColumnError(error, columns)) ||
    (relations.length > 0 && isMissingRelationError(error, relations))
  );
}
