import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireApiAuthContext } from '@/lib/auth';
import { suggestProofPackForUser } from '@/lib/ai/proof-pack-assistant';

const ProofPackAssistantRequestSchema = z
  .object({
    proofPackId: z.string().uuid(),
    idempotencyKey: z.string().trim().max(128).optional(),
  })
  .strict();

export async function POST(request: NextRequest) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: error.issues[0]?.message || 'Invalid Proof Pack assistant request.',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === 'PROOF_PACK_NOT_FOUND') {
      return NextResponse.json({ error: 'Proof Pack not found' }, { status: 404 });
    }

    console.error('Proof Pack assistant failed:', error);
    return NextResponse.json(
      { error: 'Failed to suggest Proof Pack improvements' },
      { status: 500 }
    );
  }
}
