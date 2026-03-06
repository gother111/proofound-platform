import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSelect = vi.fn();
const mockExecute = vi.fn();

vi.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    execute: (...args: unknown[]) => mockExecute(...args),
  },
}));

vi.mock('@/db/schema', () => ({
  skillsTaxonomy: {
    code: 'code',
    catId: 'catId',
    subcatId: 'subcatId',
    l3Id: 'l3Id',
    nameI18n: 'nameI18n',
    aliasesI18n: 'aliasesI18n',
    descriptionI18n: 'descriptionI18n',
    tags: 'tags',
    status: 'status',
  },
}));

function mockAtlasRows() {
  mockSelect.mockReturnValue({
    from: () => ({
      where: async () => [
        {
          code: 'skill_node',
          catId: 3,
          subcatId: 84,
          l3Id: 665,
          nameI18n: { en: 'Node' },
          aliasesI18n: [],
          descriptionI18n: { en: 'Generic node concept.' },
          tags: ['generic'],
        },
        {
          code: 'skill_nodejs',
          catId: 3,
          subcatId: 84,
          l3Id: 665,
          nameI18n: { en: 'Node.js runtime' },
          aliasesI18n: [{ en: 'Node.js' }],
          descriptionI18n: { en: 'JavaScript runtime.' },
          tags: ['runtime'],
        },
        {
          code: 'skill_c_sharp',
          catId: 3,
          subcatId: 82,
          l3Id: 649,
          nameI18n: { en: 'C# programming language' },
          aliasesI18n: [{ en: 'C#' }, { en: 'csharp' }],
          descriptionI18n: { en: 'C# development.' },
          tags: ['language', 'dotnet'],
        },
        {
          code: 'skill_c_plus_plus',
          catId: 3,
          subcatId: 82,
          l3Id: 653,
          nameI18n: { en: 'C++ programming' },
          aliasesI18n: [{ en: 'C++' }, { en: 'cplusplus' }, { en: 'c plus plus' }],
          descriptionI18n: { en: 'C++ development.' },
          tags: ['language'],
        },
      ],
    }),
  });

  mockExecute.mockResolvedValue([
    {
      skill_code: 'skill_nodejs',
      alias: 'Node.js',
      alias_norm: 'nodejs',
      confidence: 0.98,
    },
    {
      skill_code: 'skill_nodejs',
      alias: 'NodeJS',
      alias_norm: 'nodejs',
      confidence: 0.97,
    },
    {
      skill_code: 'skill_c_sharp',
      alias: 'C#',
      alias_norm: 'csharp',
      confidence: 1,
    },
    {
      skill_code: 'skill_c_plus_plus',
      alias: 'C++',
      alias_norm: 'cplusplus',
      confidence: 1,
    },
  ]);
}

describe('searchAtlasSkillMatches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockAtlasRows();
  });

  it('returns distinct best matches for C# and C++', async () => {
    const { searchAtlasSkillMatches } = await import('@/lib/expertise/atlas-skill-verifier');

    const cSharp = await searchAtlasSkillMatches({ query: 'C#', category: 'technical' });
    const cPlusPlus = await searchAtlasSkillMatches({ query: 'C++', category: 'technical' });

    expect(cSharp[0]?.skill_id).toBe('skill_c_sharp');
    expect(cPlusPlus[0]?.skill_id).toBe('skill_c_plus_plus');
    expect(cSharp[0]?.skill_id).not.toBe(cPlusPlus[0]?.skill_id);
  });

  it('returns the same best match for Node.js variants', async () => {
    const { searchAtlasSkillMatches } = await import('@/lib/expertise/atlas-skill-verifier');

    const variants = await Promise.all([
      searchAtlasSkillMatches({ query: 'Node.js', category: 'technical' }),
      searchAtlasSkillMatches({ query: 'NodeJS', category: 'technical' }),
      searchAtlasSkillMatches({ query: 'node js', category: 'technical' }),
    ]);

    for (const matches of variants) {
      expect(matches[0]?.skill_id).toBe('skill_nodejs');
    }
  });
});
