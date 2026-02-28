import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireApiAuthContext } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { writeVerificationAuditLog } from '@/lib/verification/integrity';
import type { CustomVerificationRelationship } from '@/lib/verification/custom-verification';

const CancelSelectedSchema = z.object({
  action: z.literal('cancel_selected'),
  itemIds: z.array(z.string().uuid()).min(1, 'Select at least one artifact to cancel').max(50),
});

type BundleRequestItem = {
  id: string;
  artifact_type: 'skill' | 'experience' | 'education' | 'impact_story' | 'project' | 'volunteering';
  artifact_id: string;
  display_label: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at: string;
  updated_at: string;
};

type BundleRequestRow = {
  id: string;
  requester_profile_id: string;
  verifier_email: string;
  verifier_relationship: CustomVerificationRelationship;
  message: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  created_at: string;
  expires_at: string;
  responded_at: string | null;
  response_message: string | null;
  custom_verification_request_items?: BundleRequestItem[] | null;
};

type LinkedSkillRequestRow = {
  id: string;
  skill_id: string;
};

async function loadBundleRequest(admin: ReturnType<typeof createAdminClient>, requestId: string) {
  const { data, error } = await admin
    .from('custom_verification_requests')
    .select(
      `
        id,
        requester_profile_id,
        verifier_email,
        verifier_relationship,
        message,
        status,
        created_at,
        expires_at,
        responded_at,
        response_message,
        custom_verification_request_items (
          id,
          artifact_type,
          artifact_id,
          display_label,
          status,
          created_at,
          updated_at
        )
      `
    )
    .eq('id', requestId)
    .maybeSingle();

  if (error) {
    return { data: null, error };
  }

  return { data: (data as BundleRequestRow | null) || null, error: null };
}

/**
 * GET /api/expertise/verifications/custom/[requestId]
 *
 * Returns custom bundled verification request details for the authenticated requester.
 */
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
    const admin = createAdminClient();
    const { requestId } = await params;

    const { data: bundleRequest, error: fetchError } = await loadBundleRequest(admin, requestId);

    if (fetchError) {
      console.error('Failed to load custom verification request:', fetchError);
      return NextResponse.json(
        { error: 'Failed to load custom verification request' },
        { status: 500 }
      );
    }

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
        items: (bundleRequest.custom_verification_request_items || []).map((item) => ({
          id: item.id,
          artifact_type: item.artifact_type,
          artifact_id: item.artifact_id,
          display_label: item.display_label,
          status: item.status,
          created_at: item.created_at,
          updated_at: item.updated_at,
        })),
      },
    });
  } catch (error) {
    console.error('Custom verification request GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/expertise/verifications/custom/[requestId]
 *
 * Allows requester to cancel selected pending artifacts from a bundle.
 */
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
    const admin = createAdminClient();
    const { requestId } = await params;

    const parsedBody = CancelSelectedSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsedBody.error.issues },
        { status: 400 }
      );
    }

    const requestedItemIds = [...new Set(parsedBody.data.itemIds)];
    const { data: bundleRequest, error: fetchError } = await loadBundleRequest(admin, requestId);

    if (fetchError) {
      console.error('Failed to load custom verification request for patch:', fetchError);
      return NextResponse.json(
        { error: 'Failed to load custom verification request' },
        { status: 500 }
      );
    }

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

    const allItems = bundleRequest.custom_verification_request_items || [];
    const selectedItems = allItems.filter((item) => requestedItemIds.includes(item.id));

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

    const nowIso = new Date().toISOString();
    const selectedSkillIds = selectedItems
      .filter((item) => item.artifact_type === 'skill')
      .map((item) => item.artifact_id);

    const { error: updateItemsError } = await admin
      .from('custom_verification_request_items')
      .update({
        status: 'expired',
        updated_at: nowIso,
      })
      .eq('request_id', requestId)
      .in('id', requestedItemIds)
      .eq('status', 'pending');

    if (updateItemsError) {
      console.error('Failed to update custom verification request items:', updateItemsError);
      return NextResponse.json({ error: 'Failed to cancel selected artifacts' }, { status: 500 });
    }

    let removedSkillRequestIds: string[] = [];
    if (selectedSkillIds.length > 0) {
      const { data: linkedSkillRequests, error: linkedSkillRequestsError } = await admin
        .from('skill_verification_requests')
        .select('id, skill_id')
        .eq('custom_request_id', requestId)
        .eq('requester_profile_id', user.id)
        .eq('status', 'pending')
        .in('skill_id', selectedSkillIds);

      if (linkedSkillRequestsError) {
        console.error(
          'Failed to load linked skill verification requests:',
          linkedSkillRequestsError
        );
        return NextResponse.json(
          { error: 'Failed to cancel linked skill requests' },
          { status: 500 }
        );
      }

      const typedLinkedRequests = (linkedSkillRequests || []) as LinkedSkillRequestRow[];
      removedSkillRequestIds = typedLinkedRequests
        .map((row) => row.id)
        .filter((id): id is string => Boolean(id));

      if (removedSkillRequestIds.length > 0) {
        const { error: deleteLinkedSkillRequestsError } = await admin
          .from('skill_verification_requests')
          .delete()
          .in('id', removedSkillRequestIds)
          .eq('requester_profile_id', user.id)
          .eq('status', 'pending');

        if (deleteLinkedSkillRequestsError) {
          console.error(
            'Failed to delete linked skill verification requests:',
            deleteLinkedSkillRequestsError
          );
          return NextResponse.json(
            { error: 'Failed to cancel linked skill requests' },
            { status: 500 }
          );
        }
      }
    }

    const { count: remainingPendingCount, error: remainingPendingError } = await admin
      .from('custom_verification_request_items')
      .select('id', { count: 'exact', head: true })
      .eq('request_id', requestId)
      .eq('status', 'pending');

    if (remainingPendingError) {
      console.error(
        'Failed to count remaining pending custom request items:',
        remainingPendingError
      );
      return NextResponse.json(
        { error: 'Failed to finalize custom request state' },
        { status: 500 }
      );
    }

    let requestExpired = false;
    if ((remainingPendingCount || 0) === 0) {
      const { error: expireRequestError } = await admin
        .from('custom_verification_requests')
        .update({
          status: 'expired',
          updated_at: nowIso,
        })
        .eq('id', requestId)
        .eq('requester_profile_id', user.id)
        .eq('status', 'pending');

      if (expireRequestError) {
        console.error('Failed to expire empty custom verification request:', expireRequestError);
        return NextResponse.json(
          { error: 'Failed to finalize custom request state' },
          { status: 500 }
        );
      }

      requestExpired = true;
    }

    await writeVerificationAuditLog({
      actorId: user.id,
      action: 'verification.bundle.items_cancelled',
      targetType: 'custom_verification_request',
      targetId: requestId,
      meta: {
        canceled_item_ids: requestedItemIds,
        canceled_skill_ids: selectedSkillIds,
        removed_skill_request_ids: removedSkillRequestIds,
        request_expired: requestExpired,
      },
    });

    return NextResponse.json({
      success: true,
      requestId,
      canceledItemIds: requestedItemIds,
      canceledSkillIds: selectedSkillIds,
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

    console.error('Custom verification request PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
