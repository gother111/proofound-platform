/**
 * Team Coverage Analytics API
 *
 * Returns skill coverage matrix for an organization's team members.
 * PRD Reference: Part 5 O6 - Team Coverage Analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { organizationMembers, profiles, skills } from '@/db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { log } from '@/lib/log';

interface TeamMember {
  id: string;
  name: string;
  role?: string;
  skills: string[]; // L4 skill IDs
}

interface SkillCoverage {
  l4_id: string;
  l4_name: string;
  l2_name: string;
  coverage: number; // Number of team members with this skill
  members: string[]; // Member IDs who have this skill
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id: orgId } = await params;
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const project = searchParams.get('project');

    // TODO: Verify user has access to this organization

    // Get all team members
    const members = await db.execute(sql`
      SELECT 
        p.id,
        p.display_name as name,
        om.role,
        COALESCE(
          json_agg(
            DISTINCT s.l4_id
          ) FILTER (WHERE s.l4_id IS NOT NULL),
          '[]'
        ) as skills
      FROM ${organizationMembers} om
      JOIN ${profiles} p ON p.id = om.profile_id
      LEFT JOIN ${skills} s ON s.profile_id = p.id
      WHERE om.organization_id = ${orgId}
        AND om.status = 'active'
      GROUP BY p.id, p.display_name, om.role
      ORDER BY p.display_name
    `);

    const teamMembers = members.rows as any[];

    // Get all unique L4 skills across the team
    const allSkills = await db.execute(sql`
      SELECT DISTINCT
        s.l4_id,
        s.l4_name,
        s.l2_name,
        COUNT(DISTINCT s.profile_id) as coverage_count,
        json_agg(DISTINCT s.profile_id) as member_ids
      FROM ${skills} s
      JOIN ${organizationMembers} om ON om.profile_id = s.profile_id
      WHERE om.organization_id = ${orgId}
        AND om.status = 'active'
      GROUP BY s.l4_id, s.l4_name, s.l2_name
      ORDER BY coverage_count ASC, s.l2_name, s.l4_name
    `);

    const skillCoverage = allSkills.rows.map((row: any) => ({
      l4_id: row.l4_id,
      l4_name: row.l4_name,
      l2_name: row.l2_name,
      coverage: parseInt(row.coverage_count),
      members: row.member_ids || [],
    }));

    // Calculate coverage statistics
    const stats = {
      totalMembers: teamMembers.length,
      totalSkills: skillCoverage.length,
      noCoverage: skillCoverage.filter((s: any) => s.coverage === 0).length,
      singleCoverage: skillCoverage.filter((s: any) => s.coverage === 1).length,
      multipleCoverage: skillCoverage.filter((s: any) => s.coverage >= 2).length,
    };

    log.info('team-coverage.calculated', {
      userId: user.id,
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
