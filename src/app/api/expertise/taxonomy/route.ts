import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getOrSet, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';
import { createHash } from 'node:crypto';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';

const SEARCH_RESULT_LIMIT = 50;
const ALIAS_SEARCH_LIMIT = SEARCH_RESULT_LIMIT * 2;

type SearchTelemetryEventType = 'taxonomy_search_zero_results' | 'taxonomy_search_error';

/**
 * Helper function to map snake_case DB fields to camelCase
 */
function mapTaxonomyFields(item: any, type: 'l1' | 'l2' | 'l3' | 'l4') {
  const base = {
    slug: item.slug,
    nameI18n: item.name_i18n,
    descriptionI18n: item.description_i18n,
  };

  switch (type) {
    case 'l1':
      return {
        ...base,
        catId: item.cat_id,
        icon: item.icon,
        displayOrder: item.display_order,
        version: item.version,
        status: item.status,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      };
    case 'l2':
      return {
        ...base,
        subcatId: item.subcat_id,
        catId: item.cat_id,
        displayOrder: item.display_order,
        version: item.version,
        status: item.status,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      };
    case 'l3':
      return {
        ...base,
        l3Id: item.l3_id,
        subcatId: item.subcat_id,
        catId: item.cat_id,
        displayOrder: item.display_order,
        version: item.version,
        status: item.status,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      };
    case 'l4':
      return {
        code: item.code,
        nameI18n: item.name_i18n,
        descriptionI18n: item.description_i18n,
        catId: item.cat_id,
        subcatId: item.subcat_id,
        l3Id: item.l3_id,
        tags: item.tags,
        version: item.version,
        status: item.status,
      };
  }
}

