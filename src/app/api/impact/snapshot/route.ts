/**
 * Legacy impact snapshot API.
 * Kept for non-launch surfaces only.
 */

import { NextResponse } from 'next/server';
import { requireApiAuthContext } from '@/lib/auth';
import { db } from '@/db';
import { impactStories, capabilities, matches, projects, verificationRequests } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { CLIENT_FF_DEFAULTS } from '@/lib/featureFlags';
import { legacySurfaceJsonResponse } from '@/lib/mvp/nonLaunch';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!CLIENT_FF_DEFAULTS.legacyMvpSurfaces) {
    return legacySurfaceJsonResponse(
      'Impact snapshot API',
      'Impact snapshot tiles are not part of the launch MVP corridor.'
    );
  }
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;

    const [
      impactStoriesResult,
      verifiedSkillsResult,
      projectsResult,
      matchesResult,
      pendingVerificationsResult,
    ] = await Promise.all([
      db
        .select({
          total: sql<number>`count(*)::int`,
          verified: sql<number>`count(*) filter (where ${impactStories.verified} = true)::int`,
        })
        .from(impactStories)
        .where(eq(impactStories.userId, user.id)),

      db
        .select({
          total: sql<number>`count(*)::int`,
          verified: sql<number>`count(*) filter (where ${capabilities.verificationStatus} = 'verified')::int`,
          pending: sql<number>`count(*) filter (where ${capabilities.verificationStatus} = 'pending')::int`,
        })
        .from(capabilities)
        .where(eq(capabilities.profileId, user.id)),

      db
        .select({
          total: sql<number>`count(*)::int`,
          verified: sql<number>`count(*) filter (where ${projects.verified} = true)::int`,
          ongoing: sql<number>`count(*) filter (where ${projects.status} = 'ongoing')::int`,
          concluded: sql<number>`count(*) filter (where ${projects.status} = 'concluded')::int`,
        })
        .from(projects)
        .where(eq(projects.userId, user.id)),

      db
        .select({
          count: sql<number>`count(*)::int`,
          avgScore: sql<number>`round(avg(${matches.score})::numeric, 2)`,
          highQualityMatches: sql<number>`count(*) filter (where ${matches.score} >= 70)::int`,
        })
        .from(matches)
        .where(eq(matches.profileId, user.id)),

      db
        .select({
          count: sql<number>`count(*)::int`,
        })
        .from(verificationRequests)
        .where(
          and(
            eq(verificationRequests.profileId, user.id),
            eq(verificationRequests.status, 'pending')
          )
        ),
    ]);

    const skillsData = verifiedSkillsResult[0] || { total: 0, verified: 0, pending: 0 };
    const storiesData = impactStoriesResult[0] || { total: 0, verified: 0 };
    const projectsData = projectsResult[0] || { total: 0, verified: 0, ongoing: 0, concluded: 0 };
    const matchesData = matchesResult[0] || { count: 0, avgScore: 0, highQualityMatches: 0 };
    const pendingData = pendingVerificationsResult[0] || { count: 0 };

    const maxSkillsScore = Math.min(skillsData.verified * 5, 40); // Max 8 verified skills = 40 points
    const maxStoriesScore = Math.min(storiesData.verified * 10, 30); // Max 3 verified stories = 30 points
    const maxProjectsScore = Math.min(projectsData.verified * 10, 30); // Max 3 verified projects = 30 points
    const impactScore = Math.round(maxSkillsScore + maxStoriesScore + maxProjectsScore);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivity = await db
      .select({
        recentStories: sql<number>`count(*) filter (where ${impactStories.createdAt} >= ${thirtyDaysAgo})::int`,
      })
      .from(impactStories)
      .where(eq(impactStories.userId, user.id));

    const activityData = recentActivity[0] || { recentStories: 0 };

    const snapshot = {
      impactScore,
      impactStories: {
        total: storiesData.total,
        verified: storiesData.verified,
      },
      skills: {
        total: skillsData.total,
        verified: skillsData.verified,
        pending: skillsData.pending,
      },
      projects: {
        total: projectsData.total,
        verified: projectsData.verified,
        ongoing: projectsData.ongoing,
        concluded: projectsData.concluded,
      },
      matches: {
        total: matchesData.count,
        averageScore: matchesData.avgScore || 0,
        highQuality: matchesData.highQualityMatches,
      },
      pendingVerifications: pendingData.count,
      recentActivity: activityData.recentStories,
      suggestions: generateSuggestions({
        verifiedSkills: skillsData.verified,
        impactStories: storiesData.total,
        verifiedProjects: projectsData.verified,
        pendingVerifications: pendingData.count,
      }),
    };

    return NextResponse.json(snapshot);
  } catch (error) {
    console.error('Failed to fetch impact snapshot:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch impact snapshot',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function generateSuggestions(data: {
  verifiedSkills: number;
  impactStories: number;
  verifiedProjects: number;
  pendingVerifications: number;
}): string[] {
  const suggestions: string[] = [];

  if (data.verifiedSkills < 3) {
    suggestions.push('Add more verified skills to strengthen your profile');
  }

  if (data.impactStories < 2) {
    suggestions.push('Share an impact story to showcase your achievements');
  }

  if (data.verifiedProjects === 0) {
    suggestions.push('Get a project verified to build credibility');
  }

  if (data.pendingVerifications > 0) {
    suggestions.push(
      `Follow up on ${data.pendingVerifications} pending verification${data.pendingVerifications > 1 ? 's' : ''}`
    );
  }

  if (suggestions.length === 0) {
    suggestions.push('Your impact profile is looking strong! Keep it up.');
  }

  return suggestions.slice(0, 3);
}
