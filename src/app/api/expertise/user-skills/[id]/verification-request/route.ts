import { requireApiAuthContext } from '@/lib/auth';
import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';
import { sendEmail } from '@/lib/email/sender';
import { resolveSiteUrlFromHeaders } from '@/lib/env';
import {
  VERIFICATION_INTEGRITY_REASONS,
  assessVerificationRequestIntegrity,
  normalizeEmail,
  writeVerificationAuditLog,
} from '@/lib/verification/integrity';
import {
  CUSTOM_VERIFICATION_SELECTABLE_RELATIONSHIPS,
  mapCustomRelationshipToSkillVerifierSource,
  relationshipLabel,
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
  verifierSource: z.enum(['peer', 'manager', 'external']).optional(),
  relationship: z.enum(CUSTOM_VERIFICATION_SELECTABLE_RELATIONSHIPS).optional(),
  verifierEmail: z.string().trim().email('Valid email is required'),
  message: z.string().optional(),
});

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

function isUniqueViolationError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const e = error as { code?: string };
  return e.code === '23505';
}

function isDuplicateSkillVerificationConstraintError(error: unknown): boolean {
  if (!isUniqueViolationError(error)) {
    return false;
  }

  const e = error as { message?: string; details?: string; hint?: string; constraint?: string };
  const errorText =
    `${e.constraint || ''} ${e.message || ''} ${e.details || ''} ${e.hint || ''}`.toLowerCase();

  return (
    errorText.includes('idx_skill_verification_active_unique_verifier') ||
    (errorText.includes('skill_verification_requests') &&
      errorText.includes('requester_profile_id') &&
      errorText.includes('skill_id'))
  );
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
  supabase: any;
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

  const { data, error } = await params.supabase
    .from('skill_verification_requests')
    .select('id, status, verifier_email, created_at')
    .eq('requester_profile_id', params.requesterProfileId)
    .eq('skill_id', params.skillId)
    .in('status', ['pending', 'accepted']);

  if (error || !Array.isArray(data)) {
    return null;
  }

  const matchingRows = data
    .filter((row) => normalizeEmail(row.verifier_email) === params.verifierEmail)
    .map((row) => row as ExistingActiveSkillVerificationRequest);

  if (matchingRows.length === 0) {
    return null;
  }

  matchingRows.sort((left, right) => {
    const leftPriority = left.status === 'accepted' ? 0 : 1;
    const rightPriority = right.status === 'accepted' ? 0 : 1;
    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }

    return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
  });

  return matchingRows[0] || null;
}

