import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { VALUES_TAXONOMY, CAUSES_TAXONOMY, SKILLS_TAXONOMY } from '@/lib/taxonomy/data';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

/**
 * GET /api/taxonomy/[kind]
 *
 * Returns controlled vocabulary for a given taxonomy kind.
 *
 * Params:
 *   - kind: 'values' | 'causes' | 'skills'
 *
 * Returns:
 *   - { items: TaxonomyItem[] }
 *
 * Auth: Required
 */
type TaxonomyRouteContext = { params: Promise<{ kind: string }> };

export async function GET(request: NextRequest, context: TaxonomyRouteContext) {
  let kind: string | undefined;

  try {
    // Feature flag check
    // Auth check
    await requireAuth();

    const params = await context.params;
    kind = params.kind;

    // Return appropriate taxonomy
    switch (kind) {
      case 'values':
        return NextResponse.json({ items: VALUES_TAXONOMY });

      case 'causes':
        return NextResponse.json({ items: CAUSES_TAXONOMY });

      case 'skills':
        return NextResponse.json({ items: SKILLS_TAXONOMY });

      default:
        return NextResponse.json(
          { error: 'Invalid taxonomy kind. Must be: values, causes, or skills.' },
          { status: 400 }
        );
    }
  } catch (error) {
    log.error('taxonomy.fetch.failed', {
      kind,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to fetch taxonomy' }, { status: 500 });
  }
}
