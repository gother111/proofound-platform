import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';
import { sendEmail } from '@/lib/email/sender';

const VerifyResponseSchema = z.object({
  action: z.enum(['accept', 'decline']),
  message: z.string().optional(),
  confirmedClaimIds: z.array(z.string()).optional(),
});

function isRelationMissingError(error: unknown) {
  return Boolean(
    error && typeof error === 'object' && (error as { code?: string }).code === '42P01'
  );
}

function isMissingColumnError(error: unknown, column: string) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const e = error as { code?: string; message?: string; details?: string; hint?: string };
  const errorText = `${e.message || ''} ${e.details || ''} ${e.hint || ''}`.toLowerCase();
  return (e.code === 'PGRST204' || e.code === '42703') && errorText.includes(column.toLowerCase());
}

function isNotFoundError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const e = error as { code?: string; message?: string; details?: string };
  if (e.code === 'PGRST116') {
    return true;
  }

  const errorText = `${e.message || ''} ${e.details || ''}`.toLowerCase();
  return errorText.includes('0 rows') || errorText.includes('no rows');
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function shouldFallbackToLegacyRequestIdLookup(token: string, tokenLookupError: unknown): boolean {
  if (!isUuid(token)) {
    return false;
  }

  return (
    isMissingColumnError(tokenLookupError, 'verification_token') ||
    isNotFoundError(tokenLookupError)
  );
}

async function getSkillVerificationByTokenOrLegacyId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  token: string,
  selectClause: string
): Promise<{ data: any; error: any }> {
  const tokenLookup = await supabase
    .from('skill_verification_requests')
    .select(selectClause)
    .eq('verification_token', token)
    .single();

  if (tokenLookup.data) {
    return { data: tokenLookup.data as any, error: null };
  }

  if (!shouldFallbackToLegacyRequestIdLookup(token, tokenLookup.error)) {
    return { data: null, error: tokenLookup.error };
  }

  const idLookup = await supabase
    .from('skill_verification_requests')
    .select(selectClause)
    .eq('id', token)
    .single();

  if (idLookup.data) {
    return { data: idLookup.data as any, error: null };
  }

  return { data: null, error: idLookup.error || tokenLookup.error };
}

