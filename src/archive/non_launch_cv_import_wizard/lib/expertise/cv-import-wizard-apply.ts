import { and, eq, inArray } from 'drizzle-orm';

import { db } from '@/db';
import {
  education,
  experiences,
  matchingProfiles,
  skills,
  skillsTaxonomy,
  volunteering,
} from '@/db/schema';
import { LANGUAGE_OPTIONS, type CEFRLevel } from '@/lib/taxonomy/data';
import {
  CvImportWizardApplyRequestSchema,
  CvImportWizardApplyResponseSchema,
  type CvImportWizardApplyRequest,
  type CvImportWizardApplyResponse,
} from '@/archive/non_launch_python_internal/lib/expertise/cv-import-wizard-types';

const LANGUAGE_CODE_SET = new Set(LANGUAGE_OPTIONS.map((option) => option.key));

const CEFR_RANK: Record<CEFRLevel, number> = {
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 4,
  C1: 5,
  C2: 6,
};

function strongerLevel(left: CEFRLevel, right: CEFRLevel): CEFRLevel {
  return CEFR_RANK[left] >= CEFR_RANK[right] ? left : right;
}

function buildExperienceKey(entry: {
  title: string;
  organization: string;
  duration: string;
}): string {
  return `${entry.title}::${entry.organization}::${entry.duration}`.toLowerCase();
}

function buildLearningKey(entry: {
  institution: string;
  degree: string;
  duration: string;
}): string {
  return `${entry.institution}::${entry.degree}::${entry.duration}`.toLowerCase();
}

function buildVolunteeringKey(entry: {
  title: string;
  organization: string;
  duration: string;
}): string {
  return `${entry.title}::${entry.organization}::${entry.duration}`.toLowerCase();
}

function normalizeLanguageRows(value: unknown): Array<{ code: string; level: CEFRLevel }> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const maybeCode = (entry as { code?: unknown }).code;
      const maybeLevel = (entry as { level?: unknown }).level;

      if (typeof maybeCode !== 'string' || !LANGUAGE_CODE_SET.has(maybeCode)) {
        return null;
      }

      if (
        typeof maybeLevel !== 'string' ||
        !Object.prototype.hasOwnProperty.call(CEFR_RANK, maybeLevel)
      ) {
        return null;
      }

      return {
        code: maybeCode,
        level: maybeLevel as CEFRLevel,
      };
    })
    .filter((entry): entry is { code: string; level: CEFRLevel } => Boolean(entry));
}

async function resolveValidSkillIds(skillIds: string[]): Promise<Set<string>> {
  if (skillIds.length === 0) {
    return new Set<string>();
  }

  const rows = await db
    .select({ code: skillsTaxonomy.code })
    .from(skillsTaxonomy)
    .where(and(eq(skillsTaxonomy.status, 'active'), inArray(skillsTaxonomy.code, skillIds)));

  return new Set(rows.map((row) => row.code));
}

