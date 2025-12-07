import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/organizations
 * 
 * Returns a list of all organizations (for dropdowns and selection).
 * Public organizations only, sorted by display name.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Fetch organizations
    const { data: organizations, error } = await supabase
      .from('organizations')
      .select('id, display_name, slug')
      .order('display_name', { ascending: true })
      .limit(1000);

    if (error) {
      console.error('Error fetching organizations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch organizations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      organizations: organizations || [],
    });
  } catch (error) {
    console.error('Error in organizations API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

