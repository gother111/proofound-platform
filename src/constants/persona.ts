export const PERSONA = {
  INDIVIDUAL: 'individual',
  ORG_MEMBER: 'org_member',
  UNKNOWN: 'unknown',
} as const;

export type PersonaValue = (typeof PERSONA)[keyof typeof PERSONA];

const LEGACY_TOKENS = new Map<string, PersonaValue>([['organization', PERSONA.ORG_MEMBER]]);

export function normalizePersonaToken(value: unknown): PersonaValue | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }

  if (trimmed === PERSONA.INDIVIDUAL) {
    return PERSONA.INDIVIDUAL;
  }

  if (trimmed === PERSONA.ORG_MEMBER) {
    return PERSONA.ORG_MEMBER;
  }

  if (trimmed === PERSONA.UNKNOWN) {
    return PERSONA.UNKNOWN;
  }

  return LEGACY_TOKENS.get(trimmed) ?? null;
}

export function isPersonaValue(value: unknown): value is PersonaValue {
  return value === PERSONA.INDIVIDUAL || value === PERSONA.ORG_MEMBER || value === PERSONA.UNKNOWN;
}

export function isOrgPersona(value: PersonaValue | null | undefined): value is PersonaValue {
  return value === PERSONA.ORG_MEMBER;
}

export function isIndividualPersona(value: PersonaValue | null | undefined): value is PersonaValue {
  return value === PERSONA.INDIVIDUAL;
}

export const PERSONA_CHOICES: PersonaValue[] = [PERSONA.INDIVIDUAL, PERSONA.ORG_MEMBER];
