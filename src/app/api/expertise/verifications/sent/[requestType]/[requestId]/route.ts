import { NextRequest, NextResponse } from 'next/server';

import { requireApiAuthContext } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { writeVerificationAuditLog } from '@/lib/verification/integrity';

type RequestType = 'skill' | 'impact_story';
type DeleteEligibility = 'pending' | 'failed';

function isRequestType(value: string): value is RequestType {
  return value === 'skill' || value === 'impact_story';
}

function isAllowedStatus(requestType: RequestType, status: string): status is DeleteEligibility {
  if (requestType === 'skill') {
    return status === 'pending';
  }

  return status === 'pending' || status === 'failed';
}

/**
 * DELETE /api/expertise/verifications/sent/[requestType]/[requestId]
 *
 * Removes a sent verification request owned by the authenticated requester.
 * For bundled skill requests, caller must use custom bundle cancellation flow.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ requestType: string; requestId: string }> }
) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const admin = createAdminClient();
    const { requestType: rawRequestType, requestId } = await params;

    if (!isRequestType(rawRequestType)) {
      return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
    }

    const requestType = rawRequestType;

    if (requestType === 'skill') {
      const { data: verificationRequest, error: fetchError } = await admin
        .from('skill_verification_requests')
        .select('id, requester_profile_id, status, custom_request_id, skill_id, verifier_email')
        .eq('id', requestId)
        .maybeSingle();

      if (fetchError) {
        console.error('Failed to fetch skill verification request for deletion:', fetchError);
        return NextResponse.json({ error: 'Failed to load verification request' }, { status: 500 });
      }

      if (!verificationRequest) {
        return NextResponse.json({ error: 'Verification request not found' }, { status: 404 });
      }

      if (verificationRequest.requester_profile_id !== user.id) {
        return NextResponse.json(
          { error: 'Not authorized to delete this verification request' },
          { status: 403 }
        );
      }

      if (verificationRequest.custom_request_id) {
        return NextResponse.json(
          {
            error:
              'This verification request belongs to a bundled request. Manage it from bundle controls.',
            code: 'BUNDLED_REQUEST',
            customRequestId: verificationRequest.custom_request_id,
          },
          { status: 409 }
        );
      }

      if (!isAllowedStatus(requestType, verificationRequest.status)) {
        return NextResponse.json(
          {
            error: `Only ${requestType === 'skill' ? 'pending' : 'pending or failed'} requests can be deleted.`,
          },
          { status: 400 }
        );
      }

      const { error: deleteError } = await admin
        .from('skill_verification_requests')
        .delete()
        .eq('id', requestId)
        .eq('requester_profile_id', user.id);

      if (deleteError) {
        console.error('Failed to delete skill verification request:', deleteError);
        return NextResponse.json(
          { error: 'Failed to delete verification request' },
          { status: 500 }
        );
      }

      await writeVerificationAuditLog({
        actorId: user.id,
        action: 'verification.request.deleted',
        targetType: 'skill_verification_request',
        targetId: requestId,
        meta: {
          request_type: requestType,
          request_status: verificationRequest.status,
          skill_id: verificationRequest.skill_id,
          verifier_email: verificationRequest.verifier_email,
          source: 'sent_request_delete_api',
        },
      });

      return NextResponse.json({
        success: true,
        requestType,
        requestId,
      });
    }

    const { data: verificationRequest, error: fetchError } = await admin
      .from('impact_story_verification_requests')
      .select('id, requester_profile_id, status, impact_story_id, verifier_email')
      .eq('id', requestId)
      .maybeSingle();

    if (fetchError) {
      console.error('Failed to fetch impact verification request for deletion:', fetchError);
      return NextResponse.json({ error: 'Failed to load verification request' }, { status: 500 });
    }

    if (!verificationRequest) {
      return NextResponse.json({ error: 'Verification request not found' }, { status: 404 });
    }

    if (verificationRequest.requester_profile_id !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to delete this verification request' },
        { status: 403 }
      );
    }

    if (!isAllowedStatus(requestType, verificationRequest.status)) {
      return NextResponse.json(
        {
          error: 'Only pending or failed requests can be deleted.',
        },
        { status: 400 }
      );
    }

    const { error: deleteError } = await admin
      .from('impact_story_verification_requests')
      .delete()
      .eq('id', requestId)
      .eq('requester_profile_id', user.id);

    if (deleteError) {
      console.error('Failed to delete impact verification request:', deleteError);
      return NextResponse.json({ error: 'Failed to delete verification request' }, { status: 500 });
    }

    await writeVerificationAuditLog({
      actorId: user.id,
      action: 'verification.request.deleted',
      targetType: 'impact_story_verification_request',
      targetId: requestId,
      meta: {
        request_type: requestType,
        request_status: verificationRequest.status,
        impact_story_id: verificationRequest.impact_story_id,
        verifier_email: verificationRequest.verifier_email,
        source: 'sent_request_delete_api',
      },
    });

    return NextResponse.json({
      success: true,
      requestType,
      requestId,
    });
  } catch (error) {
    console.error('Sent verification DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
