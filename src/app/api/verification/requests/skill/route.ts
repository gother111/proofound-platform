import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';

import { requireApiAuthContext } from '@/lib/auth';
import { buildBlindSafeVerificationRequestEmail } from '@/lib/email/privacy';
import { sendEmail } from '@/lib/email/sender';
import { isMockSupabaseEnabled, resolveCanonicalSiteUrl } from '@/lib/env';
import {
  VERIFICATION_INTEGRITY_REASONS,
  assessVerificationRequestIntegrity,
  normalizeEmail,
  writeVerificationAuditLog,
} from '@/lib/verification/integrity';
import {
  CUSTOM_VERIFICATION_SELECTABLE_RELATIONSHIPS,
  mapCustomRelationshipToSkillVerifierSource,
  type CustomVerificationRelationship,
  type SelectableCustomVerificationRelationship,
} from '@/lib/verification/custom-verification';
import { deriveAttestationRequestMode } from '@/lib/verification/human-attestations';
import {
  createCanonicalSkillVerificationRequest,
  findExistingCanonicalSkillVerificationRequest,
  listCanonicalSkillVerificationRequestsForOwner,
  mapCanonicalSkillVerificationRequestRecord,
  updateCanonicalSkillVerificationRequest,
} from '@/lib/verification/canonical-requests';

const CreateVerificationRequestSchema = z.object({
  skillId: z.string().trim().min(1, 'Valid skill id is required'),
  verifierSource: z.enum(['peer', 'manager', 'external']).optional(),
  relationship: z.enum(CUSTOM_VERIFICATION_SELECTABLE_RELATIONSHIPS).optional(),
  verifierEmail: z.string().trim().email('Valid email is required'),
  message: z.string().optional(),
});

const MOCK_COMPOSER_SKILL_ID = '33333333-3333-4333-8333-333333333333';

function fallbackRelationshipForSource(
  verifierSource: 'peer' | 'manager' | 'external'
): CustomVerificationRelationship {
  switch (verifierSource) {
    case 'manager':
      return 'manager';
    case 'external':
      return 'external';
    case 'peer':
    default:
      return 'peer';
  }
}

type ExistingActiveSkillVerificationRequest = {
  id: string;
  status: 'pending' | 'accepted';
  verifier_email: string | null;
  created_at: string;
};

function toDuplicateVerificationResponse(
  existingRequest?: ExistingActiveSkillVerificationRequest | null
) {
  return NextResponse.json(
    {
      error: 'An active verification request already exists for this skill and verifier.',
      code: 'DUPLICATE_VERIFICATION_REQUEST',
      existingRequestId: existingRequest?.id || null,
      existingStatus: existingRequest?.status || null,
    },
    { status: 409 }
  );
}

async function findExistingActiveVerificationRequest(params: {
  requesterProfileId: string;
  skillId: string;
  verifierEmail: string;
}): Promise<ExistingActiveSkillVerificationRequest | null> {
  const canonicalRow = await findExistingCanonicalSkillVerificationRequest({
    ownerId: params.requesterProfileId,
    skillId: params.skillId,
    verifierEmail: params.verifierEmail,
  });

  if (canonicalRow) {
    const mapped = mapCanonicalSkillVerificationRequestRecord(canonicalRow);
    return {
      id: mapped.id,
      status: mapped.status === 'accepted' ? 'accepted' : 'pending',
      verifier_email: mapped.verifier_email,
      created_at: mapped.created_at,
    };
  }
  return null;
}

