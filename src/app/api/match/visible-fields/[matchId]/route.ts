/**
 * Match Visible Fields API
 *
 * GET /api/match/visible-fields/[matchId]
 *
 * Returns the fields that would be shared with the organization if the user proceeds.
 * This is used to power the consent dialog on the individual matching feed.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import {
  assignments,
  individualProfiles,
  matches,
  organizations,
  profileFieldVisibility,
  profiles,
} from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { log } from '@/lib/log';

interface VisibleField {
  field: string;
  label: string;
  value: string | string[];
  isRedacted: boolean;
}

function isVisibleInMatch(level: unknown): boolean {
  // profile_field_visibility uses: public / network_only / match_only / private
  return level !== 'private';
}

function normalizeStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input.map((v) => (typeof v === 'string' ? v : null)).filter((v): v is string => !!v);
}

function normalizeValues(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((v) => {
      if (typeof v === 'string') return v;
      if (v && typeof v === 'object' && 'label' in v && typeof (v as any).label === 'string') {
        return (v as any).label as string;
      }
      return null;
    })
    .filter((v): v is string => !!v);
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ matchId: string }> }) {
  try {
    const user = await requireAuth();
    const { matchId } = await params;

    const rows = await db
      .select({
        match: matches,
        assignment: assignments,
        organization: organizations,
      })
      .from(matches)
      .innerJoin(assignments, eq(matches.assignmentId, assignments.id))
      .innerJoin(organizations, eq(assignments.orgId, organizations.id))
      .where(and(eq(matches.id, matchId), eq(matches.profileId, user.id)))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const { assignment, organization } = rows[0];

    const [userProfile, individualProfile, visibility] = await Promise.all([
      db.query.profiles.findFirst({ where: eq(profiles.id, user.id) }),
      db.query.individualProfiles.findFirst({ where: eq(individualProfiles.userId, user.id) }),
      db.query.profileFieldVisibility.findFirst({
        where: eq(profileFieldVisibility.profileId, user.id),
      }),
    ]);

    const displayName = userProfile?.displayName || userProfile?.handle || '';
    const headline = individualProfile?.headline || '';
    const location = individualProfile?.location || '';
    const mission = (individualProfile as any)?.mission || '';
    const vision = (individualProfile as any)?.vision || '';
    const skills = normalizeStringArray((individualProfile as any)?.skills);
    const causes = normalizeStringArray((individualProfile as any)?.causes);
    const values = normalizeValues((individualProfile as any)?.values);

    const allFields: Array<{
      field: string;
      label: string;
      value: string | string[];
      visibilityLevel: unknown;
    }> = [
      {
        field: 'name',
        label: 'Name',
        value: displayName,
        visibilityLevel: visibility?.displayName,
      },
      {
        field: 'headline',
        label: 'Professional Headline',
        value: headline,
        visibilityLevel: visibility?.headline,
      },
      {
        field: 'location',
        label: 'Location',
        value: location,
        visibilityLevel: visibility?.location,
      },
      {
        field: 'mission',
        label: 'Mission',
        value: mission,
        visibilityLevel: visibility?.mission,
      },
      {
        field: 'vision',
        label: 'Vision',
        value: vision,
        visibilityLevel: visibility?.vision,
      },
      {
        field: 'skills',
        label: 'Skills',
        value: skills,
        visibilityLevel: visibility?.skills,
      },
      {
        field: 'values',
        label: 'Core Values',
        value: values,
        visibilityLevel: visibility?.values,
      },
      {
        field: 'causes',
        label: 'Causes',
        value: causes,
        visibilityLevel: visibility?.causes,
      },
    ];

    const visibleFields: VisibleField[] = allFields
      .filter((f) => {
        if (!f.value) return false;
        if (Array.isArray(f.value) && f.value.length === 0) return false;
        return true;
      })
      .map((f) => {
        const isVisible = isVisibleInMatch(f.visibilityLevel);
        return {
          field: f.field,
          label: f.label,
          value: isVisible ? f.value : Array.isArray(f.value) ? [] : 'Hidden',
          isRedacted: !isVisible,
        };
      });

    log.info('match.visible_fields.retrieved', {
      userId: user.id,
      matchId,
      visibleCount: visibleFields.filter((f) => !f.isRedacted).length,
      totalCount: visibleFields.length,
    });

    return NextResponse.json({
      matchId,
      organizationName: organization.displayName,
      assignmentRole: assignment.role,
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
