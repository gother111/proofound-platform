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
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { dashboardLayouts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Default dashboard layout for new users
const DEFAULT_LAYOUT = [
  { widgetId: 'matches', position: 0, visible: true, size: 'default', settings: {} },
  { widgetId: 'applications', position: 1, visible: true, size: 'default', settings: {} },
  { widgetId: 'expertise-depth', position: 2, visible: true, size: 'default', settings: {} },
  { widgetId: 'next-action', position: 3, visible: true, size: 'default', settings: {} },
  { widgetId: 'zen-hub', position: 4, visible: false, size: 'default', settings: {} },
];

const LayoutItemSchema = z.object({
  widgetId: z.string(),
  position: z.number().int().min(0),
  visible: z.boolean(),
  size: z.enum(['small', 'default', 'large']),
  settings: z.record(z.any()),
});

/**
 * GET: Fetch user's dashboard layout
 */
export async function GET() {
  try {
    const user = await requireAuth();

    const userLayouts = await db
      .select()
      .from(dashboardLayouts)
      .where(eq(dashboardLayouts.userId, user.id))
      .orderBy(dashboardLayouts.position);

    // If no layout exists, return default
    if (userLayouts.length === 0) {
      return NextResponse.json({
        layout: DEFAULT_LAYOUT,
        isDefault: true,
      });
    }

    const layout = userLayouts.map((item) => ({
      widgetId: item.widgetId,
      position: item.position,
      visible: item.visible,
      size: item.size,
      settings: item.settings,
    }));

    return NextResponse.json({
      layout,
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
    const user = await requireAuth();
    const body = await request.json();

    // Validate layout
    const layoutSchema = z.array(LayoutItemSchema);
    const layout = layoutSchema.parse(body.layout);

    // Delete existing layout
    await db.delete(dashboardLayouts).where(eq(dashboardLayouts.userId, user.id));

    // Insert new layout
    if (layout.length > 0) {
      const layoutItems = layout.map((item) => ({
        userId: user.id,
        widgetId: item.widgetId,
        position: item.position,
        visible: item.visible,
        size: item.size,
        settings: item.settings,
      }));

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
