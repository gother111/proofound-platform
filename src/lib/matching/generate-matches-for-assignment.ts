import { db } from '@/db';
import { assignments, matchingProfiles, matches, skills, skillsTaxonomy } from '@/db/schema';
import { eq, inArray, sql } from 'drizzle-orm';
import { log } from '@/lib/log';
import {
  scoreValues,
  scoreCauses,
  scoreSkills,
  scoreExperience,
  scoreVerifications,
  scoreAvailability,
  scoreLocation,
  scoreCompensation,
  scoreLanguage,
  composeWeighted,
  compareMatches,
  type Skill,
  type DateWindow,
  type Range,
  type LocationMode,
} from '@/lib/core/matching/scorers';
import { getPreset } from '@/lib/core/matching/presets';
import { toAnnualCompensationRange } from '@/lib/matching/compensation';
import {
  deriveAtlasLanguageLevels,
  parseLegacyLanguageLevels,
  resolveLanguageLevel,
} from '@/lib/core/matching/language-resolution';
import {
  buildMatchAuditFields,
  CANONICAL_MATCH_AUDIT_FIELDS_ENABLED,
  CANONICAL_MATCH_SCORE_VERSION,
} from '@/lib/canonical/repository';
import {
  appendSystemReasonLedger,
  buildCanonicalMatchPersistenceFields,
  ensureMatchReviewState,
  persistFairnessEvaluationForAssignment,
} from '@/lib/matching/review-contract';

/**
 * Generate matches for an assignment and upsert the top results into the `matches` table.
 *
 * Notes:
 * - This function is designed to be safe to run multiple times (idempotent upsert).
 * - It batches skill fetches to avoid N+1 queries.
 */
