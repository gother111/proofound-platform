import { createClient } from '@/lib/supabase/server';
import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';
import { sendEmail } from '@/lib/email/sender';

const VerifyResponseSchema = z.object({
  action: z.enum(['accept', 'decline']),
  message: z.string().optional(),
});

/**
 * GET /api/verify/[token]
 *
 * Get verification request details by token (public endpoint - no auth required)
 * PRD F7: Allow verifier to access verification page via magic link
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

    // Fetch verification request by token
    const { data: verification, error: verificationError } = await supabase
      .from('skill_verification_requests')
      .select(
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
      )
      .eq('verification_token', token)
      .single();

    if (verificationError || !verification) {
      return NextResponse.json(
        { error: 'Verification request not found or invalid token' },
        { status: 404 }
      );
    }

    // Check if expired
    if (verification.expires_at && new Date(verification.expires_at) < new Date()) {
      // Update status to expired if not already
      if (verification.status === 'pending') {
        await supabase
          .from('skill_verification_requests')
          .update({ status: 'expired' })
          .eq('id', verification.id);
      }

      return NextResponse.json({
        verification: {
          ...formatVerificationResponse(verification),
          status: 'expired',
        },
      });
    }

    // Get requester profile info
    const { data: requesterProfile } = await supabase
      .from('profiles')
      .select('display_name, avatar_url, email')
      .eq('id', verification.requester_profile_id)
      .single();

    // Parse skill name from taxonomy or skill_id
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
 * PRD F7: Allow verifier to respond without needing an account
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const supabase = await createClient();
    const { token } = await params;
    const body = await request.json();

    // Validate input
    const validated = VerifyResponseSchema.parse(body);

    if (!token || token.length < 32) {
      return NextResponse.json({ error: 'Invalid verification token' }, { status: 400 });
    }

    // Fetch verification request with skill details
    const { data: verification, error: verificationError } = await supabase
      .from('skill_verification_requests')
      .select(
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
      )
      .eq('verification_token', token)
      .single();

    if (verificationError || !verification) {
      return NextResponse.json(
        { error: 'Verification request not found or invalid token' },
        { status: 404 }
      );
    }

    // Check if already responded
    if (verification.status !== 'pending') {
      return NextResponse.json(
        { error: `This request has already been ${verification.status}` },
        { status: 400 }
      );
    }

    // Check if expired
    if (verification.expires_at && new Date(verification.expires_at) < new Date()) {
      await supabase
        .from('skill_verification_requests')
        .update({ status: 'expired' })
        .eq('id', verification.id);

      return NextResponse.json({ error: 'This verification request has expired' }, { status: 400 });
    }

    // Update verification status
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

    // If accepted, update the skill's evidence strength
    if (validated.action === 'accept') {
      // Get current evidence strength and increment it
      const { data: skill } = await supabase
        .from('skills')
        .select('evidence_strength')
        .eq('id', verification.skill_id)
        .single();

      const currentStrength = parseFloat(skill?.evidence_strength || '0');
      const newStrength = Math.min(currentStrength + 0.2, 1.0); // Add 0.2 per verification, max 1.0

      await supabase
        .from('skills')
        .update({
          evidence_strength: newStrength.toString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', verification.skill_id);
    }

    // Emit verification provided analytics event (PRD F7)
    try {
      const { emitVerificationProvided } = await import('@/lib/analytics/events');
      await emitVerificationProvided(verification.id, {
        skill_id: verification.skill_id,
        requester_id: verification.requester_profile_id,
        action: validated.action === 'accept' ? 'accepted' : 'declined',
      });
    } catch (analyticsError) {
      console.error('Failed to emit attestation_provided event:', analyticsError);
    }

    // Send notification email to requester about the response
    try {
      // Fetch requester's email
      const { data: requesterProfile } = await supabase
        .from('profiles')
        .select('email, display_name')
        .eq('id', verification.requester_profile_id)
        .single();

      if (requesterProfile?.email) {
        // Determine skill name
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

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://proofound.com';
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
              
              ${
                validated.action === 'accept'
                  ? `
                <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                  🎉 Great news! This verification has been added to your skill profile and will help strengthen your credibility.
                </p>
              `
                  : `
                <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                  Don't worry - you can request verification from other colleagues or mentors who can attest to this skill.
                </p>
              `
              }
              
              <div style="margin-top: 24px;">
                <a href="${expertiseUrl}" 
                   style="display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500;">
                  View Your Expertise Atlas
                </a>
              </div>
              
              <p style="color: #9a9a9a; font-size: 14px; margin-top: 32px;">
                — The Proofound Team
              </p>
            </div>
          `,
          text: `Your skill verification request was ${validated.action === 'accept' ? 'accepted' : 'declined'}.\n\n${relationshipText} (${verification.verifier_email}) has ${actionText} your "${skillName}" skill.${validated.message ? `\n\nTheir message: "${validated.message}"` : ''}\n\nView your Expertise Atlas: ${expertiseUrl}`,
        });

        console.log('[Verification] Notification email sent to requester:', requesterProfile.email);
      }
    } catch (emailError) {
      // Don't fail the request if email sending fails
      console.error('Failed to send verification notification email:', emailError);
    }

    return NextResponse.json({
      success: true,
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
