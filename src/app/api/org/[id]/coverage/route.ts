/**
 * Team Coverage Analytics API
 *
 * Returns skill coverage matrix for an organization's team members.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { log } from '@/lib/log';
import { isActiveOrgMember, requireApiAuth } from '@/lib/api/auth';
import { getRows } from '@/lib/db/rows';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireApiAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id: orgId } = await params;
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const project = searchParams.get('project');

    const hasOrgAccess = await isActiveOrgMember(authResult.supabase, authResult.user.id, orgId, [
      'owner',
      'admin',
      'member',
      'viewer',
    ]);

    if (!hasOrgAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // TODO: Apply department and project filters when org structure fields are finalized.
    void department;
    void project;

    const membersResult = await db.execute(sql`
      SELECT
        p.id,
        p.display_name AS name,
        om.role,
        COALESCE(
          json_agg(
            DISTINCT COALESCE(s.skill_code, s.skill_id)
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'::json
        ) AS skills
      FROM organization_members om
      JOIN profiles p ON p.id = om.user_id
      LEFT JOIN skills s ON s.profile_id = p.id
      WHERE om.org_id = ${orgId}
        AND om.status = 'active'
      GROUP BY p.id, p.display_name, om.role
      ORDER BY p.display_name
    `);

    const teamMembers = getRows(membersResult) as Array<{
      id: string;
      name: string | null;
      role: string;
      skills: string[];
    }>;

    const coverageResult = await db.execute(sql`
      SELECT DISTINCT
        COALESCE(s.skill_code, s.skill_id) AS skill_key,
        COALESCE(st.name_i18n ->> 'en', st.slug, COALESCE(s.skill_code, s.skill_id)) AS skill_name,
        COALESCE(ss.name_i18n ->> 'en', ss.slug, 'Uncategorized') AS category_name,
        COUNT(DISTINCT s.profile_id) AS coverage_count,
        COALESCE(json_agg(DISTINCT s.profile_id), '[]'::json) AS member_ids
      FROM skills s
      JOIN organization_members om ON om.user_id = s.profile_id
      LEFT JOIN skills_taxonomy st ON st.code = s.skill_code
      LEFT JOIN skills_subcategories ss
        ON ss.cat_id = st.cat_id
       AND ss.subcat_id = st.subcat_id
      WHERE om.org_id = ${orgId}
        AND om.status = 'active'
      GROUP BY skill_key, skill_name, category_name
      ORDER BY coverage_count ASC, category_name, skill_name
    `);

    const skillCoverage = (getRows(coverageResult) as any[]).map((row) => ({
      l4_id: row.skill_key,
      l4_name: row.skill_name,
      l2_name: row.category_name,
      coverage: parseInt(row.coverage_count, 10),
      members: row.member_ids || [],
    }));

    const stats = {
      totalMembers: teamMembers.length,
      totalSkills: skillCoverage.length,
      noCoverage: skillCoverage.filter((s: any) => s.coverage === 0).length,
      singleCoverage: skillCoverage.filter((s: any) => s.coverage === 1).length,
      multipleCoverage: skillCoverage.filter((s: any) => s.coverage >= 2).length,
    };

    log.info('team-coverage.calculated', {
      userId: authResult.user.id,
      orgId,
      stats,
    });

    return NextResponse.json({
      members: teamMembers,
      skillCoverage,
      stats,
    });
  } catch (error) {
    log.error('team-coverage.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to calculate team coverage' }, { status: 500 });
  }
}
