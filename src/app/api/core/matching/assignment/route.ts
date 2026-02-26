import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/db';
import { assignments, organizationMembers } from '@/db/schema';
import { requireApiAuthContext } from '@/lib/auth';
import { computeAssignmentMatches } from '@/lib/core/matching/assignmentMatcher';
import { getPreset, normalizeWeights, type PresetKey } from '@/lib/core/matching/presets';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

// Validation schema
const MatchRequestSchema = z.object({
  assignmentId: z.string().uuid(),
  weights: z.record(z.number()).optional(),
  mode: z.enum(['mission-first', 'skills-first', 'balanced']).optional(),
  k: z.number().positive().max(100).optional(), // Top k results
  useTwoStage: z.boolean().optional(), // Enable two-stage matching (ANN + re-rank)
  annLimit: z.number().positive().max(1000).optional(), // Stage-1 ANN retrieval limit
});

/**
 * POST /api/match/assignment
 *
 * Computes matches for an assignment.
 * Returns top k matching profiles (blind-first, PII scrubbed).
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const body = await request.json();

    const validatedData = MatchRequestSchema.parse(body);
    const { assignmentId, mode, k = 20, useTwoStage = false, annLimit = 500 } = validatedData;

    const assignment = await db.query.assignments.findFirst({
      where: eq(assignments.id, assignmentId),
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const membership = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.userId, user.id),
        eq(organizationMembers.orgId, assignment.orgId),
        eq(organizationMembers.status, 'active')
      ),
    });

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const weights = validatedData.weights
      ? normalizeWeights(validatedData.weights)
      : mode
        ? getPreset(mode as PresetKey)
        : getPreset('balanced');

    const { items, meta } = await computeAssignmentMatches({
      assignmentId,
      assignment,
      weights,
      k,
      useTwoStage,
      annLimit,
      startTime,
    });

    return NextResponse.json({ items, meta });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }

    log.error('match.assignment.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to compute matches' }, { status: 500 });
  }
}
