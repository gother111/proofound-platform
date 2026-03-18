import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { computePortfolioPublicationState } from '@/lib/proof-trust/snapshots';
import { revalidatePublicOrganizationPortfolioById } from '@/lib/portfolio/public-invalidation';
import { resolveRequestedPublicPortfolioState } from '@/lib/portfolio/public-contract';
import { and, eq } from 'drizzle-orm';
import { portfolioPublicationStates } from '@/db/schema';
import { normalizeAuthorizedOrgRole } from '@/lib/authz';

type VisibilityLevel = 'public' | 'post_match' | 'post_conversation_start' | 'internal_only';

type VisibilitySettings = {
  displayName: VisibilityLevel;
  mission: VisibilityLevel;
  vision: VisibilityLevel;
  causes: VisibilityLevel;
};

const DEFAULT_VISIBILITY_SETTINGS: VisibilitySettings = {
  displayName: 'public',
  mission: 'public',
  vision: 'public',
  causes: 'public',
};

const VALID_LEVELS: ReadonlySet<string> = new Set([
  'public',
  'post_match',
  'post_conversation_start',
  'internal_only',
]);

const FIELD_MAP: Array<{ client: keyof VisibilitySettings; db: string }> = [
  { client: 'displayName', db: 'display_name' },
  { client: 'mission', db: 'mission' },
  { client: 'vision', db: 'vision' },
  { client: 'causes', db: 'causes' },
];

function mapRowToClientVisibility(
  row: Record<string, unknown> | null | undefined
): VisibilitySettings {
  if (!row) {
    return { ...DEFAULT_VISIBILITY_SETTINGS };
  }

  const mapped = { ...DEFAULT_VISIBILITY_SETTINGS };

  for (const field of FIELD_MAP) {
    const raw = row[field.client] ?? row[field.db];
    if (typeof raw === 'string' && VALID_LEVELS.has(raw)) {
      mapped[field.client] = raw as VisibilityLevel;
    }
  }

  return mapped;
}

function parseIncomingVisibility(input: Record<string, unknown>): {
  partial: Partial<VisibilitySettings>;
  invalidField: string | null;
} {
  const partial: Partial<VisibilitySettings> = {};

  for (const field of FIELD_MAP) {
    const raw = input[field.client] ?? input[field.db];
    if (raw === undefined) {
      continue;
    }
    if (typeof raw !== 'string' || !VALID_LEVELS.has(raw)) {
      return { partial: {}, invalidField: field.client };
    }
    partial[field.client] = raw as VisibilityLevel;
  }

  return { partial, invalidField: null };
}

function mapClientToDbVisibility(settings: VisibilitySettings): Record<string, string> {
  return {
    display_name: settings.displayName,
    mission: settings.mission,
    vision: settings.vision,
    causes: settings.causes,
  };
}

function canManageVisibility(role: string | null | undefined) {
  return normalizeAuthorizedOrgRole(role) === 'org_owner';
}

/**
 * GET /api/organizations/[orgId]/visibility
 *
 * Fetch visibility settings for an organization.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: visibility, error } = await supabase
      .from('organization_field_visibility')
      .select('*')
      .eq('org_id', orgId)
      .single();

    const { data: organization } = await supabase
      .from('organizations')
      .select('public_portfolio_state, search_indexing_enabled_at')
      .eq('id', orgId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching visibility settings:', error);
      return NextResponse.json({ error: 'Failed to fetch visibility settings' }, { status: 500 });
    }

    const requestedState = resolveRequestedPublicPortfolioState(
      (organization as { public_portfolio_state?: string | null } | null)?.public_portfolio_state
    );

    return NextResponse.json({
      publicPageEnabled: requestedState !== 'unavailable',
      searchIndexingEnabled: Boolean(
        (organization as { search_indexing_enabled_at?: string | null } | null)
          ?.search_indexing_enabled_at
      ),
      visibility: mapRowToClientVisibility(visibility as Record<string, unknown> | null),
    });
  } catch (error) {
    console.error('Error in visibility GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/organizations/[orgId]/visibility
 *
 * Update visibility settings for an organization.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .single();

    if (!membership || !canManageVisibility(membership.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const input =
      typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
    const publicPageEnabled =
      typeof input.publicPageEnabled === 'boolean' ? input.publicPageEnabled : true;
    const searchIndexingEnabled =
      typeof input.searchIndexingEnabled === 'boolean' ? input.searchIndexingEnabled : false;
    const { partial, invalidField } = parseIncomingVisibility(input);

    if (invalidField) {
      return NextResponse.json(
        { error: `Invalid visibility level for ${invalidField}` },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from('organization_field_visibility')
      .select('*')
      .eq('org_id', orgId)
      .single();

    const current = mapRowToClientVisibility(existing as Record<string, unknown> | null);
    const merged: VisibilitySettings = {
      ...current,
      ...partial,
    };

    const dbPayload = mapClientToDbVisibility(merged);
    const previousPublicationState = await db.query.portfolioPublicationStates.findFirst({
      where: and(
        eq(portfolioPublicationStates.subjectType, 'organization'),
        eq(portfolioPublicationStates.subjectId, orgId)
      ),
    });

    if (existing) {
      const { error } = await supabase
        .from('organization_field_visibility')
        .update({
          ...dbPayload,
          updated_at: new Date().toISOString(),
        })
        .eq('org_id', orgId)
        .select()
        .single();

      if (error) {
        console.error('Error updating visibility settings:', error);
        return NextResponse.json(
          { error: 'Failed to update visibility settings' },
          { status: 500 }
        );
      }
    } else {
      const { error } = await supabase
        .from('organization_field_visibility')
        .insert({
          org_id: orgId,
          ...dbPayload,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating visibility settings:', error);
        return NextResponse.json(
          { error: 'Failed to create visibility settings' },
          { status: 500 }
        );
      }
    }

    const organizationUpdate = await supabase
      .from('organizations')
      .update({
        public_portfolio_state: publicPageEnabled
          ? searchIndexingEnabled
            ? 'public_indexable'
            : 'public_link_only'
          : 'unavailable',
        search_indexing_enabled_at: searchIndexingEnabled ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orgId);

    if (organizationUpdate.error) {
      console.error('Error updating org publication settings:', organizationUpdate.error);
      return NextResponse.json(
        { error: 'Failed to update organization visibility settings' },
        { status: 500 }
      );
    }

    const publication = await computePortfolioPublicationState('organization', orgId);
    await revalidatePublicOrganizationPortfolioById(orgId);

    return NextResponse.json({
      publicPageEnabled,
      searchIndexingEnabled,
      visibility: merged,
      publication,
      publicationChanged:
        previousPublicationState?.publicationState !== publication.publicationState ||
        previousPublicationState?.indexingState !== publication.indexingState,
    });
  } catch (error) {
    console.error('Error in visibility PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
