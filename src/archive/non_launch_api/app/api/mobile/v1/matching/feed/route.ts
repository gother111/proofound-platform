import { and, desc, eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { db } from '@/db';
import { assignments, matches, organizations } from '@/db/schema';
import { getInternalApiSecret } from '@/lib/api/auth';
import { requireMobileAuth } from '@/lib/api/mobile/auth';
import { mobileError, mobileSuccess } from '@/lib/api/mobile/response';
import { POST as computeMatches } from '@/app/api/core/matching/profile/route';
import {
  isWithinStaleGraceWindow,
  resolveEffectiveScoreState,
} from '@/lib/matching/match-score-contract';

export const dynamic = 'force-dynamic';

const FeedRequestSchema = z.object({
  refresh: z.boolean().optional().default(true),
  k: z.number().int().min(1).max(50).optional().default(20),
  mode: z.enum(['mission-first', 'skills-first', 'balanced']).optional(),
  useSemanticMatching: z.boolean().optional().default(true),
});

function isHiddenMatch(vector: unknown) {
  if (!vector) {
    return false;
  }

  if (typeof vector === 'string') {
    try {
      const parsed = JSON.parse(vector);
      return !!parsed?.hidden;
    } catch {
      return false;
    }
  }

  return !!(vector as { hidden?: boolean }).hidden;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireMobileAuth(request);
    if ('status' in auth) {
      return auth;
    }

    const parsed = FeedRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return mobileError(
        'validation_error',
        'Invalid matching feed payload',
        400,
        parsed.error.flatten()
      );
    }

    if (parsed.data.refresh) {
      const sharedSecret = getInternalApiSecret();
      if (sharedSecret) {
        const internalRequest = new NextRequest(
          new URL('/api/core/matching/profile', request.url),
          {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'x-internal-api-key': sharedSecret,
            },
            body: JSON.stringify({
              userId: auth.user.id,
              k: parsed.data.k,
              mode: parsed.data.mode,
              useSemanticMatching: parsed.data.useSemanticMatching,
            }),
          }
        );

        await computeMatches(internalRequest);
      }
    }

    const rows = await db
      .select({
        matchId: matches.id,
        assignmentId: assignments.id,
        score: matches.score,
        scoreTotal: matches.scoreTotal,
        scoreState: matches.scoreState,
        generatedAt: matches.generatedAt,
        staleAt: matches.staleAt,
        vector: matches.vector,
        snoozedUntil: matches.snoozedUntil,
        assignmentRole: assignments.role,
        assignmentStatus: assignments.status,
        assignmentLocationMode: assignments.locationMode,
        assignmentCountry: assignments.country,
        assignmentCompMin: assignments.compMin,
        assignmentCompMax: assignments.compMax,
        assignmentCurrency: assignments.currency,
        organizationId: organizations.id,
        organizationName: organizations.displayName,
        organizationLogoUrl: organizations.logoUrl,
      })
      .from(matches)
      .innerJoin(assignments, eq(assignments.id, matches.assignmentId))
      .innerJoin(organizations, eq(organizations.id, assignments.orgId))
      .where(eq(matches.profileId, auth.user.id))
      .orderBy(desc(matches.scoreTotal), desc(matches.score));

    const now = new Date();
    const filtered = rows
      .filter((row) => !isHiddenMatch(row.vector))
      .filter((row) => !row.snoozedUntil || row.snoozedUntil <= now)
      .filter((row) => {
        const state = resolveEffectiveScoreState({
          scoreState: row.scoreState,
          generatedAt: row.generatedAt,
          staleAt: row.staleAt,
          now,
        });
        return (
          state !== 'hidden_due_to_policy' &&
          (state !== 'stale' || isWithinStaleGraceWindow(row.staleAt, now))
        );
      })
      .slice(0, parsed.data.k);

    return mobileSuccess({
      items: filtered.map((row) => ({
        id: row.matchId,
        assignmentId: row.assignmentId,
        score: Number(row.score),
        scoreTotal: row.scoreTotal,
        scoreState: resolveEffectiveScoreState({
          scoreState: row.scoreState,
          generatedAt: row.generatedAt,
          staleAt: row.staleAt,
          now,
        }),
        assignment: {
          id: row.assignmentId,
          role: row.assignmentRole,
          status: row.assignmentStatus,
          locationMode: row.assignmentLocationMode,
          country: row.assignmentCountry,
          compMin: row.assignmentCompMin,
          compMax: row.assignmentCompMax,
          currency: row.assignmentCurrency,
        },
        organization: {
          id: row.organizationId,
          displayName: row.organizationName,
          logoUrl: row.organizationLogoUrl,
        },
      })),
      count: filtered.length,
    });
  } catch (error) {
    console.error('[mobile.matching.feed.post] failed', error);
    return mobileError('internal_error', 'Failed to load matching feed', 500);
  }
}
