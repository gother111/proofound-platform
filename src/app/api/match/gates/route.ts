/**
 * Verification Gates Check API
 *
 * POST /api/match/gates
 * Checks if user meets verification requirements for an assignment
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuthContext } from '@/lib/auth';
import { checkVerificationGates } from '@/lib/verification/gates';
import { log } from '@/lib/log';

export async function POST(request: NextRequest) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const body = await request.json();
    const { assignmentId } = body;

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID required' }, { status: 400 });
    }

    // Check verification gates
    const result = await checkVerificationGates(user.id, assignmentId);

    log.info('match.gates.checked', {
      userId: user.id,
      assignmentId,
      passed: result.passed,
    });

    return NextResponse.json(result);
  } catch (error) {
    log.error('match.gates.check.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to check verification gates' }, { status: 500 });
  }
}
