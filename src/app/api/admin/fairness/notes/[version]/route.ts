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

export async function GET(request: NextRequest, { params }: { params: { version: string } }) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('platform_role')
      .eq('id', user.id)
      .single();

    if (
      !profile?.platform_role ||
      !['platform_admin', 'super_admin'].includes(profile.platform_role)
    ) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { version } = params;

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
