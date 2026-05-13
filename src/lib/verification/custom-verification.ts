import { createHash, randomBytes } from 'crypto';
import type { CustomVerificationRelationship } from './custom-verification-labels';

export {
  CUSTOM_VERIFICATION_ARTIFACT_TYPES,
  CUSTOM_VERIFICATION_RELATIONSHIPS,
  CUSTOM_VERIFICATION_SELECTABLE_RELATIONSHIPS,
  artifactTypeLabel,
  relationshipDisplayLabel,
  relationshipLabel,
  type CustomVerificationArtifactType,
  type CustomVerificationRelationship,
  type SelectableCustomVerificationRelationship,
} from './custom-verification-labels';

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

export function mapCustomRelationshipToSkillVerifierSource(
  value: CustomVerificationRelationship
): 'peer' | 'manager' | 'external' {
  switch (value) {
    case 'manager':
    case 'skip_level_manager':
    case 'direct_report':
      return 'manager';
    case 'colleague':
    case 'peer':
      return 'peer';
    case 'client':
    case 'partner':
    case 'mentor_coach':
    case 'external':
    default:
      return 'external';
  }
}