function parseCustomSkillName(skillId: string | null): string | null {
  if (!skillId?.startsWith('custom-')) return null;
  const parts = skillId.split('-');
  if (parts.length <= 4) return null;
  return parts
    .slice(4)
    .join(' ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user, supabase } = authContext;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const validated = CreateVerificationRequestSchema.parse(body);
    const skillId = validated.skillId;
    const verifierRelationship =
      validated.relationship ||
      (validated.verifierSource
        ? fallbackRelationshipForSource(validated.verifierSource)
        : ('peer' as SelectableCustomVerificationRelationship));
    const verifierSource = validated.relationship
      ? mapCustomRelationshipToSkillVerifierSource(validated.relationship)
      : validated.verifierSource || 'peer';
    const normalizedVerifierEmail = normalizeEmail(validated.verifierEmail);
    if (!normalizedVerifierEmail) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    if (isMockSupabaseEnabled() && skillId === MOCK_COMPOSER_SKILL_ID) {
      return NextResponse.json(
        {
          request: {
            id: '44444444-4444-4444-8444-444444444444',
            skill_id: skillId,
            verifier_email: normalizedVerifierEmail,
            verifier_relationship: verifierRelationship,
            verifier_source: verifierSource,
            status: 'pending',
          },
          email_sent: true,
          integrity_status: 'clear',
          requires_authenticated_verifier: false,
        },
        { status: 201 }
      );
    }

    const { data: skill, error: skillError } = await supabase
      .from('skills')
      .select(
        `
        id,
        profile_id,
        skill_code,
        skill_id,
        taxonomy:skills_taxonomy!skills_skill_code_fkey (
          name_i18n
        )
      `
      )
      .eq('id', skillId)
      .single();

    if (skillError || !skill || skill.profile_id !== user.id) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    const skillName =
      (skill.taxonomy as any)?.name_i18n?.en || parseCustomSkillName(skill.skill_id) || 'a skill';
    const requestMode = deriveAttestationRequestMode({
      skills: [
        {
          id: skillId,
          label: skillName,
          skillCode: skill.skill_code,
          skillId: skill.skill_id,
        },
      ],
      totalArtifacts: 1,
    });

    if ('error' in requestMode && requestMode.error) {
      return NextResponse.json({ error: requestMode.error }, { status: 400 });
    }

    const { data: requesterProfile } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', user.id)
      .single();

    const { data: authUserData } = await supabase.auth.getUser();
    const requesterEmail = normalizeEmail(authUserData.user?.email || null);

    const integrityAssessment = await assessVerificationRequestIntegrity({
      requesterProfileId: user.id,
      requesterEmail,
      verifierEmail: normalizedVerifierEmail,
      verifierSource,
      headers: request.headers,
    });

    if (integrityAssessment.policy.blockSelf) {
      await writeVerificationAuditLog({
        actorId: user.id,
        action: 'verification.request.blocked',
        targetType: 'skill',
        targetId: skillId,
        meta: {
          reason: VERIFICATION_INTEGRITY_REASONS.SELF_VERIFICATION_BLOCKED,
          verifier_email: normalizedVerifierEmail,
          verifier_source: verifierSource,
          verifier_relationship: verifierRelationship,
          risk_signals: integrityAssessment.riskSignals,
        },
      });

      return NextResponse.json(
        {
          error: 'You cannot request verification from yourself.',
          code: 'SELF_VERIFICATION_BLOCKED',
        },
        { status: 400 }
      );
    }

    const existingRequest = await findExistingActiveVerificationRequest({
      requesterProfileId: user.id,
      skillId,
      verifierEmail: normalizedVerifierEmail,
    });

    if (existingRequest) {
      return toDuplicateVerificationResponse(existingRequest);
    }

    const requesterName =
      requesterProfile?.display_name || (user as any).email?.split('@')[0] || 'Someone';

    let linkToken = '';
    let verificationRequest: ReturnType<typeof mapCanonicalSkillVerificationRequestRecord>;

    try {
      const createdRequest = await createCanonicalSkillVerificationRequest({
        ownerId: user.id,
        skillId,
        skillName,
        requesterName,
        requesterEmailSnapshot: requesterEmail,
        verifierEmail: normalizedVerifierEmail,
        verifierSource,
        verifierRelationship,
        verifierProfileId: integrityAssessment.verifierProfileId,
        requestKind: requestMode.requestKind,
        attestationRequest: requestMode.requestPayload,
        message: validated.message || null,
        integrityStatus: integrityAssessment.policy.integrityStatus as any,
        integrityReason: integrityAssessment.policy.integrityReason,
        riskSignals: {
          ...integrityAssessment.riskSignals,
          requesterEmailSnapshot: integrityAssessment.normalizedRequesterEmail,
          requesterDomainSnapshot: integrityAssessment.requesterDomain,
          verifierDomainSnapshot: integrityAssessment.verifierDomain,
          requesterIpHash: integrityAssessment.requesterFingerprints.ipHash,
          requesterUserAgentHash: integrityAssessment.requesterFingerprints.userAgentHash,
        },
        requiresAuthenticatedVerifier: integrityAssessment.policy.requiresAuthenticatedVerifier,
      });

      linkToken = createdRequest.rawToken;
      verificationRequest = mapCanonicalSkillVerificationRequestRecord(createdRequest.record);
    } catch (createRequestError) {
      console.error('Error creating canonical verification request:', createRequestError);
      const existingDuringRace = await findExistingActiveVerificationRequest({
        requesterProfileId: user.id,
        skillId,
        verifierEmail: normalizedVerifierEmail,
      });
      if (existingDuringRace) {
        return toDuplicateVerificationResponse(existingDuringRace);
      }

      return NextResponse.json({ error: 'Failed to create verification request' }, { status: 500 });
    }

    const baseUrl = resolveCanonicalSiteUrl();
    if (!baseUrl) {
      return NextResponse.json(
        { error: 'Verification request email configuration is unavailable.' },
        { status: 500 }
      );
    }
    const verifyUrl = `${baseUrl}/verify/${linkToken}`;

    const reviewCta =
      requestMode.requestKind === 'human_observed_attestation'
        ? 'Review & Record Observation'
        : 'Review & Verify Skill';
    const emailCopy = buildBlindSafeVerificationRequestEmail({
      verifyUrl,
      expiresInDays: 7,
      ctaLabel: reviewCta,
      requestKind: requestMode.requestKind,
    });

    const emailResult = await sendEmail({
      to: normalizedVerifierEmail,
      subject: emailCopy.subject,
      html: emailCopy.html,
      text: emailCopy.text,
    });

    if (!emailResult.success) {
      console.warn('Failed to send verification email:', emailResult.error);
    }

    await updateCanonicalSkillVerificationRequest({
      requestId: verificationRequest.id,
      status: verificationRequest.status,
      emailSent: emailResult.success,
      emailError: emailResult.success ? null : emailResult.error || 'unknown_email_delivery_error',
    }).catch((updateError) => {
      console.error('Failed to persist canonical verification email delivery state:', updateError);
    });

    await writeVerificationAuditLog({
      actorId: user.id,
      action: 'verification.request.created',
      targetType: 'skill_verification_request',
      targetId: verificationRequest.id,
      meta: {
        skill_id: skillId,
        verifier_email: normalizedVerifierEmail,
        verifier_source: verifierSource,
        verifier_relationship: verifierRelationship,
        request_kind: requestMode.requestKind,
        integrity_status: integrityAssessment.policy.integrityStatus || 'unknown',
        requires_authenticated_verifier:
          integrityAssessment.policy.requiresAuthenticatedVerifier || false,
        risk_signals: integrityAssessment.riskSignals || {},
      },
    });

    try {
      const { emitVerificationRequestedAsync } = await import('@/lib/analytics/events');
      emitVerificationRequestedAsync(user.id, verificationRequest.id, {
        skill_id: skillId,
        skill_name: skillName,
        verifier_source: verifierSource,
        verifier_relationship: verifierRelationship,
        request_kind: requestMode.requestKind,
      });
    } catch (analyticsError) {
      console.error('Failed to emit attestation_requested event:', analyticsError);
    }

    return NextResponse.json(
      {
        request: verificationRequest,
        email_sent: emailResult.success,
        integrity_status: integrityAssessment.policy.integrityStatus || 'unknown',
        requires_authenticated_verifier:
          integrityAssessment.policy.requiresAuthenticatedVerifier || false,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Verification request POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user, supabase } = authContext;
    const skillId = request.nextUrl.searchParams.get('skillId');

    if (!skillId) {
      return NextResponse.json({ error: 'skillId is required' }, { status: 400 });
    }

    const { data: skill, error: skillError } = await supabase
      .from('skills')
      .select('id, profile_id')
      .eq('id', skillId)
      .single();

    if (skillError || !skill || skill.profile_id !== user.id) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    const canonicalRequests = (
      await listCanonicalSkillVerificationRequestsForOwner(user.id).catch(() => [])
    )
      .map(mapCanonicalSkillVerificationRequestRecord)
      .filter((record) => record.skill_id === skillId);

    const hasAccepted = canonicalRequests.some(
      (record: any) =>
        (record.status === 'accepted' || record.status === 'verified') &&
        (record.integrity_status === 'clear' || record.integrity_status === undefined)
    );
    const verification_status = hasAccepted ? 'verified' : 'pending';

    return NextResponse.json({
      verification_status,
      requests: canonicalRequests,
    });
  } catch (error) {
    console.error('Verification GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
