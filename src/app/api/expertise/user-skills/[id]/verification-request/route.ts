import { requireApiAuthContext } from '@/lib/auth';
import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { sendEmail } from '@/lib/email/sender';
import { resolveSiteUrlFromHeaders } from '@/lib/env';
import {
  VERIFICATION_INTEGRITY_REASONS,
  assessVerificationRequestIntegrity,
  normalizeEmail,
  writeVerificationAuditLog,
} from '@/lib/verification/integrity';

const CreateVerificationRequestSchema = z.object({
  verifierSource: z.enum(['peer', 'manager', 'external']),
  verifierEmail: z.string().email('Valid email is required'),
  message: z.string().optional(),
});

/**
 * Generate a secure verification token
 */
function generateVerificationToken(): string {
  return randomBytes(32).toString('hex');
}

function isMissingVerificationTokenColumnError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const e = error as { code?: string; message?: string; details?: string; hint?: string };
  const errorText = `${e.message || ''} ${e.details || ''} ${e.hint || ''}`.toLowerCase();

  return (e.code === 'PGRST204' || e.code === '42703') && errorText.includes('verification_token');
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
      verifierSource: validated.verifierSource,
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
          verifier_source: validated.verifierSource,
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

    // Generate secure verification token for magic link
    const verificationToken = generateVerificationToken();

    // Calculate expiration (7 days from now per PRD F7)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const verificationInsert = {
      skill_id: skillId,
      requester_profile_id: user.id,
      requester_email_snapshot: integrityAssessment.normalizedRequesterEmail,
      requester_domain_snapshot: integrityAssessment.requesterDomain,
      verifier_email: normalizedVerifierEmail,
      verifier_domain_snapshot: integrityAssessment.verifierDomain,
      verifier_profile_id: integrityAssessment.verifierProfileId,
      verifier_source: validated.verifierSource,
      message: validated.message || null,
      risk_signals: integrityAssessment.riskSignals,
      requires_authenticated_verifier: integrityAssessment.policy.requiresAuthenticatedVerifier,
      integrity_status: integrityAssessment.policy.integrityStatus,
      integrity_reason: integrityAssessment.policy.integrityReason,
      integrity_meta: {
        policy: {
          requires_authenticated_verifier: integrityAssessment.policy.requiresAuthenticatedVerifier,
          integrity_status: integrityAssessment.policy.integrityStatus,
          integrity_reason: integrityAssessment.policy.integrityReason,
        },
      },
      requester_ip_hash: integrityAssessment.requesterFingerprints.ipHash,
      requester_user_agent_hash: integrityAssessment.requesterFingerprints.userAgentHash,
      verification_token: verificationToken,
      expires_at: expiresAt.toISOString(),
    };

    // Create verification request with token. Fallback to legacy insert when
    // the DB has not received the verification_token migration yet.
    const { data: verificationRequestWithToken, error: createWithTokenError } = await supabase
      .from('skill_verification_requests')
      .insert(verificationInsert)
      .select()
      .single();

    let verificationRequest = verificationRequestWithToken;
    let linkToken = verificationToken;

    if (
      !verificationRequestWithToken &&
      isMissingVerificationTokenColumnError(createWithTokenError)
    ) {
      console.warn(
        'verification_token column missing, retrying legacy verification request insert'
      );
      const { verification_token: _ignored, ...legacyInsert } = verificationInsert;
      const { data: legacyVerificationRequest, error: legacyInsertError } = await supabase
        .from('skill_verification_requests')
        .insert(legacyInsert)
        .select()
        .single();

      if (legacyInsertError || !legacyVerificationRequest) {
        console.error('Error creating verification request (legacy fallback):', {
          code: legacyInsertError?.code,
          message: legacyInsertError?.message,
          details: legacyInsertError?.details,
          hint: legacyInsertError?.hint,
        });
        return NextResponse.json(
          { error: 'Failed to create verification request' },
          { status: 500 }
        );
      }

      verificationRequest = legacyVerificationRequest;
      linkToken = legacyVerificationRequest.id;
    } else if (createWithTokenError || !verificationRequestWithToken) {
      console.error('Error creating verification request:', {
        code: createWithTokenError?.code,
        message: createWithTokenError?.message,
        details: createWithTokenError?.details,
        hint: createWithTokenError?.hint,
      });
      return NextResponse.json({ error: 'Failed to create verification request' }, { status: 500 });
    }

    // Get skill name for email
    const skillName =
      (skill.taxonomy as any)?.name_i18n?.en || parseCustomSkillName(skill.skill_id) || 'a skill';

    // Build magic link URL
    const baseUrl =
      resolveSiteUrlFromHeaders(request.headers) ||
      new URL(request.url).origin ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000';
    const verifyUrl = `${baseUrl}/verify/${linkToken}`;

    // Get requester name
    const requesterName =
      requesterProfile?.display_name || (user as any).email?.split('@')[0] || 'Someone';

    // Send verification email to verifier
    const relationshipLabel =
      validated.verifierSource === 'manager'
        ? 'a manager'
        : validated.verifierSource === 'external'
          ? 'a client/external contact'
          : 'a peer/colleague';

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
              <strong>${requesterName}</strong> has listed you as ${relationshipLabel} and is requesting your verification of their expertise in:
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
              By verifying, you're confirming that ${requesterName} has demonstrated this skill based on your professional interaction with them.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verifyUrl}" 
                 style="display: inline-block; background: #1C4D3A; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Review & Verify Skill
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

${requesterName} has listed you as ${relationshipLabel} and is requesting your verification of their expertise in: ${skillName}

${validated.message ? `Message from ${requesterName}: "${validated.message}"` : ''}

By verifying, you're confirming that ${requesterName} has demonstrated this skill based on your professional interaction with them.

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

    await writeVerificationAuditLog({
      actorId: user.id,
      action: 'verification.request.created',
      targetType: 'skill_verification_request',
      targetId: verificationRequest.id,
      meta: {
        skill_id: skillId,
        verifier_email: normalizedVerifierEmail,
        verifier_source: validated.verifierSource,
        integrity_status: verificationRequest.integrity_status || 'clear',
        requires_authenticated_verifier:
          verificationRequest.requires_authenticated_verifier || false,
        risk_signals: verificationRequest.risk_signals || {},
      },
    });

    // Emit verification requested analytics event (PRD F7)
    try {
      const { emitVerificationRequestedAsync } = await import('@/lib/analytics/events');
      emitVerificationRequestedAsync(user.id, verificationRequest.id, {
        skill_id: skillId,
        skill_name: skillName,
        verifier_source: validated.verifierSource,
      });
    } catch (analyticsError) {
      console.error('Failed to emit attestation_requested event:', analyticsError);
    }

    return NextResponse.json(
      {
        request: verificationRequest,
        email_sent: emailResult.success,
        integrity_status: verificationRequest.integrity_status || 'clear',
        requires_authenticated_verifier:
          verificationRequest.requires_authenticated_verifier || false,
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

    // Determine overall verification status
    const hasAccepted = requests?.some(
      (r) => r.status === 'accepted' && (r.integrity_status || 'clear') === 'clear'
    );
    const verification_status = hasAccepted ? 'verified' : 'pending';

    return NextResponse.json({
      verification_status,
      requests: requests || [],
    });
  } catch (error) {
    console.error('Verification GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
