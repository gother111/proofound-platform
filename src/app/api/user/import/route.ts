import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { individualProfiles, skills, experiences, volunteering, auditLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { detectPII } from '@/lib/privacy/pii-detection';
import { normalizeImportRequest } from '@/lib/contracts/data-portability';

function parseOptionalDate(value?: string | null): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function collectPotentialPiiText(payload: {
  profile?: { bio?: string; mission?: string; vision?: string };
  experiences: Array<{
    organization?: string;
    role?: string;
    description?: string;
    location?: string;
  }>;
  volunteering: Array<{ organization?: string; role?: string; description?: string }>;
}): string[] {
  const texts: string[] = [];

  if (payload.profile?.bio) texts.push(payload.profile.bio);
  if (payload.profile?.mission) texts.push(payload.profile.mission);
  if (payload.profile?.vision) texts.push(payload.profile.vision);

  for (const experience of payload.experiences) {
    if (experience.organization) texts.push(experience.organization);
    if (experience.role) texts.push(experience.role);
    if (experience.description) texts.push(experience.description);
    if (experience.location) texts.push(experience.location);
  }

  for (const entry of payload.volunteering) {
    if (entry.organization) texts.push(entry.organization);
    if (entry.role) texts.push(entry.role);
    if (entry.description) texts.push(entry.description);
  }

  return texts;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let normalized;
    try {
      normalized = normalizeImportRequest(await request.json(), { requireConsent: true });
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

      if (error instanceof Error && error.message === 'CONSENT_REQUIRED') {
        return NextResponse.json(
          {
            error: 'Consent required',
            message:
              'Please confirm you understand the import will modify your profile data before continuing.',
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: 'Invalid data format',
          message: error instanceof Error ? error.message : 'Could not parse import payload',
        },
        { status: 400 }
      );
    }

    const { data, mode, consentAcknowledged } = normalized;

    const piiDetections = collectPotentialPiiText({
      profile: {
        bio: data.profile?.bio,
        mission: data.profile?.mission,
        vision: data.profile?.vision,
      },
      experiences: data.experiences,
      volunteering: data.volunteering,
    })
      .map((text) => detectPII(text))
      .filter((detection) => detection.hasPII);

    if (piiDetections.length > 0 && !consentAcknowledged) {
      return NextResponse.json(
        {
          error: 'PII consent required',
          message:
            'Your import contains personal contact data. Please explicitly acknowledge consent before importing.',
        },
        { status: 400 }
      );
    }

    const importedCounts = {
      profile: 0,
      skills: 0,
      experiences: 0,
      volunteering: 0,
    };

    await db.transaction(async (tx) => {
      if (data.profile && Object.keys(data.profile).length > 0) {
        const [existingIndividualProfile] = await tx
          .select({ userId: individualProfiles.userId })
          .from(individualProfiles)
          .where(eq(individualProfiles.userId, user.id))
          .limit(1);

        const profilePayload = {
          headline: data.profile.headline,
          bio: data.profile.bio,
          mission: data.profile.mission,
          vision: data.profile.vision,
          tagline: data.profile.tagline,
          location: data.profile.location,
          values: data.profile.values as any,
          causes: data.profile.causes,
        };

        if (existingIndividualProfile) {
          await tx
            .update(individualProfiles)
            .set(profilePayload)
            .where(eq(individualProfiles.userId, user.id));
        } else {
          await tx.insert(individualProfiles).values({
            userId: user.id,
            ...profilePayload,
          });
        }

        importedCounts.profile = 1;
      }

      if (mode === 'replace') {
        await tx.delete(skills).where(eq(skills.profileId, user.id));
        await tx.delete(experiences).where(eq(experiences.userId, user.id));
        await tx.delete(volunteering).where(eq(volunteering.userId, user.id));
      }

      for (const skill of data.skills) {
        await tx
          .insert(skills)
          .values({
            profileId: user.id,
            skillId: skill.skillCode,
            skillCode: skill.skillCode,
            level: skill.level,
            monthsExperience: 0,
            lastUsedAt: parseOptionalDate(skill.lastUsed),
          })
          .onConflictDoUpdate({
            target: [skills.profileId, skills.skillId],
            set: {
              skillCode: skill.skillCode,
              level: skill.level,
              lastUsedAt: parseOptionalDate(skill.lastUsed),
              updatedAt: new Date(),
            },
          });
      }
      importedCounts.skills = data.skills.length;

      if (data.experiences.length > 0) {
        await tx.insert(experiences).values(
          data.experiences.map((experience) => ({
            userId: user.id,
            title: experience.role || 'Imported Experience',
            orgDescription: experience.organization,
            duration:
              experience.startDate && experience.endDate
                ? `${experience.startDate} - ${experience.endDate}`
                : experience.startDate || experience.endDate || 'Duration not specified',
            learning: experience.description || 'No learning description provided',
            growth: 'Imported from data portability export',
          }))
        );
      }
      importedCounts.experiences = data.experiences.length;

      if (data.volunteering.length > 0) {
        await tx.insert(volunteering).values(
          data.volunteering.map((entry) => ({
            userId: user.id,
            title: entry.role || 'Imported Volunteering',
            orgDescription: entry.organization,
            duration:
              entry.startDate && entry.endDate
                ? `${entry.startDate} - ${entry.endDate}`
                : entry.startDate || entry.endDate || 'Duration not specified',
            cause: 'Imported from data portability export',
            impact: entry.description || 'No impact description provided',
            skillsDeployed: 'Not specified',
            personalWhy: 'Imported from data portability export',
          }))
        );
      }
      importedCounts.volunteering = data.volunteering.length;
    });

    await db.insert(auditLogs).values({
      actorId: user.id,
      action: 'data_import',
      meta: {
        imported: importedCounts,
        version: data.version,
        mode,
        piiFindings: piiDetections.length,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Data imported successfully',
      imported: importedCounts,
      mode,
    });
  } catch (error) {
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
