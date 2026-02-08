import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { susSurveyPrompts } from '@/db/schema';
import { and, eq, lte, asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/surveys/sus/eligibility
 *
 * Returns whether the authenticated user should be prompted to complete a SUS survey.
 * Contract expected by src/hooks/useSUSSurvey.ts:
 * - { eligible: boolean, trigger_point: string, delay?: number }
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    const [prompt] = await db
      .select({
        trigger: susSurveyPrompts.trigger,
        scheduledAt: susSurveyPrompts.scheduledAt,
      })
      .from(susSurveyPrompts)
      .where(
        and(
          eq(susSurveyPrompts.userId, user.id),
          eq(susSurveyPrompts.status, 'pending'),
          lte(susSurveyPrompts.scheduledAt, now)
        )
      )
      .orderBy(asc(susSurveyPrompts.scheduledAt))
      .limit(1);

    if (!prompt) {
      return NextResponse.json({ eligible: false, trigger_point: '' });
    }

    const scheduledAt = prompt.scheduledAt ? new Date(prompt.scheduledAt) : now;
    const delay = Math.max(0, scheduledAt.getTime() - now.getTime());

    return NextResponse.json({
      eligible: true,
      trigger_point: prompt.trigger,
      delay,
    });
  } catch (error) {
    return NextResponse.json({ eligible: false, trigger_point: '' }, { status: 200 });
  }
}
