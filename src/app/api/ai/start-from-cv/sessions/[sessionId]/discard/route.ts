import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { assertStartFromCvAccess, discardStartFromCvSession } from '@/lib/ai/start-from-cv';

import {
  handleStartFromCvRouteError,
  requireStartFromCvRouteContext,
} from '../../../_route-helpers';

export const dynamic = 'force-dynamic';

const DiscardSchema = z
  .object({
    deleteSession: z.boolean().optional().default(false),
  })
  .strict();

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
    const body = DiscardSchema.parse(await request.json());
    const result = await discardStartFromCvSession({
      sessionId,
      userId: context.auth.user.id,
      deleteSession: body.deleteSession,
    });

    return NextResponse.json(result, {
      headers: {
        'cache-control': 'no-store',
      },
    });
  } catch (error) {
    return handleStartFromCvRouteError(error, 'start_from_cv.sessions.discard.failed');
  }
}