/**
 * POST /api/expertise/user-skills/[id]/verification-request
 *
 * Request verification for a user's skill.
 * PRD F7: Users can request peer/mentor attests via magic link
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user, supabase } = authContext;
    const body = await request.json();
    const { id: skillId } = await params;

    // Validate input
    const validated = CreateVerificationRequestSchema.parse(body);
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

    // Verify skill belongs to user and get skill details
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

    // Get requester profile info for the email
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
      supabase,
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
        supabase,
        requesterProfileId: user.id,
        skillId,
        verifierEmail: normalizedVerifierEmail,
      });
      if (existingDuringRace) {
        return toDuplicateVerificationResponse(existingDuringRace);
      }

      return NextResponse.json({ error: 'Failed to create verification request' }, { status: 500 });
    }

    // Build magic link URL
    const baseUrl =
      resolveSiteUrlFromHeaders(request.headers) ||
      new URL(request.url).origin ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000';
    const verifyUrl = `${baseUrl}/verify/${linkToken}`;

    // Send verification email to verifier
    const relationshipDescription = relationshipLabel(verifierRelationship);
    const requestVerb =
      requestMode.requestKind === 'human_observed_attestation'
        ? 'their observed-in-practice skill attestation for'
        : 'your verification of their expertise in';
    const confirmationCopy =
      requestMode.requestKind === 'human_observed_attestation'
        ? `By responding, you are describing how ${requesterName} demonstrated this skill in a real work, project, or learning context that you directly observed.`
        : `By verifying, you're confirming that ${requesterName} has demonstrated this skill based on your professional interaction with them.`;
    const reviewCta =
      requestMode.requestKind === 'human_observed_attestation'
        ? 'Review & Record Observation'
        : 'Review & Verify Skill';

    const emailResult = await sendEmail({
      to: normalizedVerifierEmail,
      subject: `${requesterName} requested your verification on Proofound`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #2D3330; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1C4D3A 0%, #2D5F4A 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Skill Verification Request</h1>
          </div>
          
          <div style="background: #F7F6F1; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #E5E3DA; border-top: none;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              Hi there,
            </p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              <strong>${requesterName}</strong> has listed you as ${relationshipDescription} and is requesting ${requestVerb}:
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #1C4D3A; margin: 20px 0;">
              <p style="font-size: 18px; font-weight: 600; color: #1C4D3A; margin: 0;">
                ${skillName}
              </p>
            </div>
            
            ${
              validated.message
                ? `
              <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="font-size: 14px; color: #6B6760; margin: 0 0 8px 0; font-weight: 500;">Message from ${requesterName}:</p>
                <p style="font-size: 14px; margin: 0; font-style: italic;">"${validated.message}"</p>
              </div>
            `
                : ''
            }
            
            <p style="font-size: 16px; margin-bottom: 25px;">
              ${confirmationCopy}
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${verifyUrl}" 
                 style="display: inline-block; background: #1C4D3A; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                ${reviewCta}
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6B6760; margin-top: 25px;">
              This link will expire in 7 days. If you don't recognize this request or have concerns, you can simply ignore this email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #E5E3DA; margin: 25px 0;">
            
            <p style="font-size: 12px; color: #6B6760; margin: 0;">
              This email was sent by Proofound on behalf of ${requesterName}. 
              <br>You're receiving this because ${requesterName} provided your email address.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
Skill Verification Request

Hi there,

${requesterName} has listed you as ${relationshipDescription} and is requesting ${requestVerb}: ${skillName}

${validated.message ? `Message from ${requesterName}: "${validated.message}"` : ''}

${confirmationCopy}

Click here to review and verify: ${verifyUrl}

This link will expire in 7 days.

---
This email was sent by Proofound on behalf of ${requesterName}.
      `.trim(),
    });

    if (!emailResult.success) {
      console.warn('Failed to send verification email:', emailResult.error);
      // Don't fail the request - the verification request is created, email is optional
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

    // Emit verification requested analytics event (PRD F7)
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

/**
 * Parse custom skill name from skill_id (format: custom-{cat}-{subcat}-{l3}-{name})
 */
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

/**
 * GET /api/expertise/user-skills/[id]/verification-request
 *
 * Get verification status for a user's skill.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user, supabase } = authContext;
    const { id: skillId } = await params;

    // Verify skill belongs to user
    const { data: skill, error: skillError } = await supabase
      .from('skills')
      .select('id, profile_id')
      .eq('id', skillId)
      .single();

    if (skillError || !skill || skill.profile_id !== user.id) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    // Fetch verification requests for this skill
    const { data: requests, error: requestsError } = await supabase
      .from('skill_verification_requests')
      .select('*')
      .eq('skill_id', skillId)
      .eq('requester_profile_id', user.id)
      .order('created_at', { ascending: false });

    if (requestsError) {
      console.error('Error fetching verification requests:', requestsError);
      return NextResponse.json({ error: 'Failed to fetch verification requests' }, { status: 500 });
    }

    const canonicalRequests = (
      await listCanonicalSkillVerificationRequestsForOwner(user.id).catch(() => [])
    )
      .map(mapCanonicalSkillVerificationRequestRecord)
      .filter((record) => record.skill_id === skillId);

    const combinedRequests = [...canonicalRequests, ...((requests as any[]) || [])];

    // Determine overall verification status
    const hasAccepted = combinedRequests.some(
      (r: any) =>
        (r.status === 'accepted' || r.status === 'verified') &&
        (r.integrity_status === 'clear' || r.integrity_status === undefined)
    );
    const verification_status = hasAccepted ? 'verified' : 'pending';

    return NextResponse.json({
      verification_status,
      requests: combinedRequests,
    });
  } catch (error) {
    console.error('Verification GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
