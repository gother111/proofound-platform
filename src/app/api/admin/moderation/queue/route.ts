import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/lib/auth/admin';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/moderation/queue
 *
 * Fetch moderation queue for admin review
 * Requires platform_admin or super_admin role
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await requirePlatformAdmin();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const priority = searchParams.get('priority');
    const contentType = searchParams.get('contentType');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('content_reports')
      .select(
        `
        *,
        reporter:profiles!reporter_id (
          id,
          display_name,
          handle,
          avatar_url
        )
      `
      )
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    if (contentType) {
      query = query.eq('content_type', contentType);
    }

    const { data: reports, error: reportsError } = await query;

    if (reportsError) {
      console.error('Error fetching reports:', reportsError);
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
    }

    // Get counts by status and priority
    const { data: stats } = await supabase.rpc('get_moderation_stats');

    // Enrich reports with content data
    const enrichedReports = await Promise.all(
      (reports || []).map(async (report) => {
        let contentData = null;

        try {
          switch (report.content_type) {
            case 'profile':
              const { data: profile } = await supabase
                .from('profiles')
                .select('id, display_name, handle, avatar_url')
                .eq('id', report.content_id)
                .single();
              contentData = profile;
              break;

            case 'message':
              const { data: message } = await supabase
                .from('messages')
                .select('id, content, sent_at, sender_id')
                .eq('id', report.content_id)
                .single();
              contentData = message;
              break;

            case 'assignment':
              const { data: assignment } = await supabase
                .from('assignments')
                .select('id, role, description, status')
                .eq('id', report.content_id)
                .single();
              contentData = assignment;
              break;

            case 'project':
              const { data: project } = await supabase
                .from('projects')
                .select('id, name, description')
                .eq('id', report.content_id)
                .single();
              contentData = project;
              break;

            case 'skill_proof':
              const { data: proof } = await supabase
                .from('skill_proofs')
                .select('id, proof_type, proof_link, description')
                .eq('id', report.content_id)
                .single();
              contentData = proof;
              break;
          }
        } catch (error) {
          console.error(`Error fetching ${report.content_type} data:`, error);
        }

        return {
          ...report,
          content: contentData,
        };
      })
    );

    log.info('moderation.queue.fetched', {
      adminId: user.userId,
      reportCount: enrichedReports.length,
      status,
      priority,
    });

    return NextResponse.json({
      reports: enrichedReports,
      stats: stats || {
        pending: 0,
        in_review: 0,
        resolved: 0,
        dismissed: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      },
      meta: {
        total: enrichedReports.length,
        offset,
        limit,
      },
    });
  } catch (error) {
    // Check if it's an unauthorized error from requirePlatformAdmin
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    console.error('Error in moderation queue:', error);
    log.error('moderation.queue.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
