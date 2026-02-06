/**
 * GET /api/user/audit-log/purpose
 *
 * Get user's purpose edit history
 * Returns timeline of changes to mission and vision.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPurposeEditHistory } from '@/lib/audit/purpose-log';

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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const rawField = searchParams.get('field');
    const fieldName = rawField === 'mission' || rawField === 'vision' ? rawField : null;
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    // Get audit log history
    const history = await getPurposeEditHistory(
      user.id,
      fieldName || undefined,
      Math.min(limit, 500) // Max 500 entries
    );

    return NextResponse.json({
      success: true,
      history,
      count: history.length,
    });
  } catch (error) {
    console.error('Error fetching purpose edit history:', error);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
