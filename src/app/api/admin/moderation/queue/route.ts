import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/log';
import { adminListGuard } from '../../_utils';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

type ModerationPriority = 'low' | 'medium' | 'high' | 'critical';

function mapStatusFilter(status: string) {
  switch (status) {
    case 'in_review':
      return 'reviewing';
    case 'resolved':
      return 'actioned';
    default:
      return status;
  }
}

function getPriorityFromCategory(category: string): ModerationPriority {
  switch (category) {
    case 'harassment':
      return 'critical';
    case 'misinformation':
    case 'inappropriate':
      return 'high';
    case 'spam':
      return 'medium';
    default:
      return 'low';
  }
}

async function enrichContent(adminClient: ReturnType<typeof createAdminClient>, report: any) {
  try {
    switch (report.content_type) {
      case 'profile': {
        const { data } = await adminClient
          .from('profiles')
          .select('id, display_name, handle, avatar_url')
          .eq('id', report.content_id)
          .maybeSingle();
        return data;
      }
      case 'message': {
        const { data } = await adminClient
          .from('messages')
          .select('id, content, sent_at, sender_id')
          .eq('id', report.content_id)
          .maybeSingle();
        return data;
      }
      case 'assignment': {
        const { data } = await adminClient
          .from('assignments')
          .select('id, role, description, status')
          .eq('id', report.content_id)
          .maybeSingle();
        return data;
      }
      case 'impact_story': {
        const { data } = await adminClient
          .from('impact_stories')
          .select('id, title, impact, business_value')
          .eq('id', report.content_id)
          .maybeSingle();
        return data;
      }
      case 'experience': {
        const { data } = await adminClient
          .from('experiences')
          .select('id, title, org_description')
          .eq('id', report.content_id)
          .maybeSingle();
        return data;
      }
      case 'education': {
        const { data } = await adminClient
          .from('education')
          .select('id, institution, degree')
          .eq('id', report.content_id)
          .maybeSingle();
        return data;
      }
      case 'volunteering': {
        const { data } = await adminClient
          .from('volunteering')
          .select('id, title, org_description')
          .eq('id', report.content_id)
          .maybeSingle();
        return data;
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}

/**
 * GET /api/admin/moderation/queue
 *
 * Fetch moderation queue for admin review.
 */
export async function GET(request: NextRequest) {
  try {
    const guardResult = await adminListGuard(request);
    if (guardResult instanceof NextResponse) return guardResult;

    const user = guardResult.adminUser;
    const adminClient = createAdminClient();

    const { searchParams } = new URL(request.url);
    const statusFilter = mapStatusFilter(searchParams.get('status') || 'pending');
    const contentType = searchParams.get('contentType');
    const category = searchParams.get('category');

    const limitRaw = parseInt(searchParams.get('limit') || '50', 10);
    const offsetRaw = parseInt(searchParams.get('offset') || '0', 10);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 50;
    const offset = Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0;

    let query = adminClient
      .from('content_reports')
      .select('*')
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    if (contentType) {
      query = query.eq('content_type', contentType);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data: reports, error: reportsError } = await query;

    if (reportsError) {
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
    }

    const reporterIds = Array.from(
      new Set((reports || []).map((r: any) => r.reporter_id).filter(Boolean))
    );
    const reporterMap = new Map<string, any>();

    if (reporterIds.length > 0) {
      const { data: reporters } = await adminClient
        .from('profiles')
        .select('id, display_name, handle, avatar_url')
        .in('id', reporterIds);

      for (const reporter of reporters || []) {
        reporterMap.set(reporter.id, reporter);
      }
    }

    const enrichedReports = await Promise.all(
      (reports || []).map(async (report: any) => {
        const content = await enrichContent(adminClient, report);
        const priority = getPriorityFromCategory(report.category);

        return {
          ...report,
          reporter: reporterMap.get(report.reporter_id) || null,
          content,
          priority,
          details: null,
        };
      })
    );

    const statusCounts = (reports || []).reduce(
      (acc: Record<string, number>, report: any) => {
        const key = report.status || 'pending';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const priorityCounts = enrichedReports.reduce(
      (acc: Record<ModerationPriority, number>, report: any) => {
        const key = (report.priority || 'low') as ModerationPriority;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {} as Record<ModerationPriority, number>
    );

    const stats = {
      pending: statusCounts.pending || 0,
      in_review: statusCounts.reviewing || 0,
      resolved: statusCounts.actioned || 0,
      dismissed: statusCounts.dismissed || 0,
      critical: priorityCounts.critical || 0,
      high: priorityCounts.high || 0,
      medium: priorityCounts.medium || 0,
      low: priorityCounts.low || 0,
    };

    log.info('moderation.queue.fetched', {
      adminId: user.userId,
      reportCount: enrichedReports.length,
      status: statusFilter,
      category,
    });

    return NextResponse.json({
      reports: enrichedReports,
      stats,
      meta: {
        total: enrichedReports.length,
        offset,
        limit,
      },
    });
  } catch (error) {
    log.error('moderation.queue.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
