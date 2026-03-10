'use server';

import { eq } from 'drizzle-orm';

import { calculateProfileCompletion } from '@/lib/profileStorage';
import { getProfileData } from '@/actions/profile';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { capabilities, matches } from '@/db/schema';

const QUALITY_MATCH_THRESHOLD = 0.8;

type MatchVector = {
  matches?: {
    highIntent?: number;
    total?: number;
  };
};

export interface DashboardMetrics {
  portfolioReadinessPercent: number;
  proofStoriesCount: number;
  verifiedSkills: number;
  pendingVerifications: number;
  qualifiedMatches: number;
  activeIntroductions: number;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const user = await requireAuth();

  const profileDataPromise = getProfileData();

  const [capabilitiesRows, matchRows, profileData] = await Promise.all([
    db
      .select({
        verificationStatus: capabilities.verificationStatus,
      })
      .from(capabilities)
      .where(eq(capabilities.profileId, user.id)),
    db
      .select({
        score: matches.score,
        vector: matches.vector,
      })
      .from(matches)
      .where(eq(matches.profileId, user.id)),
    profileDataPromise,
  ]);

  const verifiedSkills = capabilitiesRows.filter(
    (capability) => capability.verificationStatus === 'verified'
  ).length;

  const pendingVerifications = capabilitiesRows.filter(
    (capability) => capability.verificationStatus === 'pending'
  ).length;

  const qualifiedMatches = matchRows.filter(
    (match) => Number(match.score) >= QUALITY_MATCH_THRESHOLD
  ).length;

  const activeIntroductions = matchRows.reduce((total, match) => {
    const vector = (match.vector as MatchVector) ?? {};
    const highIntent = Number(vector.matches?.highIntent ?? 0);
    return total + highIntent;
  }, 0);

  const portfolioReadinessPercent = calculateProfileCompletion(profileData);
  const proofStoriesCount = profileData.impactStories.length;

  return {
    portfolioReadinessPercent,
    proofStoriesCount,
    verifiedSkills,
    pendingVerifications,
    qualifiedMatches,
    activeIntroductions,
  };
}
