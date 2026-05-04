import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/db';
import { organizationMembers } from '@/db/schema';
import { safeApiErrorResponse, safeValidationErrorResponse } from '@/lib/api/errors';
import { requireApiAuthContext } from '@/lib/auth';
import {
  extractProofArtifactText,
  ProofArtifactOcrConsentSchema,
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
    const body = ProofArtifactOcrConsentSchema.parse(await request.json());
    const betaContext = await loadUserBetaContext(authContext.user.id);
    const {
      data: { user: authUser },
    } = await authContext.supabase.auth.getUser();

    const result = await extractProofArtifactText({
      artifactId,
      userId: authContext.user.id,
      userEmail: authUser?.email ?? null,
      orgIds: betaContext.orgIds,
      roles: betaContext.roles,
      consentToProcess: body.consentToProcess,
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
        message: 'Explicit OCR consent is required.',
      });
    }

    if (error instanceof ProofArtifactOcrError) {
      return NextResponse.json(
        { error: safeProofArtifactOcrMessage(error.code) },
        {
          status: error.status,
        }
      );
    }

    return safeApiErrorResponse({
      event: 'proof_artifact_ocr.extract.failed',
      error,
      publicMessage: 'Proof artifact text extraction failed',
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

function safeProofArtifactOcrMessage(code: string) {
  switch (code) {
    case 'CONSENT_REQUIRED':
      return 'Explicit consent is required before OCR can process this artifact.';
    case 'UNSUPPORTED_PROOF_ARTIFACT_MIME':
      return 'OCR beta supports PDF, PNG, and JPG/JPEG proof artifacts only.';
    case 'PROOF_ARTIFACT_TOO_LARGE':
      return 'OCR beta supports proof artifacts up to 5 MB.';
    case 'PROOF_ARTIFACT_TOO_MANY_PAGES':
      return 'OCR beta supports PDF proof artifacts up to 4 pages.';
    case 'PROOF_ARTIFACT_NOT_PROCESSABLE':
      return 'This proof artifact is not ready for OCR processing.';
    case 'PROOF_ARTIFACT_OCR_PROVIDER_UNAVAILABLE':
      return 'OCR is not available right now.';
    default:
      return 'Proof artifact OCR is not available.';
  }
}
