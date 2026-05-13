export const CUSTOM_VERIFICATION_RELATIONSHIPS = [
  'colleague',
  'peer',
  'manager',
  'skip_level_manager',
  'direct_report',
  'client',
  'partner',
  'mentor_coach',
  // Legacy relationship kept for backward compatibility with older records.
  'external',
] as const;
export type CustomVerificationRelationship = (typeof CUSTOM_VERIFICATION_RELATIONSHIPS)[number];

export const CUSTOM_VERIFICATION_SELECTABLE_RELATIONSHIPS = [
  'colleague',
  'peer',
  'manager',
  'skip_level_manager',
  'direct_report',
  'client',
  'partner',
  'mentor_coach',
] as const satisfies readonly CustomVerificationRelationship[];
export type SelectableCustomVerificationRelationship =
  (typeof CUSTOM_VERIFICATION_SELECTABLE_RELATIONSHIPS)[number];

export const CUSTOM_VERIFICATION_ARTIFACT_TYPES = [
  'skill',
  'experience',
  'education',
  'impact_story',
  'project',
  'volunteering',
] as const;
export type CustomVerificationArtifactType = (typeof CUSTOM_VERIFICATION_ARTIFACT_TYPES)[number];

export function relationshipLabel(value: CustomVerificationRelationship): string {
  switch (value) {
    case 'colleague':
      return 'a colleague';
    case 'peer':
      return 'a peer';
    case 'manager':
      return 'a manager';
    case 'skip_level_manager':
      return 'a skip-level manager';
    case 'direct_report':
      return 'a direct report';
    case 'client':
      return 'a client';
    case 'partner':
      return 'a partner';
    case 'mentor_coach':
      return 'a mentor or coach';
    case 'external':
    default:
      return 'an external collaborator';
  }
}

export function relationshipDisplayLabel(value: CustomVerificationRelationship): string {
  switch (value) {
    case 'colleague':
      return 'Colleague';
    case 'peer':
      return 'Peer';
    case 'manager':
      return 'Manager';
    case 'skip_level_manager':
      return 'Skip-level manager';
    case 'direct_report':
      return 'Direct report';
    case 'client':
      return 'Client';
    case 'partner':
      return 'Partner';
    case 'mentor_coach':
      return 'Mentor / Coach';
    case 'external':
    default:
      return 'External collaborator';
  }
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
