import { NextRequest, NextResponse } from 'next/server';

import { requireAuth } from '@/lib/auth';
import { getMomentumSummary } from '@/lib/momentum/summary';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;

    const persona =
      searchParams.get('persona') === 'organization'
        ? ('organization' as const)
        : ('individual' as const);
    const orgRef = searchParams.get('org') || undefined;

    const summary = await getMomentumSummary(user.id, persona, orgRef);

    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to build momentum summary',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
