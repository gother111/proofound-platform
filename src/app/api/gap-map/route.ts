import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import {
  computeSkillGaps,
  type AssignmentRequirement,
  type SkillMetadata,
  type UserSkill,
} from '@/lib/skills/gap';
import { getLearningResources } from '@/lib/skills/resources';

export const dynamic = 'force-dynamic';

type GapRequestBody = {
  assignmentIds?: string[];
};

type TaxonomyRow = {
  code: string;
  name_i18n?: Record<string, string> | null;
  cat_id?: number | null;
  subcat_id?: number | null;
  l3_id?: number | null;
};

type CategoryRow = { cat_id: number; name_i18n?: Record<string, string> | null };
type SubcategoryRow = {
  cat_id: number;
  subcat_id: number;
  name_i18n?: Record<string, string> | null;
};
type L3Row = {
  cat_id: number;
  subcat_id: number;
  l3_id: number;
  name_i18n?: Record<string, string> | null;
};

async function parseBody(request: NextRequest): Promise<GapRequestBody> {
  if (request.method !== 'POST') return {};

  try {
    const body = await request.json();
    return body || {};
  } catch {
    return {};
  }
}

export async function POST(request: NextRequest) {
  const body = await parseBody(request);
  return handleGapRequest(body);
}

// Allow GET for convenience (defaults to interested assignments).
export async function GET() {
  return handleGapRequest({});
}

