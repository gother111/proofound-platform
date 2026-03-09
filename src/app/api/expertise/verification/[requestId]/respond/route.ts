import { requireApiAuthContext } from '@/lib/auth';
import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';
import { notifyVerificationCompleted } from '@/lib/notifications';
import {
  extractRequestFingerprints,
  hasSameDeviceSignal,
  mergeIntegrityWithResponseSignal,
  normalizeEmail,
  writeVerificationAuditLog,
} from '@/lib/verification/integrity';
import {
  CANONICAL_PROOFS_WRITE_ENABLED,
  upsertCanonicalVerificationRecord,
} from '@/lib/canonical/repository';
import { hashOpaqueToken } from '@/lib/contracts/canonical-domain';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

const RespondSchema = z.object({
  action: z.enum(['accept', 'decline']),
  responseMessage: z.string().optional(),
});

/**
 * POST /api/expertise/verification/[requestId]/respond
 *
 * Allow verifiers to accept or decline verification requests.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user, supabase } = authContext;
    const body = await request.json();
    const { requestId } = await params;

    const validated = RespondSchema.parse(body);

    // Fetch the verification request
    const { data: verificationRequest, error: fetchError } = await supabase
      .from('skill_verification_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !verificationRequest) {
      return NextResponse.json({ error: 'Verification request not found' }, { status: 404 });
    }

    // Get current user's email
    const { data: authUser } = await supabase.auth.getUser();
    const userEmail = normalizeEmail(authUser.user?.email || null) || '';

    // Check if user is authorized to respond
    // User must be the intended verifier (by email or profile ID)
    const isAuthorized =
      verificationRequest.verifier_profile_id === user.id ||
      (verificationRequest.verifier_email || '').toLowerCase() === userEmail;

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Not authorized to respond to this verification request' },
        { status: 403 }
      );
    }

    // Check if request is still pending
    if (verificationRequest.status !== 'pending') {
      return NextResponse.json(
        { error: `This verification request has already been ${verificationRequest.status}` },
        { status: 400 }
      );
    }

    // Update verification request
    const respondedAt = new Date().toISOString();
    const responderFingerprints = extractRequestFingerprints(request.headers);
    const sameDeviceSignal = hasSameDeviceSignal({
      requesterIpHash: verificationRequest.requester_ip_hash,
      requesterUserAgentHash: verificationRequest.requester_user_agent_hash,
      responderIpHash: responderFingerprints.ipHash,
      responderUserAgentHash: responderFingerprints.userAgentHash,
    });
    const mergedIntegrity = mergeIntegrityWithResponseSignal({
      currentStatus: verificationRequest.integrity_status,
      currentReason: verificationRequest.integrity_reason,
      currentSignals: verificationRequest.risk_signals,
      sameDeviceSignal,
    });
    const existingIntegrityMeta =
      verificationRequest.integrity_meta && typeof verificationRequest.integrity_meta === 'object'
        ? (verificationRequest.integrity_meta as Record<string, unknown>)
        : {};
    const integrityMeta = {
      ...existingIntegrityMeta,
      response: {
        same_device_signal: sameDeviceSignal,
        response_auth_method: 'authenticated',
        response_actor_email: userEmail,
        responded_at: respondedAt,
      },
    };

    const { data: updated, error: updateError } = await supabase
      .from('skill_verification_requests')
      .update({
        status: validated.action === 'accept' ? 'accepted' : 'declined',
        responded_at: respondedAt,
        response_message: validated.responseMessage || null,
        verifier_profile_id: user.id, // Link to user profile if they have one
        responder_ip_hash: responderFingerprints.ipHash,
        responder_user_agent_hash: responderFingerprints.userAgentHash,
        response_auth_method: 'authenticated',
        response_actor_email: userEmail,
        risk_signals: mergedIntegrity.riskSignals,
        integrity_status: mergedIntegrity.integrityStatus,
        integrity_reason: mergedIntegrity.integrityReason,
        integrity_meta: integrityMeta,
        integrity_flagged_at:
          mergedIntegrity.integrityStatus === 'flagged'
            ? verificationRequest.integrity_flagged_at || mergedIntegrity.integrityFlaggedAt
            : null,
      })
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating verification request:', updateError);
      return NextResponse.json({ error: 'Failed to update verification request' }, { status: 500 });
    }

    let canonicalRecord = null;
    if (
      CANONICAL_PROOFS_WRITE_ENABLED &&
      isUuid(verificationRequest.requester_profile_id) &&
      isUuid(verificationRequest.skill_id) &&
      isUuid(user.id)
    ) {
      try {
        canonicalRecord = await upsertCanonicalVerificationRecord({
          ownerType: 'individual_profile',
          ownerId: verificationRequest.requester_profile_id,
          subjectType: 'skill',
          subjectId: verificationRequest.skill_id,
          verificationKind:
            verificationRequest.verifier_source === 'manager'
              ? 'skill_attestation_manager'
              : verificationRequest.verifier_source === 'peer'
                ? 'skill_attestation_peer'
                : 'platform_manual_review',
          status: updated.status,
          verifierPrincipalType: 'user_account',
          verifierProfileId: user.id,
          verifierEmailHash: userEmail ? hashOpaqueToken(userEmail) : null,
          verifierDomainSnapshot:
            typeof verificationRequest.verifier_domain_snapshot === 'string'
              ? verificationRequest.verifier_domain_snapshot
              : null,
          integrityStatus: updated.integrity_status === 'clear' ? 'clear' : 'warning',
          integrityReason: updated.integrity_reason || null,
          riskSignals:
            updated.risk_signals && typeof updated.risk_signals === 'object'
              ? (updated.risk_signals as Record<string, unknown>)
              : {},
          sourceRequestTable: 'skill_verification_requests',
          sourceRequestId: requestId,
          sourceResponseTable: 'skill_verification_requests',
          sourceResponseId: requestId,
          verifiedAt: validated.action === 'accept' ? respondedAt : null,
          metadata: {
            responseMessage: validated.responseMessage || null,
            responseAuthMethod: 'authenticated',
          },
        });
      } catch (canonicalError) {
        console.error('Failed to upsert canonical verification record:', canonicalError);
      }
    }

    // Notify the requester that verification was completed
    try {
      const { data: requesterProfile } = await supabase
        .from('profiles')
        .select('display_name, handle')
        .eq('id', verificationRequest.requester_profile_id)
        .single();

      const verifierName = requesterProfile?.display_name || requesterProfile?.handle || 'Someone';

      await notifyVerificationCompleted(
        verificationRequest.requester_profile_id,
        requestId,
        verifierName,
        validated.action === 'accept'
      );
    } catch (notifError) {
      console.error('Failed to send verification completed notification:', notifError);
      // Don't fail the request if notification fails
    }

    await writeVerificationAuditLog({
      actorId: user.id,
      action: 'verification.response.recorded',
      targetType: 'skill_verification_request',
      targetId: requestId,
      meta: {
        response_status: updated.status,
        response_action: validated.action,
        response_auth_method: 'authenticated',
        response_actor_email: userEmail,
        integrity_status: updated.integrity_status || mergedIntegrity.integrityStatus,
        integrity_reason: updated.integrity_reason || mergedIntegrity.integrityReason,
        same_device_signal: sameDeviceSignal,
      },
    });

    return NextResponse.json({
      request: updated,
      message: `Verification request ${validated.action === 'accept' ? 'accepted' : 'declined'} successfully`,
      canonical_record_id: canonicalRecord?.id ?? null,
      integrity_status: updated.integrity_status || mergedIntegrity.integrityStatus,
      integrity_reason:
        (updated.integrity_status || mergedIntegrity.integrityStatus) === 'flagged'
          ? updated.integrity_reason || mergedIntegrity.integrityReason
          : null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Verification respond error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
