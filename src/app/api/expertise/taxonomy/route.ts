import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getOrSet, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';
import { createHash } from 'node:crypto';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';
import { isManualReviewOnlyShortToken } from '@/lib/expertise/skill-confidence';
import { searchAtlasSkillMatches } from '@/lib/expertise/atlas-skill-verifier';
import { legacySurfaceJsonResponse } from '@/lib/mvp/nonLaunch';

const SEARCH_RESULT_LIMIT = 50;
const SEARCH_ATLAS_TIMEOUT_MS = 4_000;

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

function sortSimpleSearchResults(searchTerm: string, rows: any[]): any[] {
  const normalized = normalizeForComparison(searchTerm);

  return [...rows].sort((left, right) => {
    const leftName = normalizeForComparison(left.name_i18n?.en || '');
    const rightName = normalizeForComparison(right.name_i18n?.en || '');
    const leftCode = normalizeForComparison(left.code || '');
    const rightCode = normalizeForComparison(right.code || '');

    const score = (name: string, code: string) => {
      if (name === normalized || code === normalized) return 0;
      if (name.startsWith(normalized) || code.startsWith(normalized)) return 1;
      if (name.includes(normalized) || code.includes(normalized)) return 2;
      return 3;
    };

    const scoreDiff = score(leftName, leftCode) - score(rightName, rightCode);
    if (scoreDiff !== 0) return scoreDiff;

    const lengthDiff = leftName.length - rightName.length;
    if (lengthDiff !== 0) return lengthDiff;

    return (left.name_i18n?.en || left.code || '').localeCompare(
      right.name_i18n?.en || right.code || ''
    );
  });
}

