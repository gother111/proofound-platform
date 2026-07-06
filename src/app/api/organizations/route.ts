import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';
import { log } from '@/lib/log';

type OrganizationRow = {
  id: string;
  display_name: string | null;
  slug: string;
};

type OrganizationMembershipRow = {
  org: OrganizationRow | OrganizationRow[] | null;
};

/**
 * GET /api/organizations
 *
 * Returns the signed-in user's active organizations for scoped selection.
 */
export async function GET(_request: NextRequest) {
  try {
    const auth = await requireApiAuth();

    if (auth instanceof NextResponse) {
      return auth;
    }

    const { supabase, user } = auth;

    const { data: memberships, error } = await supabase
      .from('organization_members')
      .select(
        `
          org:organizations (
            id,
            display_name,
            slug
          )
        `
      )
      .eq('user_id', user.id)
      .eq('state', 'active')
      .limit(100);

    if (error) {
      log.error('organizations.list.fetch_failed', {
        userId: user.id,
        error: error.message,
      });
      return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
    }

    const normalizedOrganizations = ((memberships as OrganizationMembershipRow[] | null) ?? [])
      .map((membership) => {
        const organization = Array.isArray(membership.org) ? membership.org[0] : membership.org;
        if (!organization) return null;
        return {
          id: organization.id,
          slug: organization.slug,
          displayName: organization.display_name ?? null,
          // Keep snake_case for compatibility with unknown legacy clients.
          display_name: organization.display_name ?? null,
        };
      })
      .filter(
        (organization): organization is NonNullable<typeof organization> => organization !== null
      )
      .sort((left, right) =>
        (left.displayName ?? left.slug).localeCompare(right.displayName ?? right.slug)
      );

    return NextResponse.json({ organizations: normalizedOrganizations });
  } catch (error) {
    log.error('organizations.list.unhandled_error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
