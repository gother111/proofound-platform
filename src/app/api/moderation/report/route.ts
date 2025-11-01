import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

const ReportContentSchema = z.object({
  contentType: z.enum(['profile', 'message', 'assignment', 'project', 'skill_proof']),
  contentId: z.string().uuid(),
  reason: z.enum([
    'spam',
    'harassment',
    'inappropriate_content',
    'false_information',
    'impersonation',
    'other',
  ]),
  details: z.string().max(1000).optional(),
});

/**
 * POST /api/moderation/report
 *
 * Report content for moderation
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate request body
    const body = await request.json();
    const validation = ReportContentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { contentType, contentId, reason, details } = validation.data;

    // Check if user has already reported this content
    const { data: existingReport } = await supabase
      .from('content_reports')
      .select('id')
      .eq('reporter_id', user.id)
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingReport) {
      return NextResponse.json(
        { error: 'You have already reported this content' },
        { status: 400 }
      );
    }

    // Create report
    const { data: report, error: createError } = await supabase
      .from('content_reports')
      .insert({
        reporter_id: user.id,
        content_type: contentType,
        content_id: contentId,
        reason,
        details: details || null,
        status: 'pending',
        priority: calculatePriority(reason),
      })
      .select('id')
      .single();

    if (createError) {
      console.error('Error creating report:', createError);
      return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
    }

    // Increment report count on content (if needed for auto-moderation)
    // This could trigger automatic actions at certain thresholds

    log.info('moderation.report.created', {
      reportId: report.id,
      reporterId: user.id,
      contentType,
      contentId,
      reason,
    });

    return NextResponse.json({
      success: true,
      message: 'Report submitted successfully. Our team will review it shortly.',
      reportId: report.id,
    });
  } catch (error) {
    console.error('Error in content report:', error);
    log.error('moderation.report.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Calculate priority based on reason
 * Higher priority = more urgent
 */
function calculatePriority(reason: string): 'low' | 'medium' | 'high' | 'critical' {
  switch (reason) {
    case 'harassment':
    case 'impersonation':
      return 'critical';
    case 'inappropriate_content':
    case 'false_information':
      return 'high';
    case 'spam':
      return 'medium';
    default:
      return 'low';
  }
}
