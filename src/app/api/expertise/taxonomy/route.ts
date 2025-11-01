import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

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
    const { searchParams } = new URL(request.url);

    const l1 = searchParams.get('l1');
    const l2 = searchParams.get('l2');
    const l3Id = searchParams.get('l3_id');
    const search = searchParams.get('search');

    // If no filters, return full L1 list
    if (!l1 && !l2 && !l3Id && !search) {
      const { data: categories, error } = await supabase
        .from('skills_categories')
        .select('*')
        .order('display_order');

      if (error) {
        console.error('Error fetching L1 categories:', error);
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
      }

      return NextResponse.json({
        l1_domains: categories?.map((c) => mapTaxonomyFields(c, 'l1')) || [],
      });
    }

    // If L1 specified, return L2 categories
    if (l1 && !l2 && !l3Id) {
      const catId = l1CodeToCatId(l1);
      if (!catId) {
        return NextResponse.json({ error: 'Invalid L1 code' }, { status: 400 });
      }

      const { data: subcategories, error } = await supabase
        .from('skills_subcategories')
        .select('*')
        .eq('cat_id', catId)
        .order('display_order');

      if (error) {
        console.error('Error fetching L2 subcategories:', error);
        return NextResponse.json({ error: 'Failed to fetch subcategories' }, { status: 500 });
      }

      return NextResponse.json({
        l2_categories: subcategories?.map((s) => mapTaxonomyFields(s, 'l2')) || [],
      });
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
      let query = supabase
        .from('skills_taxonomy')
        .select(
          `
          *,
          l1:skills_categories!skills_taxonomy_cat_id_fkey(cat_id, slug, name_i18n),
          l2:skills_subcategories!skills_taxonomy_cat_id_subcat_id_fkey(subcat_id, cat_id, slug, name_i18n),
          l3:skills_l3!skills_taxonomy_cat_id_subcat_id_l3_id_fkey(l3_id, subcat_id, cat_id, slug, name_i18n)
        `
        )
        .eq('status', 'active');

      if (l3Id) {
        const [catId, subcatId, l3IdNum] = l3Id.split('.').map(Number);
        query = query.eq('cat_id', catId).eq('subcat_id', subcatId).eq('l3_id', l3IdNum);
      }

      if (search) {
        // Search in name, aliases, description, and tags
        const searchLower = search.toLowerCase();

        query = query.or(
          `name_i18n->en.ilike.%${searchLower}%,` +
            `description_i18n->en.ilike.%${searchLower}%,` +
            `aliases_i18n->en.ilike.%${searchLower}%,` +
            `tags.cs.{${searchLower}}`
        );
      }

      // Execute the filtered query (not a new one!)
      const { data: skills, error } = await query.limit(100);

      if (error) {
        console.error('Error fetching L4 skills:', error);
        return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
      }

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
  } catch (error) {
    console.error('Taxonomy API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
