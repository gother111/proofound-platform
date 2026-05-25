import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireApiAuthContext } from '@/lib/auth';
import { log } from '@/lib/log';
import {
  cancelCanonicalBundleItems,
  getCanonicalBundleById,
} from '@/lib/verification/canonical-bundles';
import { writeVerificationAuditLog } from '@/lib/verification/integrity';
import { resendBundleVerificationRequest } from '@/lib/verification/sent-request-actions';

const CancelSelectedSchema = z.object({
  action: z.literal('cancel_selected'),
  itemIds: z.array(z.string().uuid()).min(1, 'Select at least one artifact to cancel').max(50),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = authContext;
    const { requestId } = await params;
    const bundleRequest = await getCanonicalBundleById(requestId);

    if (!bundleRequest) {
      return NextResponse.json({ error: 'Custom verification request not found' }, { status: 404 });
    }

    if (bundleRequest.requester_profile_id !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to access this custom verification request' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      request: {
        id: bundleRequest.id,
        verifier_email: bundleRequest.verifier_email,
        verifier_relationship: bundleRequest.verifier_relationship,
        message: bundleRequest.message,
        status: bundleRequest.status,
        created_at: bundleRequest.created_at,
        expires_at: bundleRequest.expires_at,
        responded_at: bundleRequest.responded_at,
        response_message: bundleRequest.response_message,
        items: bundleRequest.items,
      },
    });
  } catch (error) {
    log.error('verification.custom_bundle.get_failed', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = authContext;
    const { requestId } = await params;
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const parsedBody = CancelSelectedSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsedBody.error.issues },
        { status: 400 }
      );
    }

    const requestedItemIds = [...new Set(parsedBody.data.itemIds)];
    const bundleRequest = await getCanonicalBundleById(requestId);

    if (!bundleRequest) {
      return NextResponse.json({ error: 'Custom verification request not found' }, { status: 404 });
    }

    if (bundleRequest.requester_profile_id !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to modify this custom verification request' },
        { status: 403 }
      );
    }

    if (bundleRequest.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot cancel artifacts for a ${bundleRequest.status} request.` },
        { status: 409 }
      );
    }

    const selectedItems = bundleRequest.items.filter((item) => requestedItemIds.includes(item.id));

    if (selectedItems.length !== requestedItemIds.length) {
      return NextResponse.json(
        { error: 'Some selected artifacts do not belong to this bundle request.' },
        { status: 400 }
      );
    }

    const nonPendingSelected = selectedItems.filter((item) => item.status !== 'pending');
    if (nonPendingSelected.length > 0) {
      return NextResponse.json(
        { error: 'Only pending artifacts can be canceled.' },
        { status: 400 }
      );
    }

    const canceledSkillIds = selectedItems
      .filter((item) => item.artifact_type === 'skill')
      .map((item) => item.artifact_id);

    const { removedSkillRequestIds, requestExpired } = await cancelCanonicalBundleItems(
      requestId,
      requestedItemIds
    );

    await writeVerificationAuditLog({
      actorId: user.id,
      action: 'verification.bundle.items_cancelled',
      targetType: 'custom_verification_request',
      targetId: requestId,
      meta: {
        canceled_item_ids: requestedItemIds,
        canceled_skill_ids: canceledSkillIds,
        removed_skill_request_ids: removedSkillRequestIds,
        request_expired: requestExpired,
      },
    });

    return NextResponse.json({
      success: true,
      requestId,
      canceledItemIds: requestedItemIds,
      canceledSkillIds,
      removedSkillRequestIds,
      requestExpired,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    log.error('verification.custom_bundle.patch_failed', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export function POST(request: NextRequest, { params }: { params: Promise<{ requestId: string }> }) {
  return params.then(({ requestId }) => resendBundleVerificationRequest(request, requestId));
}
