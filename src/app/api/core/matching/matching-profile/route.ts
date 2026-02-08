import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { matchingProfiles, skills, individualProfiles } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { log } from '@/lib/log';
import { emitProfileActivated } from '@/lib/analytics/events';

export const dynamic = 'force-dynamic';

/**
 * Track if profile was already activated (to avoid duplicate events)
 */
const activatedProfiles = new Set<string>();

/**
 * Check if profile meets PRD-strict activation criteria and emit event
 */
async function checkAndEmitProfileActivation(userId: string): Promise<void> {
  if (activatedProfiles.has(userId)) return;

  try {
    const [profile] = await db
      .select()
      .from(individualProfiles)
      .where(eq(individualProfiles.userId, userId))
      .limit(1);

    if (!profile) return;

    const hasPurposeBlock = !!profile.mission && !!profile.vision;
    if (!hasPurposeBlock) return;

    const skillsCountRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(skills)
      .where(eq(skills.profileId, userId));

    const l4SkillsCount = skillsCountRows[0]?.count ?? 0;
    const hasMinimumL4Count = l4SkillsCount >= 10;
    if (!hasMinimumL4Count) return;

    const [matchingProfile] = await db
      .select()
      .from(matchingProfiles)
      .where(eq(matchingProfiles.profileId, userId))
      .limit(1);

    if (!matchingProfile) return;

    let completionScore = 30 + 40 + 30; // All criteria met = 100

    // Use 0 for duration since we don't track when activation started
    await emitProfileActivated(userId, 0, {
      completionScore,
      hasMinimumL4Count,
      l4SkillsCount,
      hasPurposeBlock,
      hasMatchingProfile: true,
    });

    activatedProfiles.add(userId);
  } catch (error) {
    log.error('profile-activation-check.failed', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Validation schemas
const LanguageSchema = z.object({
  code: z.string(),
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
});

const SkillInputSchema = z.object({
  skillId: z.string(),
  level: z.number().min(0).max(5),
  monthsExperience: z.number().min(0),
});

const MatchingProfileSchema = z.object({
  valuesTags: z.array(z.string()).optional(),
  causeTags: z.array(z.string()).optional(),
  timezone: z.string().optional(),
  languages: z.array(LanguageSchema).optional(),
  verified: z.record(z.boolean()).optional(),
  rightToWork: z.enum(['yes', 'no', 'conditional']).optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  availabilityEarliest: z.string().optional(), // ISO date string
  availabilityLatest: z.string().optional(),
  workMode: z.enum(['remote', 'onsite', 'hybrid']).optional(),
  radiusKm: z.number().optional(),
  hoursMin: z.number().optional(),
  hoursMax: z.number().optional(),
  compMin: z.number().optional(),
  compMax: z.number().optional(),
  currency: z.string().optional(),
  weights: z.record(z.number()).optional(),
  skills: z.array(SkillInputSchema).optional(),
});

/**
 * GET /api/matching-profile
 *
 * Returns the current user's matching profile, or null if not set up.
 */
export async function GET() {
  try {
    const user = await requireAuth();

    // Fetch matching profile
    const profile = await db.query.matchingProfiles.findFirst({
      where: eq(matchingProfiles.profileId, user.id),
    });

    // Fetch skills separately
    const userSkills = await db.query.skills.findMany({
      where: eq(skills.profileId, user.id),
    });

    if (!profile) {
      return NextResponse.json({ profile: null });
    }

    return NextResponse.json({
      profile: {
        ...profile,
        skills: userSkills,
      },
    });
  } catch (error) {
    log.error('matching-profile.get.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to fetch matching profile' }, { status: 500 });
  }
}

/**
 * PUT /api/matching-profile
 *
 * Creates or updates the current user's matching profile.
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    // Validate input
    const validatedData = MatchingProfileSchema.parse(body);

    // Extract skills separately
    const { skills: skillsInput, ...profileData } = validatedData;

    const { availabilityEarliest, availabilityLatest, ...restProfile } = profileData;

    const profileToUpsert: typeof matchingProfiles.$inferInsert = {
      profileId: user.id,
      ...restProfile,
      ...(availabilityEarliest !== undefined ? { availabilityEarliest } : {}),
      ...(availabilityLatest !== undefined ? { availabilityLatest } : {}),
    };

    // Upsert matching profile
    await db
      .insert(matchingProfiles)
      .values(profileToUpsert)
      .onConflictDoUpdate({
        target: matchingProfiles.profileId,
        set: {
          ...profileToUpsert,
          updatedAt: new Date(),
        },
      });

    // Update skills if provided
    if (skillsInput) {
      // Delete existing skills
      await db.delete(skills).where(eq(skills.profileId, user.id));

      // Insert new skills
      if (skillsInput.length > 0) {
        await db.insert(skills).values(
          skillsInput.map((skill) => ({
            profileId: user.id,
            skillId: skill.skillId,
            level: skill.level,
            monthsExperience: skill.monthsExperience,
          }))
        );
      }
    }

    log.info('matching-profile.upserted', {
      userId: user.id,
      skillCount: skillsInput?.length || 0,
    });

    // Check if profile now meets activation criteria
    await checkAndEmitProfileActivation(user.id);

    // Fetch and return updated profile
    const updatedProfile = await db.query.matchingProfiles.findFirst({
      where: eq(matchingProfiles.profileId, user.id),
    });

    const updatedSkills = await db.query.skills.findMany({
      where: eq(skills.profileId, user.id),
    });

    return NextResponse.json({
      profile: {
        ...updatedProfile,
        skills: updatedSkills,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }

    log.error('matching-profile.upsert.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to update matching profile' }, { status: 500 });
  }
}
