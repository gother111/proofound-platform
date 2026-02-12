import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type VisibilityLevel = 'public' | 'post_match' | 'post_conversation_start' | 'internal_only';

type VisibilitySettings = {
  displayName: VisibilityLevel;
  mission: VisibilityLevel;
  vision: VisibilityLevel;
  causes: VisibilityLevel;
  workCulture: VisibilityLevel;
  structure: VisibilityLevel;
  projects: VisibilityLevel;
  partnerships: VisibilityLevel;
  goals: VisibilityLevel;
  impact: VisibilityLevel;
};

const DEFAULT_VISIBILITY_SETTINGS: VisibilitySettings = {
  displayName: 'public',
  mission: 'public',
  vision: 'public',
  causes: 'public',
  workCulture: 'post_match',
  structure: 'post_match',
  projects: 'post_match',
  partnerships: 'post_match',
  goals: 'post_match',
  impact: 'post_match',
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
  { client: 'workCulture', db: 'work_culture' },
  { client: 'structure', db: 'structure' },
  { client: 'projects', db: 'projects' },
  { client: 'partnerships', db: 'partnerships' },
  { client: 'goals', db: 'goals' },
  { client: 'impact', db: 'impact' },
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
    work_culture: settings.workCulture,
    structure: settings.structure,
    projects: settings.projects,
    partnerships: settings.partnerships,
    goals: settings.goals,
    impact: settings.impact,
  };
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

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching visibility settings:', error);
      return NextResponse.json({ error: 'Failed to fetch visibility settings' }, { status: 500 });
    }

    return NextResponse.json({
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

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const input =
      typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
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

    return NextResponse.json({ visibility: merged });
  } catch (error) {
    console.error('Error in visibility PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