async function handleGapRequest(body: GapRequestBody) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    // 1) Identify assignments to analyze
    let assignmentIds: string[] = Array.isArray(body.assignmentIds)
      ? body.assignmentIds.filter((id): id is string => typeof id === 'string' && id.length > 0)
      : [];

    if (assignmentIds.length === 0) {
      const { data: interestRows, error: interestError } = await supabase
        .from('match_interest')
        .select('assignment_id')
        .eq('actor_profile_id', user.id);

      if (interestError) {
        console.error('gap-map.fetch-interest.error', interestError);
        return NextResponse.json(
          { error: 'Unable to load interested assignments' },
          { status: 500 }
        );
      }

      assignmentIds =
        interestRows
          ?.map((row: { assignment_id: string | null }) => row.assignment_id)
          .filter(Boolean) ?? [];
    }

    if (assignmentIds.length === 0) {
      return NextResponse.json(
        {
          gaps: [],
          meta: {
            assignmentCount: 0,
            assignmentsWithSkillData: 0,
            userSkillsCount: 0,
          },
          message: 'No interested assignments found. Add interests to see gap analysis.',
        },
        { status: 200 }
      );
    }

    // 2) Fetch assignment roles for context
    const { data: assignmentsData } = await supabase
      .from('assignments')
      .select('id, role')
      .in('id', assignmentIds);

    const assignmentRoleMap = new Map<string, string>();
    assignmentsData?.forEach((assignment: { id: string; role?: string | null }) => {
      if (assignment.id) {
        assignmentRoleMap.set(assignment.id, assignment.role ?? 'Assignment');
      }
    });

    // 3) Fetch required skills per assignment
    const { data: requirementsData, error: requirementsError } = await supabase
      .from('assignment_expertise_matrix')
      .select('assignment_id, skill_code, min_level, weight, is_required')
      .in('assignment_id', assignmentIds);

    if (requirementsError) {
      console.error('gap-map.fetch-requirements.error', requirementsError);
      return NextResponse.json(
        { error: 'Unable to load assignment skill requirements' },
        { status: 500 }
      );
    }

    if (!requirementsData || requirementsData.length === 0) {
      return NextResponse.json(
        {
          gaps: [],
          meta: {
            assignmentCount: assignmentIds.length,
            assignmentsWithSkillData: 0,
            userSkillsCount: 0,
          },
          message: 'Assignments have no recorded skill requirements yet.',
        },
        { status: 200 }
      );
    }

    const requirements: AssignmentRequirement[] = requirementsData
      .filter((row) => row.skill_code)
      .map((row) => ({
        assignmentId: row.assignment_id,
        assignmentRole: assignmentRoleMap.get(row.assignment_id ?? '') ?? null,
        skillCode: row.skill_code,
        minLevel: row.min_level ?? 0,
        weight: row.weight ?? 1,
        isRequired: row.is_required ?? true,
      }));

    // 4) Fetch user skills
    const { data: userSkillsData, error: userSkillsError } = await supabase
      .from('skills')
      .select('skill_code, level, competency_label')
      .eq('profile_id', user.id);

    if (userSkillsError) {
      console.error('gap-map.fetch-user-skills.error', userSkillsError);
      return NextResponse.json({ error: 'Unable to load user skills' }, { status: 500 });
    }

    const userSkills: UserSkill[] =
      userSkillsData
        ?.filter((skill) => skill.skill_code)
        .map((skill) => ({
          skillCode: skill.skill_code as string,
          level: skill.level ?? 0,
          competencyLabel: skill.competency_label ?? null,
        })) ?? [];

    // 5) Fetch taxonomy metadata for the required skill codes
    const skillCodes = Array.from(
      new Set(requirements.map((req) => req.skillCode).filter(Boolean))
    );

    const { data: taxonomyRows } = await supabase
      .from('skills_taxonomy')
      .select('code, name_i18n, cat_id, subcat_id, l3_id')
      .in('code', skillCodes);

    const catIds = Array.from(
      new Set((taxonomyRows ?? []).map((row) => row.cat_id).filter(Boolean))
    ) as number[];
    const subcatIds = Array.from(
      new Set((taxonomyRows ?? []).map((row) => row.subcat_id).filter(Boolean))
    ) as number[];
    const l3Ids = Array.from(
      new Set((taxonomyRows ?? []).map((row) => row.l3_id).filter(Boolean))
    ) as number[];

    const [{ data: categoryRows }, { data: subcategoryRows }, { data: l3Rows }] = await Promise.all(
      [
        catIds.length
          ? supabase.from('skills_categories').select('cat_id, name_i18n').in('cat_id', catIds)
          : Promise.resolve({ data: [] as CategoryRow[] }),
        subcatIds.length
          ? supabase
              .from('skills_subcategories')
              .select('cat_id, subcat_id, name_i18n')
              .in('subcat_id', subcatIds)
          : Promise.resolve({ data: [] as SubcategoryRow[] }),
        l3Ids.length
          ? supabase
              .from('skills_l3')
              .select('cat_id, subcat_id, l3_id, name_i18n')
              .in('l3_id', l3Ids)
          : Promise.resolve({ data: [] as L3Row[] }),
      ]
    );

    const categoryMap = new Map<number, string>();
    categoryRows?.forEach((row: CategoryRow) => {
      categoryMap.set(row.cat_id, (row.name_i18n?.en as string) ?? 'Category');
    });

    const subcategoryMap = new Map<number, string>();
    subcategoryRows?.forEach((row: SubcategoryRow) => {
      subcategoryMap.set(row.subcat_id, (row.name_i18n?.en as string) ?? 'Subcategory');
    });

    const l3Map = new Map<number, string>();
    l3Rows?.forEach((row: L3Row) => {
      l3Map.set(row.l3_id, (row.name_i18n?.en as string) ?? 'Skill Group');
    });

    const metadata: Record<string, SkillMetadata> = {};
    taxonomyRows?.forEach((row: TaxonomyRow) => {
      metadata[row.code] = {
        code: row.code,
        name: (row.name_i18n?.en as string) ?? row.code,
        l1: row.cat_id ? (categoryMap.get(row.cat_id) ?? undefined) : undefined,
        l2: row.subcat_id ? (subcategoryMap.get(row.subcat_id) ?? undefined) : undefined,
        l3: row.l3_id ? (l3Map.get(row.l3_id) ?? undefined) : undefined,
      };
    });

    // 6) Compute gaps
    const gaps = computeSkillGaps({
      userSkills,
      requirements,
      metadata,
      resolveResources: getLearningResources,
    });

    return NextResponse.json(
      {
        gaps,
        meta: {
          assignmentCount: assignmentIds.length,
          assignmentsWithSkillData: new Set(requirements.map((req) => req.assignmentId)).size,
          userSkillsCount: userSkills.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('gap-map.unexpected.error', error);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
