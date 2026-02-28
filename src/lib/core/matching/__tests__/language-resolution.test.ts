import { describe, expect, it } from 'vitest';

import {
  deriveAtlasLanguageLevels,
  parseLegacyLanguageLevels,
  resolveLanguageLevel,
} from '../language-resolution';

describe('language-resolution', () => {
  it('derives CEFR levels from Atlas language proficiency skills', () => {
    const levels = deriveAtlasLanguageLevels(
      [{ skillCode: '04.105.840.00001', skillId: '04.105.840.00001', level: 4 }],
      [
        {
          code: '04.105.840.00001',
          catId: 4,
          subcatId: 105,
          l3Id: 840,
          slug: 'swedish-language-proficiency',
          nameI18n: { en: 'Swedish language proficiency' },
          tags: ['l', 'language', 'cefr', 'swedish'],
        },
      ]
    );

    expect(levels).toEqual({ sv: 'C1' });
  });

  it('keeps the strongest CEFR level when multiple Atlas skills map to the same language', () => {
    const levels = deriveAtlasLanguageLevels(
      [
        { skillCode: '04.105.840.10000', level: 2 },
        { skillCode: '04.105.840.10001', level: 5 },
      ],
      [
        {
          code: '04.105.840.10000',
          catId: 4,
          subcatId: 105,
          l3Id: 840,
          slug: 'english-language-proficiency',
          nameI18n: { en: 'English language proficiency' },
          tags: ['language', 'cefr', 'english'],
        },
        {
          code: '04.105.840.10001',
          catId: 4,
          subcatId: 105,
          l3Id: 840,
          slug: 'english-language-proficiency',
          nameI18n: { en: 'English language proficiency' },
          tags: ['language', 'cefr', 'english'],
        },
      ]
    );

    expect(levels).toEqual({ en: 'C2' });
  });

  it('ignores non-language taxonomy rows', () => {
    const levels = deriveAtlasLanguageLevels(
      [{ skillCode: '01.010.073.00002', level: 5 }],
      [
        {
          code: '01.010.073.00002',
          catId: 1,
          subcatId: 10,
          l3Id: 73,
          slug: 'creative-thinking',
          nameI18n: { en: 'Creative thinking' },
          tags: ['u', 'future-of-work'],
        },
      ]
    );

    expect(levels).toEqual({});
  });

  it('parses legacy language rows and keeps strongest duplicate level', () => {
    const levels = parseLegacyLanguageLevels([
      { code: 'en', level: 'B2' },
      { code: 'en', level: 'C1' },
      { code: 'sv', level: 'A2' },
      { code: 'bad', level: 'X1' },
      { invalid: true },
    ]);

    expect(levels).toEqual({ en: 'C1', sv: 'A2' });
  });

  it('resolves candidate language level with Atlas-first fallback to legacy', () => {
    const atlasLevels = { en: 'C2' } as const;
    const legacyLevels = { en: 'B2', sv: 'C1' } as const;

    expect(resolveLanguageLevel('en', atlasLevels, legacyLevels)).toBe('C2');
    expect(resolveLanguageLevel('sv', atlasLevels, legacyLevels)).toBe('C1');
    expect(resolveLanguageLevel('fr', atlasLevels, legacyLevels)).toBeNull();
  });
});