function normalizeBaseUrl(url?: string | null) {
  const base = (url || '').trim();
  if (!base) return 'https://proofound.com';
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

async function getImpactVerificationRequestByToken(
  adminClient: ReturnType<typeof createAdminClient>,
  token: string
) {
  const { data, error } = await adminClient
    .from('impact_story_verification_requests')
    .select('*')
    .eq('token', token)
    .maybeSingle();

  if (error && isRelationMissingError(error)) {
    return { data: null, error: null };
  }

  return { data, error };
}

/**
 * GET /api/verify/[token]
 *
 * Get verification request details by token (public endpoint - no auth required)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const supabase = await createClient();
    const { token } = await params;

    if (!token || token.length < 32) {
      return NextResponse.json({ error: 'Invalid verification token' }, { status: 400 });
    }

    // 1) Try impact story verification first (new flow)
    try {
      const adminClient = createAdminClient();
      const { data: impactVerification, error: impactVerificationError } =
        await getImpactVerificationRequestByToken(adminClient, token);

      if (impactVerificationError) {
        console.error('Impact verification lookup error:', impactVerificationError);
      }

      if (impactVerification) {
        if (
          impactVerification.expires_at &&
          new Date(impactVerification.expires_at) < new Date() &&
          impactVerification.status === 'pending'
        ) {
          await adminClient
            .from('impact_story_verification_requests')
            .update({ status: 'expired', updated_at: new Date().toISOString() })
            .eq('id', impactVerification.id);

          impactVerification.status = 'expired';
        }

        const { data: impactStory } = await adminClient
          .from('impact_stories')
          .select('id, title, user_id')
          .eq('id', impactVerification.impact_story_id)
          .maybeSingle();

        const { data: requesterProfile } = impactStory?.user_id
          ? await adminClient
              .from('profiles')
              .select('display_name, avatar_url, email')
              .eq('id', impactStory.user_id)
              .maybeSingle()
          : { data: null };

        return NextResponse.json({
          verification: {
            id: impactVerification.id,
            verification_type: 'impact_story',
            story_id: impactStory?.id || null,
            story_title: impactStory?.title || 'Impact story',
            requester_name:
              requesterProfile?.display_name || requesterProfile?.email?.split('@')[0] || 'Unknown',
            requester_email: requesterProfile?.email || '',
            requester_avatar: requesterProfile?.avatar_url || null,
            verifier_email: impactVerification.verifier_email,
            verifier_name: impactVerification.verifier_name,
            verifier_relationship: impactVerification.verifier_relationship,
            message: impactVerification.message,
            status: impactVerification.status,
            claims: impactVerification.claim_snapshot || {},
            created_at: impactVerification.created_at,
            expires_at: impactVerification.expires_at,
          },
        });
      }
    } catch (impactError) {
      console.error('Impact verification lookup failed, continuing to skill lookup:', impactError);
    }

    // 2) Fallback to existing skill verification flow
    const { data: verification, error: verificationError } =
      await getSkillVerificationByTokenOrLegacyId(
        supabase,
        token,
        `
        id,
        skill_id,
        requester_profile_id,
        verifier_email,
        verifier_source,
        message,
        status,
        created_at,
        expires_at,
        skills (
          skill_id,
          skill_code,
          taxonomy:skill_code (
            name_i18n
          )
        )
      `
      );

    if (verificationError || !verification) {
      return NextResponse.json(
        { error: 'Verification request not found or invalid token' },
        { status: 404 }
      );
    }

    if (verification.expires_at && new Date(verification.expires_at) < new Date()) {
      if (verification.status === 'pending') {
        await supabase
          .from('skill_verification_requests')
          .update({ status: 'expired' })
          .eq('id', verification.id);
      }

      return NextResponse.json({
        verification: {
          ...formatVerificationResponse(verification),
          verification_type: 'skill',
          status: 'expired',
        },
      });
    }

    const { data: requesterProfile } = await supabase
      .from('profiles')
      .select('display_name, avatar_url, email')
      .eq('id', verification.requester_profile_id)
      .single();

    const skill = verification.skills as any;
    let skillName = 'Unknown Skill';

    if (skill?.taxonomy?.name_i18n?.en) {
      skillName = skill.taxonomy.name_i18n.en;
    } else if (skill?.skill_id?.startsWith('custom-')) {
      const parts = skill.skill_id.split('-');
      if (parts.length > 4) {
        skillName = parts
          .slice(4)
          .join(' ')
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (c: string) => c.toUpperCase());
      }
    }

    return NextResponse.json({
      verification: {
        id: verification.id,
        verification_type: 'skill',
        skill_name: skillName,
        skill_code: skill?.skill_code || null,
        requester_name:
          requesterProfile?.display_name || requesterProfile?.email?.split('@')[0] || 'Unknown',
        requester_email: requesterProfile?.email || '',
        requester_avatar: requesterProfile?.avatar_url || null,
        verifier_source: verification.verifier_source,
        message: verification.message,
        status: verification.status,
        created_at: verification.created_at,
        expires_at: verification.expires_at,
      },
    });
  } catch (error) {
    console.error('Verify GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/verify/[token]
 *
 * Accept or decline a verification request (public endpoint - no auth required)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const supabase = await createClient();
    const { token } = await params;
    const body = await request.json();

    const validated = VerifyResponseSchema.parse(body);

    if (!token || token.length < 32) {
      return NextResponse.json({ error: 'Invalid verification token' }, { status: 400 });
    }

    // 1) Try new impact-story verification flow first
    try {
      const adminClient = createAdminClient();
      const { data: impactVerification, error: impactVerificationError } =
        await getImpactVerificationRequestByToken(adminClient, token);

      if (impactVerificationError) {
        console.error('Impact verification lookup error:', impactVerificationError);
      }

      if (impactVerification) {
        if (impactVerification.status !== 'pending') {
          return NextResponse.json(
            { error: `This request has already been ${impactVerification.status}` },
            { status: 400 }
          );
        }

        if (impactVerification.expires_at && new Date(impactVerification.expires_at) < new Date()) {
          await adminClient
            .from('impact_story_verification_requests')
            .update({ status: 'expired', updated_at: new Date().toISOString() })
            .eq('id', impactVerification.id);

          return NextResponse.json(
            { error: 'This verification request has expired' },
            { status: 400 }
          );
        }

        const claimSnapshot = (impactVerification.claim_snapshot || {}) as {
          outcomeClaims?: Array<{ id?: string; outcomeId?: string }>;
          artifactsClaim?: { enabled?: boolean };
        };

        const confirmedClaimIds = new Set(validated.confirmedClaimIds || []);
        const outcomeClaims = Array.isArray(claimSnapshot.outcomeClaims)
          ? claimSnapshot.outcomeClaims
          : [];

        const confirmedOutcomeIds =
          validated.action === 'accept'
            ? outcomeClaims
                .filter((claim) => claim.id && confirmedClaimIds.has(claim.id))
                .map((claim) => claim.outcomeId)
                .filter((outcomeId): outcomeId is string => Boolean(outcomeId))
            : [];

        const confirmedRole = validated.action === 'accept' && confirmedClaimIds.has('role');
        const confirmedArtifacts =
          validated.action === 'accept' &&
          Boolean(claimSnapshot.artifactsClaim?.enabled) &&
          confirmedClaimIds.has('artifacts');

        const { error: responseInsertError } = await adminClient
          .from('impact_story_verification_responses')
          .insert({
            request_id: impactVerification.id,
            responder_email: impactVerification.verifier_email,
            action: validated.action,
            confirmed_role: confirmedRole,
            confirmed_artifacts: confirmedArtifacts,
            confirmed_outcome_ids: confirmedOutcomeIds,
            response_note: validated.message || null,
          });

        if (responseInsertError) {
          console.error('Failed to insert impact verification response:', responseInsertError);
          return NextResponse.json(
            { error: 'Failed to record verification response' },
            { status: 500 }
          );
        }

        const nextStatus = validated.action === 'accept' ? 'accepted' : 'declined';

        const { error: requestUpdateError } = await adminClient
          .from('impact_story_verification_requests')
          .update({
            status: nextStatus,
            responded_at: new Date().toISOString(),
            response_message: validated.message || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', impactVerification.id);

        if (requestUpdateError) {
          console.error('Failed to update impact verification request:', requestUpdateError);
          return NextResponse.json(
            { error: 'Failed to update verification request' },
            { status: 500 }
          );
        }

        if (
          validated.action === 'accept' &&
          (confirmedRole || confirmedArtifacts || confirmedOutcomeIds.length > 0)
        ) {
          const { error: impactStoryUpdateError } = await adminClient
            .from('impact_stories')
            .update({
              verified: true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', impactVerification.impact_story_id);

          if (impactStoryUpdateError) {
            console.error('Failed to mark impact story verified:', impactStoryUpdateError);
          }
        }

        try {
          const { data: requesterProfile } = await adminClient
            .from('profiles')
            .select('email, display_name')
            .eq('id', impactVerification.requester_profile_id)
            .maybeSingle();

          const { data: impactStory } = await adminClient
            .from('impact_stories')
            .select('title')
            .eq('id', impactVerification.impact_story_id)
            .maybeSingle();

          if (requesterProfile?.email) {
            const actionLabel = validated.action === 'accept' ? 'accepted' : 'declined';
            const storyTitle = impactStory?.title || 'impact story';
            const confirmedCount =
              (confirmedRole ? 1 : 0) + (confirmedArtifacts ? 1 : 0) + confirmedOutcomeIds.length;

            await sendEmail({
              to: requesterProfile.email,
              subject: `Impact story verification ${actionLabel}`,
              html: `
                <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="margin-bottom: 16px; color: #1a1a1a;">Impact verification update</h2>
                  <p style="color: #4a4a4a; line-height: 1.6;">
                    ${impactVerification.verifier_email} has <strong>${actionLabel}</strong> your verification request for <strong>${storyTitle}</strong>.
                  </p>
                  ${
                    validated.action === 'accept'
                      ? `<p style="color: #4a4a4a; line-height: 1.6;">Confirmed claims: <strong>${confirmedCount}</strong>.</p>`
                      : ''
                  }
                  ${
                    validated.message
                      ? `<p style="color: #4a4a4a; line-height: 1.6;"><em>"${validated.message}"</em></p>`
                      : ''
                  }
                </div>
              `,
              text: `${impactVerification.verifier_email} has ${actionLabel} your verification request for ${storyTitle}.`,
            });
          }
        } catch (impactEmailError) {
          console.error('Failed to send impact verification notification email:', impactEmailError);
        }

        return NextResponse.json({
          success: true,
          verification_type: 'impact_story',
          status: nextStatus,
          confirmed_claims: {
            role: confirmedRole,
            artifacts: confirmedArtifacts,
            outcomes: confirmedOutcomeIds,
          },
          message:
            validated.action === 'accept'
              ? 'Impact story claims verified successfully.'
              : 'Your response has been recorded.',
        });
      }
    } catch (impactError) {
      console.error('Impact verification submit failed, continuing to skill flow:', impactError);
    }

    // 2) Fallback to existing skill verification flow
    const { data: verification, error: verificationError } =
      await getSkillVerificationByTokenOrLegacyId(
        supabase,
        token,
        `
        id, 
        skill_id, 
        status, 
        expires_at, 
        requester_profile_id,
        verifier_email,
        verifier_source,
        skills (
          skill_code,
          custom_skill_name,
          taxonomy:skill_code (
            name_i18n
          )
        )
      `
      );

    if (verificationError || !verification) {
      return NextResponse.json(
        { error: 'Verification request not found or invalid token' },
        { status: 404 }
      );
    }

    if (verification.status !== 'pending') {
      return NextResponse.json(
        { error: `This request has already been ${verification.status}` },
        { status: 400 }
      );
    }

    if (verification.expires_at && new Date(verification.expires_at) < new Date()) {
      await supabase
        .from('skill_verification_requests')
        .update({ status: 'expired' })
        .eq('id', verification.id);

      return NextResponse.json({ error: 'This verification request has expired' }, { status: 400 });
    }

    const newStatus = validated.action === 'accept' ? 'accepted' : 'declined';

    const { error: updateError } = await supabase
      .from('skill_verification_requests')
      .update({
        status: newStatus,
        responded_at: new Date().toISOString(),
        response_message: validated.message || null,
      })
      .eq('id', verification.id);

    if (updateError) {
      console.error('Error updating verification:', updateError);
      return NextResponse.json({ error: 'Failed to update verification status' }, { status: 500 });
    }

    if (validated.action === 'accept') {
      const { data: skill } = await supabase
        .from('skills')
        .select('evidence_strength')
        .eq('id', verification.skill_id)
        .single();

      const currentStrength = parseFloat(skill?.evidence_strength || '0');
      const newStrength = Math.min(currentStrength + 0.2, 1.0);

      await supabase
        .from('skills')
        .update({
          evidence_strength: newStrength.toString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', verification.skill_id);
    }

    try {
      const { emitVerificationProvided } = await import('@/lib/analytics/events');
      await emitVerificationProvided(verification.requester_profile_id, verification.id, {
        skill_id: verification.skill_id,
        requester_id: verification.requester_profile_id,
        action: validated.action === 'accept' ? 'accepted' : 'declined',
      });
    } catch (analyticsError) {
      console.error('Failed to emit attestation_provided event:', analyticsError);
    }

    try {
      const { data: requesterProfile } = await supabase
        .from('profiles')
        .select('email, display_name')
        .eq('id', verification.requester_profile_id)
        .single();

      if (requesterProfile?.email) {
        const skill = verification.skills as any;
        let skillName = 'your skill';
        if (skill?.taxonomy?.name_i18n?.en) {
          skillName = skill.taxonomy.name_i18n.en;
        } else if (skill?.custom_skill_name) {
          skillName = skill.custom_skill_name;
        }

        const actionText = validated.action === 'accept' ? 'verified' : 'declined to verify';
        const actionEmoji = validated.action === 'accept' ? '✅' : '❌';
        const relationshipText = verification.verifier_source || 'your contact';

        const baseUrl = normalizeBaseUrl(
          process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL
        );
        const expertiseUrl = `${baseUrl}/app/i/expertise`;

        await sendEmail({
          to: requesterProfile.email,
          subject: `${actionEmoji} Your skill verification request was ${validated.action === 'accept' ? 'accepted' : 'declined'}`,
          html: `
            <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #1a1a1a; margin-bottom: 16px;">
                Skill Verification Update
              </h2>
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Hi${requesterProfile.display_name ? ` ${requesterProfile.display_name}` : ''},
              </p>
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                <strong>${relationshipText}</strong> (${verification.verifier_email}) has ${actionText} your 
                <strong>"${skillName}"</strong> skill.
              </p>
              ${
                validated.message
                  ? `
                <div style="background: #f5f5f5; border-left: 4px solid ${validated.action === 'accept' ? '#22c55e' : '#ef4444'}; padding: 16px; margin: 20px 0; border-radius: 4px;">
                  <p style="color: #6b6b6b; font-size: 14px; margin: 0 0 8px 0;">Their message:</p>
                  <p style="color: #4a4a4a; font-size: 15px; margin: 0; font-style: italic;">"${validated.message}"</p>
                </div>
              `
                  : ''
              }
              <div style="margin-top: 24px;">
                <a href="${expertiseUrl}" 
                   style="display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500;">
                  View Your Expertise Atlas
                </a>
              </div>
            </div>
          `,
          text: `Your skill verification request was ${validated.action === 'accept' ? 'accepted' : 'declined'}.\n\n${relationshipText} (${verification.verifier_email}) has ${actionText} your "${skillName}" skill.${validated.message ? `\n\nTheir message: "${validated.message}"` : ''}\n\nView your Expertise Atlas: ${expertiseUrl}`,
        });
      }
    } catch (emailError) {
      console.error('Failed to send verification notification email:', emailError);
    }

    return NextResponse.json({
      success: true,
      verification_type: 'skill',
      status: newStatus,
      message:
        validated.action === 'accept'
          ? 'Thank you for verifying this skill!'
          : 'Your response has been recorded.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Verify POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Format verification response for frontend
 */
function formatVerificationResponse(verification: any) {
  const skill = verification.skills;
  let skillName = 'Unknown Skill';

  if (skill?.taxonomy?.name_i18n?.en) {
    skillName = skill.taxonomy.name_i18n.en;
  } else if (skill?.skill_id?.startsWith('custom-')) {
    const parts = skill.skill_id.split('-');
    if (parts.length > 4) {
      skillName = parts
        .slice(4)
        .join(' ')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c: string) => c.toUpperCase());
    }
  }

  return {
    id: verification.id,
    skill_name: skillName,
    skill_code: skill?.skill_code || null,
    verifier_source: verification.verifier_source,
    message: verification.message,
    status: verification.status,
    created_at: verification.created_at,
    expires_at: verification.expires_at,
  };
}