function normalizeSearchTerm(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeForComparison(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function buildSearchTermVariants(searchTerm: string): string[] {
  const normalized = normalizeSearchTerm(searchTerm);
  const simplified = normalized
    .replace(/[^a-z0-9]+/gi, ' ')
    .trim()
    .replace(/\s+/g, ' ');
  return Array.from(new Set([normalized, simplified].filter(Boolean)));
}

function scoreMatch(
  value: string | undefined,
  searchTerm: string,
  source: 'name' | 'slug' | 'description' | 'alias',
  confidence = 1
) {
  if (!value) return 0;

  const normalizedValue = normalizeForComparison(value);
  const normalizedTerm = normalizeForComparison(searchTerm);
  if (!normalizedValue || !normalizedTerm) return 0;

  const base = source === 'name' ? 120 : source === 'alias' ? 110 : source === 'slug' ? 90 : 50;

  const confidenceBonus =
    source === 'alias' ? Math.round(Math.max(0, Math.min(1, confidence)) * 10) : 0;

  if (normalizedValue === normalizedTerm) return base + 35 + confidenceBonus;
  if (normalizedValue.startsWith(normalizedTerm)) return base + 20 + confidenceBonus;
  if (normalizedValue.includes(normalizedTerm)) return base + 10 + confidenceBonus;

  return 0;
}

function classifySearchQuery(value: string): string {
  const normalized = normalizeForComparison(value);
  if (!normalized) return 'empty';

  const words = normalized.split(' ').filter(Boolean);
  if (words.length === 1) {
    if (words[0].length <= 2) return 'very_short_token';
    if (words[0].length <= 5) return 'short_token';
    return 'single_term';
  }
  if (words.length <= 3) return 'multi_term_short';
  return 'multi_term_long';
}

function hashQuery(value: string): string {
  const normalized = normalizeForComparison(value);
  if (!normalized) return 'empty';
  return createHash('sha256').update(normalized).digest('hex').slice(0, 16);
}

async function emitSearchTelemetry(input: {
  eventType: SearchTelemetryEventType;
  searchTerm: string;
  queryClass: string;
  resultCount: number;
  usedFallback: boolean;
  rpcFailed: boolean;
  detail?: string;
}) {
  if (process.env.NODE_ENV === 'test') return;

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim();
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRole) return;

  try {
    const admin = createSupabaseAdminClient(supabaseUrl, serviceRole, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const properties: Record<string, unknown> = {
      query_hash: hashQuery(input.searchTerm),
      query_class: input.queryClass,
      result_count: input.resultCount,
      used_fallback: input.usedFallback,
      rpc_failed: input.rpcFailed,
    };

    if (input.detail) {
      properties.error_detail = normalizeForComparison(input.detail).slice(0, 180);
    }

    const { error } = await admin.from('analytics_events').insert({
      event_type: input.eventType,
      entity_type: 'api',
      properties,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.warn('[Taxonomy API] Failed to emit telemetry event', {
        eventType: input.eventType,
        error: error.message,
      });
    }
  } catch (error) {
    console.warn('[Taxonomy API] Failed to emit telemetry event', {
      eventType: input.eventType,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function enrichSkillsWithParentContext(supabase: any, skills: any[]): Promise<any[]> {
  if (!skills.length) {
    return [];
  }

  const catIds = Array.from(new Set(skills.map((s: any) => s.cat_id).filter(Boolean)));
  const subcatIds = Array.from(new Set(skills.map((s: any) => s.subcat_id).filter(Boolean)));
  const l3Ids = Array.from(new Set(skills.map((s: any) => s.l3_id).filter(Boolean)));

  const [l1Result, l2Result, l3Result] = await Promise.all([
    catIds.length
      ? supabase.from('skills_categories').select('cat_id, slug, name_i18n').in('cat_id', catIds)
      : Promise.resolve({ data: [], error: null }),
    subcatIds.length
      ? supabase
          .from('skills_subcategories')
          .select('subcat_id, cat_id, slug, name_i18n')
          .in('subcat_id', subcatIds)
      : Promise.resolve({ data: [], error: null }),
    l3Ids.length
      ? supabase
          .from('skills_l3')
          .select('l3_id, subcat_id, cat_id, slug, name_i18n')
          .in('l3_id', l3Ids)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (l1Result.error || l2Result.error || l3Result.error) {
    console.error('[Taxonomy API] Failed to enrich parent context', {
      l1Error: l1Result.error?.message,
      l2Error: l2Result.error?.message,
      l3Error: l3Result.error?.message,
    });

    return skills.map((skill: any) => ({
      ...skill,
      l1: null,
      l2: null,
      l3: null,
    }));
  }

  const l1Map = new Map((l1Result.data || []).map((l: any) => [l.cat_id, l]));
  const l2Map = new Map((l2Result.data || []).map((l: any) => [`${l.cat_id}-${l.subcat_id}`, l]));
  const l3Map = new Map(
    (l3Result.data || []).map((l: any) => [`${l.cat_id}-${l.subcat_id}-${l.l3_id}`, l])
  );

  return skills.map((skill: any) => ({
    ...skill,
    l1: l1Map.get(skill.cat_id) || null,
    l2: l2Map.get(`${skill.cat_id}-${skill.subcat_id}`) || null,
    l3: l3Map.get(`${skill.cat_id}-${skill.subcat_id}-${skill.l3_id}`) || null,
  }));
}

async function runSmartSearch(
  supabase: any,
  searchTerm: string
): Promise<{
  skills: any[];
  errorMessage: string | null;
}> {
  const { data: searchResults, error: searchError } = await supabase.rpc('search_skills_smart', {
    search_query: searchTerm,
    result_limit: SEARCH_RESULT_LIMIT,
  });

  if (searchError) {
    return {
      skills: [],
      errorMessage: searchError.message || 'search_skills_smart failed',
    };
  }

  const skillCodes = (searchResults || [])
    .map((item: any) => item.code)
    .filter((code: string | null) => Boolean(code));

  if (!skillCodes.length) {
    return {
      skills: [],
      errorMessage: null,
    };
  }

  const { data: skillsData, error: skillsError } = await supabase
    .from('skills_taxonomy')
    .select('*')
    .eq('status', 'active')
    .in('code', skillCodes);

  if (skillsError) {
    return {
      skills: [],
      errorMessage: skillsError.message || 'Failed to load search result rows',
    };
  }

  const byCode = new Map((skillsData || []).map((row: any) => [row.code, row]));
  const ordered = skillCodes.map((code: string) => byCode.get(code)).filter(Boolean);

  return {
    skills: ordered,
    errorMessage: null,
  };
}

async function runFallbackSearch(
  supabase: any,
  searchTerm: string
): Promise<{
  skills: any[];
  errorMessages: string[];
}> {
  const errorMessages: string[] = [];
  const scoredByCode = new Map<string, { skill: any; score: number }>();
  const aliasScoreByCode = new Map<string, number>();

  const querySpecs: Array<{
    field: 'name_i18n->>en' | 'slug' | 'description_i18n->>en';
    source: 'name' | 'slug' | 'description';
    limit: number;
  }> = [
    { field: 'name_i18n->>en', source: 'name', limit: SEARCH_RESULT_LIMIT },
    { field: 'slug', source: 'slug', limit: SEARCH_RESULT_LIMIT },
    { field: 'description_i18n->>en', source: 'description', limit: 30 },
  ];

  const termVariants = buildSearchTermVariants(searchTerm);
  let aliasTableUnavailable = false;

  for (const variant of termVariants) {
    for (const querySpec of querySpecs) {
      const { data, error } = await supabase
        .from('skills_taxonomy')
        .select('*')
        .eq('status', 'active')
        .ilike(querySpec.field, `%${variant}%`)
        .limit(querySpec.limit);

      if (error) {
        errorMessages.push(`${querySpec.source} search failed: ${error.message}`);
        continue;
      }

      for (const skill of data || []) {
        const valueToScore =
          querySpec.source === 'name'
            ? skill.name_i18n?.en
            : querySpec.source === 'slug'
              ? skill.slug
              : skill.description_i18n?.en;

        const score = scoreMatch(valueToScore, variant, querySpec.source);
        const current = scoredByCode.get(skill.code);

        if (!current || score > current.score) {
          scoredByCode.set(skill.code, { skill, score });
        }
      }
    }

    if (aliasTableUnavailable) {
      continue;
    }

    const normalizedVariant = normalizeForComparison(variant);
    const aliasQueries = [
      supabase
        .from('skills_taxonomy_aliases')
        .select('skill_code, alias, alias_norm, confidence')
        .eq('status', 'active')
        .eq('locale', 'en')
        .ilike('alias', `%${variant}%`)
        .limit(ALIAS_SEARCH_LIMIT),
      normalizedVariant
        ? supabase
            .from('skills_taxonomy_aliases')
            .select('skill_code, alias, alias_norm, confidence')
            .eq('status', 'active')
            .eq('locale', 'en')
            .ilike('alias_norm', `%${normalizedVariant}%`)
            .limit(ALIAS_SEARCH_LIMIT)
        : Promise.resolve({ data: [], error: null }),
    ];

    for (const aliasQuery of aliasQueries) {
      const { data: aliasRows, error: aliasError } = await aliasQuery;

      if (aliasError) {
        if ((aliasError as { code?: string }).code === '42P01') {
          aliasTableUnavailable = true;
          break;
        }

        errorMessages.push(`alias search failed: ${aliasError.message}`);
        continue;
      }

      for (const aliasRow of aliasRows || []) {
        const score = scoreMatch(
          aliasRow.alias || aliasRow.alias_norm,
          variant,
          'alias',
          Number(aliasRow.confidence || 1)
        );
        const current = aliasScoreByCode.get(aliasRow.skill_code);

        if (current == null || score > current) {
          aliasScoreByCode.set(aliasRow.skill_code, score);
        }
      }
    }
  }

  if (aliasScoreByCode.size > 0) {
    const aliasCodes = Array.from(aliasScoreByCode.keys());
    const { data: aliasSkills, error: aliasSkillsError } = await supabase
      .from('skills_taxonomy')
      .select('*')
      .eq('status', 'active')
      .in('code', aliasCodes);

    if (aliasSkillsError) {
      errorMessages.push(`alias canonical lookup failed: ${aliasSkillsError.message}`);
    } else {
      for (const skill of aliasSkills || []) {
        const score = aliasScoreByCode.get(skill.code) || 0;
        const current = scoredByCode.get(skill.code);
        if (!current || score > current.score) {
          scoredByCode.set(skill.code, { skill, score });
        }
      }
    }
  }

  const rankedSkills = Array.from(scoredByCode.values())
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aName = a.skill.name_i18n?.en || '';
      const bName = b.skill.name_i18n?.en || '';
      return aName.localeCompare(bName);
    })
    .slice(0, SEARCH_RESULT_LIMIT)
    .map((entry) => entry.skill);

  return {
    skills: rankedSkills,
    errorMessages,
  };
}

/**
 * GET /api/expertise/taxonomy
 *
 * Returns the complete skills taxonomy hierarchy.
 * Optionally filter by L1, L2, or L3.
 *
 * Query params:
 * - l1: L1 domain code (U/F/T/L/M/D)
 * - l2: L2 category code (e.g., "U-COMM")
 * - l3_id: L3 subcategory ID
 * - search: Search query for L4 skills
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    if (!supabase) {
      console.error('[Taxonomy API] Failed to create Supabase client');
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);

    const l1 = searchParams.get('l1');
    const l2 = searchParams.get('l2');
    const l3Id = searchParams.get('l3_id');
    const search = searchParams.get('search');
    const searchClass = search ? classifySearchQuery(search) : null;
    const searchHash = search ? hashQuery(search) : null;

    console.log('[Taxonomy API] Request params:', {
      l1,
      l2,
      l3Id,
      hasSearch: Boolean(search),
      searchHash,
      searchClass,
    });

    // If no filters, return full L1 list (cached)
    if (!l1 && !l2 && !l3Id && !search) {
      const cacheKey = `${CACHE_KEYS.TAXONOMY}l1`;

      const l1Domains = await getOrSet(
        cacheKey,
        async () => {
          const { data: categories, error } = await supabase
            .from('skills_categories')
            .select('*')
            .order('display_order');

          if (error) {
            throw new Error('Failed to fetch categories');
          }

          return categories?.map((c) => mapTaxonomyFields(c, 'l1')) || [];
        },
        CACHE_TTL.TAXONOMY
      );

      return NextResponse.json({ l1_domains: l1Domains });
    }

    // If L1 specified, return L2 categories (cached)
    if (l1 && !l2 && !l3Id) {
      const catId = l1CodeToCatId(l1);
      if (!catId) {
        return NextResponse.json({ error: 'Invalid L1 code' }, { status: 400 });
      }

      const cacheKey = `${CACHE_KEYS.TAXONOMY}l2:${l1}`;

      const l2Categories = await getOrSet(
        cacheKey,
        async () => {
          const { data: subcategories, error } = await supabase
            .from('skills_subcategories')
            .select('*')
            .eq('cat_id', catId)
            .order('display_order');

          if (error) {
            throw new Error('Failed to fetch subcategories');
          }

          return subcategories?.map((s) => mapTaxonomyFields(s, 'l2')) || [];
        },
        CACHE_TTL.TAXONOMY
      );

      return NextResponse.json({ l2_categories: l2Categories });
    }

    // If L2 specified, return L3 subcategories
    if (l2 && !l3Id) {
      // Parse L2 code to get cat_id and subcat_id
      // This requires querying the subcategories table by slug
      const { data: l2Data, error: l2Error } = await supabase
        .from('skills_subcategories')
        .select('cat_id, subcat_id')
        .eq('slug', l2.toLowerCase())
        .single();

      if (l2Error || !l2Data) {
        return NextResponse.json({ error: 'Invalid L2 code' }, { status: 400 });
      }

      const { data: l3Items, error } = await supabase
        .from('skills_l3')
        .select('*')
        .eq('subcat_id', l2Data.subcat_id)
        .order('display_order');

      if (error) {
        console.error('Error fetching L3 items:', error);
        return NextResponse.json({ error: 'Failed to fetch L3 items' }, { status: 500 });
      }

      return NextResponse.json({
        l3_subcategories: l3Items?.map((l) => mapTaxonomyFields(l, 'l3')) || [],
      });
    }

    // If L3 specified or search query, return L4 skills
    if (l3Id || search) {
      let skills: any[];
      let error: any;

      // Use smart search function if searching, otherwise use regular query
      if (search) {
        const normalizedSearch = normalizeSearchTerm(search);
        const queryClass = classifySearchQuery(normalizedSearch);
        if (!normalizedSearch) {
          return NextResponse.json({ l4_skills: [] });
        }

        const smartSearch = await runSmartSearch(supabase, normalizedSearch);
        const rpcFailed = Boolean(smartSearch.errorMessage);
        if (smartSearch.errorMessage) {
          console.warn('[Taxonomy API] Smart search failed, falling back', {
            searchHash,
            searchClass: queryClass,
            error: smartSearch.errorMessage,
          });
        }

        let searchSkills = smartSearch.skills;
        let usedFallback = false;

        if (!searchSkills.length) {
          usedFallback = true;
          const fallbackSearch = await runFallbackSearch(supabase, normalizedSearch);

          if (!fallbackSearch.skills.length && fallbackSearch.errorMessages.length > 0) {
            console.error('[Taxonomy API] All fallback search strategies failed', {
              searchHash,
              searchClass: queryClass,
              errors: fallbackSearch.errorMessages,
            });
            void emitSearchTelemetry({
              eventType: 'taxonomy_search_error',
              searchTerm: normalizedSearch,
              queryClass,
              resultCount: 0,
              usedFallback,
              rpcFailed,
              detail: fallbackSearch.errorMessages.join(' | '),
            });
            return NextResponse.json(
              {
                error: 'Failed to fetch skills',
                details:
                  process.env.NODE_ENV === 'development'
                    ? fallbackSearch.errorMessages.join(' | ')
                    : undefined,
              },
              { status: 500 }
            );
          }

          searchSkills = fallbackSearch.skills;
        }

        skills = await enrichSkillsWithParentContext(supabase, searchSkills);
        error = null;

        if (!skills.length) {
          void emitSearchTelemetry({
            eventType: 'taxonomy_search_zero_results',
            searchTerm: normalizedSearch,
            queryClass,
            resultCount: 0,
            usedFallback,
            rpcFailed,
          });
        }
      } else if (l3Id) {
        // Regular L3 filtering
        const [catId, subcatId, l3IdNum] = l3Id.split('.').map(Number);
        const { data: l3Skills, error: l3Error } = await supabase
          .from('skills_taxonomy')
          .select(
            `
            *,
            l1:skills_categories!skills_taxonomy_cat_id_fkey(cat_id, slug, name_i18n),
            l2:skills_subcategories!skills_taxonomy_cat_id_subcat_id_fkey(subcat_id, cat_id, slug, name_i18n),
            l3:skills_l3!skills_taxonomy_cat_id_subcat_id_l3_id_fkey(l3_id, subcat_id, cat_id, slug, name_i18n)
          `
          )
          .eq('status', 'active')
          .eq('cat_id', catId)
          .eq('subcat_id', subcatId)
          .eq('l3_id', l3IdNum)
          .limit(100);

        skills = l3Skills || [];
        error = l3Error;
      } else {
        skills = [];
        error = null;
      }

      if (error) {
        console.error('Error fetching L4 skills:', error);
        return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
      }

      console.log(
        `✅ Skills ${search ? 'search' : 'query'} ${search ? `for "${search}"` : ''} returned ${skills?.length || 0} results`
      );

      // Map skills with parent context
      const mappedSkills =
        skills?.map((s) => {
          const baseSkill = mapTaxonomyFields(s, 'l4');
          return {
            ...baseSkill,
            l1: s.l1
              ? {
                  catId: s.l1.cat_id,
                  slug: s.l1.slug,
                  nameI18n: s.l1.name_i18n,
                }
              : null,
            l2: s.l2
              ? {
                  subcatId: s.l2.subcat_id,
                  catId: s.l2.cat_id,
                  slug: s.l2.slug,
                  nameI18n: s.l2.name_i18n,
                }
              : null,
            l3: s.l3
              ? {
                  l3Id: s.l3.l3_id,
                  subcatId: s.l3.subcat_id,
                  catId: s.l3.cat_id,
                  slug: s.l3.slug,
                  nameI18n: s.l3.name_i18n,
                }
              : null,
          };
        }) || [];

      return NextResponse.json({ l4_skills: mappedSkills });
    }

    return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
  } catch (error: any) {
    console.error('[Taxonomy API] Caught error:', error);
    console.error('[Taxonomy API] Error message:', error?.message);
    console.error('[Taxonomy API] Error stack:', error?.stack);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * Helper to map L1 letter codes to numeric cat_id
 */
function l1CodeToCatId(code: string): number | null {
  const mapping: Record<string, number> = {
    U: 1,
    F: 2,
    T: 3,
    L: 4,
    M: 5,
    D: 6,
  };
  return mapping[code.toUpperCase()] || null;
}
