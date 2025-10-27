/**
 * Profile Data Transformer
 *
 * Transforms data between useProfileData hook format and ProfileData component format.
 * This keeps the design components decoupled from the specific data fetching implementation.
 */

import type { ProfileData } from "./profile-types";

/**
 * Hook data format (from useProfileData)
 */
export interface HookProfileData {
  profile: {
    id: string;
    displayName: string;
    location: string | null;
    joinedDate: string;
    avatar: string | null;
    coverImage: string | null;
    tagline: string | null;
    verified: boolean;
    mission: string | null;
    values: Array<{
      id: string;
      icon: string;
      label: string;
      verified: boolean;
    }>;
    causes: string[];
    skills: Array<{
      id: string;
      name: string;
      verified: boolean;
    }>;
  };
  impactStories: Array<{
    id: string;
    title: string;
    orgDescription: string;
    impact: string;
    businessValue: string;
    outcomes: string;
    timeline: string;
    verified: boolean;
  }>;
  experiences: Array<{
    id: string;
    title: string;
    orgDescription: string;
    duration: string;
    learning: string;
    growth: string;
    verified: boolean;
  }>;
  education: Array<{
    id: string;
    institution: string;
    degree: string;
    duration: string;
    skills: string;
    projects: string;
    verified: boolean;
  }>;
  volunteering: Array<{
    id: string;
    title: string;
    orgDescription: string;
    duration: string;
    cause: string;
    impact: string;
    skillsDeployed: string;
    personalWhy: string;
    verified: boolean;
  }>;
  profileCompletion: number;
}

/**
 * Transform hook data to component props format
 */
export function transformToComponentData(hookData: HookProfileData): ProfileData {
  return {
    basicInfo: {
      name: hookData.profile.displayName,
      location: hookData.profile.location,
      joinedDate: hookData.profile.joinedDate,
      avatar: hookData.profile.avatar,
      coverImage: hookData.profile.coverImage,
      tagline: hookData.profile.tagline,
    },
    mission: hookData.profile.mission,
    values: hookData.profile.values.map((v) => ({
      id: v.id,
      icon: v.icon,
      label: v.label,
      verified: v.verified,
    })),
    causes: hookData.profile.causes,
    skills: hookData.profile.skills.map((s) => ({
      id: s.id,
      name: s.name,
      verified: s.verified,
    })),
    impactStories: hookData.impactStories.map((story) => ({
      id: story.id,
      title: story.title,
      orgDescription: story.orgDescription,
      timeline: story.timeline,
      impact: story.impact,
      businessValue: story.businessValue,
      outcomes: story.outcomes,
      verified: story.verified,
    })),
    experiences: hookData.experiences.map((exp) => ({
      id: exp.id,
      title: exp.title,
      orgDescription: exp.orgDescription,
      duration: exp.duration,
      learning: exp.learning,
      growth: exp.growth,
      verified: exp.verified,
    })),
    education: hookData.education.map((edu) => ({
      id: edu.id,
      degree: edu.degree,
      institution: edu.institution,
      duration: edu.duration,
      skills: edu.skills,
      projects: edu.projects,
      verified: edu.verified,
    })),
    volunteering: hookData.volunteering.map((vol) => ({
      id: vol.id,
      title: vol.title,
      orgDescription: vol.orgDescription,
      duration: vol.duration,
      cause: vol.cause,
      personalWhy: vol.personalWhy,
      impact: vol.impact,
      skillsDeployed: vol.skillsDeployed,
      verified: vol.verified,
    })),
    networkStats: {
      people: 0, // TODO: Connect to actual network data
      organizations: 0,
      institutions: 0,
    },
    profileCompletion: hookData.profileCompletion,
  };
}

/**
 * Calculate profile completion percentage
 * This matches the logic from the existing implementation
 */
export function calculateProfileCompletion(data: ProfileData): number {
  let score = 0;
  let total = 10;

  // Basic info (4 points)
  if (data.basicInfo.avatar) score += 1;
  if (data.basicInfo.tagline) score += 1;
  if (data.basicInfo.location) score += 1;
  if (data.basicInfo.coverImage) score += 1;

  // Core content (3 points)
  if (data.mission) score += 1;
  if (data.values.length > 0) score += 1;
  if (data.causes.length > 0) score += 1;

  // Content sections (3 points)
  if (data.impactStories.length > 0) score += 1;
  if (data.experiences.length > 0) score += 1;
  if (data.education.length > 0 || data.volunteering.length > 0) score += 1;

  return Math.round((score / total) * 100);
}
