import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendSkillVerificationRequest } from '@/lib/email';
import crypto from 'crypto';
import { z } from 'zod';
import { log } from '@/lib/log';
import { notifyVerificationRequested } from '@/lib/notifications';
import { checkVerificationRateLimit } from '@/lib/rate-limit';
import {
  CAPABILITY_BINDINGS,
  CAPABILITY_TOKEN_CLASSES,
  issueCapabilityToken,
} from '@/lib/security/capability-tokens';
import { emitLaunchTrace, startLaunchTrace } from '@/lib/launch/trace';

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
  const trace = startLaunchTrace({
    flow: 'verification_request',
    requestId: request.headers.get('x-request-id'),
    actorType: 'anonymous',
  });

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      emitLaunchTrace(trace, {
        outcome: 'rejected',
        state: 'verification_request_unauthorized',
        failureClass: 'unauthorized',
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    trace.actorId = user.id;
    trace.actorType = 'user_account';

    // Validate request body
    const body = await request.json();
    const validation = SkillVerificationRequestSchema.safeParse(body);

    if (!validation.success) {
      emitLaunchTrace(trace, {
        outcome: 'rejected',
        state: 'verification_request_validation_failed',
        failureClass: 'invalid_verification_request',
      });
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { skillId, verifierEmail, message } = validation.data;
    trace.objectRefs.skillId = skillId;

    // Check rate limit (5/hour, 20/day)
    const rateLimit = await checkVerificationRateLimit(user.id);
    if (!rateLimit.allowed) {
      emitLaunchTrace(trace, {
        outcome: 'rejected',
        state: 'verification_request_rate_limited',
        failureClass: 'rate_limited',
      });
      return NextResponse.json(
        {
          error: rateLimit.reason,
          hourlyRemaining: rateLimit.hourlyRemaining,
          dailyRemaining: rateLimit.dailyRemaining,
        },
        { status: 429 }
      );
    }

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
      emitLaunchTrace(trace, {
        outcome: 'rejected',
        state: 'verification_request_duplicate_pending',
        failureClass: 'duplicate_pending_request',
      });
      return NextResponse.json(
        { error: 'A pending verification request already exists for this skill and verifier' },
        { status: 400 }
      );
    }

    const verificationRequestId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days
    const issued = await issueCapabilityToken({
      tokenClass: CAPABILITY_TOKEN_CLASSES.SKILL_VERIFICATION_RESPONSE,
      sourceTable: 'skill_verification_requests',
      sourceId: verificationRequestId,
      actionScope: 'skill_verification.respond',
      subjectType: 'skill_verification_request',
      subjectId: verificationRequestId,
      actorBinding: CAPABILITY_BINDINGS.EMAIL_HASH,
      actorEmail: verifierEmail.toLowerCase(),
      expiresAt,
      singleUse: true,
      maxUses: 1,
      scopeKey: `skill_verification:${skillId}:${verifierEmail.toLowerCase()}`,
      revokePriorActiveTokensForScope: true,
      metadata: {
        verifierSource: 'external',
        skillId,
      },
    });

    // Create verification request
    const { data: verificationRequest, error: createError } = await supabase
      .from('skill_verification_requests')
      .insert({
        id: verificationRequestId,
        requester_id: user.id,
        skill_id: skillId,
        verifier_email: verifierEmail.toLowerCase(),
        message: message || null,
        capability_token_id: issued.token.id,
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
        issued.rawToken,
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
    emitLaunchTrace(trace, {
      outcome: 'success',
      state: 'verification_request_created',
      details: {
        requestId: verificationRequest.id,
      },
    });

    // Send in-app notification if verifier has a Proofound account
    try {
      const { data: verifierProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', verifierEmail.toLowerCase())
        .maybeSingle();

      if (verifierProfile) {
        const requesterName = profile.display_name || profile.handle || 'Someone';
        await notifyVerificationRequested(
          verifierProfile.id,
          verificationRequest.id,
          requesterName,
          skillName
        );
      }
    } catch (notifError) {
      console.error('Failed to send verification notification:', notifError);
      // Don't fail the request if notification fails
    }

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
    emitLaunchTrace(trace, {
      outcome: 'failure',
      state: 'verification_request_failed',
      failureClass: error instanceof Error ? error.message : 'verification_request_failed',
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
