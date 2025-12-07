/**
 * Dashboard Load Time API
 *
 * POST /api/analytics/dashboard-load-time - Record dashboard load time
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { dashboardType, loadTimeMs, tileCount, dataFetchTimeMs, renderTimeMs, pagePath } = body;

    if (!dashboardType || !loadTimeMs) {
      return NextResponse.json(
        { error: 'dashboardType and loadTimeMs are required' },
        { status: 400 }
      );
    }

    // Store metrics
    await db.execute(sql`
      INSERT INTO dashboard_load_times (
        user_id,
        dashboard_type,
        load_time_ms,
        tile_count,
        data_fetch_time_ms,
        render_time_ms,
        page_path,
        created_at
      ) VALUES (
        ${user.id},
        ${dashboardType},
        ${loadTimeMs},
        ${tileCount || null},
        ${dataFetchTimeMs || null},
        ${renderTimeMs || null},
        ${pagePath || '/'},
        NOW()
      )
    `);

    // Emit analytics event if load time is poor (>2s)
    if (loadTimeMs > 2000) {
      await db.execute(sql`
        INSERT INTO analytics_events (
          event_type,
          user_id,
          properties,
          occurred_at
        ) VALUES (
          'dashboard_slow_load',
          ${user.id},
          ${JSON.stringify({
        dashboard_type: dashboardType,
        load_time_ms: loadTimeMs,
        tile_count: tileCount,
      })}::jsonb,
          NOW()
        )
      `);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('dashboard.load_time.record.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    // Don't fail - metrics should never break user experience
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
