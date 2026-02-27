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

function skillLabel(skill: any): string {
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

/**
 * GET /api/expertise/verifications/custom/artifacts
 *
 * Returns unverified artifacts for the authenticated requester.
 */
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
      supabase
        .from('skills')
        .select(
          `
          id,
          skill_id,
          skill_code,
          competency_label,
          name_i18n,
          taxonomy:skills_taxonomy!skills_skill_code_fkey (
            name_i18n
          )
        `
        )
        .eq('profile_id', user.id),
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

    if (skillsResult.error) {
      console.error('Failed to load skills for custom verification artifacts:', skillsResult.error);
      return NextResponse.json({ error: 'Failed to load artifacts' }, { status: 500 });
    }

    if (experiencesResult.error) {
      console.error(
        'Failed to load experiences for custom verification artifacts:',
        experiencesResult.error
      );
      return NextResponse.json({ error: 'Failed to load artifacts' }, { status: 500 });
    }

    if (educationResult.error) {
      console.error(
        'Failed to load education for custom verification artifacts:',
        educationResult.error
      );
      return NextResponse.json({ error: 'Failed to load artifacts' }, { status: 500 });
    }

    if (impactStoriesResult.error) {
      console.error(
        'Failed to load impact stories for custom verification artifacts:',
        impactStoriesResult.error
      );
      return NextResponse.json({ error: 'Failed to load artifacts' }, { status: 500 });
    }

    if (projectsResult.error) {
      console.error(
        'Failed to load projects for custom verification artifacts:',
        projectsResult.error
      );
      return NextResponse.json({ error: 'Failed to load artifacts' }, { status: 500 });
    }

    if (volunteeringResult.error) {
      console.error(
        'Failed to load volunteering for custom verification artifacts:',
        volunteeringResult.error
      );
      return NextResponse.json({ error: 'Failed to load artifacts' }, { status: 500 });
    }

    const allSkills = skillsResult.data || [];
    const skillIds = allSkills.map((skill) => skill.id);
    const acceptedSkillIds = new Set<string>();

    if (skillIds.length > 0) {
      const { data: acceptedRequests, error: acceptedError } = await supabase
        .from('skill_verification_requests')
        .select('skill_id')
        .eq('requester_profile_id', user.id)
        .eq('status', 'accepted')
        .in('skill_id', skillIds);

      if (acceptedError) {
        console.error('Failed to load accepted skill verification requests:', acceptedError);
        return NextResponse.json({ error: 'Failed to load artifacts' }, { status: 500 });
      }

      for (const request of acceptedRequests || []) {
        if (request.skill_id) {
          acceptedSkillIds.add(request.skill_id);
        }
      }
    }

    const artifacts: Record<ArtifactGroup, CustomArtifact[]> = {
      skill: allSkills
        .filter((skill) => !acceptedSkillIds.has(skill.id))
        .map((skill) => ({
          id: skill.id,
          type: 'skill',
          label: skillLabel(skill),
          subtitle: skill.competency_label ? `Level ${skill.competency_label}` : undefined,
        })),
      experience: (experiencesResult.data || []).map((experience) => ({
        id: experience.id,
        type: 'experience',
        label: experience.title,
        subtitle: experience.org_description || undefined,
      })),
      education: (educationResult.data || []).map((item) => ({
        id: item.id,
        type: 'education',
        label: `${item.degree} at ${item.institution}`,
      })),
      impact_story: (impactStoriesResult.data || []).map((story) => ({
        id: story.id,
        type: 'impact_story',
        label: story.title,
        subtitle: story.org_description || undefined,
      })),
      project: (projectsResult.data || []).map((project) => ({
        id: project.id,
        type: 'project',
        label: project.title,
        subtitle:
          project.role_title || project.organization_name
            ? [project.role_title, project.organization_name].filter(Boolean).join(' at ')
            : undefined,
      })),
      volunteering: (volunteeringResult.data || []).map((entry) => ({
        id: entry.id,
        type: 'volunteering',
        label: entry.title,
        subtitle: entry.org_description || undefined,
      })),
    };

    const total = Object.values(artifacts).reduce((sum, list) => sum + list.length, 0);

    return NextResponse.json({
      artifacts,
      total,
    });
  } catch (error) {
    console.error('Custom verification artifacts GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
