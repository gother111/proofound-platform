/**
 * Dashboard Layout API
 *
 * GET - Fetch user's saved dashboard layout
 * POST - Save user's dashboard layout
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { dashboardLayouts } from '@/db/schema';
import { eq } from 'drizzle-orm';

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

    const layouts = await db.query.dashboardLayouts.findMany({
      where: eq(dashboardLayouts.userId, user.id),
      orderBy: (dashboardLayouts, { asc }) => [asc(dashboardLayouts.position)],
    });

    // If user has no custom layout, return default widgets
    if (!layouts || layouts.length === 0) {
      const defaultWidgets = [
        {
          widgetId: 'matching-results',
          visible: true,
          position: 0,
          title: 'Quality Matches',
          description: 'Your best-fit opportunities',
        },
        {
          widgetId: 'next-best-actions',
          visible: true,
          position: 1,
          title: 'Next Best Actions',
          description: 'Recommended actions to improve your profile',
        },
        {
          widgetId: 'gap-map',
          visible: true,
          position: 2,
          title: 'Skills Gap Map',
          description: 'Identify missing skills for your goals',
        },
        {
          widgetId: 'goals',
          visible: true,
          position: 3,
          title: 'Goals',
          description: 'Track your career objectives',
        },
        {
          widgetId: 'impact-snapshot',
          visible: true,
          position: 4,
          title: 'Impact Snapshot',
          description: 'Your recent contributions',
        },
        {
          widgetId: 'while-away',
          visible: true,
          position: 5,
          title: 'While You Were Away',
          description: 'Recent updates and activity',
        },
      ];

      return NextResponse.json({ widgets: defaultWidgets });
    }

    // Reconstruct widgets array from database records
    const widgets = layouts.map((layout) => ({
      widgetId: layout.widgetId,
      visible: true,
      position: layout.position || 0,
      title: (layout.settings as any)?.title || layout.widgetId,
      description: (layout.settings as any)?.description || '',
    }));

    return NextResponse.json({ widgets });
  } catch (error) {
    console.error('Fetch dashboard layout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    const { widgets } = body;

    if (!Array.isArray(widgets)) {
      return NextResponse.json({ error: 'Widgets must be an array' }, { status: 400 });
    }

    // Delete existing layout
    await db.delete(dashboardLayouts).where(eq(dashboardLayouts.userId, user.id));

    // Insert new layout
    if (widgets.length > 0) {
      const layoutRecords = widgets.map((widget) => ({
        userId: user.id,
        widgetId: widget.id,
        size: widget.size,
        position: widget.order,
        settings: {
          title: widget.title,
          description: widget.description,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await db.insert(dashboardLayouts).values(layoutRecords);
    }

    // Log analytics event
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_type: 'dashboard_customized',
      event_data: {
        widgetCount: widgets.length,
        widgetIds: widgets.map((w: any) => w.id),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save dashboard layout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
