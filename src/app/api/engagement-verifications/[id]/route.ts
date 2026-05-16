import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/db';
import { engagementVerifications } from '@/db/schema';
import { withWorkflowMutationIdempotency } from '@/lib/api/workflow-idempotency';
import {
  confirmEngagementVerification,
  normalizeEngagementType,
} from '@/lib/engagement-verifications/service';
import { isActiveOrgMember, requireApiAuth } from '@/lib/api/auth';
import { log } from '@/lib/log';
import { eq } from 'drizzle-orm';

const EngagementVerificationPatchSchema = z.object({
  confirm: z.literal(true),
  engagementType: z.string().optional(),
  uploadedFileId: z.string().uuid().optional(),
  evidenceNote: z.string().trim().max(2000).optional(),
});

function toSafeEngagementPatchError(error: unknown) {
  const message = error instanceof Error ? error.message : '';

  switch (message) {
    case 'Engagement verification not found':
      return { message, status: 404 };
    case 'Unsupported engagement type':
    case 'Uploaded evidence must belong to the current user and be attachable':
      return { message, status: 400 };
    default:
      return {
        message: 'Failed to update engagement verification',
        status: 500,
      };
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireApiAuth();
    if (auth instanceof NextResponse) {
      return auth;
    }

    const { id } = await params;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: 'Invalid JSON body',
        },
        { status: 400 }
      );
    }

    const parsed = EngagementVerificationPatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    if (
      parsed.data.engagementType !== undefined &&
      normalizeEngagementType(parsed.data.engagementType) === null
    ) {
      return NextResponse.json(
        {
          error: 'Unsupported engagement type',
        },
        { status: 400 }
      );
    }

    const record = await db.query.engagementVerifications.findFirst({
      where: eq(engagementVerifications.id, id),
    });

    if (!record) {
      return NextResponse.json({ error: 'Engagement verification not found' }, { status: 404 });
    }

    let actorType: 'candidate' | 'organization_member' | null = null;
    if (record.candidateProfileId === auth.user.id) {
      actorType = 'candidate';
    } else {
      const canConfirmForOrg = await isActiveOrgMember(auth.supabase, auth.user.id, record.orgId, [
        'org_owner',
        'org_manager',
      ]);

      if (canConfirmForOrg) {
        actorType = 'organization_member';
      }
    }

    if (!actorType) {
      return NextResponse.json(
        {
          error: 'Unauthorized to update this engagement verification',
        },
        { status: 403 }
      );
    }

    return await withWorkflowMutationIdempotency(
      request,
      {
        userId: auth.user.id,
        orgId: record.orgId,
        action: `engagement_verification.confirm.${actorType}`,
        resourceType: 'engagement_verification',
        resourceId: record.id,
      },
      parsed.data,
      async () => {
        const updated = await confirmEngagementVerification({
          engagementVerificationId: record.id,
          actorType,
          actorId: auth.user.id,
          engagementType: parsed.data.engagementType,
          uploadedFileId: parsed.data.uploadedFileId,
          evidenceNote: parsed.data.evidenceNote,
        });

        log.info('engagement_verification.updated', {
          engagementVerificationId: record.id,
          decisionId: record.decisionId,
          actorType,
          actorId: auth.user.id,
          status: updated.status,
          uploadedEvidencePresent: updated.uploadedEvidencePresent,
        });

        return NextResponse.json({
          success: true,
          engagementVerification: updated,
        });
      }
    );
  } catch (error) {
    log.error('engagement_verification.patch.failed', {
      error,
    });

    const { message, status } = toSafeEngagementPatchError(error);

    return NextResponse.json({ error: message }, { status });
  }
}
