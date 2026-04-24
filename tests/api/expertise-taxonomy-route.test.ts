import { beforeEach, describe, expect, it, vi } from 'vitest';

const createClientMock = vi.fn();
const searchAtlasSkillMatchesMock = vi.fn();
const dbExecuteMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: (...args: unknown[]) => createClientMock(...args),
}));

vi.mock('@/db', () => ({
  db: {
    execute: (...args: unknown[]) => dbExecuteMock(...args),
  },
}));

vi.mock('@/lib/expertise/atlas-skill-verifier', () => ({
  searchAtlasSkillMatches: (...args: unknown[]) => searchAtlasSkillMatchesMock(...args),
}));

import { GET } from '@/app/api/expertise/taxonomy/route';

type SkillRow = {
  code: string;
  cat_id: number;
  subcat_id: number;
  l3_id: number;
  slug: string;
  name_i18n: { en: string };
  description_i18n: { en: string };
  tags: string[];
  status: string;
  version: number;
};

function createSupabaseMock(params: {
  skills?: SkillRow[];
  l1?: Array<{ cat_id: number; slug: string; name_i18n: { en: string } }>;
  l2?: Array<{ cat_id: number; subcat_id: number; slug: string; name_i18n: { en: string } }>;
  l3?: Array<{
    cat_id: number;
    subcat_id: number;
    l3_id: number;
    slug: string;
    name_i18n: { en: string };
  }>;
}) {
  return {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: null }, error: null })),
    },
    from: vi.fn((table: string) => {
      if (table === 'skills_taxonomy') {
        const state: { status?: string } = {};
        const chain: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn((field: string, value: string) => {
            if (field === 'status') {
              state.status = value;
            }
            return chain;
          }),
          in: vi.fn(async (field: string, values: string[]) => {
            if (field !== 'code') {
              return { data: [], error: null };
            }

            const rows = (params.skills || []).filter(
              (row) => values.includes(row.code) && (!state.status || row.status === state.status)
            );

            return { data: rows, error: null };
          }),
        };

        return chain;
      }

      if (table === 'skills_categories') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn(async () => ({ data: params.l1 || [], error: null })),
          }),
        };
      }

      if (table === 'skills_subcategories') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn(async () => ({ data: params.l2 || [], error: null })),
          }),
        };
      }

      if (table === 'skills_l3') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn(async () => ({ data: params.l3 || [], error: null })),
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    }),
  };
}

