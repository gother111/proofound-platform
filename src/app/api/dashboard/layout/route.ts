/**
 * Dashboard Layout API
 * GET/POST /api/dashboard/layout
 *
 * Manages user's customizable dashboard tile layout
 *
 * PRD References:
 * - Part 5: F2 - Dashboard Customization
 * - Part 7: Dashboard loads < 2.0s P75
 * - Part 12: Task success ≥90%, drop-off <10%
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuthContext } from '@/lib/auth';
import { db } from '@/db';
import { dashboardLayouts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { AVAILABLE_WIDGETS, sanitizeLayout } from '@/lib/dashboard/layout';

export const dynamic = 'force-dynamic';

// Default dashboard layout for new users
// Uses widgets from lib/dashboard/layout.ts
const DEFAULT_LAYOUT = [
  { widgetId: 'while-away', position: 0, visible: true, size: 'default', settings: {} },
  { widgetId: 'next-best-actions', position: 1, visible: true, size: 'full', settings: {} },
  { widgetId: 'matching-results', position: 2, visible: true, size: 'default', settings: {} },
  { widgetId: 'gap-map', position: 3, visible: true, size: 'default', settings: {} },
  { widgetId: 'goals', position: 4, visible: true, size: 'default', settings: {} },
  { widgetId: 'impact-snapshot', position: 5, visible: true, size: 'large', settings: {} },
];

const LayoutItemSchema = z.object({
  widgetId: z.string(),
  position: z.number().int().min(0),
  visible: z.boolean(),
  size: z.enum(['small', 'default', 'large', 'full']),
  settings: z.record(z.any()),
});

/**
 * GET: Fetch user's dashboard layout
 */
export async function GET() {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;

    const userLayouts = await db
      .select()
      .from(dashboardLayouts)
      .where(eq(dashboardLayouts.userId, user.id))
      .orderBy(dashboardLayouts.position);

    // If no layout exists, return default
    if (userLayouts.length === 0) {
      const sanitizedDefaultLayout = sanitizeLayout(DEFAULT_LAYOUT, {
        defaultLayout: DEFAULT_LAYOUT,
        availableWidgets: AVAILABLE_WIDGETS,
      });
      return NextResponse.json({
        widgets: sanitizedDefaultLayout,
        isDefault: true,
      });
    }

    const widgets = userLayouts.map((item) => ({
      widgetId: item.widgetId,
      position: item.position,
      visible: item.visible,
      size: item.size ?? 'default',
      settings:
        item.settings && typeof item.settings === 'object'
          ? (item.settings as Record<string, any>)
          : {},
    }));
    const sanitizedWidgets = sanitizeLayout(widgets, {
      defaultLayout: DEFAULT_LAYOUT,
      availableWidgets: AVAILABLE_WIDGETS,
    });

    return NextResponse.json({
      widgets: sanitizedWidgets,
      isDefault: false,
    });
  } catch (error) {
    console.error('Failed to fetch dashboard layout:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch layout',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST: Update user's dashboard layout
 */
export async function POST(request: NextRequest) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const body = await request.json();

    // Validate layout (accept both 'layout' and 'widgets' keys for backwards compatibility)
    const layoutSchema = z.array(LayoutItemSchema);
    const layoutData = body.widgets || body.layout;

    if (!layoutData) {
      return NextResponse.json(
        { error: 'Missing layout data. Provide either "widgets" or "layout" array.' },
        { status: 400 }
      );
    }

    const layout = layoutSchema.parse(layoutData);
    const sanitizedLayout = sanitizeLayout(layout, {
      defaultLayout: DEFAULT_LAYOUT,
      availableWidgets: AVAILABLE_WIDGETS,
    });

    // Delete existing layout
    await db.delete(dashboardLayouts).where(eq(dashboardLayouts.userId, user.id));

    // Insert new layout
    if (sanitizedLayout.length > 0) {
      const layoutItems = sanitizedLayout.map((item) => {
        const normalizedSize: 'small' | 'default' | 'large' =
          item.size === 'small' || item.size === 'default' || item.size === 'large'
            ? item.size
            : 'large';

        return {
          userId: user.id,
          widgetId: item.widgetId,
          position: item.position,
          visible: item.visible,
          // DB only supports small/default/large.
          size: normalizedSize,
          settings: item.settings,
        };
      });

      await db.insert(dashboardLayouts).values(layoutItems);
    }

    return NextResponse.json({
      success: true,
      message: 'Dashboard layout updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid layout data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Failed to update dashboard layout:', error);
    return NextResponse.json(
      {
        error: 'Failed to update layout',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
