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
  type HumanObservedVerdict,
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

function isCompatibleHumanObservedAction(params: {
  action: 'accept' | 'decline';
  verdict: HumanObservedVerdict;
}) {
  if (params.action === 'accept') {
    return params.verdict === 'yes' || params.verdict === 'partly';
  }

  return params.verdict === 'no';
}

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

    const canonicalVerificationRow = await getCanonicalSkillVerificationRequestById(
      requestId
    ).catch(() => null);
    const verificationRequest = canonicalVerificationRow
      ? mapCanonicalSkillVerificationRequestRecord(canonicalVerificationRow)
      : null;

    if (!verificationRequest) {
      return NextResponse.json({ error: 'Verification request not found' }, { status: 404 });
    }

    const { data: authUser } = await supabase.auth.getUser();
    const userEmail = normalizeEmail(authUser.user?.email || null) || '';
    const isAuthorized =
      verificationRequest.verifier_profile_id === user.id ||
      (verificationRequest.verifier_email || '').toLowerCase() === userEmail;

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Not authorized to respond to this verification request' },
        { status: 403 }
      );
    }

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
    if (requestKind === 'human_observed_attestation') {
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

      if (
        !isCompatibleHumanObservedAction({
          action: validated.action,
          verdict: attestationResponse.verdict as HumanObservedVerdict,
        })
      ) {
        return NextResponse.json(
          {
            error:
              validated.action === 'accept'
                ? 'Structured attestations marked accept must use verdict yes or partly.'
                : 'Structured attestations marked decline must use verdict no.',
          },
          { status: 400 }
        );
      }
    }

    const respondedAt = new Date().toISOString();
    const responderFingerprints = extractRequestFingerprints(request.headers);
    const verificationRequestSignals = verificationRequest as Record<string, unknown>;
    const sameDeviceSignal = hasSameDeviceSignal({
      requesterIpHash:
        typeof verificationRequestSignals.requester_ip_hash === 'string'
          ? verificationRequestSignals.requester_ip_hash
          : null,
      requesterUserAgentHash:
        typeof verificationRequestSignals.requester_user_agent_hash === 'string'
          ? verificationRequestSignals.requester_user_agent_hash
          : null,
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

    const updatedCanonical = await updateCanonicalSkillVerificationRequest({
      requestId,
      status: validated.action === 'accept' ? 'accepted' : 'declined',
      respondedAt,
      responseMessage: validated.responseMessage || null,
      attestationResponse,
      verifierProfileId: user.id,
      verifierPrincipalType: 'user_account',
      verifierEmail: userEmail || verificationRequest.verifier_email || null,
      integrityStatus:
        mergedIntegrity.integrityStatus === 'flagged' ? 'warning' : mergedIntegrity.integrityStatus,
      integrityReason: mergedIntegrity.integrityReason,
      riskSignals: mergedIntegrity.riskSignals,
      integrityMeta,
      integrityFlaggedAt:
        mergedIntegrity.integrityStatus === 'flagged'
          ? verificationRequest.integrity_flagged_at || mergedIntegrity.integrityFlaggedAt
          : null,
      responseAuthMethod: 'authenticated',
      responseActorEmail: userEmail,
    }).catch((error) => {
      console.error('Error updating canonical verification request:', error);
      return null;
    });

    const updated = updatedCanonical
      ? mapCanonicalSkillVerificationRequestRecord(updatedCanonical)
      : null;
    if (!updated) {
      return NextResponse.json({ error: 'Failed to update verification request' }, { status: 500 });
    }

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
      canonical_record_id: requestId,
      integrity_status: updated.integrity_status || mergedIntegrity.integrityStatus,
      integrity_reason:
        (updated.integrity_status || mergedIntegrity.integrityStatus) !== 'clear'
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
