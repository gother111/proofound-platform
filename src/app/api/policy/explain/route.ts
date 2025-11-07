/**
 * Policy Explanation API
 *
 * POST /api/policy/explain - Ask questions about policies and get AI explanations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { explainPolicy, getCommonPolicyQuestions } from '@/lib/ai/policy-explainer';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { question, context, policySection } = body;

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'question is required and must be a string' },
        { status: 400 }
      );
    }

    log.info('policy.explain.request', {
      userId: user.id,
      context,
      questionLength: question.length,
    });

    // Get explanation
    const explanation = await explainPolicy({
      question,
      context,
      policySection,
    });

    return NextResponse.json({
      success: true,
      explanation,
    });
  } catch (error) {
    log.error('policy.explain.api.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to explain policy' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return common questions
    const commonQuestions = getCommonPolicyQuestions();

    return NextResponse.json({
      success: true,
      commonQuestions,
    });
  } catch (error) {
    log.error('policy.common_questions.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to get common questions' }, { status: 500 });
  }
}
