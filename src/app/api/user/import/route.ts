import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { individualProfiles, skills, experiences, volunteering, auditLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Schema validation for import data
const importSchema = z.object({
  version: z.string(),
  exportedAt: z.string(),
  profile: z
    .object({
      headline: z.string().optional(),
      bio: z.string().optional(),
      mission: z.string().optional(),
      vision: z.string().optional(),
      tagline: z.string().optional(),
      location: z.string().optional(),
      values: z.any().optional(),
      causes: z.array(z.string()).optional(),
    })
    .optional(),
  skills: z
    .array(
      z.object({
        skillCode: z.string(),
        level: z.number().min(0).max(5),
        lastUsed: z.string().optional().nullable(),
        notes: z.string().optional(),
      })
    )
    .optional(),
  experiences: z
    .array(
      z.object({
        type: z.string(),
        organization: z.string(),
        role: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional().nullable(),
        description: z.string().optional(),
        location: z.string().optional(),
      })
    )
    .optional(),
  volunteering: z
    .array(
      z.object({
        organization: z.string(),
        role: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional().nullable(),
        description: z.string().optional(),
        hoursPerWeek: z.number().optional(),
      })
    )
    .optional(),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Validate schema
    const validatedData = importSchema.parse(body);

    // Schema version compatibility check
    const [majorVersion] = validatedData.version.split('.');
    if (majorVersion !== '3') {
      return NextResponse.json(
        {
          error: 'Incompatible schema version',
          message: `Version ${validatedData.version} is not compatible. Please export your data again with the latest version.`,
          currentVersion: '3.0.0',
        },
        { status: 400 }
      );
    }

    let importedCounts = {
      profile: 0,
      skills: 0,
      experiences: 0,
      volunteering: 0,
    };

    // Transaction: Restore data
    await db.transaction(async (tx) => {
      // Update profile
      if (validatedData.profile) {
        await tx
          .update(individualProfiles)
          .set({
            headline: validatedData.profile.headline,
            bio: validatedData.profile.bio,
            mission: validatedData.profile.mission,
            vision: validatedData.profile.vision,
            tagline: validatedData.profile.tagline,
            location: validatedData.profile.location,
            values: validatedData.profile.values as any,
            causes: validatedData.profile.causes,
          })
          .where(eq(individualProfiles.userId, user.id));

        importedCounts.profile = 1;
      }

      // Restore skills (clear existing first to avoid conflicts)
      if (validatedData.skills && validatedData.skills.length > 0) {
        // Delete existing skills
        await tx.delete(skills).where(eq(skills.profileId, user.id));

        // Insert imported skills
        for (const skill of validatedData.skills) {
          await tx.insert(skills).values({
            profileId: user.id,
            skillId: skill.skillCode, // Using skillCode as skillId for backwards compatibility
            skillCode: skill.skillCode,
            level: skill.level,
            monthsExperience: 0, // Default value as this field is required
            lastUsedAt: skill.lastUsed ? new Date(skill.lastUsed) : null,
          });
        }

        importedCounts.skills = validatedData.skills.length;
      }

      // Restore experiences
      if (validatedData.experiences && validatedData.experiences.length > 0) {
        // Delete existing experiences
        await tx.delete(experiences).where(eq(experiences.userId, user.id));

        // Insert imported experiences (mapping old schema to new)
        for (const exp of validatedData.experiences) {
          await tx.insert(experiences).values({
            userId: user.id,
            title: exp.role || 'Imported Experience',
            orgDescription: exp.organization || 'Organization not specified',
            duration:
              exp.startDate && exp.endDate
                ? `${exp.startDate} - ${exp.endDate}`
                : 'Duration not specified',
            learning: exp.description || 'No learning description provided',
            growth: 'Imported from previous data format',
          });
        }

        importedCounts.experiences = validatedData.experiences.length;
      }

      // Restore volunteering (mapping old schema to new)
      if (validatedData.volunteering && validatedData.volunteering.length > 0) {
        // Delete existing volunteering
        await tx.delete(volunteering).where(eq(volunteering.userId, user.id));

        // Insert imported volunteering
        for (const vol of validatedData.volunteering) {
          await tx.insert(volunteering).values({
            userId: user.id,
            title: vol.role || 'Imported Volunteering',
            orgDescription: vol.organization || 'Organization not specified',
            duration:
              vol.startDate && vol.endDate
                ? `${vol.startDate} - ${vol.endDate}`
                : 'Duration not specified',
            cause: 'Imported from previous data format',
            impact: vol.description || 'No impact description provided',
            skillsDeployed: 'Not specified',
            personalWhy: 'Imported from previous data format',
          });
        }

        importedCounts.volunteering = validatedData.volunteering.length;
      }
    });

    // Audit log
    await db.insert(auditLogs).values({
      actorId: user.id,
      action: 'data_import',
      meta: {
        imported: importedCounts,
        version: validatedData.version,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Data imported successfully',
      imported: importedCounts,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid data format',
          message: 'The uploaded file does not match the expected format',
          details: error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error('Import error:', error);
    return NextResponse.json(
      {
        error: 'Import failed',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
