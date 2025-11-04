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
      orderBy: (dashboardLayouts, { asc }) => [asc(dashboardLayouts.widgetOrder)],
    });

    if (!layouts || layouts.length === 0) {
      return NextResponse.json({ widgets: [] });
    }

    // Reconstruct widgets array from database records
    const widgets = layouts.map((layout) => ({
      id: layout.widgetId,
      type: layout.widgetId,
      title: layout.widgetConfig?.title || layout.widgetId,
      description: layout.widgetConfig?.description || '',
      icon: null, // Icons will be added by the component
      size: layout.widgetSize || 'medium',
      enabled: true,
      order: layout.widgetOrder || 0,
    }));

    return NextResponse.json({ widgets });
  } catch (error) {
    console.error('Fetch dashboard layout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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
      return NextResponse.json(
        { error: 'Widgets must be an array' },
        { status: 400 }
      );
    }

    // Delete existing layout
    await db.delete(dashboardLayouts).where(eq(dashboardLayouts.userId, user.id));

    // Insert new layout
    if (widgets.length > 0) {
      const layoutRecords = widgets.map((widget) => ({
        userId: user.id,
        widgetId: widget.id,
        widgetSize: widget.size,
        widgetOrder: widget.order,
        widgetConfig: {
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
