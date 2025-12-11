import { describe, it, expect } from 'vitest';
import { normalizeSkillForClient } from '@/app/app/i/expertise/utils/normalizeSkill';

describe('normalizeSkillForClient', () => {
  it('fills taxonomy and names from fallback search result', () => {
    const fallback = {
      code: 'T.STATS.BAYES',
      nameI18n: { en: 'Bayesian Statistics' },
      l1: { catId: 3 },
      l2: { subcatId: 12 },
      l3: { l3Id: 34 },
    } as any;

    const normalized = normalizeSkillForClient({ id: '1', level: 2 }, fallback);

    expect(normalized?.taxonomy?.cat_id).toBe(3);
    expect(normalized?.taxonomy?.subcat_id).toBe(12);
    expect(normalized?.taxonomy?.l3_id).toBe(34);
    expect(normalized?.skill_name).toBe('Bayesian Statistics');
    expect(normalized?.skillCode).toBe('T.STATS.BAYES');
    expect(normalized?.proof_count).toBe(0);
    expect(normalized?.verification_count).toBe(0);
  });
});
