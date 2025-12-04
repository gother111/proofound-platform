/**
 * GET /api/admin/fairness/notes/[version]
 *
 * Get a specific fairness note by release version
 * Requires admin permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { fairnessNotes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { adminListGuard } from '../../_utils';

export async function GET(request: NextRequest, { params }: { params: Promise<{ version: string }> }) {
  try {
    const guardResult = await adminListGuard(request);
    if (guardResult instanceof NextResponse) return guardResult;

    const { version } = await params;

    if (!version) {
      return NextResponse.json({ error: 'Version parameter is required' }, { status: 400 });
    }

    // Get the fairness note
    const [note] = await db
      .select()
      .from(fairnessNotes)
      .where(eq(fairnessNotes.releaseVersion, version))
      .limit(1);

    if (!note) {
      return NextResponse.json(
        { error: `Fairness note not found for version ${version}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      note,
    });
  } catch (error) {
    console.error('Error fetching fairness note:', error);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
