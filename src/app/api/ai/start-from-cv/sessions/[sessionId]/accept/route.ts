import { NextRequest, NextResponse } from 'next/server';

import {
  acceptStartFromCvDrafts,
  assertStartFromCvAccess,
  StartFromCvAcceptSchema,
} from '@/lib/ai/start-from-cv';

import {
  handleStartFromCvRouteError,
  requireStartFromCvRouteContext,
} from '../../../_route-helpers';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const context = await requireStartFromCvRouteContext();
    if (context instanceof NextResponse) {
      return context;
    }

    const { sessionId } = await params;
    await assertStartFromCvAccess(context.betaContext);
    const body = StartFromCvAcceptSchema.parse(await request.json());
    const result = await acceptStartFromCvDrafts({
      sessionId,
      userId: context.auth.user.id,
      accepted: body.accepted,
    });

    return NextResponse.json(result, {
      headers: {
        'cache-control': 'no-store',
      },
    });
  } catch (error) {
    return handleStartFromCvRouteError(error, 'start_from_cv.sessions.accept.failed');
  }
}
