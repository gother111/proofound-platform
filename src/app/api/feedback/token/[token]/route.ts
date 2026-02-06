import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const admin = createAdminClient();

  try {
    const { token: tokenValue } = await params;

    const { data: tokenRow, error: tokenError } = await admin
      .from('feedback_tokens')
      .select('token, interview_id, template_id, direction, expires_at, used_at')
      .eq('token', tokenValue)
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

    const [{ data: template }, { data: questions }, { data: interview }] = await Promise.all([
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
        .select('id, status, scheduled_at')
        .eq('id', tokenRow.interview_id)
        .maybeSingle(),
    ]);

    return NextResponse.json({
      token: tokenRow.token,
      direction: tokenRow.direction,
      expiresAt: tokenRow.expires_at,
      usedAt: tokenRow.used_at,
      template,
      questions,
      interview,
    });
  } catch (error) {
    console.error('Feedback token lookup failed', error);
    return NextResponse.json({ error: 'Failed to load feedback form' }, { status: 500 });
  }
}
