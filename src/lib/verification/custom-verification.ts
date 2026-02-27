import { createHash, randomBytes } from 'crypto';

export const CUSTOM_VERIFICATION_RELATIONSHIPS = ['peer', 'manager', 'external'] as const;
export type CustomVerificationRelationship = (typeof CUSTOM_VERIFICATION_RELATIONSHIPS)[number];

export const CUSTOM_VERIFICATION_ARTIFACT_TYPES = [
  'skill',
  'experience',
  'education',
  'impact_story',
  'project',
  'volunteering',
] as const;
export type CustomVerificationArtifactType = (typeof CUSTOM_VERIFICATION_ARTIFACT_TYPES)[number];

export function generateVerificationToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashVerificationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function parseCustomSkillName(skillId: string | null | undefined): string | null {
  if (!skillId?.startsWith('custom-')) {
    return null;
  }

  const parts = skillId.split('-');
  if (parts.length <= 4) {
    return null;
  }

  return parts
    .slice(4)
    .join(' ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function normalizeVerifierEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function relationshipLabel(value: CustomVerificationRelationship): string {
  if (value === 'manager') {
    return 'a manager';
  }

  if (value === 'external') {
    return 'an external collaborator';
  }

  return 'a peer';
}

export function artifactTypeLabel(value: CustomVerificationArtifactType): string {
  switch (value) {
    case 'impact_story':
      return 'Impact story';
    case 'project':
      return 'Project';
    case 'experience':
      return 'Experience';
    case 'education':
      return 'Education';
    case 'volunteering':
      return 'Volunteering';
    case 'skill':
    default:
      return 'Skill';
  }
}
