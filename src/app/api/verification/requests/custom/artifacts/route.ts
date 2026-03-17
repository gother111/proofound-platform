import { NextResponse } from 'next/server';

import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { parseCustomSkillName } from '@/lib/verification/custom-verification';

type ArtifactGroup =
  | 'skill'
  | 'experience'
  | 'education'
  | 'impact_story'
  | 'project'
  | 'volunteering';

type CustomArtifact = {
  id: string;
  type: ArtifactGroup;
  label: string;
  subtitle?: string;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type SkillArtifactRow = {
  id: string;
  skill_id: string | null;
  skill_code: string | null;
  competency_label: string | null;
  name_i18n?: unknown;
  taxonomy?: {
    name_i18n?: unknown;
  } | null;
};

type SkillTaxonomyRow = {
  code: string;
  name_i18n?: unknown;
};

type SkillLoadResult = {
  data: SkillArtifactRow[] | null;
  error: unknown | null;
};

function uniqueNonEmptySkillCodes(skills: Array<{ skill_code: string | null }>): string[] {
  return [
    ...new Set(skills.map((skill) => skill.skill_code).filter((code): code is string => !!code)),
  ];
}

async function loadSkillsForArtifacts(
  supabase: SupabaseServerClient,
  profileId: string
): Promise<SkillLoadResult> {
  const primarySkillSelect = `
    id,
    skill_id,
    skill_code,
    competency_label,
    name_i18n,
    taxonomy:skills_taxonomy!skills_skill_code_fkey (
      name_i18n
    )
  `;
  const fallbackSkillSelect = 'id, skill_id, skill_code, competency_label, name_i18n';

  const primaryResult = await supabase
    .from('skills')
    .select(primarySkillSelect)
    .eq('profile_id', profileId);

  if (!primaryResult.error) {
    return {
      data: (primaryResult.data as SkillArtifactRow[] | null) || [],
      error: null,
    };
  }

  console.warn(
    'Falling back to manual taxonomy lookup for custom verification artifact skills:',
    primaryResult.error
  );

  const fallbackSkillsResult = await supabase
    .from('skills')
    .select(fallbackSkillSelect)
    .eq('profile_id', profileId);

  if (fallbackSkillsResult.error) {
    return {
      data: null,
      error: fallbackSkillsResult.error,
    };
  }

  const fallbackSkills =
    ((fallbackSkillsResult.data as SkillArtifactRow[] | null) || []).map((skill) => ({
      ...skill,
      taxonomy: null,
    })) || [];

  const skillCodes = uniqueNonEmptySkillCodes(fallbackSkills);
  if (skillCodes.length === 0) {
    return {
      data: fallbackSkills,
      error: null,
    };
  }

  const taxonomyResult = await supabase
    .from('skills_taxonomy')
    .select('code, name_i18n')
    .in('code', skillCodes);

  if (taxonomyResult.error) {
    return {
      data: null,
      error: taxonomyResult.error,
    };
  }

  const taxonomyByCode = new Map<string, { name_i18n?: unknown }>();
  for (const taxonomy of (taxonomyResult.data as SkillTaxonomyRow[] | null) || []) {
    taxonomyByCode.set(taxonomy.code, {
      name_i18n: taxonomy.name_i18n,
    });
  }

  const stitchedSkills = fallbackSkills.map((skill) => ({
    ...skill,
    taxonomy: skill.skill_code ? taxonomyByCode.get(skill.skill_code) || null : null,
  }));

  return {
    data: stitchedSkills,
    error: null,
  };
}

function readI18nEnglish(value: unknown): string | null {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object' && value !== null && 'en' in value) {
    const english = (value as { en?: unknown }).en;
    if (typeof english === 'string' && english.trim().length > 0) {
      return english;
    }
  }

  return null;
}

function skillLabel(skill: SkillArtifactRow): string {
  const directName = readI18nEnglish(skill?.name_i18n);
  if (directName) {
    return directName;
  }

  const taxonomyName = readI18nEnglish(skill?.taxonomy?.name_i18n);
  if (taxonomyName) {
    return taxonomyName;
  }

  const parsed = parseCustomSkillName(skill?.skill_id);
  if (parsed) {
    return parsed;
  }

  return 'Untitled skill';
}

export async function GET() {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const [
      skillsResult,
      experiencesResult,
      educationResult,
      impactStoriesResult,
      projectsResult,
      volunteeringResult,
    ] = await Promise.all([
      loadSkillsForArtifacts(supabase, user.id),
      supabase
        .from('experiences')
        .select('id, title, org_description')
        .eq('user_id', user.id)
        .eq('verified', false),
      supabase
        .from('education')
        .select('id, institution, degree')
        .eq('user_id', user.id)
        .eq('verified', false),
      supabase
        .from('impact_stories')
        .select('id, title, org_description')
        .eq('user_id', user.id)
        .eq('verified', false),
      supabase
        .from('projects')
        .select('id, title, role_title, organization_name')
        .eq('user_id', user.id)
        .eq('verified', false),
      supabase
        .from('volunteering')
        .select('id, title, org_description')
        .eq('user_id', user.id)
        .eq('verified', false),
    ]);

    const failures = [
      skillsResult.error,
      experiencesResult.error,
      educationResult.error,
      impactStoriesResult.error,
      projectsResult.error,
      volunteeringResult.error,
    ].filter(Boolean);

    if (failures.length === 6) {
      return NextResponse.json({ error: 'Failed to load verification artifacts' }, { status: 500 });
    }

    const artifacts: Record<ArtifactGroup, CustomArtifact[]> = {
      skill: ((skillsResult.data as SkillArtifactRow[] | null) || []).map((skill) => ({
        id: skill.id,
        type: 'skill',
        label: skillLabel(skill),
        subtitle: skill.competency_label ? `Level ${skill.competency_label}` : undefined,
      })),
      experience: ((experiencesResult.data as any[] | null) || []).map((item) => ({
        id: item.id,
        type: 'experience',
        label: item.title,
        subtitle: item.org_description || undefined,
      })),
      education: ((educationResult.data as any[] | null) || []).map((item) => ({
        id: item.id,
        type: 'education',
        label: `${item.degree} at ${item.institution}`,
      })),
      impact_story: ((impactStoriesResult.data as any[] | null) || []).map((item) => ({
        id: item.id,
        type: 'impact_story',
        label: item.title,
        subtitle: item.org_description || undefined,
      })),
      project: ((projectsResult.data as any[] | null) || []).map((item) => ({
        id: item.id,
        type: 'project',
        label: item.title,
        subtitle: item.organization_name || item.role_title || undefined,
      })),
      volunteering: ((volunteeringResult.data as any[] | null) || []).map((item) => ({
        id: item.id,
        type: 'volunteering',
        label: item.title,
        subtitle: item.org_description || undefined,
      })),
    };

    const total = Object.values(artifacts).reduce((sum, group) => sum + group.length, 0);
    return NextResponse.json({ total, artifacts });
  } catch (error) {
    console.error('Custom verification artifacts GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
