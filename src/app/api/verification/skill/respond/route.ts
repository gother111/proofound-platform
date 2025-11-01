import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { log } from '@/lib/log';

const SkillVerificationResponseSchema = z.object({
  token: z.string().min(1),
  action: z.enum(['approve', 'decline']),
  verifierName: z.string().max(100).optional(),
  verifierTitle: z.string().max(100).optional(),
  verifierCompany: z.string().max(100).optional(),
  anonymous: z.boolean().optional(),
  comment: z.string().max(500).optional(),
});

/**
 * POST /api/verification/skill/respond
 *
 * Responds to a skill verification request (approve or decline)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Validate request body
    const body = await request.json();
    const validation = SkillVerificationResponseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { token, action, verifierName, verifierTitle, verifierCompany, anonymous, comment } =
      validation.data;

    // Find verification request by token
    const { data: verificationRequest, error: requestError } = await supabase
      .from('skill_verification_requests')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .maybeSingle();

    if (requestError) {
      console.error('Error finding verification request:', requestError);
      return NextResponse.json({ error: 'Failed to find verification request' }, { status: 500 });
    }

    if (!verificationRequest) {
      return NextResponse.json(
        { error: 'Verification request not found or already responded to' },
        { status: 404 }
      );
    }

    // Check if token is expired
    if (new Date(verificationRequest.token_expires_at) < new Date()) {
      await supabase
        .from('skill_verification_requests')
        .update({ status: 'expired' })
        .eq('id', verificationRequest.id);

      return NextResponse.json({ error: 'Verification link has expired' }, { status: 400 });
    }

    // Update verification request status
    const newStatus = action === 'approve' ? 'approved' : 'declined';

    const { error: updateError } = await supabase
      .from('skill_verification_requests')
      .update({
        status: newStatus,
        responded_at: new Date().toISOString(),
        verifier_name: anonymous ? null : verifierName || null,
        verifier_title: anonymous ? null : verifierTitle || null,
        verifier_company: anonymous ? null : verifierCompany || null,
        comment: comment || null,
      })
      .eq('id', verificationRequest.id);

    if (updateError) {
      console.error('Error updating verification request:', updateError);
      return NextResponse.json({ error: 'Failed to update verification request' }, { status: 500 });
    }

    // If approved, update the skill's verification status
    if (action === 'approve') {
      const { error: skillUpdateError } = await supabase
        .from('skills')
        .update({
          verified: true,
          verified_at: new Date().toISOString(),
          verified_by: anonymous ? null : verifierName || null,
        })
        .eq('profile_id', verificationRequest.requester_id)
        .eq('skill_id', verificationRequest.skill_id);

      if (skillUpdateError) {
        console.error('Error updating skill verification:', skillUpdateError);
        // Don't fail the request if this fails, verification request is already saved
      }

      // Update matching profile verification status
      const { data: profile } = await supabase
        .from('matching_profiles')
        .select('verified')
        .eq('profile_id', verificationRequest.requester_id)
        .single();

      if (profile) {
        const verified = (profile.verified as Record<string, boolean>) || {};
        verified['skills'] = true;

        await supabase
          .from('matching_profiles')
          .update({ verified })
          .eq('profile_id', verificationRequest.requester_id);
      }
    }

    log.info('verification.skill.responded', {
      requestId: verificationRequest.id,
      action,
      requesterId: verificationRequest.requester_id,
      skillId: verificationRequest.skill_id,
    });

    return NextResponse.json({
      success: true,
      message: action === 'approve' ? 'Skill verified successfully' : 'Verification declined',
      action,
    });
  } catch (error) {
    console.error('Error in skill verification response:', error);
    log.error('verification.skill.respond.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
