import { describe, expect, it } from 'vitest';

import { humanizeIdentifierLabel, isMachineIdentifier, skillDisplayLabel } from '@/lib/copy/labels';

describe('copy labels', () => {
  it('treats backend identifiers as machine-only values', () => {
    expect(isMachineIdentifier('03.01.01.001')).toBe(true);
    expect(isMachineIdentifier('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isMachineIdentifier('pending_review')).toBe(true);
  });

  it('does not expose numeric skill codes as skill names', () => {
    expect(skillDisplayLabel({ id: '03.01.01.001', code: '03.01.01.001' })).toBe(
      'Skill name unavailable'
    );
  });

  it('prefers human skill names over ids or codes', () => {
    expect(
      skillDisplayLabel({
        taxonomyName: 'Threat modeling',
        id: '03.01.01.001',
        code: '03.01.01.001',
      })
    ).toBe('Threat modeling');
  });

  it('cleans readable underscored labels instead of dropping them', () => {
    expect(skillDisplayLabel({ skillName: 'service_design', code: '03.01.01.001' })).toBe(
      'Service Design'
    );
  });

  it('humanizes custom skill identifiers when no display name exists', () => {
    expect(humanizeIdentifierLabel('custom-service-design')).toBe('Service Design');
  });
});
