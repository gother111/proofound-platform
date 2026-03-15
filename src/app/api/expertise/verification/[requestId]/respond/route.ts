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
  parseHumanObservedAttestationResponse,
  type HumanObservedAttestationRequestPayload,
} from '@/lib/verification/human-attestations';
import {
  getCanonicalSkillVerificationRequestById,
  mapCanonicalSkillVerificationRequestRecord,
  updateCanonicalSkillVerificationRequest,
} from '@/lib/verification/canonical-requests';

const RespondSchema = z.object({
  action: z.enum(['accept', 'decline']),
  responseMessage: z.string().optional(),
  attestation: z.unknown().optional(),
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

    let canonicalVerificationRow = null;
    try {
      canonicalVerificationRow = await getCanonicalSkillVerificationRequestById(requestId);
    } catch {
      canonicalVerificationRow = null;
    }
    const { data: legacyVerificationRequest } = canonicalVerificationRow
      ? { data: null as any }
      : await supabase.from('skill_verification_requests').select('*').eq('id', requestId).single();

    const verificationRequest = legacyVerificationRequest
      ? legacyVerificationRequest
      : canonicalVerificationRow
        ? mapCanonicalSkillVerificationRequestRecord(canonicalVerificationRow)
        : null;

    if (!verificationRequest) {
      return NextResponse.json({ error: 'Verification request not found' }, { status: 404 });
    }

    const usingCanonicalRequest = Boolean(!legacyVerificationRequest && canonicalVerificationRow);

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

    const requestKind =
      verificationRequest.request_kind === 'human_observed_attestation'
        ? 'human_observed_attestation'
        : 'generic_verification';
    const attestationRequest =
      requestKind === 'human_observed_attestation' &&
      verificationRequest.attestation_request &&
      typeof verificationRequest.attestation_request === 'object'
        ? (verificationRequest.attestation_request as HumanObservedAttestationRequestPayload)
        : null;

    let attestationResponse: Record<string, unknown> | null = null;
    if (requestKind === 'human_observed_attestation' && validated.action === 'accept') {
      if (!attestationRequest) {
        return NextResponse.json(
          { error: 'This attestation request is missing its bounded skill scope.' },
          { status: 400 }
        );
      }

      const parsedAttestation = parseHumanObservedAttestationResponse(
        validated.attestation,
        attestationRequest
      );

      if (!parsedAttestation.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: parsedAttestation.error.issues },
          { status: 400 }
        );
      }

      attestationResponse = parsedAttestation.data;
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

    let updated = null;
    if (usingCanonicalRequest) {
      let updatedCanonical = null;
      try {
        updatedCanonical = await updateCanonicalSkillVerificationRequest({
          requestId,
          status: validated.action === 'accept' ? 'accepted' : 'declined',
          respondedAt,
          responseMessage: validated.responseMessage || null,
          attestationResponse,
          verifierProfileId: user.id,
          verifierPrincipalType: 'user_account',
          verifierEmail: userEmail || verificationRequest.verifier_email || null,
          integrityStatus:
            mergedIntegrity.integrityStatus === 'flagged'
              ? 'warning'
              : mergedIntegrity.integrityStatus,
          integrityReason: mergedIntegrity.integrityReason,
          riskSignals: mergedIntegrity.riskSignals,
          integrityMeta,
          integrityFlaggedAt:
            mergedIntegrity.integrityStatus === 'flagged'
              ? verificationRequest.integrity_flagged_at || mergedIntegrity.integrityFlaggedAt
              : null,
          responseAuthMethod: 'authenticated',
          responseActorEmail: userEmail,
        });
      } catch (error) {
        console.error('Error updating canonical verification request:', error);
        updatedCanonical = null;
      }
      updated = updatedCanonical
        ? mapCanonicalSkillVerificationRequestRecord(updatedCanonical)
        : null;
    } else {
      const { data, error: updateError } = await supabase
        .from('skill_verification_requests')
        .update({
          status: validated.action === 'accept' ? 'accepted' : 'declined',
          responded_at: respondedAt,
          response_message: validated.responseMessage || null,
          attestation_response: attestationResponse,
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
        return NextResponse.json(
          { error: 'Failed to update verification request' },
          { status: 500 }
        );
      }

      updated = data;
    }

    if (!updated) {
      return NextResponse.json({ error: 'Failed to update verification request' }, { status: 500 });
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
        request_kind: requestKind,
        verifier_relationship: verificationRequest.verifier_relationship || null,
        integrity_status: updated.integrity_status || mergedIntegrity.integrityStatus,
        integrity_reason: updated.integrity_reason || mergedIntegrity.integrityReason,
        same_device_signal: sameDeviceSignal,
      },
    });

    return NextResponse.json({
      request: updated,
      message: `Verification request ${validated.action === 'accept' ? 'accepted' : 'declined'} successfully`,
      canonical_record_id: usingCanonicalRequest ? requestId : null,
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
