import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireApiAuthContext } from '@/lib/auth';
import {
  buildAiAssistKillSwitchResponse,
  isAiAssistDisabledByKillSwitch,
} from '@/lib/ai/kill-switches';
import { addUnsafeAiRequestPayloadIssue } from '@/lib/ai/request-safety';
import { safeApiErrorResponse, safeValidationErrorResponse } from '@/lib/api/errors';
import { isMockSupabaseEnabled } from '@/lib/env';
import {
  VERIFICATION_COMPOSER_FIELDS,
  VERIFICATION_SCOPES,
  composeVerificationRequestForUser,
} from '@/lib/ai/verification-composer';

const MOCK_COMPOSER_PROOF_PACK_ID = '11111111-1111-4111-8111-111111111111';

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

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const payload = VerificationComposerRequestSchema.parse(body);
    const requestId = crypto.randomUUID();

    if (isMockSupabaseEnabled() && payload.proofPackId === MOCK_COMPOSER_PROOF_PACK_ID) {
      return NextResponse.json({
        subject: 'Proofound verification request',
        message: [
          'Hi, I am asking you to confirm one specific Proofound claim: I narrowed a launch workflow into one privacy-safe proof path with review checkpoints.',
          'Please only respond based on what you directly know or observed. It is completely fine to confirm only part of it or say that you cannot verify it.',
          'Thank you for taking a careful look.',
        ].join('\n\n'),
        claimScope:
          'I narrowed a launch workflow into one privacy-safe proof path with review checkpoints.',
        verificationQuestions: [
          'Can you confirm the specific proof-first workflow contribution?',
          'Which parts can you confirm from direct knowledge or observation?',
          'Is there anything in this request that you cannot verify?',
        ],
        privacyNotes: ['Draft uses selected public-safe Proof Pack fields only.'],
        tooBroadWarnings: [
          'This draft is limited to one claim scope and avoids general praise or candidate quality judgment.',
        ],
        fallback: true,
      });
    }

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
