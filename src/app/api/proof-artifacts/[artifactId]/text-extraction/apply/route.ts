import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/db';
import { organizationMembers } from '@/db/schema';
import { safeApiErrorResponse, safeValidationErrorResponse } from '@/lib/api/errors';
import { requireApiAuthContext } from '@/lib/auth';
import {
  applyProofArtifactOcrDraft,
  ApplyProofArtifactOcrDraftSchema,
  ProofArtifactOcrError,
} from '@/lib/proof-artifacts/text-extraction';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ artifactId: string }> }
) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { artifactId } = await params;
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const body = ApplyProofArtifactOcrDraftSchema.parse(rawBody);
    const betaContext = await loadUserBetaContext(authContext.user.id);
    const {
      data: { user: authUser },
    } = await authContext.supabase.auth.getUser();

    const result = await applyProofArtifactOcrDraft({
      artifactId,
      proofPackId: body.proofPackId,
      selectedFields: body.selectedFields,
      sourceExtractionRequestId: body.sourceExtractionRequestId ?? null,
      userId: authContext.user.id,
      userEmail: authUser?.email ?? null,
      orgIds: betaContext.orgIds,
      roles: betaContext.roles,
    });

    return NextResponse.json(result, {
      headers: {
        'cache-control': 'no-store',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return safeValidationErrorResponse({
        error,
        message: 'Validation failed',
      });
    }

    if (error instanceof ProofArtifactOcrError) {
      return NextResponse.json(
        { error: safeProofArtifactOcrApplyMessage(error.code) },
        {
          status: error.status,
        }
      );
    }

    return safeApiErrorResponse({
      event: 'proof_artifact_ocr.apply.failed',
      error,
      publicMessage: 'Failed to apply selected OCR draft fields',
    });
  }
}

async function loadUserBetaContext(userId: string) {
  const memberships = await db
    .select({
      orgId: organizationMembers.orgId,
      role: organizationMembers.role,
    })
    .from(organizationMembers)
    .where(and(eq(organizationMembers.userId, userId), eq(organizationMembers.state, 'active')));

  return {
    orgIds: memberships.map((membership) => membership.orgId),
    roles: memberships.map((membership) => membership.role),
  };
}

function safeProofArtifactOcrApplyMessage(code: string) {
  switch (code) {
    case 'PROOF_PACK_NOT_DRAFT':
      return 'OCR text can only be applied to a draft proof record.';
    case 'NO_DRAFT_FIELDS_SELECTED':
      return 'Choose at least one draft field to apply.';
    default:
      return 'Selected OCR draft fields could not be applied.';
  }
}
