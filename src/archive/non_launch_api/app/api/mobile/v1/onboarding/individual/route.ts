import { NextRequest } from 'next/server';
import { z } from 'zod';

import { db } from '@/db';
import { matchingProfiles, profiles, skills } from '@/db/schema';
import { requireMobileAuth } from '@/lib/api/mobile/auth';
import { mobileError, mobileSuccess } from '@/lib/api/mobile/response';

export const dynamic = 'force-dynamic';

const SkillSchema = z.object({
  skillId: z.string().min(1),
  level: z.number().int().min(0).max(5),
  monthsExperience: z.number().int().min(0).optional().default(0),
});

const IndividualOnboardingSchema = z.object({
  valuesTags: z.array(z.string()).optional().default([]),
  causeTags: z.array(z.string()).optional().default([]),
  workMode: z.enum(['remote', 'onsite', 'hybrid']).optional(),
  skills: z.array(SkillSchema).optional().default([]),
});

/**
 * PUT /api/mobile/v1/onboarding/individual
 *
 * Minimum viable matchable setup for a new individual:
 * - profiles.persona = individual
 * - baseline matching_profiles row
 * - optional initial skills
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireMobileAuth(request);
    if ('status' in auth) {
      return auth;
    }

    const parsed = IndividualOnboardingSchema.safeParse(await request.json());
    if (!parsed.success) {
      return mobileError(
        'validation_error',
        'Invalid onboarding payload',
        400,
        parsed.error.flatten()
      );
    }

    const now = new Date();
    const payload = parsed.data;

    await db.transaction(async (tx) => {
      await tx
        .insert(profiles)
        .values({
          id: auth.user.id,
          persona: 'individual',
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: profiles.id,
          set: { persona: 'individual', updatedAt: now },
        });

      await tx
        .insert(matchingProfiles)
        .values({
          profileId: auth.user.id,
          valuesTags: payload.valuesTags,
          causeTags: payload.causeTags,
          workMode: payload.workMode,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: matchingProfiles.profileId,
          set: {
            valuesTags: payload.valuesTags,
            causeTags: payload.causeTags,
            workMode: payload.workMode,
            updatedAt: now,
          },
        });

      for (const skill of payload.skills) {
        await tx
          .insert(skills)
          .values({
            profileId: auth.user.id,
            skillId: skill.skillId,
            level: skill.level,
            monthsExperience: skill.monthsExperience,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: [skills.profileId, skills.skillId],
            set: {
              level: skill.level,
              monthsExperience: skill.monthsExperience,
              updatedAt: now,
            },
          });
      }
    });

    return mobileSuccess({ ok: true });
  } catch (error) {
    console.error('[mobile.onboarding.individual.put] failed', error);
    return mobileError('internal_error', 'Failed to complete individual onboarding', 500);
  }
}
