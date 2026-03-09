import { and, eq, gte, inArray, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/db';
import { analyticsEvents, assignments, performanceMetrics } from '@/db/schema';
import { requirePlatformAdminJson } from '@/lib/api/route-helpers';
import { calculateFirstTenMinuteActivationMetrics } from '@/lib/analytics/metrics';
import { getRows } from '@/lib/db/rows';

export const dynamic = 'force-dynamic';

function toPercent(numerator: number, denominator: number): number {
  if (!denominator) return 0;
  return Number(((numerator / denominator) * 100).toFixed(2));
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requirePlatformAdminJson();
    if (admin instanceof NextResponse) {
      return admin;
    }

    const daysParam = Number(request.nextUrl.searchParams.get('days') || '14');
    const days = Number.isFinite(daysParam) && daysParam > 0 ? Math.min(daysParam, 90) : 14;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const now = new Date();

    const firstTenMinuteActivation = await calculateFirstTenMinuteActivationMetrics(since, now);

    const [profileCreatedCountRows, profileActivatedCountRows, activationTierRows] =
      await Promise.all([
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(analyticsEvents)
          .where(
            and(
              eq(analyticsEvents.eventType, 'profile_created'),
              gte(analyticsEvents.createdAt, since)
            )
          ),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(analyticsEvents)
          .where(
            and(
              eq(analyticsEvents.eventType, 'profile_activated'),
              gte(analyticsEvents.createdAt, since)
            )
          ),
        db
          .select({
            tier: sql<string>`coalesce(${analyticsEvents.properties}->>'activationTier', 'unknown')`,
            count: sql<number>`count(*)::int`,
          })
          .from(analyticsEvents)
          .where(
            and(
              eq(analyticsEvents.eventType, 'profile_activated'),
              gte(analyticsEvents.createdAt, since)
            )
          )
          .groupBy(sql`coalesce(${analyticsEvents.properties}->>'activationTier', 'unknown')`),
      ]);

    const assignmentCreatedRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(assignments)
      .where(gte(assignments.createdAt, since));

    const assignmentPublishedRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(assignments)
      .where(
        and(
          gte(assignments.createdAt, since),
          inArray(assignments.creationStatus, ['published', 'ready_to_publish'])
        )
      );

    const builderModeRows = await db
      .select({
        builderMode: sql<string>`coalesce(${analyticsEvents.properties}->>'builderMode', 'unknown')`,
        count: sql<number>`count(*)::int`,
      })
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.eventType, 'assignment_published'),
          gte(analyticsEvents.createdAt, since)
        )
      )
      .groupBy(sql`coalesce(${analyticsEvents.properties}->>'builderMode', 'unknown')`);

    const [privacyUsersRows, visibilityChangeRows, reversalRows] = await Promise.all([
      db
        .select({ users: sql<number>`count(distinct ${analyticsEvents.userId})::int` })
        .from(analyticsEvents)
        .where(
          and(
            gte(analyticsEvents.createdAt, since),
            inArray(analyticsEvents.eventType, ['privacy_settings_updated', 'visibility_changed'])
          )
        ),
      db
        .select({
          count: sql<number>`count(*)::int`,
          from: sql<string>`coalesce(${analyticsEvents.properties}->>'from', '')`,
          to: sql<string>`coalesce(${analyticsEvents.properties}->>'to', '')`,
        })
        .from(analyticsEvents)
        .where(
          and(
            eq(analyticsEvents.eventType, 'visibility_changed'),
            gte(analyticsEvents.createdAt, since)
          )
        )
        .groupBy(
          sql`coalesce(${analyticsEvents.properties}->>'from', '')`,
          sql`coalesce(${analyticsEvents.properties}->>'to', '')`
        ),
      db.execute(sql`
        select count(*)::int as count
        from (
          select
            user_id,
            coalesce(properties->>'field', 'unknown') as field_name
          from analytics_events
          where event_type = 'visibility_changed'
            and created_at >= ${since}
          group by user_id, coalesce(properties->>'field', 'unknown')
          having count(*) >= 2
             and count(distinct coalesce(properties->>'to', '')) >= 2
        ) visibility_reversals
      `),
    ]);

    const [endpointRows, fallbackRowsRaw, queueRowsRaw, syntheticRowsRaw] = await Promise.all([
      db
        .select({
          endpoint: performanceMetrics.apiEndpoint,
          p95: sql<number>`percentile_cont(0.95) within group (order by ${performanceMetrics.valueMs})`,
          total: sql<number>`count(*)::int`,
          breaches: sql<number>`sum(case when ${performanceMetrics.valueMs}::numeric > 1500 then 1 else 0 end)::int`,
        })
        .from(performanceMetrics)
        .where(
          and(
            eq(performanceMetrics.metricType, 'api_latency'),
            gte(performanceMetrics.timestamp, since),
            inArray(performanceMetrics.apiEndpoint, [
              '/api/core/matching/profile',
              '/api/assignments/[id]/publish',
            ])
          )
        )
        .groupBy(performanceMetrics.apiEndpoint),
      db.execute(sql`
        select
          operational_fallback_mode as mode,
          count(*)::int as count,
          round(
            avg(
              extract(
                epoch from (${now} - coalesce(operational_fallback_at, created_at))
              ) / 3600.0
            )::numeric,
            2
          ) as avg_hours_in_state
        from assignments
        where operational_fallback_mode is not null
          and created_at >= ${since}
        group by operational_fallback_mode
        order by count(*) desc, operational_fallback_mode asc
      `),
      db.execute(sql`
        select 'verification_pending_manual' as queue_key, count(*)::int as queue_depth
        from verification_records
        where status in ('pending', 'disputed', 'contradicted')
        union all
        select 'intro_hold' as queue_key, count(*)::int as queue_depth
        from assignments
        where operational_fallback_mode = 'intro_hold_insufficient_qualified_intros'
        union all
        select 'fairness_remediation' as queue_key, count(*)::int as queue_depth
        from fairness_evaluations
        where status in ('elevated', 'breach')
          and evaluated_at >= ${since}
        union all
        select 'feedback_pending' as queue_key, count(*)::int as queue_depth
        from feedback_tokens
        where used_at is null
          and expires_at >= ${now}
      `),
      db.execute(sql`
        select distinct on (monitor_key)
          monitor_key,
          status,
          severity,
          checked_at,
          failure_class
        from synthetic_monitor_runs
        order by monitor_key, checked_at desc
      `),
    ]);

    const profileCreatedCount = profileCreatedCountRows[0]?.count ?? 0;
    const profileActivatedCount = profileActivatedCountRows[0]?.count ?? 0;
    const assignmentsCreatedCount = assignmentCreatedRows[0]?.count ?? 0;
    const assignmentsPublishedCount = assignmentPublishedRows[0]?.count ?? 0;
    const privacyCompletedUsers = privacyUsersRows[0]?.users ?? 0;
    const totalVisibilityChanges = visibilityChangeRows.reduce((sum, row) => sum + row.count, 0);
    const reversalCountRows = getRows(reversalRows as { rows?: Array<{ count?: number }> });
    const visibilityReversalCount = Number(reversalCountRows[0]?.count ?? 0) || 0;
    const fallbackRows = getRows(
      fallbackRowsRaw as {
        rows?: Array<{ mode?: string; count?: number; avg_hours_in_state?: number }>;
      }
    );
    const queueRows = getRows(
      queueRowsRaw as { rows?: Array<{ queue_key?: string; queue_depth?: number }> }
    );
    const syntheticRows = getRows(
      syntheticRowsRaw as {
        rows?: Array<{
          monitor_key?: string;
          status?: string;
          severity?: string;
          checked_at?: string;
          failure_class?: string;
        }>;
      }
    );

    return NextResponse.json({
      windowDays: days,
      generatedAt: now.toISOString(),
      indicators: {
        activationCompletionRate: toPercent(profileActivatedCount, profileCreatedCount),
        assignmentPublishCompletionRate: toPercent(
          assignmentsPublishedCount,
          assignmentsCreatedCount
        ),
        individualFirst10MinuteActivationRate: firstTenMinuteActivation.individual.rate,
        companyFirst10MinuteActivationRate: firstTenMinuteActivation.company.rate,
        privacySettingsCompletionUsers: privacyCompletedUsers,
        privacyVisibilityReversalRate: toPercent(visibilityReversalCount, totalVisibilityChanges),
      },
      firstTenMinuteActivation: {
        windowMinutes: firstTenMinuteActivation.windowMinutes,
        individual: firstTenMinuteActivation.individual,
        company: firstTenMinuteActivation.company,
      },
      activationTierBreakdown: activationTierRows,
      assignmentBuilderModeBreakdown: builderModeRows,
      endpointHealth: endpointRows.map((row) => ({
        endpoint: row.endpoint,
        p95Ms: Number(row.p95 || 0),
        sampleCount: row.total,
        slaBreachRate: toPercent(row.breaches, row.total),
      })),
      fallbackStates: fallbackRows.map((row) => ({
        mode: row.mode,
        count: Number(row.count ?? 0),
        avgHoursInState: Number(row.avg_hours_in_state ?? 0),
      })),
      queueHealth: queueRows.map((row) => ({
        queueKey: row.queue_key,
        queueDepth: Number(row.queue_depth ?? 0),
      })),
      syntheticMonitorHealth: syntheticRows.map((row) => ({
        monitorKey: row.monitor_key,
        status: row.status,
        severity: row.severity,
        checkedAt: row.checked_at,
        failureClass: row.failure_class,
      })),
    });
  } catch (error) {
    console.error('admin.metrics.rollout.failed', error);
    return NextResponse.json({ error: 'Failed to load rollout metrics' }, { status: 500 });
  }
}
