/**
 * Self-Assessment API
 *
 * POST /api/wellbeing/self-assessment - Save private non-diagnostic check-in results
 * GET /api/wellbeing/self-assessment - Retrieve assessment history
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { assessmentType, score, severity, responses } = body;

    if (!assessmentType || score === undefined || !severity || !responses) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['phq2', 'gad2'].includes(assessmentType)) {
      return NextResponse.json({ error: 'Invalid assessment type' }, { status: 400 });
    }

    // Save to database
    const { data, error } = await supabase
      .from('self_assessments')
      .insert({
        user_id: user.id,
        assessment_type: assessmentType,
        score,
        severity,
        responses,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to save assessment' }, { status: 500 });
    }

    // Log analytics event without storing raw PII in payload
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_type: 'self_assessment_completed',
      properties: {
        assessmentType,
        score,
        severity,
        privacy_partition: 'wellbeing',
      },
    });

    return NextResponse.json({ success: true, assessment: data });
  } catch (error) {
    console.error('Self-assessment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const assessmentType = searchParams.get('type'); // 'phq2' or 'gad2' or null (all)
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('self_assessments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (assessmentType) {
      query = query.eq('assessment_type', assessmentType);
    }

    const { data: assessments, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch assessments' }, { status: 500 });
    }

    return NextResponse.json({ assessments: assessments || [] });
  } catch (error) {
    console.error('Fetch assessments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
