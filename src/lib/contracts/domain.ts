import { z } from 'zod';

export const ASSIGNMENT_STATUS_VALUES = ['draft', 'active', 'hold', 'closed'] as const;
export type AssignmentStatus = (typeof ASSIGNMENT_STATUS_VALUES)[number];
export const AssignmentStatusSchema = z.enum(ASSIGNMENT_STATUS_VALUES);

export const INTERVIEW_PLATFORM_VALUES = ['zoom', 'google_meet', 'manual', 'google'] as const;
export type InterviewPlatform = (typeof INTERVIEW_PLATFORM_VALUES)[number];
export type NormalizedInterviewPlatform = Exclude<InterviewPlatform, 'google'>;
export const InterviewPlatformSchema = z.enum(INTERVIEW_PLATFORM_VALUES);

export const MANUAL_MEETING_PROVIDER_VALUES = ['teams', 'zoom', 'google_meet', 'other'] as const;
export type ManualMeetingProvider = (typeof MANUAL_MEETING_PROVIDER_VALUES)[number];
export const ManualMeetingProviderSchema = z.enum(MANUAL_MEETING_PROVIDER_VALUES);

export const PROFILE_VISIBILITY_LEVEL_VALUES = [
  'public',
  'network_only',
  'match_only',
  'private',
] as const;
export type ProfileVisibilityLevel = (typeof PROFILE_VISIBILITY_LEVEL_VALUES)[number];
export const ProfileVisibilityLevelSchema = z.enum(PROFILE_VISIBILITY_LEVEL_VALUES);

export const PROFILE_VISIBILITY_DEFAULTS: Record<string, ProfileVisibilityLevel> = {
  displayName: 'public',
  avatar: 'public',
  headline: 'public',
  location: 'network_only',
  mission: 'public',
  vision: 'public',
  values: 'public',
  causes: 'public',
  experiences: 'private',
  education: 'private',
  volunteering: 'private',
  skills: 'public',
  impactStories: 'match_only',
};

export function normalizeInterviewPlatform(
  platform: InterviewPlatform
): NormalizedInterviewPlatform {
  if (platform === 'google') {
    return 'google_meet';
  }

  return platform;
}

export function isVisibleInMatchContext(level: ProfileVisibilityLevel): boolean {
  return level === 'public' || level === 'network_only' || level === 'match_only';
}
