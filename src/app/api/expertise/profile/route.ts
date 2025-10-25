import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';
import { capabilities, growthPlans, skills } from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/log';
import { db } from '@/db';

export const dynamic = 'force-dynamic';

const CapabilityInputSchema = z.object({
  capabilityId: z.string().uuid().optional(),
  skillId: z.string(),
  level: z.number().int().min(0).max(5),
  monthsExperience: z.number().int().min(0),
  privacyLevel: z.enum(['only_me', 'team', 'organization', 'public']).optional(),
  summary: z.string().max(1000).nullable().optional(),
  highlights: z.array(z.string().max(280)).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const GrowthPlanInputSchema = z.object({
  growthPlanId: z.string().uuid().optional(),
  capabilityId: z.string().uuid().nullable().optional(),
  title: z.string().min(2).max(200),
  goal: z.string().max(1000).nullable().optional(),
  targetLevel: z.number().int().min(0).max(5).nullable().optional(),
  targetDate: z.string().datetime().nullable().optional(),
  status: z.enum(['planned', 'in_progress', 'blocked', 'completed', 'archived']).optional(),
  milestones: z.array(z.record(z.unknown())).optional(),
  supportNeeds: z.string().max(1000).nullable().optional(),
});

const ExpertiseProfileSchema = z.object({
  capabilities: z.array(CapabilityInputSchema),
  growthPlans: z.array(GrowthPlanInputSchema).optional(),
});

export async function GET() {
  try {
    const user = await requireAuth();

    // Load every capability for this profile
    const capabilityRows = await db
      .select()
      .from(capabilities)
      .where(eq(capabilities.profileId, user.id))
      .orderBy(desc(capabilities.updatedAt));

    // Collect the skill records they belong to (if any were deleted, we still return the capability)
    const skillRows = await db.select().from(skills).where(eq(skills.profileId, user.id));

    // Build a friendlier object for the UI: each capability + its skill row (or undefined)
    const capabilityMap = capabilityRows.map((capabilityRow) => ({
      capability: capabilityRow,
      skill: skillRows.find((skillRow) => skillRow.id === capabilityRow.skillRecordId),
    }));

    // Fetch any growth plans the user has created
    const userGrowthPlans = await db
      .select()
      .from(growthPlans)
      .where(eq(growthPlans.profileId, user.id))
      .orderBy(desc(growthPlans.updatedAt));

    return NextResponse.json({
      capabilities: capabilityMap,
      growthPlans: userGrowthPlans,
    });
  } catch (error) {
    log.error('expertise.profile.get.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to load expertise profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const parsed = ExpertiseProfileSchema.parse(body);

    const result = await db.transaction(async (tx) => {
      const now = new Date();
      const capabilityIds: string[] = [];

      for (const capabilityInput of parsed.capabilities) {
        const {
          capabilityId,
          skillId,
          level,
          monthsExperience,
          privacyLevel,
          summary,
          highlights,
          metadata,
        } = capabilityInput;

        // 1. Make sure the base skill row exists (one per profile + taxonomy skill)
        const existingSkill = await tx
          .select({ id: skills.id })
          .from(skills)
          .where(and(eq(skills.profileId, user.id), eq(skills.skillId, skillId)))
          .limit(1);

        let skillRecordId: string;

        if (existingSkill.length) {
          skillRecordId = existingSkill[0].id;

          await tx
            .update(skills)
            .set({
              level,
              monthsExperience,
              updatedAt: now,
            })
            .where(eq(skills.id, skillRecordId));
        } else {
          const [insertedSkill] = await tx
            .insert(skills)
            .values({
              profileId: user.id,
              skillId,
              level,
              monthsExperience,
            })
            .returning({ id: skills.id });

          skillRecordId = insertedSkill.id;
        }

        // 2. Decide whether we are updating or creating the capability wrapper
        const capabilityUpdates: Partial<typeof capabilities.$inferInsert> = {
          updatedAt: now,
        };

        if (summary !== undefined) {
          capabilityUpdates.summary = summary;
        }

        if (highlights !== undefined) {
          capabilityUpdates.highlights = highlights ?? [];
        }

        if (metadata !== undefined) {
          capabilityUpdates.metadata = metadata ?? {};
        }

        if (privacyLevel !== undefined) {
          capabilityUpdates.privacyLevel = privacyLevel;
        }

        if (capabilityId) {
          // Update an existing capability that belongs to the user
          const existingCapability = await tx
            .select({ id: capabilities.id })
            .from(capabilities)
            .where(and(eq(capabilities.id, capabilityId), eq(capabilities.profileId, user.id)))
            .limit(1);

          if (!existingCapability.length) {
            throw new Error('Capability not found or access denied');
          }

          await tx
            .update(capabilities)
            .set(capabilityUpdates)
            .where(eq(capabilities.id, capabilityId));

          capabilityIds.push(existingCapability[0].id);
        } else {
          // Find a capability linked to this skill (if one already exists we reuse it)
          const existingCapability = await tx
            .select({ id: capabilities.id })
            .from(capabilities)
            .where(
              and(
                eq(capabilities.profileId, user.id),
                eq(capabilities.skillRecordId, skillRecordId)
              )
            )
            .limit(1);

          if (existingCapability.length) {
            await tx
              .update(capabilities)
              .set(capabilityUpdates)
              .where(eq(capabilities.id, existingCapability[0].id));

            capabilityIds.push(existingCapability[0].id);
          } else {
            const [createdCapability] = await tx
              .insert(capabilities)
              .values({
                profileId: user.id,
                skillRecordId,
                privacyLevel: privacyLevel ?? 'team',
                summary: summary ?? null,
                highlights: highlights ?? [],
                metadata: metadata ?? {},
                createdAt: now,
                updatedAt: now,
              })
              .returning({ id: capabilities.id });

            capabilityIds.push(createdCapability.id);
          }
        }
      }

      if (parsed.growthPlans) {
        for (const plan of parsed.growthPlans) {
          const {
            growthPlanId,
            capabilityId,
            title,
            goal,
            targetLevel,
            targetDate,
            status,
            milestones,
            supportNeeds,
          } = plan;

          // Build the payload, but only include fields that were provided to avoid clobbering data the client did not send
          const growthPlanUpdates: Partial<typeof growthPlans.$inferInsert> = {
            profileId: user.id,
            updatedAt: now,
          };

          if (capabilityId !== undefined) {
            growthPlanUpdates.capabilityId = capabilityId;
          }

          if (title !== undefined) {
            growthPlanUpdates.title = title;
          }

          if (goal !== undefined) {
            growthPlanUpdates.goal = goal;
          }

          if (targetLevel !== undefined) {
            growthPlanUpdates.targetLevel = targetLevel;
          }

          if (targetDate !== undefined) {
            growthPlanUpdates.targetDate = targetDate;
          }

          if (status !== undefined) {
            growthPlanUpdates.status = status;
          }

          if (milestones !== undefined) {
            growthPlanUpdates.milestones = milestones ?? [];
          }

          if (supportNeeds !== undefined) {
            growthPlanUpdates.supportNeeds = supportNeeds;
          }

          if (growthPlanId) {
            const existingPlan = await tx
              .select({ id: growthPlans.id })
              .from(growthPlans)
              .where(and(eq(growthPlans.id, growthPlanId), eq(growthPlans.profileId, user.id)))
              .limit(1);

            if (!existingPlan.length) {
              throw new Error('Growth plan not found or access denied');
            }

            await tx
              .update(growthPlans)
              .set(growthPlanUpdates)
              .where(eq(growthPlans.id, growthPlanId));
          } else {
            await tx.insert(growthPlans).values({
              profileId: user.id,
              capabilityId: capabilityId ?? null,
              title,
              goal: goal ?? null,
              targetLevel: targetLevel ?? null,
              targetDate: targetDate,
              status: status ?? 'planned',
              milestones: milestones ?? [],
              supportNeeds: supportNeeds ?? null,
              createdAt: now,
              updatedAt: now,
            });
          }
        }
      }

      const refreshedCapabilities = await tx
        .select()
        .from(capabilities)
        .where(eq(capabilities.profileId, user.id))
        .orderBy(desc(capabilities.updatedAt));

      const refreshedSkills = await tx.select().from(skills).where(eq(skills.profileId, user.id));

      const refreshedGrowthPlans = await tx
        .select()
        .from(growthPlans)
        .where(eq(growthPlans.profileId, user.id))
        .orderBy(desc(growthPlans.updatedAt));

      return {
        capabilityIds,
        capabilities: refreshedCapabilities.map((capabilityRow) => ({
          capability: capabilityRow,
          skill: refreshedSkills.find((skillRow) => skillRow.id === capabilityRow.skillRecordId),
        })),
        growthPlans: refreshedGrowthPlans,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid expertise payload', details: error.flatten() },
        { status: 400 }
      );
    }

    log.error('expertise.profile.put.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to update expertise profile' }, { status: 500 });
  }
}
