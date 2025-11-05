import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import {
  individualProfiles,
  matchingProfiles,
  skills,
  projects,
  experiences,
  education,
  volunteering,
  profileBenefitsPrefs,
  wellbeingOptIns,
  notificationPreferences,
  userConsents,
} from '@/db/schema';
import { eq } from 'drizzle-orm';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

// Validation schemas for import data
const ImportDataSchema = z.object({
  version: z.string(),
  profile: z
    .object({
      individual: z.any().optional(),
      matching: z.any().optional(),
    })
    .optional(),
  skills: z
    .object({
      skills: z.array(z.any()).optional(),
    })
    .optional(),
  workExperience: z
    .object({
      projects: z.array(z.any()).optional(),
      experiences: z.array(z.any()).optional(),
      education: z.array(z.any()).optional(),
      volunteering: z.array(z.any()).optional(),
    })
    .optional(),
  matching: z
    .object({
      benefitsPreferences: z.array(z.any()).optional(),
    })
    .optional(),
  wellbeing: z
    .object({
      optIns: z.array(z.any()).optional(),
    })
    .optional(),
  settings: z
    .object({
      notificationPreferences: z.array(z.any()).optional(),
      consents: z.array(z.any()).optional(),
    })
    .optional(),
});

/**
 * POST /api/data-import
 *
 * Imports user data from a previous export.
 * Validates data structure and merges/overwrites existing data.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Parse the uploaded JSON file
    const body = await request.json();

    // Validate the import data structure
    const validatedData = ImportDataSchema.parse(body);

    log.info('data.import.started', {
      userId: user.id,
      version: validatedData.version,
    });

    const importResults = {
      imported: [] as string[],
      skipped: [] as string[],
      errors: [] as string[],
    };

    // Import individual profile data
    if (validatedData.profile?.individual) {
      try {
        const existingIndividualProfile = await db.query.individualProfiles.findFirst({
          where: eq(individualProfiles.userId, user.id),
        });

        const profileData = {
          ...validatedData.profile.individual,
          userId: user.id,
          updatedAt: new Date(),
        };

        if (existingIndividualProfile) {
          await db
            .update(individualProfiles)
            .set(profileData)
            .where(eq(individualProfiles.userId, user.id));
        } else {
          await db.insert(individualProfiles).values(profileData);
        }

        importResults.imported.push('individual_profile');
      } catch (error) {
        importResults.errors.push(
          `individual_profile: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Import matching profile data
    if (validatedData.profile?.matching) {
      try {
        const existingMatchingProfile = await db.query.matchingProfiles.findFirst({
          where: eq(matchingProfiles.profileId, user.id),
        });

        const matchingData = {
          ...validatedData.profile.matching,
          profileId: user.id,
          updatedAt: new Date(),
        };

        if (existingMatchingProfile) {
          await db
            .update(matchingProfiles)
            .set(matchingData)
            .where(eq(matchingProfiles.profileId, user.id));
        } else {
          await db.insert(matchingProfiles).values(matchingData);
        }

        importResults.imported.push('matching_profile');
      } catch (error) {
        importResults.errors.push(
          `matching_profile: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Import skills (replace existing)
    if (validatedData.skills?.skills && validatedData.skills.skills.length > 0) {
      try {
        // Delete existing skills
        await db.delete(skills).where(eq(skills.profileId, user.id));

        // Insert new skills
        const skillsToImport = validatedData.skills.skills.map((skill: any) => ({
          ...skill,
          profileId: user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        await db.insert(skills).values(skillsToImport);

        importResults.imported.push(`skills (${skillsToImport.length} items)`);
      } catch (error) {
        importResults.errors.push(
          `skills: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Import projects
    if (validatedData.workExperience?.projects && validatedData.workExperience.projects.length > 0) {
      try {
        await db.delete(projects).where(eq(projects.userId, user.id));

        const projectsToImport = validatedData.workExperience.projects.map((project: any) => ({
          ...project,
          userId: user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        await db.insert(projects).values(projectsToImport);

        importResults.imported.push(`projects (${projectsToImport.length} items)`);
      } catch (error) {
        importResults.errors.push(
          `projects: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Import experiences
    if (
      validatedData.workExperience?.experiences &&
      validatedData.workExperience.experiences.length > 0
    ) {
      try {
        await db.delete(experiences).where(eq(experiences.userId, user.id));

        const experiencesToImport = validatedData.workExperience.experiences.map(
          (experience: any) => ({
            ...experience,
            userId: user.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        );

        await db.insert(experiences).values(experiencesToImport);

        importResults.imported.push(`experiences (${experiencesToImport.length} items)`);
      } catch (error) {
        importResults.errors.push(
          `experiences: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Import education
    if (validatedData.workExperience?.education && validatedData.workExperience.education.length > 0) {
      try {
        await db.delete(education).where(eq(education.userId, user.id));

        const educationToImport = validatedData.workExperience.education.map((edu: any) => ({
          ...edu,
          userId: user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        await db.insert(education).values(educationToImport);

        importResults.imported.push(`education (${educationToImport.length} items)`);
      } catch (error) {
        importResults.errors.push(
          `education: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Import volunteering
    if (
      validatedData.workExperience?.volunteering &&
      validatedData.workExperience.volunteering.length > 0
    ) {
      try {
        await db.delete(volunteering).where(eq(volunteering.userId, user.id));

        const volunteeringToImport = validatedData.workExperience.volunteering.map((vol: any) => ({
          ...vol,
          userId: user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        await db.insert(volunteering).values(volunteeringToImport);

        importResults.imported.push(`volunteering (${volunteeringToImport.length} items)`);
      } catch (error) {
        importResults.errors.push(
          `volunteering: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Import benefits preferences
    if (
      validatedData.matching?.benefitsPreferences &&
      validatedData.matching.benefitsPreferences.length > 0
    ) {
      try {
        await db.delete(profileBenefitsPrefs).where(eq(profileBenefitsPrefs.profileId, user.id));

        const benefitsToImport = validatedData.matching.benefitsPreferences.map((pref: any) => ({
          ...pref,
          profileId: user.id,
          createdAt: new Date(),
        }));

        await db.insert(profileBenefitsPrefs).values(benefitsToImport);

        importResults.imported.push(`benefits_preferences (${benefitsToImport.length} items)`);
      } catch (error) {
        importResults.errors.push(
          `benefits_preferences: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Import wellbeing opt-ins
    if (validatedData.wellbeing?.optIns && validatedData.wellbeing.optIns.length > 0) {
      try {
        await db.delete(wellbeingOptIns).where(eq(wellbeingOptIns.userId, user.id));

        const optInsToImport = validatedData.wellbeing.optIns.map((optIn: any) => ({
          ...optIn,
          userId: user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        await db.insert(wellbeingOptIns).values(optInsToImport);

        importResults.imported.push(`wellbeing_opt_ins (${optInsToImport.length} items)`);
      } catch (error) {
        importResults.errors.push(
          `wellbeing_opt_ins: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Import notification preferences
    if (
      validatedData.settings?.notificationPreferences &&
      validatedData.settings.notificationPreferences.length > 0
    ) {
      try {
        await db
          .delete(notificationPreferences)
          .where(eq(notificationPreferences.userId, user.id));

        const notifPrefsToImport = validatedData.settings.notificationPreferences.map(
          (pref: any) => ({
            ...pref,
            userId: user.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        );

        await db.insert(notificationPreferences).values(notifPrefsToImport);

        importResults.imported.push(
          `notification_preferences (${notifPrefsToImport.length} items)`
        );
      } catch (error) {
        importResults.errors.push(
          `notification_preferences: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Import user consents
    if (validatedData.settings?.consents && validatedData.settings.consents.length > 0) {
      try {
        await db.delete(userConsents).where(eq(userConsents.profileId, user.id));

        const consentsToImport = validatedData.settings.consents.map((consent: any) => ({
          ...consent,
          profileId: user.id,
          createdAt: new Date(),
        }));

        await db.insert(userConsents).values(consentsToImport);

        importResults.imported.push(`user_consents (${consentsToImport.length} items)`);
      } catch (error) {
        importResults.errors.push(
          `user_consents: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    log.info('data.import.completed', {
      userId: user.id,
      imported: importResults.imported.length,
      errors: importResults.errors.length,
    });

    return NextResponse.json({
      success: true,
      results: importResults,
      message: `Successfully imported ${importResults.imported.length} data types${importResults.errors.length > 0 ? ` with ${importResults.errors.length} errors` : ''}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      log.error('data.import.validation.failed', {
        errors: error.errors,
      });

      return NextResponse.json(
        {
          error: 'Invalid import data format',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    log.error('data.import.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        error: 'Failed to import data',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
