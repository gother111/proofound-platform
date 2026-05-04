import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireApiAuthContext } from '@/lib/auth';
import {
  buildAiAssistKillSwitchResponse,
  isAiAssistDisabledByKillSwitch,
} from '@/lib/ai/kill-switches';
import { addUnsafeAiRequestPayloadIssue } from '@/lib/ai/request-safety';
import { safeApiErrorResponse, safeValidationErrorResponse } from '@/lib/api/errors';
import {
  VERIFICATION_COMPOSER_FIELDS,
  VERIFICATION_SCOPES,
  composeVerificationRequestForUser,
} from '@/lib/ai/verification-composer';

const VerificationComposerRequestSchema = z
  .object({
    proofPackId: z.string().uuid().optional(),
    claimId: z.string().uuid().optional(),
    verifierEmail: z.string().trim().email().max(254).optional(),
    verifierRelationshipType: z.string().trim().min(1).max(80),
    verificationScope: z.enum(VERIFICATION_SCOPES),
    selectedPublicSafeProofFields: z
      .array(z.enum(VERIFICATION_COMPOSER_FIELDS))
      .min(1)
      .max(VERIFICATION_COMPOSER_FIELDS.length)
      .optional(),
    selectedProofFields: z
      .array(z.enum(VERIFICATION_COMPOSER_FIELDS))
      .min(1)
      .max(VERIFICATION_COMPOSER_FIELDS.length)
      .optional(),
    idempotencyKey: z.string().trim().max(128).optional(),
  })
  .strict()
  .superRefine(addUnsafeAiRequestPayloadIssue)
  .refine((value) => Boolean(value.proofPackId || value.claimId), {
    message: 'proofPackId or claimId is required',
    path: ['proofPackId'],
  })
  .refine((value) => Boolean(value.selectedPublicSafeProofFields || value.selectedProofFields), {
    message: 'selected public-safe proof fields are required',
    path: ['selectedPublicSafeProofFields'],
  });

export async function POST(request: NextRequest) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (isAiAssistDisabledByKillSwitch('verification_composer')) {
      return NextResponse.json(buildAiAssistKillSwitchResponse('verification_composer'), {
        status: 503,
      });
    }

    const body = await request.json();
    const payload = VerificationComposerRequestSchema.parse(body);
    const requestId = crypto.randomUUID();

    const draft = await composeVerificationRequestForUser({
      proofPackId: payload.proofPackId ?? null,
      claimId: payload.claimId ?? null,
      userId: authContext.user.id,
      requestId,
      verifierRelationshipType: payload.verifierRelationshipType,
      verificationScope: payload.verificationScope,
      selectedPublicSafeProofFields:
        payload.selectedPublicSafeProofFields ?? payload.selectedProofFields ?? [],
      idempotencyKey: payload.idempotencyKey ?? null,
    });

    return NextResponse.json(draft);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return safeValidationErrorResponse({
        error,
        message: error.issues[0]?.message || 'Validation failed',
      });
    }

    if (
      error instanceof Error &&
      (error.message === 'PROOF_PACK_NOT_FOUND' || error.message === 'PROOF_PACK_OR_CLAIM_REQUIRED')
    ) {
      return NextResponse.json({ error: 'Proof Pack or claim not found' }, { status: 404 });
    }

    return safeApiErrorResponse({
      event: 'ai.verification_composer.failed',
      error,
      publicMessage: 'Failed to draft verification request',
    });
  }
}
