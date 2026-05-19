export type TaxonomySearchCategory =
  | 'technical'
  | 'soft_skills'
  | 'tools_technologies'
  | 'languages'
  | 'certifications'
  | 'other';

export function buildCvImportTaxonomySearchUrl(params: {
  query: string;
  category: TaxonomySearchCategory;
  evidenceSnippets: string[];
  limit?: number;
}): string {
  const searchParams = new URLSearchParams();
  searchParams.set('search', params.query);
  searchParams.set('context', 'cv_import');
  searchParams.set('category', params.category);
  searchParams.set('limit', String(Math.max(1, Math.min(params.limit ?? 8, 10))));

  for (const snippet of params.evidenceSnippets.slice(0, 3)) {
    const value = snippet.trim();
    if (!value) {
      continue;
    }
    searchParams.append('evidence', value);
  }

  return `/api/expertise/taxonomy?${searchParams.toString()}`;
}
