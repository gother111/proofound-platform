import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/log';

const ParamsSchema = z.object({
  interviewId: z.string().uuid(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ interviewId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { interviewId } = ParamsSchema.parse(await params);

    const { data: interview, error: interviewError } = await supabase
      .from('interviews')
      .select('id, host_user_id, participant_user_ids, status')
      .eq('id', interviewId)
      .maybeSingle();

    if (interviewError || !interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    const allowed =
      interview.host_user_id === user.id || interview.participant_user_ids?.includes(user.id);

    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: templates } = await supabase
      .from('feedback_templates')
      .select('id, name, direction, description')
      .eq('is_active', true);

    const templateIds = (templates || []).map((t) => t.id);

    const [{ data: questions }, { data: responses }] = await Promise.all([
      supabase
        .from('feedback_questions')
        .select(
          'id, template_id, prompt, question_type, scale_min, scale_max, required, sort_order, helper_text'
        )
        .in(
          'template_id',
          templateIds.length ? templateIds : ['00000000-0000-0000-0000-000000000000']
        )
        .order('sort_order', { ascending: true }),
      supabase
        .from('feedback_responses')
        .select(
          `
          id,
          interview_id,
          template_id,
          direction,
          submitted_by,
          submitted_via,
          is_anonymous,
          overall_score,
          decision_state,
          audience_variant,
          reason_code,
          personalized_note,
          suggested_next_step,
          author_role,
          rubric_version,
          rubric_subscores,
          reusable_template_id,
          operator_override_reason,
          internal_note,
          created_at,
          answers:feedback_answers (
            id,
            question_id,
            score,
            text_answer,
            created_at
          )
        `
        )
        .eq('interview_id', interviewId),
    ]);

    const maskedResponses = (responses || []).map((response) => ({
      ...response,
      submitted_by: response.submitted_by === user.id ? response.submitted_by : null,
    }));

    const templateWithQuestions = (templates || []).map((template) => ({
      ...template,
      questions: (questions || []).filter((q) => q.template_id === template.id),
    }));

    return NextResponse.json({
      interview: { id: interview.id, status: interview.status },
      templates: templateWithQuestions,
      responses: maskedResponses,
    });
  } catch (error: any) {
    log.error('feedback.load.failed', { error });

    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid interview id' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to load feedback' }, { status: 500 });
  }
}
