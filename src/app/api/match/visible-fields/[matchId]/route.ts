/**
 * Match Visible Fields API
 *
 * GET /api/match/visible-fields/[matchId] - Get fields that will be shared with org
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { log } from '@/lib/log';

interface VisibleField {
  field: string;
  label: string;
  value: string | string[];
  isRedacted: boolean;
}

export async function GET(req: NextRequest, { params }: { params: { matchId: string } }) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { matchId } = params;

    // Get match details
    const match = await db.execute(sql`
      SELECT
        m.*,
        a.organization_id,
        a.role
      FROM matches m
      INNER JOIN assignments a ON m.assignment_id = a.id
      WHERE m.id = ${matchId}
        AND m.individual_id = ${user.id}
    `);

    if (!match.rows.length) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const matchData = match.rows[0] as any;
    const organizationId = matchData.organization_id;

    // Get individual's profile
    const profile = await db.execute(sql`
      SELECT *
      FROM individual_profiles
      WHERE user_id = ${user.id}
    `);

    if (!profile.rows.length) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const profileData = profile.rows[0] as any;

    // Get field visibility settings
    const visibility = await db.execute(sql`
      SELECT field_name, is_visible
      FROM profile_field_visibility
      WHERE user_id = ${user.id}
    `);

    const visibilityMap = new Map(
      visibility.rows.map((row: any) => [row.field_name, row.is_visible])
    );

    // Define all profile fields with their labels
    const allFields = [
      { field: 'name', label: 'Name', value: profileData.name },
      { field: 'email', label: 'Email', value: profileData.email },
      { field: 'phone', label: 'Phone', value: profileData.phone },
      { field: 'location', label: 'Location', value: profileData.location },
      {
        field: 'headline',
        label: 'Professional Headline',
        value: profileData.headline,
      },
      { field: 'bio', label: 'Biography', value: profileData.bio },
      { field: 'skills', label: 'Skills', value: profileData.skills || [] },
      {
        field: 'experience',
        label: 'Years of Experience',
        value: profileData.years_of_experience?.toString() || 'Not specified',
      },
      {
        field: 'education',
        label: 'Education',
        value: profileData.education || [],
      },
      {
        field: 'languages',
        label: 'Languages',
        value: profileData.languages || [],
      },
      { field: 'values', label: 'Core Values', value: profileData.values || [] },
      { field: 'causes', label: 'Causes', value: profileData.causes || [] },
      {
        field: 'availability',
        label: 'Availability',
        value: profileData.availability || 'Not specified',
      },
      {
        field: 'compensation',
        label: 'Compensation Expectations',
        value: profileData.compensation_expectations || 'Not specified',
      },
      {
        field: 'work_authorization',
        label: 'Work Authorization',
        value: profileData.work_authorization || 'Not specified',
      },
      {
        field: 'portfolio_url',
        label: 'Portfolio',
        value: profileData.portfolio_url || 'Not provided',
      },
      {
        field: 'github_url',
        label: 'GitHub',
        value: profileData.github_url || 'Not provided',
      },
      {
        field: 'linkedin_url',
        label: 'LinkedIn',
        value: profileData.linkedin_url || 'Not provided',
      },
    ];

    // Filter out empty fields and apply visibility settings
    const visibleFields: VisibleField[] = allFields
      .filter((f) => {
        // Filter out empty/null values
        if (!f.value) return false;
        if (Array.isArray(f.value) && f.value.length === 0) return false;
        if (f.value === 'Not specified' || f.value === 'Not provided') return false;
        return true;
      })
      .map((f) => {
        const isVisible = visibilityMap.get(f.field) ?? true; // Default visible
        return {
          field: f.field,
          label: f.label,
          value: f.value,
          isRedacted: !isVisible,
        };
      });

    // Get organization details
    const org = await db.execute(sql`
      SELECT name
      FROM organizations
      WHERE id = ${organizationId}
    `);

    const organizationName = org.rows.length > 0 ? (org.rows[0] as any).name : 'the organization';

    log.info('match.visible_fields.retrieved', {
      userId: user.id,
      matchId,
      visibleCount: visibleFields.filter((f) => !f.isRedacted).length,
      totalCount: visibleFields.length,
    });

    return NextResponse.json({
      matchId,
      organizationName,
      assignmentRole: matchData.role,
      visibleFields,
    });
  } catch (error) {
    log.error('match.visible_fields.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: 'Failed to get visible fields' }, { status: 500 });
  }
}
