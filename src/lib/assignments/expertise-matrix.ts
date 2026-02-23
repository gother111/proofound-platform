export type RequirementSkill = {
  id: string;
  level?: number | null;
};

export type MatrixSkillRow = {
  assignmentId: string;
  skillCode: string;
  requiredLevel: number;
  stakeholderRole: string;
  linkedOutcomeId?: string | null;
  outcomeRationale?: string | null;
};

const NICE_TO_HAVE_ROLES = new Set(['nice', 'nice_to_have', 'preferred', 'optional']);

export function isNiceToHaveRole(role: string | null | undefined): boolean {
  return NICE_TO_HAVE_ROLES.has((role || '').trim().toLowerCase());
}

function clampLevel(level: number | null | undefined, fallback = 1): number {
  if (typeof level !== 'number' || Number.isNaN(level)) return fallback;
  return Math.max(0, Math.min(5, Math.round(level)));
}

function normalizeSkillCode(skillId: string): string {
  return String(skillId || '').trim();
}

/**
 * Build canonical matrix rows from assignment requirements.
 * Must-have wins over nice-to-have when the same skill appears in both arrays.
 */
export function buildMatrixRowsFromRequirements(
  assignmentId: string,
  mustHaveSkills: RequirementSkill[] = [],
  niceToHaveSkills: RequirementSkill[] = []
): MatrixSkillRow[] {
  const rowsBySkill = new Map<string, MatrixSkillRow>();

  for (const skill of niceToHaveSkills) {
    const skillCode = normalizeSkillCode(skill.id);
    if (!skillCode) continue;
    rowsBySkill.set(skillCode, {
      assignmentId,
      skillCode,
      requiredLevel: clampLevel(skill.level, 1),
      stakeholderRole: 'nice',
    });
  }

  for (const skill of mustHaveSkills) {
    const skillCode = normalizeSkillCode(skill.id);
    if (!skillCode) continue;
    const existing = rowsBySkill.get(skillCode);
    rowsBySkill.set(skillCode, {
      assignmentId,
      skillCode,
      requiredLevel: Math.max(clampLevel(skill.level, 1), existing?.requiredLevel ?? 0),
      stakeholderRole: 'must',
    });
  }

  return Array.from(rowsBySkill.values());
}

/**
 * Convert matrix rows back to assignments.mustHaveSkills/niceToHaveSkills shape.
 */
export function deriveRequirementsFromMatrix(
  rows: Array<{ skillCode: string; requiredLevel: number; stakeholderRole?: string | null }>
): {
  mustHaveSkills: Array<{ id: string; level: number }>;
  niceToHaveSkills: Array<{ id: string; level: number }>;
} {
  const mustById = new Map<string, number>();
  const niceById = new Map<string, number>();

  for (const row of rows) {
    const skillCode = normalizeSkillCode(row.skillCode);
    if (!skillCode) continue;

    const level = clampLevel(row.requiredLevel, 1);
    if (isNiceToHaveRole(row.stakeholderRole)) {
      if (!mustById.has(skillCode)) {
        const existing = niceById.get(skillCode);
        niceById.set(skillCode, existing ? Math.max(existing, level) : level);
      }
      continue;
    }

    const existing = mustById.get(skillCode);
    mustById.set(skillCode, existing ? Math.max(existing, level) : level);
    niceById.delete(skillCode);
  }

  return {
    mustHaveSkills: Array.from(mustById.entries()).map(([id, level]) => ({ id, level })),
    niceToHaveSkills: Array.from(niceById.entries()).map(([id, level]) => ({ id, level })),
  };
}
