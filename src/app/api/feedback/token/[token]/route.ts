import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { FEATURE_FLAG_KEYS } from '@/lib/featureFlags';
import { isFeatureEnabled } from '@/lib/feature-flags/server';
import { resolveFeedbackFollowUpState } from '@/lib/feedback/service';
import {
  beginCapabilityTokenRedeemSession,
  CAPABILITY_REDEEM_SESSION_MAX_AGE_SECONDS,
  CAPABILITY_TOKEN_CLASSES,
  getCapabilityRedeemSessionCookieName,
} from '@/lib/security/capability-tokens';

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const admin = createAdminClient();

  try {
    const { token: tokenValue } = await params;
    const preview = await beginCapabilityTokenRedeemSession(tokenValue, {
      tokenClass: CAPABILITY_TOKEN_CLASSES.FEEDBACK_RESPONSE,
      actor: {
        ip: req.headers.get('x-forwarded-for'),
        userAgent: req.headers.get('user-agent'),
      },
      metadata: { surface: 'feedback_token_lookup' },
      maxAgeSeconds: CAPABILITY_REDEEM_SESSION_MAX_AGE_SECONDS,
    });

    if (!preview.ok) {
      const status = preview.reason === 'invalid' ? 404 : 410;
      return NextResponse.json({ error: `Token ${preview.reason}` }, { status });
    }

    const { data: tokenRow, error: tokenError } = await admin
      .from('feedback_tokens')
      .select('id, interview_id, template_id, direction, expires_at, used_at')
      .eq('id', preview.token.source_id)
      .maybeSingle();

    if (tokenError || !tokenRow) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
    }

    const isExpired = new Date(tokenRow.expires_at) < new Date();
    if (tokenRow.used_at) {
      return NextResponse.json({ error: 'Token already used' }, { status: 410 });
    }

    if (isExpired) {
      return NextResponse.json({ error: 'Token expired' }, { status: 410 });
    }

    const [{ data: template }, { data: questions }, { data: interview }, { data: responses }] =
      await Promise.all([
        admin
          .from('feedback_templates')
          .select('id, name, direction, description')
          .eq('id', tokenRow.template_id)
          .maybeSingle(),
        admin
          .from('feedback_questions')
          .select(
            'id, prompt, question_type, scale_min, scale_max, required, sort_order, helper_text'
          )
          .eq('template_id', tokenRow.template_id)
          .order('sort_order', { ascending: true }),
        admin
          .from('interviews')
          .select('id, status, scheduled_at, completed_at')
          .eq('id', tokenRow.interview_id)
          .maybeSingle(),
        admin
          .from('feedback_responses')
          .select('direction, shared_at')
          .eq('interview_id', tokenRow.interview_id),
      ]);

    const candidateSubmittedAt =
      responses?.find(
        (row: { direction?: string | null; shared_at?: string | null }) =>
          row.direction === 'candidate_to_org'
      )?.shared_at ?? null;
    const organizationSubmittedAt =
      responses?.find(
        (row: { direction?: string | null; shared_at?: string | null }) =>
          row.direction === 'org_to_candidate'
      )?.shared_at ?? null;
    const feedbackFollowUp = resolveFeedbackFollowUpState({
      completedAt: interview?.completed_at ?? null,
      candidateSubmittedAt,
      organizationSubmittedAt,
    });

    const structuredFeedbackRequired = await isFeatureEnabled(
      FEATURE_FLAG_KEYS.STRUCTURED_FEEDBACK_REQUIRED,
      {
        userEmail: null,
      },
      true
    );

    const response = NextResponse.json({
      token: tokenValue,
      direction: tokenRow.direction,
      expiresAt: tokenRow.expires_at,
      usedAt: tokenRow.used_at,
      structuredFeedbackRequired,
      feedbackContract: {
        requiresReasonCode: structuredFeedbackRequired,
        requiresPersonalizedNote: structuredFeedbackRequired,
        requiresSuggestedNextStep: structuredFeedbackRequired,
        rubricVersion: 'structured-feedback/v1',
      },
      template,
      questions,
      interview,
      feedbackFollowUp: {
        dueAt: feedbackFollowUp.dueAt?.toISOString() ?? null,
        overallState: feedbackFollowUp.overallState,
        candidateToOrg: feedbackFollowUp.candidateToOrg,
        orgToCandidate: feedbackFollowUp.orgToCandidate,
        slaBreached: feedbackFollowUp.slaBreached,
      },
    });

    response.cookies.set(
      getCapabilityRedeemSessionCookieName(CAPABILITY_TOKEN_CLASSES.FEEDBACK_RESPONSE),
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
    console.error('Feedback token lookup failed', error);
    return NextResponse.json({ error: 'Failed to load feedback form' }, { status: 500 });
  }
}
