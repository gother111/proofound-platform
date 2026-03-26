import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

const ReportContentTypeSchema = z.enum([
  'profile',
  'message',
  'assignment',
  'impact_story',
  'experience',
  'education',
  'volunteering',
]);

const ReportCategorySchema = z.enum([
  'spam',
  'harassment',
  'misinformation',
  'inappropriate',
  'political',
  'other',
]);

const CurrentReportSchema = z.object({
  contentType: ReportContentTypeSchema,
  contentId: z.string().uuid(),
  category: ReportCategorySchema,
  reason: z.string().trim().min(3).max(500),
  details: z.string().trim().max(1000).optional(),
});

const LegacyReasonSchema = z.enum([
  'spam',
  'harassment',
  'inappropriate_content',
  'false_information',
  'impersonation',
  'other',
]);

const LegacyReportSchema = z.object({
  contentType: z.string(),
  contentId: z.string().uuid(),
  reason: LegacyReasonSchema,
  details: z.string().trim().max(1000).optional(),
});

type NormalizedReport = {
  contentType: z.infer<typeof ReportContentTypeSchema>;
  contentId: string;
  category: z.infer<typeof ReportCategorySchema>;
  reason: string;
  details?: string;
};

function mapLegacyContentType(contentType: string): z.infer<typeof ReportContentTypeSchema> | null {
  switch (contentType) {
    case 'profile':
    case 'message':
    case 'assignment':
    case 'impact_story':
    case 'experience':
    case 'education':
    case 'volunteering':
      return contentType;
    // Legacy values with no direct DB enum in content_reports
    case 'project':
      return 'impact_story';
    case 'skill_proof':
      return null;
    default:
      return null;
  }
}

function mapLegacyReason(
  reason: z.infer<typeof LegacyReasonSchema>
): z.infer<typeof ReportCategorySchema> {
  switch (reason) {
    case 'inappropriate_content':
      return 'inappropriate';
    case 'false_information':
      return 'misinformation';
    case 'impersonation':
      return 'harassment';
    default:
      return reason;
  }
}

function normalizeReportPayload(
  payload: unknown
): { ok: true; value: NormalizedReport } | { ok: false; error: string; details?: unknown } {
  const current = CurrentReportSchema.safeParse(payload);
  if (current.success) {
    return {
      ok: true,
      value: current.data,
    };
  }

  const legacy = LegacyReportSchema.safeParse(payload);
  if (!legacy.success) {
    return {
      ok: false,
      error: 'Invalid request data',
      details: current.error.flatten(),
    };
  }

  const mappedContentType = mapLegacyContentType(legacy.data.contentType);
  if (!mappedContentType) {
    return {
      ok: false,
      error: 'Unsupported content type for moderation reporting',
    };
  }

  const mappedCategory = mapLegacyReason(legacy.data.reason);
  const reason = legacy.data.details?.trim()
    ? legacy.data.details.trim().slice(0, 500)
    : `User-reported category: ${mappedCategory}`;

  return {
    ok: true,
    value: {
      contentType: mappedContentType,
      contentId: legacy.data.contentId,
      category: mappedCategory,
      reason,
      details: legacy.data.details,
    },
  };
}

async function resolveContentOwnerId(
  adminClient: ReturnType<typeof createAdminClient>,
  contentType: z.infer<typeof ReportContentTypeSchema>,
  contentId: string
): Promise<string | null> {
  if (contentType === 'profile') {
    return contentId;
  }

  if (contentType === 'message') {
    const { data } = await adminClient
      .from('messages')
      .select('sender_id')
      .eq('id', contentId)
      .maybeSingle();
    return data?.sender_id ?? null;
  }

  if (contentType === 'assignment') {
    const { data: assignment } = await adminClient
      .from('assignments')
      .select('org_id')
      .eq('id', contentId)
      .maybeSingle();

    if (!assignment?.org_id) {
      return null;
    }

    const { data: ownerMembership } = await adminClient
      .from('organization_members')
      .select('user_id')
      .eq('org_id', assignment.org_id)
      .eq('role', 'org_owner')
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();

    return ownerMembership?.user_id ?? null;
  }

  const tableByType: Record<string, string> = {
    impact_story: 'impact_stories',
    experience: 'experiences',
    education: 'education',
    volunteering: 'volunteering',
  };

  const tableName = tableByType[contentType];
  if (!tableName) return null;

  const { data } = await adminClient
    .from(tableName)
    .select('user_id')
    .eq('id', contentId)
    .maybeSingle();

  return data?.user_id ?? null;
}

/**
 * POST /api/moderation/report
 *
 * Report content for moderation review.
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

    const payload = normalizeReportPayload(await request.json());
    if (!payload.ok) {
      return NextResponse.json({ error: payload.error, details: payload.details }, { status: 400 });
    }

    const adminClient = createAdminClient();

    const contentOwnerId = await resolveContentOwnerId(
      adminClient,
      payload.value.contentType,
      payload.value.contentId
    );

    if (!contentOwnerId) {
      return NextResponse.json(
        { error: 'Unable to resolve content owner for report' },
        { status: 404 }
      );
    }

    const { data: existingReport } = await adminClient
      .from('content_reports')
      .select('id')
      .eq('reporter_id', user.id)
      .eq('content_type', payload.value.contentType)
      .eq('content_id', payload.value.contentId)
      .in('status', ['pending', 'reviewing'])
      .maybeSingle();

    if (existingReport) {
      return NextResponse.json(
        { error: 'You have already reported this content and it is under review' },
        { status: 409 }
      );
    }

    const { data: report, error: createError } = await adminClient
      .from('content_reports')
      .insert({
        reporter_id: user.id,
        content_type: payload.value.contentType,
        content_id: payload.value.contentId,
        content_owner_id: contentOwnerId,
        category: payload.value.category,
        reason: payload.value.reason,
        status: 'pending',
      })
      .select('id')
      .single();

    if (createError || !report) {
      log.error('moderation.report.create_failed', {
        userId: user.id,
        error: createError?.message || 'Unknown error',
      });
      return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
    }

    log.info('moderation.report.created', {
      reportId: report.id,
      reporterId: user.id,
      contentType: payload.value.contentType,
      contentId: payload.value.contentId,
      category: payload.value.category,
    });

    return NextResponse.json({
      success: true,
      message: 'Report submitted successfully. Our team will review it shortly.',
      reportId: report.id,
    });
  } catch (error) {
    log.error('moderation.report.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
