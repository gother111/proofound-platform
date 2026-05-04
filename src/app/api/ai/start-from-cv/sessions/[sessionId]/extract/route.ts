import { NextRequest, NextResponse } from 'next/server';

import { extractStartFromCvSession } from '@/lib/ai/start-from-cv';

import {
  handleStartFromCvRouteError,
  parseStartFromCvFile,
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
    const file = await parseStartFromCvFile(request);
    const result = await extractStartFromCvSession({
      ...context.betaContext,
      sessionId,
      userId: context.auth.user.id,
      file,
    });

    return NextResponse.json(result, {
      headers: {
        'cache-control': 'no-store',
      },
    });
  } catch (error) {
    return handleStartFromCvRouteError(error, 'start_from_cv.sessions.extract.failed');
  }
}
