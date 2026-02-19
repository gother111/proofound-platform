/**
 * Match Visible Fields API
 *
 * GET /api/match/visible-fields/[matchId] - Get fields that will be shared with org
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { profileFieldVisibility } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { log } from '@/lib/log';
import {
  PROFILE_VISIBILITY_DEFAULTS,
  type ProfileVisibilityLevel,
  isVisibleInMatchContext,
} from '@/lib/contracts/domain';

interface VisibleField {
  field: string;
  label: string;
  value: string | string[];
  isRedacted: boolean;
}

const fieldVisibilityMapping: Record<string, keyof typeof PROFILE_VISIBILITY_DEFAULTS | null> = {
  name: 'displayName',
  email: null,
  location: 'location',
  headline: 'headline',
  bio: null,
  skills: 'skills',
  values: 'values',
  causes: 'causes',
  linkedin_url: null,
};

function resolveFieldVisibility(
  field: string,
  settings: Record<string, ProfileVisibilityLevel>
): ProfileVisibilityLevel {
  const mappedKey = fieldVisibilityMapping[field];

  if (!mappedKey) {
    return 'private';
  }

  return settings[mappedKey] || 'private';
}

function toVisibilityLevel(value: string | undefined): ProfileVisibilityLevel {
  if (
    value === 'public' ||
    value === 'network_only' ||
    value === 'match_only' ||
    value === 'private'
  ) {
    return value;
  }

  return 'private';
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ matchId: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { matchId } = await params;

    // Get match details
    const match = await db.execute(sql`
      SELECT
        m.*,
        a.org_id as organization_id,
        a.role
      FROM matches m
      INNER JOIN assignments a ON m.assignment_id = a.id
      WHERE m.id = ${matchId}
        AND m.profile_id = ${user.id}
    `);

    if (!match.length) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const matchData = match[0] as any;
    const organizationId = matchData.organization_id;

    // Get user profile (basic info from profiles table)
    const userProfile = await db.execute(sql`
      SELECT display_name, avatar_url
      FROM profiles
      WHERE id = ${user.id}
    `);

    // Get individual's profile (extended info)
    const profile = await db.execute(sql`
      SELECT headline, bio, skills, location, values, causes, linkedin_profile_url
      FROM individual_profiles
      WHERE user_id = ${user.id}
    `);

    const userData = userProfile.length > 0 ? (userProfile[0] as any) : {};
    const profileData = profile.length > 0 ? (profile[0] as any) : {};

    const [visibility] = await db
      .select()
      .from(profileFieldVisibility)
      .where(eq(profileFieldVisibility.profileId, user.id))
      .limit(1);

    const resolvedVisibility: Record<string, ProfileVisibilityLevel> = {
      ...PROFILE_VISIBILITY_DEFAULTS,
      ...(visibility
        ? {
            displayName: toVisibilityLevel(visibility.displayName),
            avatar: toVisibilityLevel(visibility.avatar),
            headline: toVisibilityLevel(visibility.headline),
            location: toVisibilityLevel(visibility.location),
            mission: toVisibilityLevel(visibility.mission),
            vision: toVisibilityLevel(visibility.vision),
            values: toVisibilityLevel(visibility.values),
            causes: toVisibilityLevel(visibility.causes),
            experiences: toVisibilityLevel(visibility.experiences),
            education: toVisibilityLevel(visibility.education),
            volunteering: toVisibilityLevel(visibility.volunteering),
            skills: toVisibilityLevel(visibility.skills),
            impactStories: toVisibilityLevel(visibility.impactStories),
          }
        : {}),
    };

    // Define all profile fields with their labels using correct column names
    const allFields = [
      { field: 'name', label: 'Name', value: userData.display_name },
      { field: 'email', label: 'Email', value: user.email },
      { field: 'location', label: 'Location', value: profileData.location },
      {
        field: 'headline',
        label: 'Professional Headline',
        value: profileData.headline,
      },
      { field: 'bio', label: 'Biography', value: profileData.bio },
      { field: 'skills', label: 'Skills', value: profileData.skills || [] },
      { field: 'values', label: 'Core Values', value: profileData.values || [] },
      { field: 'causes', label: 'Causes', value: profileData.causes || [] },
      {
        field: 'linkedin_url',
        label: 'LinkedIn',
        value: profileData.linkedin_profile_url || 'Not provided',
      },
    ];

    // Filter out empty fields and apply visibility settings
    const visibleFields: VisibleField[] = allFields
      .filter((f) => {
        if (!f.value) return false;
        if (Array.isArray(f.value) && f.value.length === 0) return false;
        if (f.value === 'Not specified' || f.value === 'Not provided') return false;
        return true;
      })
      .map((f) => {
        const visibilityLevel = resolveFieldVisibility(f.field, resolvedVisibility);
        const isVisible = isVisibleInMatchContext(visibilityLevel);

        return {
          field: f.field,
          label: f.label,
          value: f.value,
          isRedacted: !isVisible,
        };
      });

    // Get organization details
    const org = await db.execute(sql`
      SELECT display_name
      FROM organizations
      WHERE id = ${organizationId}
    `);

    const organizationName = org.length > 0 ? (org[0] as any).display_name : 'the organization';

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
