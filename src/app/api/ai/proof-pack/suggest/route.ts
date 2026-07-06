import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireApiAuthContext } from '@/lib/auth';
import {
  buildAiAssistKillSwitchResponse,
  isAiAssistDisabledByKillSwitch,
} from '@/lib/ai/kill-switches';
import { addUnsafeAiRequestPayloadIssue } from '@/lib/ai/request-safety';
import { suggestProofPackForUser } from '@/lib/ai/proof-pack-assistant';
import { safeApiErrorResponse, safeValidationErrorResponse } from '@/lib/api/errors';

const ProofPackAssistantRequestSchema = z
  .object({
    proofPackId: z.string().uuid(),
    idempotencyKey: z.string().trim().max(128).optional(),
  })
  .strict()
  .superRefine(addUnsafeAiRequestPayloadIssue);

export async function POST(request: NextRequest) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (isAiAssistDisabledByKillSwitch('proof_pack_assistant')) {
      return NextResponse.json(buildAiAssistKillSwitchResponse('proof_pack_assistant'), {
        status: 503,
      });
    }

    const body = await request.json();
    const payload = ProofPackAssistantRequestSchema.parse(body);
    const requestId = crypto.randomUUID();

    const suggestion = await suggestProofPackForUser({
      proofPackId: payload.proofPackId,
      userId: authContext.user.id,
      requestId,
      idempotencyKey: payload.idempotencyKey ?? null,
    });

    return NextResponse.json(suggestion);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return safeValidationErrorResponse({
        error,
        message: 'Validation failed',
      });
    }

    if (error instanceof Error && error.message === 'PROOF_PACK_NOT_FOUND') {
      return NextResponse.json({ error: 'Proof record not found' }, { status: 404 });
    }

    return safeApiErrorResponse({
      event: 'ai.proof_pack_assistant.failed',
      error,
      publicMessage: 'Failed to suggest proof record improvements',
    });
  }
}
