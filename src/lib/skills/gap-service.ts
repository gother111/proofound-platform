import { createClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type SkillGap = {
  skillCode: string;
  skillName: string;
  currentLevel: number;
  targetLevel: number;
  gap: number;
  importance: number; // 0-100 scaled by demand
  assignments: Array<{ id: string; role?: string; weight: number }>;
  tags?: string[];
  catId?: number;
  subcatId?: number;
  l3Id?: number;
};

export type GapMatrixRow = {
  assignmentId: string;
  role?: string;
  requirements: Array<{
    skillCode: string;
    targetLevel: number;
    currentLevel: number;
    gap: number;
    weight: number;
  }>;
};

export type GapAnalysisResult = {
  gaps: SkillGap[];
  assignments: Array<{ id: string; role?: string; status?: string; updatedAt?: string }>;
  matrix: GapMatrixRow[];
  coverage: { totalRequired: number; missing: number; covered: number };
};

const safeLogger = {
  debug: (_msg: string, _ctx?: unknown) => {},
  info: (_msg: string, _ctx?: unknown) => {},
  warn: (_msg: string, _ctx?: unknown) => {},
  error: (_msg: string, _err?: unknown, _ctx?: unknown) => {},
};

const logger = typeof createLogger === 'function' ? createLogger('gap-service') : safeLogger;

const firstI18nValue = (val: Record<string, string> | null | undefined) => {
  if (!val) return undefined;
  if (val.en) return val.en;
  const first = Object.values(val)[0];
  return typeof first === 'string' ? first : undefined;
};

const unique = <T>(arr: T[]) => Array.from(new Set(arr));

export type GapAnalysisOptions = {
  profileId: string;
  limitAssignments?: number;
  timeframeDays?: number;
  roleFilter?: string;
  supabase?: Supabase;
};

/**
 * Compute gaps between a user's skills and the skills required by the
 * assignments they are viewing/interested in.
 */
export async function computeSkillGaps({
  profileId,
  limitAssignments = 20,
  timeframeDays = 180,
  roleFilter,
  supabase,
}: GapAnalysisOptions): Promise<GapAnalysisResult> {
  const client = supabase ?? (await createClient());

  // Fetch user skills (L4)
  const { data: userSkills } = await client
    .from('skills')
    .select('skill_code, level, last_used_at, months_experience, recency_multiplier')
    .eq('profile_id', profileId);

  const userSkillRows = userSkills ?? [];
  const userSkillMap = new Map(
    userSkillRows
      .filter((s) => s.skill_code)
      .map((s) => [
        s.skill_code as string,
        {
          level: s.level ?? 0,
          lastUsedAt: s.last_used_at,
          monthsExperience: s.months_experience ?? 0,
          recencyMultiplier: s.recency_multiplier ?? 1,
        },
      ])
  );

  // Candidate assignments: things the user showed interest in or was matched to
  const [interestsRes, matchesRes] = await Promise.all([
    client
      .from('match_interest')
      .select('assignment_id, created_at')
      .eq('actor_profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(limitAssignments),
    client
      .from('matches')
      .select('assignment_id, score, created_at')
      .eq('profile_id', profileId)
      .order('score', { ascending: false })
      .limit(limitAssignments),
  ]);

  const assignmentIds = unique([
    ...(interestsRes.data?.map((row) => row.assignment_id).filter(Boolean) ?? []),
    ...(matchesRes.data?.map((row) => row.assignment_id).filter(Boolean) ?? []),
  ]);

  // If nothing explicit, fall back to recent active assignments
  if (assignmentIds.length === 0) {
    const { data: fallback } = await client
      .from('assignments')
      .select('id')
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(8);
    fallback?.forEach((row) => assignmentIds.push(row.id));
  }

  if (assignmentIds.length === 0) {
    return {
      gaps: [],
      assignments: [],
      matrix: [],
      coverage: { totalRequired: 0, missing: 0, covered: 0 },
    };
  }

  // Pull assignment metadata for filtering
  const { data: assignmentMeta } = await client
    .from('assignments')
    .select('id, role, status, updated_at')
    .in('id', assignmentIds);

  const assignmentMetaRows = assignmentMeta ?? [];
  const timeframeCutoff = new Date();
  timeframeCutoff.setDate(timeframeCutoff.getDate() - timeframeDays);

  const filteredAssignments = assignmentMetaRows
    .filter((a) => {
      const updated = a.updated_at ? new Date(a.updated_at) : null;
      const withinTimeframe = updated ? updated >= timeframeCutoff : true;
      const matchesRole = roleFilter ? (a.role || '').toLowerCase().includes(roleFilter.toLowerCase()) : true;
      return withinTimeframe && matchesRole;
    })
    .slice(0, limitAssignments);

  const filteredAssignmentIds = filteredAssignments.map((a) => a.id);

  if (filteredAssignmentIds.length === 0) {
    return {
      gaps: [],
      assignments: [],
      matrix: [],
      coverage: { totalRequired: 0, missing: 0, covered: 0 },
    };
  }

  // Fetch required skills per assignment
  const { data: requirements, error: reqError } = await client
    .from('assignment_expertise_matrix')
    .select('assignment_id, skill_code, min_level, weight, is_required')
    .in('assignment_id', filteredAssignmentIds);

  if (reqError) {
    logger.error('Failed to fetch expertise matrix', reqError);
  }

  const requirementRows = requirements ?? [];
  const demandMap = new Map<
    string,
    {
      targetLevel: number;
      totalWeight: number;
      severity: number;
      assignments: Array<{ id: string; role?: string; weight: number }>;
    }
  >();

  let maxSeverity = 1;
  let missingCount = 0;
  const matrix: GapMatrixRow[] = [];

  filteredAssignments.forEach((assignment) => {
    const reqsForAssignment = requirementRows.filter((req) => req.assignment_id === assignment.id);

    const row: GapMatrixRow = {
      assignmentId: assignment.id,
      role: assignment.role ?? undefined,
      requirements: [],
    };

    reqsForAssignment.forEach((req) => {
      const skillCode = req.skill_code;
      const targetLevel = req.min_level ?? 1;
      const weight = req.weight ?? 1;
      const currentLevel = userSkillMap.get(skillCode)?.level ?? 0;
      const gap = Math.max(targetLevel - currentLevel, 0);

      if (gap > 0) missingCount += 1;

      row.requirements.push({ skillCode, targetLevel, currentLevel, gap, weight });

      if (gap <= 0) return;

      const existing = demandMap.get(skillCode) ?? {
        targetLevel: targetLevel,
        totalWeight: 0,
        severity: 0,
        assignments: [] as Array<{ id: string; role?: string; weight: number }>,
      };

      const severity = gap * weight;
      existing.targetLevel = Math.max(existing.targetLevel, targetLevel);
      existing.totalWeight += weight;
      existing.severity += severity;
      existing.assignments.push({ id: assignment.id, role: assignment.role ?? undefined, weight });

      maxSeverity = Math.max(maxSeverity, existing.severity);
      demandMap.set(skillCode, existing);
    });

    matrix.push(row);
  });

  const requiredEntries = requirementRows.length;
  const coverage = {
    totalRequired: requiredEntries,
    missing: missingCount,
    covered: Math.max(requiredEntries - missingCount, 0),
  };

  if (demandMap.size === 0) {
    return { gaps: [], assignments: filteredAssignments, matrix, coverage };
  }

  // Fetch taxonomy for naming
  const codes = Array.from(demandMap.keys());
  const { data: taxonomy } = await client
    .from('skills_taxonomy')
    .select('code, name_i18n, cat_id, subcat_id, l3_id, tags')
    .in('code', codes);

  const taxonomyRows = taxonomy ?? [];
  const taxonomyMap = new Map(
    taxonomyRows.map((t) => [
      t.code,
      {
        name: firstI18nValue(t.name_i18n) ?? t.code,
        catId: t.cat_id,
        subcatId: t.subcat_id,
        l3Id: t.l3_id,
        tags: t.tags,
      },
    ])
  );

  const gaps: SkillGap[] = Array.from(demandMap.entries()).map(([skillCode, meta]) => {
    const currentLevel = userSkillMap.get(skillCode)?.level ?? 0;
    const importance = Math.round((meta.severity / maxSeverity) * 100);
    const tax = taxonomyMap.get(skillCode);

    return {
      skillCode,
      skillName: tax?.name ?? skillCode,
      currentLevel,
      targetLevel: meta.targetLevel,
      gap: Math.max(meta.targetLevel - currentLevel, 0),
      importance,
      assignments: meta.assignments,
      tags: tax?.tags,
      catId: tax?.catId,
      subcatId: tax?.subcatId,
      l3Id: tax?.l3Id,
    };
  });

  // Sort by importance desc, then gap size
  gaps.sort((a, b) => {
    if (b.importance !== a.importance) return b.importance - a.importance;
    return b.gap - a.gap;
  });

  return {
    gaps,
    assignments: filteredAssignments.map((a) => ({
      id: a.id,
      role: a.role ?? undefined,
      status: a.status ?? undefined,
      updatedAt: a.updated_at ?? undefined,
    })),
    matrix,
    coverage,
  };
}
