/**
 * GET /api/admin/fairness/notes
 *
 * List all fairness notes
 * Requires admin permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { fairnessNotes } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { adminListGuard } from '@/app/api/admin/_utils';
import { jsonError } from '@/lib/api/route-helpers';

export async function GET(request: NextRequest) {
  try {
    const guardResult = await adminListGuard(request);
    if (guardResult instanceof NextResponse) return guardResult;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'draft' | 'published' | 'archived' | null;
    const limitRaw = parseInt(searchParams.get('limit') || '50', 10);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 50;

    // Fetch fairness notes
    let notes: any[] = [];

    try {
      // Build query
      let query = db.select().from(fairnessNotes).orderBy(desc(fairnessNotes.generatedAt));

      if (status) {
        query = query.where(eq(fairnessNotes.status, status)) as any;
      }

      query = query.limit(limit) as any;

      notes = await query;
    } catch (dbError) {
      console.error('Error fetching fairness notes from DB:', dbError);
      // Continue with empty notes array
    }

    return NextResponse.json({
      success: true,
      notes,
      count: notes.length,
    });
  } catch (error) {
    console.error('Error fetching fairness notes:', error);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