export async function generateMatchesForAssignment(
  assignmentId: string,
  options: { replaceExisting?: boolean } = {}
): Promise<number> {
  const startTime = Date.now();
  const { replaceExisting = false } = options;

  try {
    const assignment = await db.query.assignments.findFirst({
      where: eq(assignments.id, assignmentId),
    });

    if (!assignment) {
      log.error('generate.matches.assignment.not.found', { assignmentId });
      return 0;
    }

    if (replaceExisting) {
      await db.delete(matches).where(eq(matches.assignmentId, assignmentId));
    }

    // Fetch all matching profiles
    // TODO: Add status field to matchingProfiles table and filter by active status
    const allProfiles = await db.query.matchingProfiles.findMany();

    if (allProfiles.length === 0) {
      log.info('generate.matches.no.profiles', { assignmentId });
      return 0;
    }

    const profileIds = allProfiles.map((p) => p.profileId).filter(Boolean) as string[];

    // Batch fetch all skills for all candidate profiles
    const skillsByProfileId = new Map<string, Record<string, Skill>>();
    const profileSkillRows = new Map<string, Array<typeof skills.$inferSelect>>();
    const atlasLanguageLevelsByProfile = new Map<
      string,
      ReturnType<typeof deriveAtlasLanguageLevels>
    >();
    if (profileIds.length > 0) {
      const allSkills = await db.query.skills.findMany({
        where: inArray(skills.profileId, profileIds),
      });

      for (const row of allSkills) {
        const profileId = row.profileId;
        let map = skillsByProfileId.get(profileId);
        if (!map) {
          map = {};
          skillsByProfileId.set(profileId, map);
        }
        map[row.skillId] = {
          id: row.skillId,
          level: row.level,
          months: row.monthsExperience,
        };

        const existingRows = profileSkillRows.get(profileId) || [];
        existingRows.push(row);
        profileSkillRows.set(profileId, existingRows);
      }

      const skillTaxonomyCodes = Array.from(
        new Set(
          allSkills
            .map((skill) => skill.skillCode || skill.skillId)
            .filter((code): code is string => Boolean(code))
        )
      );
      const skillTaxonomyRows =
        skillTaxonomyCodes.length > 0
          ? await db
              .select({
                code: skillsTaxonomy.code,
                catId: skillsTaxonomy.catId,
                subcatId: skillsTaxonomy.subcatId,
                l3Id: skillsTaxonomy.l3Id,
                slug: skillsTaxonomy.slug,
                nameI18n: skillsTaxonomy.nameI18n,
                tags: skillsTaxonomy.tags,
              })
              .from(skillsTaxonomy)
              .where(inArray(skillsTaxonomy.code, skillTaxonomyCodes))
          : [];
      for (const [profileId, rows] of profileSkillRows.entries()) {
        atlasLanguageLevelsByProfile.set(
          profileId,
          deriveAtlasLanguageLevels(rows, skillTaxonomyRows)
        );
      }
    }

    // Use default weights for assignment matching
    const weights = (assignment.weights as Record<string, number>) || getPreset('balanced');

    const matchResults: Array<{
      profileId: string;
      score: number;
      vector: Record<string, any>;
    }> = [];

    // Apply hard filters + compute scores for each profile
    for (const profile of allProfiles) {
      const skillsMap = skillsByProfileId.get(profile.profileId) ?? {};

      const mustHaveSkills = (assignment.mustHaveSkills as Skill[]) || [];
      const niceToHaveSkills = (assignment.niceToHaveSkills as Skill[]) || [];

      const skillScore = scoreSkills(mustHaveSkills, niceToHaveSkills, skillsMap);
      if (skillScore.hardFail) {
        continue;
      }

      const subscores: Record<string, number> = {
        values: scoreValues(profile.valuesTags || [], assignment.valuesRequired || []),
        causes: scoreCauses(profile.causeTags || [], assignment.causeTags || []),
        skills: skillScore.score,
        experience: scoreExperience(
          Object.values(skillsMap).reduce((sum, s) => sum + (s.months || 0), 0) /
            Math.max(Object.keys(skillsMap).length, 1)
        ),
        verifications: scoreVerifications(
          assignment.verificationGates || [],
          (profile.verified as Record<string, boolean>) || {}
        ),
      };

      // Availability
      if (assignment.startEarliest && assignment.startLatest && profile.availabilityEarliest) {
        subscores.availability = scoreAvailability(
          {
            earliest: new Date(assignment.startEarliest),
            latest: new Date(assignment.startLatest),
          } as DateWindow,
          new Date(profile.availabilityEarliest),
          {
            min: assignment.hoursMin || 0,
            max: assignment.hoursMax || 40,
          } as Range,
          {
            min: profile.hoursMin || 0,
            max: profile.hoursMax || 40,
          } as Range
        );
      } else {
        subscores.availability = 1.0;
      }

      // Location
      if (assignment.locationMode && profile.workMode) {
        subscores.location = scoreLocation(
          assignment.locationMode as LocationMode,
          profile.workMode as LocationMode,
          assignment.country || undefined,
          profile.country || undefined
        );
      } else {
        subscores.location = 1.0;
      }

      // Compensation
      const profileAnnualComp = toAnnualCompensationRange({
        min: profile.compMin,
        max: profile.compMax,
        period: profile.compPeriod,
      });
      if (assignment.compMin && assignment.compMax && profileAnnualComp) {
        subscores.compensation = scoreCompensation(
          { min: assignment.compMin, max: assignment.compMax } as Range,
          profileAnnualComp as Range
        );
      } else {
        subscores.compensation = 1.0;
      }

      // Language
      if (assignment.minLanguage) {
        const minLang = assignment.minLanguage as { code: string; level: string };
        const atlasLanguageLevels = atlasLanguageLevelsByProfile.get(profile.profileId) || {};
        const legacyLanguageLevels = parseLegacyLanguageLevels(profile.languages);
        const candidateLevel = resolveLanguageLevel(
          minLang.code,
          atlasLanguageLevels,
          legacyLanguageLevels
        );

        subscores.language = candidateLevel ? scoreLanguage(minLang.level, candidateLevel) : 0;
      } else {
        subscores.language = 1.0;
      }

      const composed = composeWeighted(subscores, weights);

      matchResults.push({
        profileId: profile.profileId,
        score: composed.total,
        vector: {
          subscores,
          contributions: composed.contributions,
          gaps: skillScore.gaps,
          missing: skillScore.missing,
        },
      });
    }

    matchResults.sort((a, b) =>
      compareMatches(
        { score: a.score, assignmentId, profileId: a.profileId },
        { score: b.score, assignmentId, profileId: b.profileId }
      )
    );

    const topMatches = matchResults.slice(0, 100);

    if (topMatches.length > 0) {
      const matchInserts = topMatches.map((match) => {
        const auditFields = buildMatchAuditFields({
          scoreVersion: CANONICAL_MATCH_SCORE_VERSION,
          assignmentId,
          profileId: match.profileId,
          weights: weights as Record<string, number>,
          subscores: (match.vector.subscores as Record<string, number>) || {},
          missing: (match.vector.missing as string[]) || [],
          gaps: (match.vector.gaps as Array<{ id: string; required: number; have: number }>) || [],
          verificationGates: assignment.verificationGates || [],
        });
        const persistenceFields = buildCanonicalMatchPersistenceFields({
          scoreVersion: CANONICAL_MATCH_AUDIT_FIELDS_ENABLED ? auditFields.scoreVersion : null,
          inputsHash: CANONICAL_MATCH_AUDIT_FIELDS_ENABLED ? auditFields.inputsHash : null,
          reasonCodes: CANONICAL_MATCH_AUDIT_FIELDS_ENABLED ? auditFields.reasonCodes : [],
          generatedAt: CANONICAL_MATCH_AUDIT_FIELDS_ENABLED ? auditFields.generatedAt : null,
        });

        return {
          assignmentId,
          profileId: match.profileId,
          score: match.score.toString(),
          ...persistenceFields,
          vector: match.vector,
          weights,
        };
      });

      // Upsert: update score/vector/weights without overwriting snoozed_until.
      const persisted = await db
        .insert(matches)
        .values(matchInserts)
        .onConflictDoUpdate({
          target: [matches.assignmentId, matches.profileId],
          set: {
            score: sql`excluded.score`,
            scoreVersion: sql`excluded.score_version`,
            modelVersion: sql`excluded.model_version`,
            explanationVersion: sql`excluded.explanation_version`,
            fairnessCheckVersion: sql`excluded.fairness_check_version`,
            fairnessStatus: sql`excluded.fairness_status`,
            fairnessEvaluatedAt: sql`excluded.fairness_evaluated_at`,
            inputsHash: sql`excluded.inputs_hash`,
            reasonCodes: sql`excluded.reason_codes`,
            generatedAt: sql`excluded.generated_at`,
            vector: sql`excluded.vector`,
            weights: sql`excluded.weights`,
          },
        })
        .returning({
          id: matches.id,
          assignmentId: matches.assignmentId,
          profileId: matches.profileId,
          generatedAt: matches.generatedAt,
          reasonCodes: matches.reasonCodes,
        });

      await Promise.all(
        persisted.map(async (row) => {
          await ensureMatchReviewState({
            matchId: row.id,
            assignmentId: row.assignmentId,
            profileId: row.profileId,
            orgId: assignment.orgId,
          });

          await appendSystemReasonLedger({
            matchId: row.id,
            assignmentId: row.assignmentId,
            profileId: row.profileId,
            reasonCodes: (row.reasonCodes || []) as Array<
              Parameters<typeof appendSystemReasonLedger>[0]['reasonCodes'][number]
            >,
            createdAt: row.generatedAt,
          });
        })
      );

      await persistFairnessEvaluationForAssignment({
        assignmentId,
      });
    }

    log.info('generate.matches.success', {
      assignmentId,
      durationMs: Date.now() - startTime,
      totalCandidates: allProfiles.length,
      matchesGenerated: topMatches.length,
    });

    return topMatches.length;
  } catch (error) {
    log.error('generate.matches.failed', {
      assignmentId,
      durationMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return 0;
  }
}
