import { NextRequest, NextResponse } from 'next/server';
import { authorize, type OrgRole } from '@/lib/authz';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/organizations/[orgId]/structure/export
 *
 * Export organizational structure as JSON file
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

    // Check membership and canonical export authorization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    const orgRole = (membership?.role as OrgRole | undefined) ?? null;
    if (
      !authorize({
        resource: 'exports',
        action: 'export',
        orgRole,
      }).allowed
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch organization info
    const { data: org } = await supabase
      .from('organizations')
      .select('display_name, slug')
      .eq('id', orgId)
      .single();

    // Fetch structure
    const { data: structure, error } = await supabase
      .from('organization_structure')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching structure for export:', error);
      return NextResponse.json({ error: 'Failed to export structure' }, { status: 500 });
    }

    // Build hierarchical structure
    const buildHierarchy = (items: any[], parentId: string | null = null): any[] => {
      return items
        .filter((item) => item.parent_id === parentId)
        .map((item) => ({
          id: item.id,
          entityType: item.entity_type,
          name: item.name,
          description: item.description,
          teamSize: item.team_size,
          focusArea: item.focus_area,
          children: buildHierarchy(items, item.id),
        }));
    };

    const hierarchy = buildHierarchy(structure || []);

    // Create export data
    const exportData = {
      organization: {
        id: orgId,
        name: org?.display_name,
        slug: org?.slug,
      },
      exportedAt: new Date().toISOString(),
      exportedBy: user.email,
      structure: {
        flat: (structure || []).map((item) => ({
          id: item.id,
          entityType: item.entity_type,
          name: item.name,
          description: item.description,
          teamSize: item.team_size,
          focusArea: item.focus_area,
          parentId: item.parent_id,
        })),
        hierarchical: hierarchy,
      },
      metadata: {
        totalEntities: structure?.length || 0,
        entityTypes: {
          executive_team: structure?.filter((s) => s.entity_type === 'executive_team').length || 0,
          department: structure?.filter((s) => s.entity_type === 'department').length || 0,
          team: structure?.filter((s) => s.entity_type === 'team').length || 0,
          working_group: structure?.filter((s) => s.entity_type === 'working_group').length || 0,
        },
      },
    };

    // Return as JSON file download
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });

    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="org-structure-${org?.slug || orgId}-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('Error in structure export:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
