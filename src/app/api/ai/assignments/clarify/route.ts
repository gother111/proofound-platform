import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  AssignmentClarityRequestSchema,
  suggestAssignmentClarityForUser,
} from '@/lib/ai/assignment-clarity';
import {
  buildAiAssistKillSwitchResponse,
  isAiAssistDisabledByKillSwitch,
} from '@/lib/ai/kill-switches';
import { requireApiAuthContext } from '@/lib/auth';
import { log } from '@/lib/log';
import { sanitizeErrorForLog } from '@/lib/privacy/log-redaction';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (isAiAssistDisabledByKillSwitch('assignment_clarity')) {
      return NextResponse.json(buildAiAssistKillSwitchResponse('assignment_clarity'), {
        status: 503,
      });
    }

    const body = await request.json();
    const payload = AssignmentClarityRequestSchema.parse(body);
    const requestId = crypto.randomUUID();

    const suggestion = await suggestAssignmentClarityForUser({
      userId: authContext.user.id,
      requestId,
      input: payload,
      idempotencyKey:
        typeof request.headers.get('idempotency-key') === 'string'
          ? request.headers.get('idempotency-key')
          : null,
    });

    return NextResponse.json(suggestion);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: error.issues[0]?.message || 'Invalid assignment clarity request.',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === 'MISSING_ORG_CONTEXT') {
      return NextResponse.json({ error: 'Organization context is required' }, { status: 400 });
    }

    if (error instanceof Error && error.message === 'ASSIGNMENT_FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (error instanceof Error && error.message === 'ASSIGNMENT_NOT_FOUND') {
      return NextResponse.json({ error: 'Assignment not found or access denied' }, { status: 403 });
    }

    log.error('assignment_clarity.failed', {
      error: sanitizeErrorForLog(error),
    });
    return NextResponse.json({ error: 'Failed to clarify assignment' }, { status: 500 });
  }
}
