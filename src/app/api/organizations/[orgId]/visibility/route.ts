import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/organizations/[orgId]/visibility
 * 
 * Fetch visibility settings for an organization
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const supabase = await createClient();

    // Verify user has access
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check membership
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch visibility settings
    const { data: visibility, error } = await supabase
      .from('organization_field_visibility')
      .select('*')
      .eq('org_id', orgId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Error fetching visibility settings:', error);
      return NextResponse.json({ error: 'Failed to fetch visibility settings' }, { status: 500 });
    }

    // Return defaults if no settings exist yet
    if (!visibility) {
      return NextResponse.json({
        visibility: {
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
        },
      });
    }

    return NextResponse.json({ visibility });
  } catch (error) {
    console.error('Error in visibility GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/organizations/[orgId]/visibility
 * 
 * Update visibility settings for an organization
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const supabase = await createClient();

    // Verify user has permissions
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check membership (owner or admin can modify)
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .single();

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const settings = await request.json();

    // Validate visibility levels
    const validLevels = ['public', 'post_match', 'post_conversation_start', 'internal_only'];
    const requiredFields = [
      'displayName',
      'mission',
      'vision',
      'causes',
      'workCulture',
      'structure',
      'projects',
      'partnerships',
      'goals',
      'impact',
    ];

    for (const field of requiredFields) {
      if (settings[field] && !validLevels.includes(settings[field])) {
        return NextResponse.json(
          { error: `Invalid visibility level for ${field}` },
          { status: 400 }
        );
      }
    }

    // Check if settings exist
    const { data: existing } = await supabase
      .from('organization_field_visibility')
      .select('id')
      .eq('org_id', orgId)
      .single();

    let result;
    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('organization_field_visibility')
        .update({
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
          updated_at: new Date().toISOString(),
        })
        .eq('org_id', orgId)
        .select()
        .single();

      if (error) {
        console.error('Error updating visibility settings:', error);
        return NextResponse.json({ error: 'Failed to update visibility settings' }, { status: 500 });
      }

      result = data;
    } else {
      // Create new
      const { data, error } = await supabase
        .from('organization_field_visibility')
        .insert({
          org_id: orgId,
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
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating visibility settings:', error);
        return NextResponse.json({ error: 'Failed to create visibility settings' }, { status: 500 });
      }

      result = data;
    }

    return NextResponse.json({ visibility: result });
  } catch (error) {
    console.error('Error in visibility PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

