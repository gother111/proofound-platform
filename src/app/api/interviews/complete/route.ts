import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { issueFeedbackInvites } from '@/lib/feedback/service';

const CompleteSchema = z.object({
  interviewId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = CompleteSchema.parse(await request.json());

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: interview, error: interviewError } = await supabase
      .from('interviews')
      .select('id, host_user_id, participant_user_ids, status')
      .eq('id', body.interviewId)
      .maybeSingle();

    if (interviewError || !interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    if (interview.host_user_id !== user.id) {
      return NextResponse.json({ error: 'Only the host can mark completion' }, { status: 403 });
    }

    if (interview.status === 'completed') {
      return NextResponse.json({ success: true, message: 'Already completed' });
    }

    const { error: updateError } = await supabase
      .from('interviews')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', body.interviewId);

    if (updateError) {
      return NextResponse.json({ error: 'Could not update interview status' }, { status: 500 });
    }

    await issueFeedbackInvites(body.interviewId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Interview completion failed', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid payload', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
