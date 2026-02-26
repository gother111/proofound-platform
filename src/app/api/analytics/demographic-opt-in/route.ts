import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuthContext } from '@/lib/auth';
import { db } from '@/db';
import { demographicOptIns } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const DemographicOptInSchema = z.object({
  optedIn: z.boolean(),
  gender: z.string().optional(),
  ethnicity: z.string().optional(),
  ageRange: z.string().optional(),
  disability: z.string().optional(),
  veteranStatus: z.string().optional(),
});

/**
 * GET /api/analytics/demographic-opt-in
 *
 * Get the current user's demographic opt-in status and data
 */
export async function GET() {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;

    // Fetch existing opt-in data
    const [optIn] = await db
      .select()
      .from(demographicOptIns)
      .where(eq(demographicOptIns.profileId, user.id))
      .limit(1);

    if (!optIn) {
      // Return default (not opted in)
      return NextResponse.json({
        optedIn: false,
      });
    }

    return NextResponse.json({
      optedIn: optIn.optedIn,
      gender: optIn.gender,
      ethnicity: optIn.ethnicity,
      ageRange: optIn.ageRange,
      disability: optIn.disability,
      veteranStatus: optIn.veteranStatus,
    });
  } catch (error) {
    console.error('Error fetching demographic opt-in:', error);
    return NextResponse.json({ error: 'Failed to fetch demographic opt-in' }, { status: 500 });
  }
}

/**
 * POST /api/analytics/demographic-opt-in
 *
 * Update the current user's demographic opt-in status and data
 */
export async function POST(request: NextRequest) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const body = await request.json();

    // Validate input
    const validated = DemographicOptInSchema.parse(body);

    // Check if opt-in exists
    const [existing] = await db
      .select()
      .from(demographicOptIns)
      .where(eq(demographicOptIns.profileId, user.id))
      .limit(1);

    if (existing) {
      // Update existing opt-in
      await db
        .update(demographicOptIns)
        .set({
          optedIn: validated.optedIn,
          gender: validated.optedIn ? validated.gender : null,
          ethnicity: validated.optedIn ? validated.ethnicity : null,
          ageRange: validated.optedIn ? validated.ageRange : null,
          disability: validated.optedIn ? validated.disability : null,
          veteranStatus: validated.optedIn ? validated.veteranStatus : null,
          consentedAt: validated.optedIn ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(demographicOptIns.profileId, user.id));
    } else {
      // Create new opt-in
      await db.insert(demographicOptIns).values({
        profileId: user.id,
        optedIn: validated.optedIn,
        gender: validated.optedIn ? validated.gender : null,
        ethnicity: validated.optedIn ? validated.ethnicity : null,
        ageRange: validated.optedIn ? validated.ageRange : null,
        disability: validated.optedIn ? validated.disability : null,
        veteranStatus: validated.optedIn ? validated.veteranStatus : null,
        dataUsageConsent: true,
        consentedAt: validated.optedIn ? new Date() : null,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Demographic opt-in updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }

    console.error('Error updating demographic opt-in:', error);
    return NextResponse.json({ error: 'Failed to update demographic opt-in' }, { status: 500 });
  }
}

/**
 * DELETE /api/analytics/demographic-opt-in
 *
 * Delete the current user's demographic data (opt-out completely)
 */
export async function DELETE() {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;

    await db.delete(demographicOptIns).where(eq(demographicOptIns.profileId, user.id));

    return NextResponse.json({
      success: true,
      message: 'Demographic data deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting demographic opt-in:', error);
    return NextResponse.json({ error: 'Failed to delete demographic data' }, { status: 500 });
  }
}
