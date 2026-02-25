import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type OrganizationRow = {
  id: string;
  display_name: string | null;
  slug: string;
};

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
      return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
    }

    const normalizedOrganizations = ((organizations as OrganizationRow[] | null) ?? []).map(
      (organization) => ({
        id: organization.id,
        slug: organization.slug,
        displayName: organization.display_name ?? null,
        // Keep snake_case for compatibility with unknown legacy clients.
        display_name: organization.display_name ?? null,
      })
    );

    return NextResponse.json({ organizations: normalizedOrganizations });
  } catch (error) {
    console.error('Error in organizations API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
