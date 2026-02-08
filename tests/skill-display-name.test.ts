import { describe, expect, it } from 'vitest';
import { getSkillDisplayName } from '@/lib/skills/display-name';

describe('getSkillDisplayName', () => {
  it('prefers taxonomy name_i18n.en when present', () => {
    expect(
      getSkillDisplayName({
        nameI18n: { en: 'Bayesian Statistics' },
        skillId: 'custom-1-2-3-bayesian-statistics',
        skillCode: '01.002.003.00001',
      })
    ).toBe('Bayesian Statistics');
  });

  it('parses custom skill_id into Title Case', () => {
    expect(
      getSkillDisplayName({
        nameI18n: null,
        skillId: 'custom-1-2-3-data-pipelines',
        skillCode: null,
      })
    ).toBe('Data Pipelines');
  });

  it('falls back to skill_id when not custom and taxonomy is missing', () => {
    expect(
      getSkillDisplayName({
        nameI18n: null,
        skillId: 'T.STATS.BAYES',
        skillCode: '01.002.003.00001',
      })
    ).toBe('T.STATS.BAYES');
  });

  it('falls back to skill_code when skill_id is missing', () => {
    expect(
      getSkillDisplayName({
        nameI18n: null,
        skillId: null,
        skillCode: '01.002.003.00001',
      })
    ).toBe('01.002.003.00001');
  });
});
