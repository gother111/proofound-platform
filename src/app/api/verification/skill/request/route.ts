import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendSkillVerificationRequest } from '@/lib/email';
import crypto from 'crypto';
import { z } from 'zod';
import { log } from '@/lib/log';

const SkillVerificationRequestSchema = z.object({
  skillId: z.string().min(1),
  verifierEmail: z.string().email('Invalid email address'),
  message: z.string().max(500).optional(),
});

/**
 * POST /api/verification/skill/request
 *
 * Sends a skill verification request to a peer/referee
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate request body
    const body = await request.json();
    const validation = SkillVerificationRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { skillId, verifierEmail, message } = validation.data;

    // Get requester's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('display_name, handle')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get skill details
    const { data: skill, error: skillError } = await supabase
      .from('skills')
      .select('skill_id, custom_skill_name')
      .eq('profile_id', user.id)
      .eq('skill_id', skillId)
      .single();

    if (skillError || !skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    // Get skill name from taxonomy if not custom
    let skillName = skill.custom_skill_name;
    if (!skillName) {
      const { data: taxonomySkill } = await supabase
        .from('skills_taxonomy')
        .select('name')
        .eq('id', skillId)
        .single();
      skillName = taxonomySkill?.name || 'Unknown Skill';
    }

    // Check if verification request already exists (pending)
    const { data: existingRequest } = await supabase
      .from('skill_verification_requests')
      .select('id, status')
      .eq('requester_id', user.id)
      .eq('skill_id', skillId)
      .eq('verifier_email', verifierEmail.toLowerCase())
      .eq('status', 'pending')
      .maybeSingle();

    if (existingRequest) {
      return NextResponse.json(
        { error: 'A pending verification request already exists for this skill and verifier' },
        { status: 400 }
      );
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days

    // Create verification request
    const { data: verificationRequest, error: createError } = await supabase
      .from('skill_verification_requests')
      .insert({
        requester_id: user.id,
        skill_id: skillId,
        verifier_email: verifierEmail.toLowerCase(),
        message: message || null,
        token,
        token_expires_at: expiresAt.toISOString(),
        status: 'pending',
      })
      .select('id')
      .single();

    if (createError) {
      console.error('Error creating verification request:', createError);
      return NextResponse.json({ error: 'Failed to create verification request' }, { status: 500 });
    }

    // Send verification email
    try {
      await sendSkillVerificationRequest(
        verifierEmail,
        profile.display_name || 'A Proofound user',
        profile.handle || '',
        skillName,
        token,
        message
      );
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);

      // Mark request as failed
      await supabase
        .from('skill_verification_requests')
        .update({ status: 'failed' })
        .eq('id', verificationRequest.id);

      return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 });
    }

    log.info('verification.skill.request.sent', {
      requesterId: user.id,
      skillId,
      verifierEmail,
    });

    return NextResponse.json({
      success: true,
      message: 'Verification request sent',
      requestId: verificationRequest.id,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Error in skill verification request:', error);
    log.error('verification.skill.request.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
