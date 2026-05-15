import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createStartFromCvSession, StartFromCvConsentSchema } from '@/lib/ai/start-from-cv';

import { handleStartFromCvRouteError, requireStartFromCvRouteContext } from '../_route-helpers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const context = await requireStartFromCvRouteContext();
    if (context instanceof NextResponse) {
      return context;
    }

    const body = StartFromCvConsentSchema.parse(await request.json());
    const result = await createStartFromCvSession({
      ...context.betaContext,
      userId: context.auth.user.id,
    });

    return NextResponse.json(
      {
        ...result,
        consentToProcessCv: body.consentToProcessCv,
      },
      {
        headers: {
          'cache-control': 'no-store',
        },
      }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleStartFromCvRouteError(error, 'start_from_cv.sessions.create.validation_failed');
    }
    return handleStartFromCvRouteError(error, 'start_from_cv.sessions.create.failed');
  }
}
