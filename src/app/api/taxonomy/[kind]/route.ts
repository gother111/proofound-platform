import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuthContext } from '@/lib/auth';
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
export async function GET(request: NextRequest, { params }: { params: Promise<{ kind: string }> }) {
  try {
    // Feature flag check
    // Auth check
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { kind } = resolvedParams;

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
    const resolvedParams = await params;
    log.error('taxonomy.fetch.failed', {
      kind: resolvedParams.kind,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to fetch taxonomy' }, { status: 500 });
  }
}
