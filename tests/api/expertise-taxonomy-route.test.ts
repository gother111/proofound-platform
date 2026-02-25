import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { GET } from '@/app/api/expertise/taxonomy/route';

type SupabaseMockOptions = {
  rpcData?: any[] | null;
  rpcError?: { message: string } | null;
  codeLookupData?: any[];
  codeLookupError?: { message: string } | null;
  nameResults?: any[];
  slugResults?: any[];
  descriptionResults?: any[];
  nameError?: { message: string } | null;
  slugError?: { message: string } | null;
  descriptionError?: { message: string } | null;
  aliasResults?: any[];
  aliasNormResults?: any[];
  aliasError?: { message: string; code?: string } | null;
  aliasNormError?: { message: string; code?: string } | null;
  l1Data?: any[];
  l2Data?: any[];
  l3Data?: any[];
};

function createSupabaseMock(options: SupabaseMockOptions = {}) {
  const rpc = vi.fn().mockResolvedValue({
    data: options.rpcData ?? [],
    error: options.rpcError ?? null,
  });

  const from = vi.fn((table: string) => {
    if (table === 'skills_taxonomy') {
      const state: { field?: string } = {};

      const chain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn((field: string) => {
          state.field = field;
          return chain;
        }),
        in: vi.fn(async (column: string, values: string[]) => {
          if (column === 'code') {
            if (options.codeLookupError) {
              return { data: null, error: options.codeLookupError };
            }

            const rows = (options.codeLookupData || []).filter((row) => values.includes(row.code));
            return { data: rows, error: null };
          }

          return { data: [], error: null };
        }),
        limit: vi.fn(async () => {
          if (state.field === 'name_i18n->>en') {
            return { data: options.nameResults || [], error: options.nameError ?? null };
          }
          if (state.field === 'slug') {
            return { data: options.slugResults || [], error: options.slugError ?? null };
          }
          if (state.field === 'description_i18n->>en') {
            return {
              data: options.descriptionResults || [],
              error: options.descriptionError ?? null,
            };
          }

          return { data: [], error: null };
        }),
      };

      return chain;
    }

    if (table === 'skills_taxonomy_aliases') {
      const state: { field?: string } = {};

      const chain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn((field: string) => {
          state.field = field;
          return chain;
        }),
        limit: vi.fn(async () => {
          if (state.field === 'alias') {
            return { data: options.aliasResults || [], error: options.aliasError ?? null };
          }

          if (state.field === 'alias_norm') {
            return {
              data: options.aliasNormResults || [],
              error: options.aliasNormError ?? null,
            };
          }

          return { data: [], error: null };
        }),
      };

      return chain;
    }

    if (table === 'skills_categories') {
      return {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ data: options.l1Data || [], error: null }),
        }),
      };
    }

    if (table === 'skills_subcategories') {
      return {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ data: options.l2Data || [], error: null }),
        }),
      };
    }

    if (table === 'skills_l3') {
      return {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ data: options.l3Data || [], error: null }),
        }),
      };
    }

    throw new Error(`Unexpected table: ${table}`);
  });

  return { rpc, from };
}

describe('GET /api/expertise/taxonomy (search mode)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('falls back to direct search when smart search RPC fails', async () => {
    const swedishSkill = {
      code: '04.105.840.95013',
      cat_id: 4,
      subcat_id: 105,
      l3_id: 840,
      slug: 'swedish-language-proficiency',
      name_i18n: { en: 'Swedish language proficiency' },
      description_i18n: { en: 'Use Swedish effectively in professional communication.' },
      tags: ['l', 'language', 'cefr', 'swedish'],
      status: 'active',
      version: 1,
    };

    const supabase = createSupabaseMock({
      rpcError: { message: 'function similarity(text, text) does not exist' },
      nameResults: [swedishSkill],
      l1Data: [{ cat_id: 4, slug: 'languages-culture', name_i18n: { en: 'Languages & Culture' } }],
      l2Data: [
        {
          cat_id: 4,
          subcat_id: 105,
          slug: 'l-lang',
          name_i18n: { en: 'Natural Languages' },
        },
      ],
      l3Data: [
        {
          cat_id: 4,
          subcat_id: 105,
          l3_id: 840,
          slug: 'l-lang-cefr-proficiency-mapping',
          name_i18n: { en: 'CEFR proficiency mapping' },
        },
      ],
    });

    (createClient as any).mockResolvedValue(supabase);

    const response = await GET(
      new Request('http://localhost/api/expertise/taxonomy?search=swedish')
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.l4_skills).toHaveLength(1);
    expect(body.l4_skills[0].nameI18n.en).toBe('Swedish language proficiency');
    expect(body.l4_skills[0].l1.nameI18n.en).toBe('Languages & Culture');
    expect(supabase.rpc).toHaveBeenCalledWith('search_skills_smart', {
      search_query: 'swedish',
      result_limit: 50,
    });
  });

  it('falls back to alias search when canonical fallback has no direct matches', async () => {
    const githubActionsSkill = {
      code: '03.084.665.96021',
      cat_id: 3,
      subcat_id: 84,
      l3_id: 665,
      slug: 'github-actions',
      name_i18n: { en: 'GitHub Actions' },
      description_i18n: { en: 'Automate CI/CD workflows in GitHub repositories.' },
      tags: ['t', 'cicd', 'automation'],
      status: 'active',
      version: 1,
    };

    const supabase = createSupabaseMock({
      rpcError: { message: 'function similarity(text, text) does not exist' },
      codeLookupData: [githubActionsSkill],
      aliasResults: [
        {
          skill_code: githubActionsSkill.code,
          alias: 'gh actions',
          alias_norm: 'gh actions',
          confidence: 0.99,
        },
      ],
      l1Data: [{ cat_id: 3, slug: 'tools-technology', name_i18n: { en: 'Tools & Technology' } }],
      l2Data: [
        {
          cat_id: 3,
          subcat_id: 84,
          slug: 't-cicd',
          name_i18n: { en: 'CI/CD' },
        },
      ],
      l3Data: [
        {
          cat_id: 3,
          subcat_id: 84,
          l3_id: 665,
          slug: 't-cicd-automation',
          name_i18n: { en: 'Automation platforms' },
        },
      ],
    });

    (createClient as any).mockResolvedValue(supabase);

    const response = await GET(
      new Request('http://localhost/api/expertise/taxonomy?search=gh%20actions')
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.l4_skills).toHaveLength(1);
    expect(body.l4_skills[0].nameI18n.en).toBe('GitHub Actions');
    expect(body.l4_skills[0].l1.nameI18n.en).toBe('Tools & Technology');
  });

  it('returns 500 when smart search and all fallback strategies fail', async () => {
    const supabase = createSupabaseMock({
      rpcError: { message: 'function similarity(text, text) does not exist' },
      nameError: { message: 'name search failed' },
      slugError: { message: 'slug search failed' },
      descriptionError: { message: 'description search failed' },
    });

    (createClient as any).mockResolvedValue(supabase);

    const response = await GET(
      new Request('http://localhost/api/expertise/taxonomy?search=swedish')
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to fetch skills');
  });
});
