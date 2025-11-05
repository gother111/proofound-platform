/**
 * POST /api/admin/fairness/generate-note
 *
 * Trigger generation of a new fairness note for a release version
 * Requires admin permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateFairnessNote } from '@/lib/analytics/fairness-note-generator';

export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { releaseVersion } = body;

    if (!releaseVersion || typeof releaseVersion !== 'string') {
      return NextResponse.json(
        { error: 'Release version is required and must be a string' },
        { status: 400 }
      );
    }

    // Generate the fairness note
    const noteId = await generateFairnessNote(releaseVersion, user.id);

    return NextResponse.json({
      success: true,
      noteId,
      message: 'Fairness note generated successfully',
    });
  } catch (error) {
    console.error('Error generating fairness note:', error);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
