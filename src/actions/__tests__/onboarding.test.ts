import { describe, expect, it } from 'vitest';
import { normalizePersonaValue } from '../onboarding';
import { PERSONA } from '@/constants/persona';

describe('normalizePersonaValue', () => {
  it('maps legacy organization token to org_member', () => {
    expect(normalizePersonaValue('organization')).toBe(PERSONA.ORG_MEMBER);
  });

  it('returns null for unsupported tokens', () => {
    expect(normalizePersonaValue('persona-x')).toBeNull();
  });

  it('preserves canonical persona tokens', () => {
    expect(normalizePersonaValue('individual')).toBe(PERSONA.INDIVIDUAL);
    expect(normalizePersonaValue('org_member')).toBe(PERSONA.ORG_MEMBER);
  });
});
