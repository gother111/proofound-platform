import type { LearningResource } from './resources';

export type UserSkill = {
  skillCode: string;
  level: number;
  competencyLabel?: string | null;
};

export type AssignmentRequirement = {
  skillCode: string;
  minLevel: number;
  weight?: number | null;
  isRequired?: boolean | null;
  assignmentId: string;
  assignmentRole?: string | null;
};

export type SkillMetadata = {
  code: string;
  name?: string | null;
  l1?: string | null;
  l2?: string | null;
  l3?: string | null;
};

export type SkillGap = {
  skillCode: string;
  skillName: string;
  l1?: string;
  l2?: string;
  l3?: string;
  currentLevel: number;
  targetLevel: number;
  gap: number;
  importance: number; // 0-100
  assignmentCount: number;
  assignments: string[];
  learningResources: LearningResource[];
};

type GapAccumulator = {
  currentLevel: number;
  targetLevel: number;
  requiredCount: number;
  totalWeight: number;
  assignmentCount: number;
  assignments: Set<string>;
};

type ComputeParams = {
  userSkills: UserSkill[];
  requirements: AssignmentRequirement[];
  metadata?: Record<string, SkillMetadata | undefined>;
  resolveResources?: (skillCode: string, skillName?: string) => LearningResource[];
};

function normalize(code: string) {
  return code.trim();
}

function importanceScore(acc: GapAccumulator): number {
  const gapSize = Math.max(acc.targetLevel - acc.currentLevel, 0);
  const gapScore = Math.min(1, gapSize / Math.max(acc.targetLevel, 1));
  const frequencyScore = Math.min(1, acc.assignmentCount / 5);
  const averageWeight = acc.totalWeight / Math.max(acc.assignmentCount, 1);
  const weightScore = Math.min(1, averageWeight / 3);
  const requiredBoost = acc.requiredCount > 0 ? 1.1 : 1;

  const raw = (gapScore * 0.45 + frequencyScore * 0.35 + weightScore * 0.2) * requiredBoost;

  return Math.round(Math.min(raw, 1) * 100);
}

/**
 * Compute skill gaps by comparing required skills for assignments against a user's skills.
 */
export function computeSkillGaps({
  userSkills,
  requirements,
  metadata = {},
  resolveResources,
}: ComputeParams): SkillGap[] {
  if (!requirements.length) {
    return [];
  }

  const userSkillLevels = new Map<string, number>();
  for (const skill of userSkills) {
    if (!skill.skillCode) continue;
    const code = normalize(skill.skillCode);
    const existing = userSkillLevels.get(code) ?? 0;
    userSkillLevels.set(code, Math.max(existing, skill.level));
  }

  const gapMap = new Map<string, GapAccumulator>();

  for (const req of requirements) {
    if (!req.skillCode) continue;

    const code = normalize(req.skillCode);
    const minLevel = Math.max(req.minLevel ?? 0, 0);
    const currentLevel = userSkillLevels.get(code) ?? 0;

    // If the user already meets or exceeds the minimum level, skip this requirement.
    if (currentLevel >= minLevel && minLevel > 0) {
      continue;
    }

    const existing = gapMap.get(code) ?? {
      currentLevel,
      targetLevel: minLevel,
      requiredCount: 0,
      totalWeight: 0,
      assignmentCount: 0,
      assignments: new Set<string>(),
    };

    existing.currentLevel = currentLevel;
    existing.targetLevel = Math.max(existing.targetLevel, minLevel);
    existing.assignmentCount += 1;
    existing.totalWeight += req.weight ?? 1;
    existing.requiredCount += req.isRequired === false ? 0 : 1;

    const assignmentLabel =
      req.assignmentRole?.trim() || req.assignmentId?.slice(0, 8) || 'assignment';
    existing.assignments.add(assignmentLabel);

    gapMap.set(code, existing);
  }

  const gaps: SkillGap[] = [];

  for (const [code, acc] of gapMap.entries()) {
    const meta = metadata[code];
    const skillName = meta?.name || code;
    const gap = Math.max(acc.targetLevel - acc.currentLevel, 0);
    const importance = importanceScore(acc);
    const learningResources = resolveResources ? resolveResources(code, skillName) : [];

    gaps.push({
      skillCode: code,
      skillName,
      l1: meta?.l1 ?? undefined,
      l2: meta?.l2 ?? undefined,
      l3: meta?.l3 ?? undefined,
      currentLevel: acc.currentLevel,
      targetLevel: acc.targetLevel,
      gap,
      importance,
      assignmentCount: acc.assignmentCount,
      assignments: Array.from(acc.assignments),
      learningResources,
    });
  }

  return gaps.sort((a, b) => b.importance - a.importance);
}
