'use server';

import { and, eq, sql } from 'drizzle-orm';

import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { matches, verificationRecords } from '@/db/schema';
import { isMockSupabaseEnabled } from '@/lib/env';
import {
  listCanonicalProofPackAggregatesForOwner,
  summarizeCanonicalProofOwnerAggregates,
} from '@/lib/proofs/canonical-pack';

const QUALITY_MATCH_THRESHOLD = 0.8;

type MatchVector = {
  matches?: {
    highIntent?: number;
    total?: number;
  };
};

export interface DashboardMetrics {
  proofStoriesCount: number;
  verifiedSkills: number;
  pendingVerifications: number;
  qualifiedMatches: number;
  activeIntroductions: number;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const user = await requireAuth();

  if (isMockSupabaseEnabled()) {
    return {
      proofStoriesCount: 0,
      verifiedSkills: 0,
      pendingVerifications: 0,
      qualifiedMatches: 0,
      activeIntroductions: 0,
    };
  }

  const [canonicalAggregates, verificationStatsRow, matchRows] = await Promise.all([
    listCanonicalProofPackAggregatesForOwner('individual_profile', user.id),
    db
      .select({
        pending: sql<number>`count(${verificationRecords.id}) filter (where ${verificationRecords.status} = 'pending')::int`,
        verified: sql<number>`count(${verificationRecords.id}) filter (where ${verificationRecords.status} = 'verified' and ${verificationRecords.integrityStatus} = 'clear')::int`,
      })
      .from(verificationRecords)
      .where(
        and(
          eq(verificationRecords.ownerType, 'individual_profile'),
          eq(verificationRecords.ownerId, user.id)
        )
      ),
    db
      .select({
        score: matches.score,
        vector: matches.vector,
      })
      .from(matches)
      .where(eq(matches.profileId, user.id)),
  ]);

  const canonicalSummary = summarizeCanonicalProofOwnerAggregates(canonicalAggregates);
  const verifiedSkills = verificationStatsRow[0]?.verified ?? 0;
  const pendingVerifications = verificationStatsRow[0]?.pending ?? 0;

  const qualifiedMatches = matchRows.filter(
    (match) => Number(match.score) >= QUALITY_MATCH_THRESHOLD
  ).length;

  const activeIntroductions = matchRows.reduce((total, match) => {
    const vector = (match.vector as MatchVector) ?? {};
    const highIntent = Number(vector.matches?.highIntent ?? 0);
    return total + highIntent;
  }, 0);

  const proofStoriesCount = canonicalSummary.packCount;

  return {
    proofStoriesCount,
    verifiedSkills,
    pendingVerifications,
    qualifiedMatches,
    activeIntroductions,
  };
}
