import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { safeApiErrorResponse } from '@/lib/api/errors';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  beginCapabilityTokenRedeemSession,
  CAPABILITY_REDEEM_SESSION_MAX_AGE_SECONDS,
  CAPABILITY_TOKEN_CLASSES,
  getCapabilityRedeemSessionCookieName,
  redeemCapabilityToken,
} from '@/lib/security/capability-tokens';
import {
  expireCanonicalBundle,
  getCanonicalBundleById,
  respondCanonicalBundle,
} from '@/lib/verification/canonical-bundles';
import type { CustomVerificationRelationship } from '@/lib/verification/custom-verification';
import {
  applySkillVerificationTrustLift,
  parseHumanObservedAttestationResponse,
  type HumanObservedAttestationRequestPayload,
  type HumanObservedVerdict,
} from '@/lib/verification/human-attestations';
import { ensureInternalOpsQueueItem } from '@/lib/internal-ops/queue';

const TOKEN_FAILURE_RESPONSE = { error: 'Verification request not found' };

const RespondSchema = z.object({
  action: z.enum(['accept', 'decline']).optional(),
  message: z.string().max(2000).optional(),
  attestation: z.unknown().optional(),
});

function getHumanObservedVerdict(attestation: unknown): HumanObservedVerdict | null {
  if (!attestation || typeof attestation !== 'object') {
    return null;
  }

  const verdict = (attestation as { verdict?: unknown }).verdict;
  if (verdict === 'yes' || verdict === 'partly' || verdict === 'no') {
    return verdict;
  }

  return null;
}

function resolveVerificationAction(params: {
  requestKind: 'generic_verification' | 'human_observed_attestation';
  action?: 'accept' | 'decline';
  attestation?: unknown;
}) {
  if (params.requestKind !== 'human_observed_attestation') {
    return params.action ?? null;
  }

  const verdict = getHumanObservedVerdict(params.attestation);
  if (!verdict) {
    return params.action ?? null;
  }

  return verdict === 'no' ? 'decline' : 'accept';
}

function isCompatibleHumanObservedAction(params: {
  action: 'accept' | 'decline';
  verdict: HumanObservedVerdict;
}) {
  if (params.action === 'accept') {
    return params.verdict === 'yes' || params.verdict === 'partly';
  }

  return params.verdict === 'no';
}

function toResponseStatus(status: string): 'pending' | 'accepted' | 'declined' | 'expired' {
  if (status === 'accepted' || status === 'declined' || status === 'expired') {
    return status;
  }

  return 'pending';
}

function isExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) {
    return false;
  }

  return new Date(expiresAt).getTime() < Date.now();
}

async function loadBundleForToken(token: { id: string; source_id?: string | null }) {
  if (token.source_id) {
    return getCanonicalBundleById(token.source_id);
  }

  return null;
}

