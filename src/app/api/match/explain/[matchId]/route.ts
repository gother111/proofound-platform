/**
 * Match Explanation API
 *
 * GET /api/match/explain/[matchId]
 *
 * Returns a breakdown used by the Match Explainer Modal.
 * The data is derived from the stored `matches` row plus current assignment/profile data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { assignments, matchingProfiles, matches, organizationMembers, skills } from '@/db/schema';
import { and, desc, eq } from 'drizzle-orm';

function jaccard(a: string[], b: string[]): number {
  const A = new Set(a);
  const B = new Set(b);
  if (A.size === 0 && B.size === 0) return 0;
  let inter = 0;
  for (const v of A) {
    if (B.has(v)) inter += 1;
  }
  const union = new Set([...A, ...B]).size;
  return union === 0 ? 0 : inter / union;
}

function overlap<T extends string>(a: T[], b: T[]): T[] {
  const B = new Set(b);
  return a.filter((v) => B.has(v));
}

function toNumber(input: unknown, fallback = 0): number {
  const n = typeof input === 'number' ? input : typeof input === 'string' ? Number(input) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

function average(values: number[]): number {
  if (values.length === 0) return 1;
  const total = values.reduce((sum, v) => sum + v, 0);
  return total / values.length;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ matchId: string }> }) {
  const user = await requireAuth();
  const { matchId } = await params;

  if (!matchId) {
    return NextResponse.json({ error: 'Match ID required' }, { status: 400 });
  }

  // Fetch match and assignment
  const rows = await db
    .select({
      match: matches,
      assignment: assignments,
    })
    .from(matches)
    .innerJoin(assignments, eq(matches.assignmentId, assignments.id))
    .where(eq(matches.id, matchId))
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  }

  const { match, assignment } = rows[0];

  // Authorization: candidate or org member for the owning org can view explanation.
  if (match.profileId !== user.id) {
    const membership = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.userId, user.id),
        eq(organizationMembers.orgId, assignment.orgId),
        eq(organizationMembers.status, 'active')
      ),
    });

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
  }

  const candidateId = match.profileId;

  const [candidateMatchingProfile, candidateSkills] = await Promise.all([
    db.query.matchingProfiles.findFirst({ where: eq(matchingProfiles.profileId, candidateId) }),
    db.query.skills.findMany({ where: eq(skills.profileId, candidateId) }),
  ]);

  const skillsById: Record<string, { level: number }> = {};
  for (const s of candidateSkills) {
    skillsById[s.skillId] = { level: s.level };
  }

  const mustHave = ((assignment.mustHaveSkills as any[]) || []) as Array<{
    id: string;
    level: number;
  }>;
  const niceToHave = ((assignment.niceToHaveSkills as any[]) || []) as Array<{
    id: string;
    level?: number;
  }>;

  const skillsMatch = {
    required: mustHave.map((req) => {
      const yourLevel = skillsById[req.id]?.level ?? 0;
      return {
        skillName: req.id,
        requiredLevel: req.level ?? 0,
        yourLevel,
        met: yourLevel >= (req.level ?? 0),
      };
    }),
    nice: niceToHave.map((nice) => {
      const yourLevel = skillsById[nice.id]?.level ?? 0;
      return {
        skillName: nice.id,
        desiredLevel: nice.level,
        yourLevel,
        met: skillsById[nice.id] !== undefined,
      };
    }),
  };

  const candidateValues = ((candidateMatchingProfile?.valuesTags as any) || []) as string[];
  const candidateCauses = ((candidateMatchingProfile?.causeTags as any) || []) as string[];
  const assignmentValues = (assignment.valuesRequired || []) as string[];
  const assignmentCauses = (assignment.causeTags || []) as string[];

  const sharedValues = overlap(candidateValues, assignmentValues);
  const sharedCauses = overlap(candidateCauses, assignmentCauses);

  const valuesOverlap = jaccard(candidateValues, assignmentValues);
  const causesOverlap = jaccard(candidateCauses, assignmentCauses);

  // Subscores are stored in match.vector.subscores.
  const vector = (match.vector as any) || {};
  const subs = (vector.subscores as Record<string, unknown>) || {};

  const constraintsScore = average(
    [subs.location, subs.compensation, subs.availability, subs.language]
      .map((v) => toNumber(v, NaN))
      .filter((v) => Number.isFinite(v))
  );

  // Rank within candidate pool for this assignment, based on stored matches.
  const all = await db
    .select({ id: matches.id })
    .from(matches)
    .where(eq(matches.assignmentId, assignment.id))
    .orderBy(desc(matches.score), desc(matches.createdAt));

  const rank = all.findIndex((m) => m.id === matchId) + 1;
  const totalCandidates = all.length;

  let rankBand: string | undefined;
  if (rank > 0) {
    if (rank <= 5) rankBand = 'Top 5';
    else if (rank <= 10) rankBand = 'Top 10';
    else if (rank <= 20) rankBand = 'Top 20';
  }

  const pac = {
    valuesOverlap,
    causesOverlap,
    sharedValues,
    sharedCauses,
    totalValues: new Set([...candidateValues, ...assignmentValues]).size,
    totalCauses: new Set([...candidateCauses, ...assignmentCauses]).size,
  };

  const constraints = {
    location: {
      match:
        assignment.locationMode === null ||
        assignment.locationMode === undefined ||
        assignment.locationMode === 'remote' ||
        !candidateMatchingProfile?.workMode ||
        candidateMatchingProfile?.workMode === assignment.locationMode,
      details: assignment.locationMode || 'Not specified',
    },
    salary: {
      match:
        assignment.compMin === null ||
        assignment.compMax === null ||
        candidateMatchingProfile?.compMin === null ||
        candidateMatchingProfile?.compMax === null ||
        (assignment.compMax ?? 0) >= (candidateMatchingProfile?.compMin ?? 0),
      details:
        assignment.compMin !== null && assignment.compMax !== null
          ? `${assignment.currency || 'USD'} ${assignment.compMin}-${assignment.compMax}`
          : 'Not specified',
    },
    hours: {
      match:
        assignment.hoursMin === null ||
        assignment.hoursMax === null ||
        candidateMatchingProfile?.hoursMin === null ||
        candidateMatchingProfile?.hoursMax === null ||
        (candidateMatchingProfile?.hoursMax ?? 0) >= (assignment.hoursMin ?? 0),
      details:
        assignment.hoursMin !== null && assignment.hoursMax !== null
          ? `${assignment.hoursMin}-${assignment.hoursMax} hours/week`
          : 'Not specified',
    },
    workMode: {
      match:
        !assignment.locationMode ||
        !candidateMatchingProfile?.workMode ||
        assignment.locationMode === candidateMatchingProfile?.workMode,
      details: assignment.locationMode || 'Not specified',
    },
  };

  return NextResponse.json({
    matchId: match.id,
    compositeScore: toNumber(match.score, 0),
    rank,
    totalCandidates,
    rankBand,
    subscores: {
      skills: toNumber(subs.skills, 0),
      pac: toNumber(subs.pac, toNumber(subs.values, 0) * 0.5 + toNumber(subs.causes, 0) * 0.5),
      constraints: constraintsScore,
      recency: toNumber(subs.recency, 0),
      evidence: toNumber(subs.evidence, 0),
    },
    skillsMatch,
    pac,
    constraints,
  });
}