export async function applyWizardSelections(
  userId: string,
  input: CvImportWizardApplyRequest
): Promise<CvImportWizardApplyResponse> {
  const parsedInput = CvImportWizardApplyRequestSchema.parse(input);

  const importedCounts = {
    skills: 0,
    work_experiences: 0,
    learning_experiences: 0,
    volunteering: 0,
    languages: 0,
  };

  const skippedCounts = {
    skills: 0,
    work_experiences: 0,
    learning_experiences: 0,
    volunteering: 0,
    languages: 0,
  };

  const warnings: string[] = [];

  const incomingSkillIds = Array.from(
    new Set(parsedInput.documents.flatMap((document) => document.skill_ids).filter(Boolean))
  );

  const validSkillIdSet = await resolveValidSkillIds(incomingSkillIds);
  const validSkillIds = incomingSkillIds.filter((skillId) => validSkillIdSet.has(skillId));
  skippedCounts.skills += incomingSkillIds.length - validSkillIds.length;

  if (incomingSkillIds.length !== validSkillIds.length) {
    warnings.push('Some skill_ids were ignored because they are not active taxonomy entries.');
  }

  const languageInputs = parsedInput.documents.flatMap((document) => document.languages);
  const validLanguageInputs = languageInputs.filter((entry) =>
    LANGUAGE_CODE_SET.has(entry.language_code)
  );
  skippedCounts.languages += languageInputs.length - validLanguageInputs.length;

  if (languageInputs.length !== validLanguageInputs.length) {
    warnings.push('Some languages were ignored because they are not supported language codes.');
  }

  await db.transaction(async (tx) => {
    if (validSkillIds.length > 0) {
      const skillRows = validSkillIds.map((skillId) => ({
        profileId: userId,
        skillId,
        skillCode: skillId,
        level: 2,
        monthsExperience: 0,
        lastUsedAt: new Date(),
        relevance: 'current' as const,
      }));

      await tx
        .insert(skills)
        .values(skillRows)
        .onConflictDoUpdate({
          target: [skills.profileId, skills.skillId],
          set: {
            level: 2,
            monthsExperience: 0,
            relevance: 'current',
            lastUsedAt: new Date(),
            updatedAt: new Date(),
          },
        });

      importedCounts.skills = validSkillIds.length;
    }

    const existingExperiences = await tx
      .select({
        title: experiences.title,
        organizationName: experiences.organizationName,
        organization: experiences.orgDescription,
        duration: experiences.duration,
      })
      .from(experiences)
      .where(eq(experiences.userId, userId));

    const existingExperienceKeys = new Set(
      existingExperiences.map((entry) =>
        buildExperienceKey({
          title: entry.title,
          organization: entry.organizationName || entry.organization,
          duration: entry.duration,
        })
      )
    );

    const workInputs = parsedInput.documents.flatMap((document) => document.work_experiences);
    const workRows = [] as Array<{
      userId: string;
      title: string;
      organizationName: string | null;
      orgDescription: string;
      duration: string;
      outcomes: string;
      projects: string;
      colleagues: string;
      achievements: string;
    }>;

    for (const entry of workInputs) {
      const key = buildExperienceKey({
        title: entry.title,
        organization: entry.organization,
        duration: entry.duration,
      });

      if (existingExperienceKeys.has(key)) {
        skippedCounts.work_experiences += 1;
        continue;
      }

      existingExperienceKeys.add(key);

      workRows.push({
        userId,
        title: entry.title,
        organizationName: entry.organization.trim() || null,
        orgDescription: 'Organization details not specified',
        duration: entry.duration,
        outcomes: entry.summary,
        projects: entry.summary,
        colleagues: 'Imported from CV wizard',
        achievements: entry.summary,
      });
    }

    if (workRows.length > 0) {
      await tx.insert(experiences).values(workRows);
      importedCounts.work_experiences = workRows.length;
    }

    const existingLearning = await tx
      .select({
        institution: education.institution,
        degree: education.degree,
        duration: education.duration,
      })
      .from(education)
      .where(eq(education.userId, userId));

    const existingLearningKeys = new Set(existingLearning.map((entry) => buildLearningKey(entry)));

    const learningInputs = parsedInput.documents.flatMap(
      (document) => document.learning_experiences
    );
    const learningRows = [] as Array<{
      userId: string;
      institution: string;
      degree: string;
      duration: string;
      skills: string;
      projects: string;
    }>;

    for (const entry of learningInputs) {
      const key = buildLearningKey(entry);
      if (existingLearningKeys.has(key)) {
        skippedCounts.learning_experiences += 1;
        continue;
      }

      existingLearningKeys.add(key);
      learningRows.push({
        userId,
        institution: entry.institution,
        degree: entry.degree,
        duration: entry.duration,
        skills: entry.skills,
        projects: entry.projects,
      });
    }

    if (learningRows.length > 0) {
      await tx.insert(education).values(learningRows);
      importedCounts.learning_experiences = learningRows.length;
    }

    const existingVolunteering = await tx
      .select({
        title: volunteering.title,
        organization: volunteering.orgDescription,
        duration: volunteering.duration,
      })
      .from(volunteering)
      .where(eq(volunteering.userId, userId));

    const existingVolunteeringKeys = new Set(
      existingVolunteering.map((entry) => buildVolunteeringKey(entry))
    );

    const volunteeringInputs = parsedInput.documents.flatMap((document) => document.volunteering);
    const volunteeringRows = [] as Array<{
      userId: string;
      title: string;
      orgDescription: string;
      duration: string;
      cause: string;
      impact: string;
      skillsDeployed: string;
      personalWhy: string;
    }>;

    for (const entry of volunteeringInputs) {
      const key = buildVolunteeringKey({
        title: entry.title,
        organization: entry.organization,
        duration: entry.duration,
      });

      if (existingVolunteeringKeys.has(key)) {
        skippedCounts.volunteering += 1;
        continue;
      }

      existingVolunteeringKeys.add(key);

      volunteeringRows.push({
        userId,
        title: entry.title,
        orgDescription: entry.organization,
        duration: entry.duration,
        cause: entry.cause,
        impact: entry.impact,
        skillsDeployed: entry.skills_deployed,
        personalWhy: entry.personal_why,
      });
    }

    if (volunteeringRows.length > 0) {
      await tx.insert(volunteering).values(volunteeringRows);
      importedCounts.volunteering = volunteeringRows.length;
    }

    const existingMatching = await tx
      .select({ languages: matchingProfiles.languages })
      .from(matchingProfiles)
      .where(eq(matchingProfiles.profileId, userId))
      .limit(1);

    const mergedLanguageMap = new Map<string, CEFRLevel>();

    for (const existing of normalizeLanguageRows(existingMatching[0]?.languages)) {
      mergedLanguageMap.set(existing.code, existing.level);
    }

    let languageChanges = 0;

    for (const entry of validLanguageInputs) {
      const currentLevel = mergedLanguageMap.get(entry.language_code);
      if (!currentLevel) {
        mergedLanguageMap.set(entry.language_code, entry.level);
        languageChanges += 1;
        continue;
      }

      const stronger = strongerLevel(currentLevel, entry.level);
      if (stronger !== currentLevel) {
        mergedLanguageMap.set(entry.language_code, stronger);
        languageChanges += 1;
      }
    }

    if (validLanguageInputs.length > 0 || existingMatching.length > 0) {
      const mergedLanguages = Array.from(mergedLanguageMap.entries()).map(([code, level]) => ({
        code,
        level,
      }));

      await tx
        .insert(matchingProfiles)
        .values({
          profileId: userId,
          languages: mergedLanguages as any,
        })
        .onConflictDoUpdate({
          target: matchingProfiles.profileId,
          set: {
            languages: mergedLanguages as any,
            updatedAt: new Date(),
          },
        });
    }

    importedCounts.languages = languageChanges;
    skippedCounts.languages += Math.max(0, validLanguageInputs.length - languageChanges);
  });

  if (skippedCounts.work_experiences > 0) {
    warnings.push('Duplicate work experiences were skipped.');
  }

  if (skippedCounts.learning_experiences > 0) {
    warnings.push('Duplicate learning experiences were skipped.');
  }

  if (skippedCounts.volunteering > 0) {
    warnings.push('Duplicate volunteering entries were skipped.');
  }

  if (skippedCounts.languages > 0) {
    warnings.push('Some language entries were skipped due to duplicates or weaker CEFR levels.');
  }

  return CvImportWizardApplyResponseSchema.parse({
    imported_counts: importedCounts,
    skipped_counts: skippedCounts,
    warnings: Array.from(new Set(warnings)),
  });
}
