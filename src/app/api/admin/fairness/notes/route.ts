/**
 * GET /api/admin/fairness/notes
 *
 * List all fairness notes
 * Requires admin permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { fairnessNotes } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'draft' | 'published' | 'archived' | null;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Build query
    let query = db.select().from(fairnessNotes).orderBy(desc(fairnessNotes.generatedAt));

    if (status) {
      query = query.where(eq(fairnessNotes.status, status)) as any;
    }

    query = query.limit(limit) as any;

    const notes = await query;

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