describe('GET /api/expertise/taxonomy (search mode)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbExecuteMock.mockResolvedValue([]);
  });

  it('returns atlas-ranked skills with match metadata in cv_import context', async () => {
    searchAtlasSkillMatchesMock.mockResolvedValue([
      {
        skill_id: 'skill_nodejs',
        skill_name: 'Node.js',
        match_method: 'exact',
        score: 0.99,
        match_source: 'alias',
        matched_query: 'node.js',
        matched_label: 'Node.js',
      },
      {
        skill_id: 'skill_react_native',
        skill_name: 'React Native',
        match_method: 'synonym',
        score: 0.95,
        match_source: 'canonical',
        matched_query: 'react native',
        matched_label: 'React Native',
      },
    ]);

    createClientMock.mockResolvedValue(
      createSupabaseMock({
        skills: [
          {
            code: 'skill_react_native',
            cat_id: 3,
            subcat_id: 84,
            l3_id: 665,
            slug: 'react-native',
            name_i18n: { en: 'React Native' },
            description_i18n: { en: 'Build mobile apps in React Native.' },
            tags: ['mobile'],
            status: 'active',
            version: 1,
          },
          {
            code: 'skill_nodejs',
            cat_id: 3,
            subcat_id: 84,
            l3_id: 665,
            slug: 'nodejs',
            name_i18n: { en: 'Node.js' },
            description_i18n: { en: 'Build backend services with Node.js.' },
            tags: ['backend'],
            status: 'active',
            version: 1,
          },
        ],
        l1: [{ cat_id: 3, slug: 'tools-technology', name_i18n: { en: 'Tools & Technology' } }],
        l2: [{ cat_id: 3, subcat_id: 84, slug: 'frameworks', name_i18n: { en: 'Frameworks' } }],
        l3: [
          {
            cat_id: 3,
            subcat_id: 84,
            l3_id: 665,
            slug: 'application-platforms',
            name_i18n: { en: 'Application platforms' },
          },
        ],
      })
    );

    const response = await GET(
      new Request(
        'http://localhost/api/expertise/taxonomy?search=node.js&context=cv_import&category=technical&evidence=Built%20Node.js%20services'
      )
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(searchAtlasSkillMatchesMock).toHaveBeenCalledWith({
      query: 'node.js',
      evidenceSnippets: ['Built Node.js services'],
      category: 'technical',
      limit: 50,
    });
    expect(body.l4_skills).toHaveLength(2);
    expect(body.l4_skills[0].code).toBe('skill_nodejs');
    expect(body.l4_skills[0].matchMethod).toBe('exact');
    expect(body.l4_skills[0].matchScore).toBe(0.99);
    expect(body.l4_skills[0].matchSource).toBe('alias');
    expect(body.l4_skills[0].matchedLabel).toBe('Node.js');
    expect(body.l4_skills[0].l1.nameI18n.en).toBe('Tools & Technology');
  });

  it('suppresses ambiguous short tokens outside cv_import context', async () => {
    createClientMock.mockResolvedValue(createSupabaseMock({}));

    const response = await GET(new Request('http://localhost/api/expertise/taxonomy?search=pm'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.l4_skills).toEqual([]);
    expect(searchAtlasSkillMatchesMock).not.toHaveBeenCalled();
  });

  it('allows ambiguous short tokens in cv_import context and returns ranked guesses', async () => {
    searchAtlasSkillMatchesMock.mockResolvedValue([
      {
        skill_id: 'skill_project_management',
        skill_name: 'Project Management',
        match_method: 'semantic',
        score: 0.72,
        match_source: 'alias',
        matched_query: 'pm',
        matched_label: 'PM',
      },
    ]);

    createClientMock.mockResolvedValue(
      createSupabaseMock({
        skills: [
          {
            code: 'skill_project_management',
            cat_id: 1,
            subcat_id: 10,
            l3_id: 20,
            slug: 'project-management',
            name_i18n: { en: 'Project Management' },
            description_i18n: { en: 'Coordinate delivery and execution.' },
            tags: ['management'],
            status: 'active',
            version: 1,
          },
        ],
        l1: [{ cat_id: 1, slug: 'human-skills', name_i18n: { en: 'Human Skills' } }],
        l2: [{ cat_id: 1, subcat_id: 10, slug: 'delivery', name_i18n: { en: 'Delivery' } }],
        l3: [
          {
            cat_id: 1,
            subcat_id: 10,
            l3_id: 20,
            slug: 'execution',
            name_i18n: { en: 'Execution' },
          },
        ],
      })
    );

    const response = await GET(
      new Request(
        'http://localhost/api/expertise/taxonomy?search=pm&context=cv_import&evidence=Led%20project%20delivery'
      )
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(searchAtlasSkillMatchesMock).toHaveBeenCalledWith({
      query: 'pm',
      evidenceSnippets: ['Led project delivery'],
      category: undefined,
      limit: 50,
    });
    expect(body.l4_skills).toHaveLength(1);
    expect(body.l4_skills[0].code).toBe('skill_project_management');
    expect(body.l4_skills[0].matchMethod).toBe('semantic');
  });

  it('falls back to direct taxonomy search when atlas returns no ranked skills', async () => {
    searchAtlasSkillMatchesMock.mockResolvedValue([]);
    dbExecuteMock.mockResolvedValue([
      {
        code: 'skill_quality_audit',
        cat_id: 2,
        subcat_id: 20,
        l3_id: 200,
        slug: 'quality-audit',
        name_i18n: { en: 'Quality audit' },
        description_i18n: { en: 'Review work for completeness and evidence quality.' },
        tags: ['quality'],
        status: 'active',
        version: 1,
      },
    ]);

    createClientMock.mockResolvedValue(
      createSupabaseMock({
        l1: [{ cat_id: 2, slug: 'foundation', name_i18n: { en: 'Foundation' } }],
        l2: [{ cat_id: 2, subcat_id: 20, slug: 'operations', name_i18n: { en: 'Operations' } }],
        l3: [
          {
            cat_id: 2,
            subcat_id: 20,
            l3_id: 200,
            slug: 'quality',
            name_i18n: { en: 'Quality' },
          },
        ],
      })
    );

    const response = await GET(
      new Request('http://localhost/api/expertise/taxonomy?search=quality')
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(dbExecuteMock).toHaveBeenCalledTimes(1);
    expect(body.l4_skills).toHaveLength(1);
    expect(body.l4_skills[0]).toMatchObject({
      code: 'skill_quality_audit',
      nameI18n: { en: 'Quality audit' },
      l1: { nameI18n: { en: 'Foundation' } },
      l2: { nameI18n: { en: 'Operations' } },
      l3: { nameI18n: { en: 'Quality' } },
    });
  });
});
