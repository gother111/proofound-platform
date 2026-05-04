import { NextRequest, NextResponse } from 'next/server';

import { assertStartFromCvAccess, getStartFromCvSession } from '@/lib/ai/start-from-cv';

import { handleStartFromCvRouteError, requireStartFromCvRouteContext } from '../../_route-helpers';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const context = await requireStartFromCvRouteContext();
    if (context instanceof NextResponse) {
      return context;
    }

    const { sessionId } = await params;
    await assertStartFromCvAccess(context.betaContext);
    const result = await getStartFromCvSession({
      sessionId,
      userId: context.auth.user.id,
    });

    return NextResponse.json(result, {
      headers: {
        'cache-control': 'no-store',
      },
    });
  } catch (error) {
    return handleStartFromCvRouteError(error, 'start_from_cv.sessions.get.failed');
  }
}
