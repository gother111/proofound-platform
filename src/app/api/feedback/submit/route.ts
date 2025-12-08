import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { markTokenUsed } from '@/lib/feedback/service';
import { SubmitPayloadSchema } from '@/lib/feedback/schema';

export async function POST(request: NextRequest) {
  try {
    const body = SubmitPayloadSchema.parse(await request.json());
    const supabase = await createClient();
    const admin = createAdminClient();

    let userId: string | null = null;
    let interviewId = body.interviewId;
    let templateId = body.templateId;
    let useAdminClient = false;

    // Authenticated path
    if (!body.token) {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = user.id;
    }

    // Resolve token-based context
    if (body.token) {
      useAdminClient = true;
      const { data: tokenRow, error: tokenError } = await admin
        .from('feedback_tokens')
        .select('interview_id, template_id, direction, expires_at, used_at')
        .eq('token', body.token)
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
    }

    if (!interviewId) {
      return NextResponse.json({ error: 'Missing interview id' }, { status: 400 });
    }

    // Validate interview access for authenticated users
    if (!useAdminClient) {
      const { data: interview, error: interviewError } = await supabase
        .from('interviews')
        .select('host_user_id, participant_user_ids, status')
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

    const client = useAdminClient ? admin : supabase;

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

    const numericScores = body.answers
      .map((a) => a.score)
      .filter((v): v is number => typeof v === 'number');
    const computedOverall =
      body.overallScore ??
      (numericScores.length
        ? Number((numericScores.reduce((s, v) => s + v, 0) / numericScores.length).toFixed(2))
        : null);

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
      })
      .select('id')
      .single();

    if (insertError || !response) {
      console.error('Feedback save error', insertError);
      return NextResponse.json({ error: 'Could not save feedback' }, { status: 500 });
    }

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

    if (body.token) {
      await markTokenUsed(body.token);
    }

    return NextResponse.json({ success: true, responseId: response.id });
  } catch (error: any) {
    console.error('Feedback submit failed', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid payload', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