async function searchTaxonomySkillsWithSupabase(
  supabase: any,
  searchTerm: string,
  limit: number
): Promise<any[]> {
  const normalized = normalizeForComparison(searchTerm);
  if (!normalized) return [];

  const likePattern = `%${normalized}%`;
  const { data, error } = await supabase
    .from('skills_taxonomy')
    .select('*')
    .eq('status', 'active')
    .or(
      [
        `code.ilike.${likePattern}`,
        `slug.ilike.${likePattern}`,
        `name_i18n->>en.ilike.${likePattern}`,
        `description_i18n->>en.ilike.${likePattern}`,
      ].join(',')
    )
    .limit(limit);

  if (error) {
    throw error;
  }

  return sortSimpleSearchResults(searchTerm, data || []);
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

async function emitSearchTelemetry(input: {
  eventType: SearchTelemetryEventType;
  searchTerm: string;
  queryClass: string;
  resultCount: number;
  usedFallback: boolean;
  rpcFailed: boolean;
  userId?: string | null;
  detail?: string;
}) {
  if (process.env.NODE_ENV === 'test') return;
  if (!input.userId) return;

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
      user_id: input.userId,
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
    const searchContext = searchParams.get('context');
    if (searchContext === 'cv_import') {
      return legacySurfaceJsonResponse(
        'Legacy Expertise API',
        'CV import taxonomy matching is archived outside the locked launch MVP corridor.'
      );
    }
    const searchCategory = searchParams.get('category');
    const evidenceSnippets = searchParams
      .getAll('evidence')
      .map((value) => value.trim())
      .filter(Boolean);
    const resultLimitRaw = Number(searchParams.get('limit') || SEARCH_RESULT_LIMIT);
    const resultLimit = Number.isFinite(resultLimitRaw)
      ? Math.max(1, Math.min(Math.floor(resultLimitRaw), SEARCH_RESULT_LIMIT))
      : SEARCH_RESULT_LIMIT;
    const searchClass = search ? classifySearchQuery(search) : null;
    const searchHash = search ? hashQuery(search) : null;
    const {
      data: { user },
    } = await supabase.auth.getUser();

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

        if (isManualReviewOnlyShortToken(normalizedSearch) && searchContext !== 'cv_import') {
          void emitSearchTelemetry({
            eventType: 'taxonomy_search_zero_results',
            searchTerm: normalizedSearch,
            queryClass,
            resultCount: 0,
            usedFallback: false,
            rpcFailed: false,
            userId: user?.id,
          });
          return NextResponse.json({ l4_skills: [] });
        }

        const shouldUseSimpleSearchFirst =
          searchContext !== 'cv_import' && !searchCategory && evidenceSnippets.length === 0;

        if (shouldUseSimpleSearchFirst) {
          const simpleSkills = await searchTaxonomySkillsWithSupabase(
            supabase,
            normalizedSearch,
            resultLimit
          );
          skills = await enrichSkillsWithParentContext(supabase, simpleSkills);
          error = null;

          if (skills.length === 0) {
            void emitSearchTelemetry({
              eventType: 'taxonomy_search_zero_results',
              searchTerm: normalizedSearch,
              queryClass,
              resultCount: 0,
              usedFallback: true,
              rpcFailed: false,
              userId: user?.id,
            });
          }
        } else {
          let rankedMatches: Awaited<ReturnType<typeof searchAtlasSkillMatches>> = [];
          let atlasTimedOut = false;

          try {
            rankedMatches = await withTimeout(
              searchAtlasSkillMatches({
                query: normalizedSearch,
                evidenceSnippets,
                category: (() => {
                  if (
                    searchCategory === 'technical' ||
                    searchCategory === 'soft_skills' ||
                    searchCategory === 'tools_technologies' ||
                    searchCategory === 'languages' ||
                    searchCategory === 'certifications' ||
                    searchCategory === 'other'
                  ) {
                    return searchCategory;
                  }
                  return undefined;
                })(),
                limit: resultLimit,
              }),
              SEARCH_ATLAS_TIMEOUT_MS,
              'Atlas taxonomy search timed out'
            );
          } catch (atlasError) {
            atlasTimedOut = true;
            console.warn('[Taxonomy API] Atlas search unavailable; using simple taxonomy search', {
              searchHash,
              searchClass: queryClass,
              error: atlasError instanceof Error ? atlasError.message : String(atlasError),
            });
          }

          const rankedCodes = rankedMatches.map((match) => match.skill_id);
          if (rankedCodes.length === 0) {
            const fallbackSkills = await searchTaxonomySkillsWithSupabase(
              supabase,
              normalizedSearch,
              resultLimit
            );
            skills = await enrichSkillsWithParentContext(supabase, fallbackSkills);
            error = null;
            if (skills.length === 0) {
              void emitSearchTelemetry({
                eventType: 'taxonomy_search_zero_results',
                searchTerm: normalizedSearch,
                queryClass,
                resultCount: 0,
                usedFallback: true,
                rpcFailed: atlasTimedOut,
                userId: user?.id,
              });
            }
          } else {
            const { data: searchSkills, error: searchError } = await supabase
              .from('skills_taxonomy')
              .select('*')
              .eq('status', 'active')
              .in('code', rankedCodes);

            if (searchError) {
              console.error('[Taxonomy API] Failed to load ranked atlas rows', {
                searchHash,
                searchClass: queryClass,
                error: searchError.message,
              });
              void emitSearchTelemetry({
                eventType: 'taxonomy_search_error',
                searchTerm: normalizedSearch,
                queryClass,
                resultCount: 0,
                usedFallback: false,
                rpcFailed: false,
                detail: searchError.message,
                userId: user?.id,
              });
              return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
            }

            const byCode = new Map((searchSkills || []).map((skill: any) => [skill.code, skill]));
            const orderedSkills = rankedCodes.map((code) => byCode.get(code)).filter(Boolean);
            const enrichedSkills = await enrichSkillsWithParentContext(supabase, orderedSkills);
            const matchByCode = new Map(rankedMatches.map((match) => [match.skill_id, match]));

            skills = enrichedSkills.map((skill) => {
              const match = matchByCode.get(skill.code);
              return {
                ...skill,
                matchMethod: match?.match_method || null,
                matchScore: match?.score ?? null,
                matchSource: match?.match_source || null,
                matchedQuery: match?.matched_query || null,
                matchedLabel: match?.matched_label || null,
              };
            });
            error = null;
          }
        }
      } else if (l3Id) {
        // Regular L3 filtering
        const [catId, subcatId, l3IdNum] = l3Id.split('.').map(Number);
        if (![catId, subcatId, l3IdNum].every((value) => Number.isFinite(value))) {
          return NextResponse.json({ error: 'Invalid L3 identifier' }, { status: 400 });
        }

        const { data: l3Skills, error: l3Error } = await supabase
          .from('skills_taxonomy')
          .select('*')
          .eq('status', 'active')
          .eq('cat_id', catId)
          .eq('subcat_id', subcatId)
          .eq('l3_id', l3IdNum)
          .limit(100);

        if (l3Error) {
          skills = [];
          error = l3Error;
        } else {
          skills = await enrichSkillsWithParentContext(supabase, l3Skills || []);
          error = null;
        }
      } else {
        skills = [];
        error = null;
      }

      if (error) {
        console.error('Error fetching L4 skills:', error);
        return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
      }

      console.log('[Taxonomy API] Skills request completed', {
        mode: search ? 'search' : 'query',
        searchHash,
        searchClass,
        resultCount: skills?.length || 0,
      });

      // Map skills with parent context
      const mappedSkills =
        skills?.map((s) => {
          const baseSkill = mapTaxonomyFields(s, 'l4');
          return {
            ...baseSkill,
            matchMethod: s.matchMethod ?? null,
            matchScore: s.matchScore ?? null,
            matchSource: s.matchSource ?? null,
            matchedQuery: s.matchedQuery ?? null,
            matchedLabel: s.matchedLabel ?? null,
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