async function applyAcceptedArtifactEffects(args: {
  admin: ReturnType<typeof createAdminClient>;
  requesterProfileId: string;
  requestKind: 'generic_verification' | 'human_observed_attestation';
  attestationResponse: Record<string, unknown> | null;
  nowIso: string;
  items: Array<{
    artifact_type:
      | 'skill'
      | 'experience'
      | 'education'
      | 'impact_story'
      | 'project'
      | 'volunteering';
    artifact_id: string;
  }>;
}) {
  const idsByType = {
    skill: args.items
      .filter((item) => item.artifact_type === 'skill')
      .map((item) => item.artifact_id),
    experience: args.items
      .filter((item) => item.artifact_type === 'experience')
      .map((item) => item.artifact_id),
    education: args.items
      .filter((item) => item.artifact_type === 'education')
      .map((item) => item.artifact_id),
    impact_story: args.items
      .filter((item) => item.artifact_type === 'impact_story')
      .map((item) => item.artifact_id),
    project: args.items
      .filter((item) => item.artifact_type === 'project')
      .map((item) => item.artifact_id),
    volunteering: args.items
      .filter((item) => item.artifact_type === 'volunteering')
      .map((item) => item.artifact_id),
  };

  if (idsByType.skill.length > 0) {
    const { data: skills } = await args.admin
      .from('skills')
      .select('id, evidence_strength')
      .in('id', idsByType.skill);

    for (const skill of skills || []) {
      const currentStrength = Number.parseFloat(String(skill.evidence_strength || '0')) || 0;
      const nextStrength = applySkillVerificationTrustLift({
        currentStrength,
        requestKind: args.requestKind,
        integrityStatus: 'clear',
        status: 'accepted',
        attestationResponse: args.attestationResponse,
      });

      if (nextStrength !== currentStrength) {
        await args.admin
          .from('skills')
          .update({
            evidence_strength: nextStrength.toString(),
            updated_at: args.nowIso,
          })
          .eq('id', skill.id);
      }
    }
  }

  if (idsByType.experience.length > 0) {
    await args.admin
      .from('experiences')
      .update({ verified: true, updated_at: args.nowIso })
      .eq('user_id', args.requesterProfileId)
      .in('id', idsByType.experience);
  }

  if (idsByType.education.length > 0) {
    await args.admin
      .from('education')
      .update({ verified: true, updated_at: args.nowIso })
      .eq('user_id', args.requesterProfileId)
      .in('id', idsByType.education);
  }

  if (idsByType.impact_story.length > 0) {
    await args.admin
      .from('impact_stories')
      .update({ verified: true, updated_at: args.nowIso })
      .eq('user_id', args.requesterProfileId)
      .in('id', idsByType.impact_story);
  }

  if (idsByType.project.length > 0) {
    await args.admin
      .from('projects')
      .update({
        verified: true,
        verified_at: args.nowIso,
        verification_source: 'custom_request',
        updated_at: args.nowIso,
      })
      .eq('user_id', args.requesterProfileId)
      .in('id', idsByType.project);
  }

  if (idsByType.volunteering.length > 0) {
    await args.admin
      .from('volunteering')
      .update({ verified: true, updated_at: args.nowIso })
      .eq('user_id', args.requesterProfileId)
      .in('id', idsByType.volunteering);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token || token.length < 32) {
      return NextResponse.json(TOKEN_FAILURE_RESPONSE, { status: 404 });
    }

    const preview = await beginCapabilityTokenRedeemSession(token, {
      tokenClass: CAPABILITY_TOKEN_CLASSES.CUSTOM_VERIFICATION_RESPONSE,
      actor: {
        ip: request.headers.get('x-forwarded-for'),
        userAgent: request.headers.get('user-agent'),
      },
      metadata: { surface: 'custom_verification.preview' },
      maxAgeSeconds: CAPABILITY_REDEEM_SESSION_MAX_AGE_SECONDS,
    });

    if (!preview.ok) {
      return NextResponse.json(TOKEN_FAILURE_RESPONSE, { status: 404 });
    }

    let bundle = await loadBundleForToken(preview.token);
    if (!bundle) {
      return NextResponse.json(TOKEN_FAILURE_RESPONSE, { status: 404 });
    }

    if (bundle.status === 'pending' && isExpired(bundle.expires_at)) {
      await expireCanonicalBundle(bundle.id);
      bundle = await getCanonicalBundleById(bundle.id);
    }

    if (!bundle) {
      return NextResponse.json(TOKEN_FAILURE_RESPONSE, { status: 404 });
    }

    const response = NextResponse.json({
      request: {
        id: bundle.id,
        requester_name: bundle.requester_name || 'A Proofound user',
        requester_avatar: null,
        relationship: (bundle.verifier_relationship ||
          'external') as CustomVerificationRelationship,
        request_kind: bundle.request_kind,
        attestation_request: bundle.attestation_request,
        message: bundle.message,
        status: toResponseStatus(bundle.status),
        created_at: bundle.created_at,
        expires_at: bundle.expires_at,
        responded_at: bundle.responded_at,
        response_message: bundle.response_message,
        attestation_response: bundle.attestation_response,
        items: bundle.items.map((item) => ({
          ...item,
          status: toResponseStatus(item.status),
        })),
      },
    });

    response.cookies.set(
      getCapabilityRedeemSessionCookieName(CAPABILITY_TOKEN_CLASSES.CUSTOM_VERIFICATION_RESPONSE),
      preview.redeemSessionNonce,
      {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: preview.maxAgeSeconds,
      }
    );

    return response;
  } catch (error) {
    return safeApiErrorResponse({
      event: 'verification.custom.preview_failed',
      error,
      status: 500,
      publicMessage: 'Unable to load verification request',
    });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const admin = createAdminClient();
    const { token } = await params;
    const body = await request.json();
    const parsed = RespondSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      );
    }

    if (!token || token.length < 32) {
      return NextResponse.json(TOKEN_FAILURE_RESPONSE, { status: 404 });
    }

    const redeemSessionNonce =
      request.cookies.get(
        getCapabilityRedeemSessionCookieName(CAPABILITY_TOKEN_CLASSES.CUSTOM_VERIFICATION_RESPONSE)
      )?.value ?? null;

    const customRedeemActor = {
      ip: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
      principalType: 'external_email' as const,
    };
    const customRedeemMetadata = {
      surface: 'custom_verification.respond',
      action: parsed.data.action,
    };
    const redeemed = await redeemCapabilityToken(token, {
      tokenClass: CAPABILITY_TOKEN_CLASSES.CUSTOM_VERIFICATION_RESPONSE,
      actor: customRedeemActor,
      consume: true,
      requireRedeemSessionNonce: true,
      redeemSessionNonce,
      metadata: customRedeemMetadata,
    });

    if (!redeemed.ok) {
      return NextResponse.json(TOKEN_FAILURE_RESPONSE, { status: 404 });
    }

    let bundle = await loadBundleForToken(redeemed.token);
    if (!bundle) {
      return NextResponse.json(TOKEN_FAILURE_RESPONSE, { status: 404 });
    }

    if (bundle.status !== 'pending') {
      return NextResponse.json(
        { error: `This request has already been ${bundle.status}` },
        { status: 400 }
      );
    }

    if (isExpired(bundle.expires_at)) {
      await expireCanonicalBundle(bundle.id);
      return NextResponse.json({ error: 'This verification request has expired' }, { status: 400 });
    }

    const requestKind =
      bundle.request_kind === 'human_observed_attestation'
        ? 'human_observed_attestation'
        : 'generic_verification';
    const resolvedAction = resolveVerificationAction({
      requestKind,
      action: parsed.data.action,
      attestation: parsed.data.attestation,
    });
    const attestationRequest =
      requestKind === 'human_observed_attestation' &&
      bundle.attestation_request &&
      typeof bundle.attestation_request === 'object'
        ? (bundle.attestation_request as HumanObservedAttestationRequestPayload)
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
        parsed.data.attestation,
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
        parsed.data.action &&
        !isCompatibleHumanObservedAction({
          action: parsed.data.action,
          verdict: attestationResponse.verdict as HumanObservedVerdict,
        })
      ) {
        return NextResponse.json(
          {
            error:
              parsed.data.action === 'accept'
                ? 'Structured attestations marked accept must use verdict yes or partly.'
                : 'Structured attestations marked decline must use verdict no.',
          },
          { status: 400 }
        );
      }
    }

    if (!resolvedAction) {
      return NextResponse.json(
        { error: 'Verification responses must include an explicit action or structured verdict.' },
        { status: 400 }
      );
    }

    const pendingItems = bundle.items.filter((item) => item.status === 'pending');
    await respondCanonicalBundle({
      bundleId: bundle.id,
      action: resolvedAction,
      responseMessage: parsed.data.message?.trim() || null,
      attestationResponse,
      verifierProfileId: bundle.verifier_profile_id || null,
      verifierEmail: bundle.verifier_email,
      verifierPrincipalType: bundle.verifier_profile_id ? 'user_account' : 'external_email',
      responseAuthMethod: 'token',
      responseActorEmail: bundle.verifier_email,
    });

    if (resolvedAction === 'accept') {
      await applyAcceptedArtifactEffects({
        admin,
        requesterProfileId: bundle.requester_profile_id,
        requestKind,
        attestationResponse,
        nowIso: new Date().toISOString(),
        items: pendingItems.map((item) => ({
          artifact_type: item.artifact_type,
          artifact_id: item.artifact_id,
        })),
      });
    }

    const attestationVerdict = getHumanObservedVerdict(attestationResponse);
    if (requestKind === 'human_observed_attestation') {
      if (attestationVerdict === 'partly') {
        await ensureInternalOpsQueueItem({
          queueType: 'verification',
          linkedEntityType: 'verification_bundle',
          linkedEntityId: bundle.id,
          summary:
            'A bundle verifier responded partly. Manual review is needed before trust can advance.',
          priority: 'normal',
          actorType: 'service_account',
          metadata: {
            verdict: attestationVerdict,
            requestKind,
            verifierEmailPresent: Boolean(bundle.verifier_email),
          },
        });
      } else if (attestationVerdict === 'no') {
        await ensureInternalOpsQueueItem({
          queueType: 'correction_revocation',
          linkedEntityType: 'verification_bundle',
          linkedEntityId: bundle.id,
          summary:
            'A bundle verifier responded no. Review whether trust needs correction or revocation handling.',
          priority: 'high',
          actorType: 'service_account',
          metadata: {
            verdict: attestationVerdict,
            requestKind,
            verifierEmailPresent: Boolean(bundle.verifier_email),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      status: resolvedAction === 'accept' ? 'accepted' : 'declined',
      message:
        resolvedAction === 'accept'
          ? requestKind === 'human_observed_attestation'
            ? 'Thank you for recording these structured observed-in-practice attestations.'
            : 'Thank you for verifying these artifacts!'
          : 'Your response has been recorded.',
    });
  } catch (error) {
    return safeApiErrorResponse({
      event: 'verification.custom.respond_failed',
      error,
      status: 500,
      publicMessage: 'Unable to record verification response',
    });
  }
}
