import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { markTokenUsed, resolveFeedbackFollowUpState } from '@/lib/feedback/service';
import { SubmitPayloadSchema } from '@/lib/feedback/schema';
import { emitLifecycleEvent } from '@/lib/analytics/lifecycle-events';
import { FEATURE_FLAG_KEYS } from '@/lib/featureFlags';
import { isFeatureEnabled } from '@/lib/feature-flags/server';
import {
  CAPABILITY_TOKEN_CLASSES,
  getCapabilityRedeemSessionCookieName,
  inspectCapabilityToken,
} from '@/lib/security/capability-tokens';
import { emitLaunchTrace, startLaunchTrace } from '@/lib/launch/trace';

export async function POST(request: NextRequest) {
  const trace = startLaunchTrace({
    flow: 'feedback_submission',
    requestId: request.headers.get('x-request-id'),
    actorType: 'anonymous',
  });

  try {
    const body = SubmitPayloadSchema.parse(await request.json());
    const supabase = await createClient();
    const admin = createAdminClient();

    let userId: string | null = null;
    let interviewId = body.interviewId;
    let templateId = body.templateId;
    let useAdminClient = false;
    let actorEmail: string | null = null;

    // Authenticated path
    if (!body.token) {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        emitLaunchTrace(trace, {
          outcome: 'rejected',
          state: 'feedback_submit_unauthorized',
          failureClass: 'unauthorized',
        });
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = user.id;
      trace.actorId = user.id;
      trace.actorType = 'user_account';
      actorEmail = user.email ?? null;
    }

    // Resolve token-based context
    if (body.token) {
      useAdminClient = true;
      const inspected = await inspectCapabilityToken(body.token, {
        tokenClass: CAPABILITY_TOKEN_CLASSES.FEEDBACK_RESPONSE,
        actor: {
          ip: request.headers.get('x-forwarded-for'),
          userAgent: request.headers.get('user-agent'),
        },
        metadata: { surface: 'feedback_submit' },
      });

      if (!inspected.ok) {
        const status = inspected.reason === 'invalid' ? 404 : 410;
        return NextResponse.json({ error: `Token ${inspected.reason}` }, { status });
      }

      const { data: tokenRow, error: tokenError } = await admin
        .from('feedback_tokens')
        .select('id, interview_id, template_id, direction, expires_at, used_at, recipient_email')
        .eq('id', inspected.token.source_id)
        .maybeSingle();

      if (tokenError || !tokenRow) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
      }

      if (tokenRow.used_at) {
        return NextResponse.json({ error: 'Token already used' }, { status: 410 });
      }

      if (new Date(tokenRow.expires_at) < new Date()) {
        return NextResponse.json({ error: 'Token expired' }, { status: 410 });
      }

      interviewId = tokenRow.interview_id;
      templateId = tokenRow.template_id;

      if (tokenRow.direction !== body.direction) {
        return NextResponse.json({ error: 'Token direction mismatch' }, { status: 400 });
      }

      actorEmail = tokenRow.recipient_email ?? null;
    }

    if (!interviewId) {
      emitLaunchTrace(trace, {
        outcome: 'rejected',
        state: 'feedback_submit_missing_interview',
        failureClass: 'missing_interview_id',
      });
      return NextResponse.json({ error: 'Missing interview id' }, { status: 400 });
    }
    trace.objectRefs.interviewId = interviewId;

    // Validate interview access for authenticated users
    if (!useAdminClient) {
      const { data: interview, error: interviewError } = await supabase
        .from('interviews')
        .select('host_user_id, participant_user_ids, status, completed_at')
        .eq('id', interviewId)
        .maybeSingle();

      if (interviewError || !interview) {
        return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
      }

      const canAccess =
        interview.host_user_id === userId || interview.participant_user_ids?.includes(userId);

      if (!canAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      if (interview.status !== 'completed') {
        return NextResponse.json(
          { error: 'Feedback is available after the interview is marked completed' },
          { status: 400 }
        );
      }
    }

    // Resolve default template if none provided
    if (!templateId) {
      const { data: templateRow } = await admin
        .from('feedback_templates')
        .select('id')
        .eq('direction', body.direction)
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      templateId = templateRow?.id as string | undefined;
    }

    if (!templateId) {
      return NextResponse.json({ error: 'No feedback template configured' }, { status: 400 });
    }

    const structuredFeedbackRequired = await isFeatureEnabled(
      FEATURE_FLAG_KEYS.STRUCTURED_FEEDBACK_REQUIRED,
      {
        userId,
        userEmail: actorEmail ?? undefined,
      },
      true
    );

    if (structuredFeedbackRequired && !body.structuredFeedback) {
      return NextResponse.json(
        {
          error:
            'Structured feedback is required. Include a reason code, personalized note, and suggested next step.',
        },
        { status: 400 }
      );
    }

    const client = useAdminClient ? admin : supabase;
    const { data: interviewTiming } = await admin
      .from('interviews')
      .select('completed_at')
      .eq('id', interviewId)
      .maybeSingle();

    // Prevent duplicate token submissions for a side
    if (useAdminClient) {
      const { data: existingTokenResponse } = await client
        .from('feedback_responses')
        .select('id')
        .eq('interview_id', interviewId)
        .eq('direction', body.direction)
        .eq('submitted_via', 'token')
        .limit(1)
        .maybeSingle();

      if (existingTokenResponse) {
        return NextResponse.json(
          { error: 'Feedback already submitted for this side' },
          { status: 409 }
        );
      }
    }

    const numericScores = (body.answers ?? [])
      .map((a) => a.score)
      .filter((v): v is number => typeof v === 'number');
    const computedOverall =
      body.overallScore ??
      (numericScores.length
        ? Number((numericScores.reduce((s, v) => s + v, 0) / numericScores.length).toFixed(2))
        : null);

    const structuredFeedback = body.structuredFeedback;

    const { data: response, error: insertError } = await client
      .from('feedback_responses')
      .insert({
        interview_id: interviewId,
        template_id: templateId,
        direction: body.direction,
        submitted_by: userId,
        submitted_via: useAdminClient ? 'token' : 'dashboard',
        is_anonymous: true,
        overall_score: computedOverall,
        shared_at: new Date().toISOString(),
        decision_state: structuredFeedback?.decisionState ?? null,
        audience_variant: structuredFeedback?.audienceVariant ?? null,
        reason_code: structuredFeedback?.reasonCode ?? null,
        personalized_note: structuredFeedback?.personalizedNote ?? null,
        suggested_next_step: structuredFeedback?.suggestedNextStep ?? null,
        author_role: structuredFeedback?.authorRole ?? null,
        rubric_version: structuredFeedback?.rubricVersion ?? null,
        rubric_subscores: structuredFeedback?.rubricSubscores ?? null,
        reusable_template_id: structuredFeedback?.reusableTemplateId ?? null,
        operator_override_reason: structuredFeedback?.operatorOverrideReason ?? null,
        internal_note: structuredFeedback?.internalNote ?? null,
      })
      .select('id')
      .single();

    if (insertError || !response) {
      console.error('Feedback save error', insertError);
      return NextResponse.json({ error: 'Could not save feedback' }, { status: 500 });
    }

    if (body.answers?.length) {
      const answersPayload = body.answers.map((answer) => ({
        response_id: response.id,
        question_id: answer.questionId,
        score: answer.score ?? null,
        text_answer: answer.textAnswer ?? null,
      }));

      const { error: answerError } = await client.from('feedback_answers').insert(answersPayload);
      if (answerError) {
        console.error('Feedback answers error', answerError);
        return NextResponse.json({ error: 'Could not save answers' }, { status: 500 });
      }
    }

    if (body.token) {
      const redeemSessionNonce =
        request.cookies.get(
          getCapabilityRedeemSessionCookieName(CAPABILITY_TOKEN_CLASSES.FEEDBACK_RESPONSE)
        )?.value ?? null;
      const markUsed = await markTokenUsed(body.token, {
        email: actorEmail,
        redeemSessionNonce,
      });
      if (!markUsed.ok) {
        const status =
          markUsed.reason === 'replayed'
            ? 409
            : markUsed.reason === 'expired' || markUsed.reason === 'revoked'
              ? 410
              : 404;
        return NextResponse.json({ error: 'Invalid token' }, { status });
      }
    }

    if (structuredFeedback) {
      await emitLifecycleEvent(
        'structured_feedback_submitted',
        {
          feedback_response_id: response.id,
          interview_id: interviewId,
          direction: body.direction,
          audience_variant: structuredFeedback.audienceVariant,
          decision_state: structuredFeedback.decisionState,
          reason_code: structuredFeedback.reasonCode,
          author_role: structuredFeedback.authorRole,
          actor_type:
            structuredFeedback.authorRole === 'organization_member'
              ? 'organization_member'
              : structuredFeedback.authorRole === 'platform_operator'
                ? 'platform_admin'
                : structuredFeedback.authorRole === 'system'
                  ? 'system'
                  : 'candidate',
          source: useAdminClient ? 'feedback.submit.token' : 'feedback.submit.dashboard',
        },
        {
          userId,
          entityType: 'interview',
          entityId: interviewId,
        }
      );
    }

    const { data: feedbackResponses } = await admin
      .from('feedback_responses')
      .select('direction, shared_at')
      .eq('interview_id', interviewId);
    const candidateSubmittedAt =
      feedbackResponses?.find(
        (row: { direction?: string | null; shared_at?: string | null }) =>
          row.direction === 'candidate_to_org'
      )?.shared_at ?? null;
    const organizationSubmittedAt =
      feedbackResponses?.find(
        (row: { direction?: string | null; shared_at?: string | null }) =>
          row.direction === 'org_to_candidate'
      )?.shared_at ?? null;
    const feedbackFollowUp = resolveFeedbackFollowUpState({
      completedAt: interviewTiming?.completed_at ?? null,
      candidateSubmittedAt,
      organizationSubmittedAt,
    });
    emitLaunchTrace(trace, {
      outcome: 'success',
      state: 'structured_feedback_submitted',
      details: {
        responseId: response.id,
      },
    });

    return NextResponse.json({
      success: true,
      responseId: response.id,
      structuredFeedbackRequired,
      feedbackFollowUp: {
        dueAt: feedbackFollowUp.dueAt?.toISOString() ?? null,
        overallState: feedbackFollowUp.overallState,
        candidateToOrg: feedbackFollowUp.candidateToOrg,
        orgToCandidate: feedbackFollowUp.orgToCandidate,
        slaBreached: feedbackFollowUp.slaBreached,
      },
    });
    emitLaunchTrace(trace, {
      outcome: 'success',
      state: 'structured_feedback_submitted',
      details: {
        responseId: response.id,
      },
    });
  } catch (error: any) {
    console.error('Feedback submit failed', error);

    if (error.name === 'ZodError') {
      emitLaunchTrace(trace, {
        outcome: 'rejected',
        state: 'feedback_submit_validation_failed',
        failureClass: 'invalid_feedback_payload',
      });
      return NextResponse.json(
        { error: 'Invalid payload', details: error.issues },
        { status: 400 }
      );
    }

    emitLaunchTrace(trace, {
      outcome: 'failure',
      state: 'feedback_submit_failed',
      failureClass: error instanceof Error ? error.message : 'feedback_submit_failed',
    });
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
