/**
 * Learning Goals API
 * GET: list goals for the authenticated user
 * POST: create a new learning goal (skill + target date/level)
 * PATCH: update goal status or target_date
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('growth_plans')
      .select('id, title, goal, target_level, target_date, status, created_at, updated_at')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ goals: data ?? [] });
  } catch (error) {
    console.error('Failed to load goals', error);
    return NextResponse.json(
      { error: 'Failed to load goals', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();
    const body = await request.json();

    const skillCode: string | undefined = body.skillCode;
    const targetLevel: number | undefined = body.targetLevel;
    const targetDate: string | undefined = body.targetDate;

    if (!skillCode) {
      return NextResponse.json({ error: 'skillCode is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('growth_plans')
      .insert({
        profile_id: user.id,
        title: body.title ?? `Learn ${skillCode}`,
        goal: skillCode,
        target_level: targetLevel ?? 3,
        target_date: targetDate ?? null,
        status: 'planned',
      })
      .select()
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ goal: data });
  } catch (error) {
    console.error('Failed to create goal', error);
    return NextResponse.json(
      { error: 'Failed to create goal', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();
    const body = await request.json();

    const id: string | undefined = body.id;
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (body.status) updates.status = body.status;
    if (body.targetDate) updates.target_date = body.targetDate;

    const { data, error } = await supabase
      .from('growth_plans')
      .update(updates)
      .eq('id', id)
      .eq('profile_id', user.id)
      .select()
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ goal: data });
  } catch (error) {
    console.error('Failed to update goal', error);
    return NextResponse.json(
      { error: 'Failed to update goal', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

