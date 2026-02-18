#!/usr/bin/env tsx
/**
 * Seed Expertise Atlas Taxonomy
 *
 * This script populates the skills taxonomy tables with:
 * - L1: 6 domains (Universal Capabilities, Functional Competencies, etc.)
 * - L2: Categories within each L1
 * - L3: Subcategories within each L2
 * - L4: ~20K granular skills
 *
 * Data sources:
 * - L1/L2/L3: Expertise_Atlas_Taxonomy_L1_L2_L3_Expanded.md
 * - L4: data/expertise-atlas-20k-l4-final.json
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TAXONOMY_MARKDOWN_CANDIDATES = [
  path.join(process.cwd(), 'Expertise_Atlas_Taxonomy_L1_L2_L3_Expanded.md'),
  path.join(
    process.cwd(),
    'docs',
    'archive',
    'legacy-platform',
    'Expertise_Atlas_Taxonomy_L1_L2_L3_Expanded.md'
  ),
];

const L4_JSON_CANDIDATES = [path.join(process.cwd(), 'data', 'expertise-atlas-20k-l4-final.json')];

export interface SeedTaxonomyOptions {
  dryRun?: boolean;
  l4Only?: boolean;
  taxonomyPath?: string;
  l4JsonPath?: string;
}

export interface SeedTaxonomySummary {
  taxonomyPath: string;
  l4JsonPath: string;
  insertedL2: number;
  insertedL3: number;
  insertedL4: number;
  skippedL4: number;
  erroredL4: number;
  finalCounts: {
    l1: number;
    l2: number;
    l3: number;
    l4: number;
  };
}

function resolveFirstExistingPath(candidates: string[], explicitPath?: string): string {
  if (explicitPath) {
    if (!fs.existsSync(explicitPath)) {
      throw new Error(`File not found: ${explicitPath}`);
    }
    return explicitPath;
  }

  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) {
    throw new Error(`None of the expected files exist: ${candidates.join(', ')}`);
  }
  return found;
}

// L1 to cat_id mapping
const L1_MAPPING: Record<string, number> = {
  U: 1,
  F: 2,
  T: 3,
  L: 4,
  M: 5,
  D: 6,
};

interface L2Category {
  code: string;
  name: string;
  l3Items: string[];
}

interface L4Skill {
  name: string;
  aliases: string[];
  description: string;
  examples?: string[];
  related_skills?: string[];
  l1_code: string;
  l1_name: string;
  l2_code: string;
  l2_name: string;
  l3_name: string;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeForMatch(input: string): string {
  return input
    .normalize('NFKD')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[\u2019\u2018']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

const PAGE_SIZE = 1000;

async function fetchAllRows<T = any>(table: string, columns: string): Promise<T[]> {
  const rows: T[] = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase.from(table).select(columns).range(from, to);
    if (error) {
      throw new Error(`Failed to load ${table} rows (${from}-${to}): ${error.message}`);
    }

    const page = (data || []) as T[];
    if (page.length === 0) {
      break;
    }

    rows.push(...page);
    if (page.length < PAGE_SIZE) {
      break;
    }
    from += PAGE_SIZE;
  }

  return rows;
}

/**
 * Parse L2 and L3 from the taxonomy markdown file
 */
function parseTaxonomyMarkdown(filePath: string): Map<string, L2Category[]> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const l1ToL2Map = new Map<string, L2Category[]>();
  let currentL1: string | null = null;
  let currentL2: L2Category | null = null;

  for (const line of lines) {
    // Match L1 headers: ## U — Universal Capabilities
    const l1Match = line.match(/^## ([UFTLMD]) — (.+)$/);
    if (l1Match) {
      currentL1 = l1Match[1];
      l1ToL2Map.set(currentL1, []);
      continue;
    }

    // Match L2 headers: ### U-COMM — Communication
    const l2Match = line.match(/^### ([A-Z]-[A-Z]+) — (.+)$/);
    if (l2Match && currentL1) {
      currentL2 = {
        code: l2Match[1],
        name: l2Match[2],
        l3Items: [],
      };
      l1ToL2Map.get(currentL1)!.push(currentL2);
      continue;
    }

    // Match L3 items: - Verbal communication
    const l3Match = line.match(/^- (.+)$/);
    if (l3Match && currentL2) {
      currentL2.l3Items.push(l3Match[1]);
    }
  }

  return l1ToL2Map;
}

/**
 * Seed L2 categories
 * Returns a map of L2 codes to their global subcat_id values
 */
async function seedL2Categories(
  l1ToL2Map: Map<string, L2Category[]>,
  dryRun: boolean = false
): Promise<{ l2ToSubcatIdMap: Map<string, number>; inserted: number }> {
  console.log('\n📦 Seeding L2 categories...');

  const existingRows = await fetchAllRows<{ cat_id: number; subcat_id: number; slug: string }>(
    'skills_subcategories',
    'cat_id, subcat_id, slug'
  );

  const existingBySlug = new Map(existingRows.map((row) => [row.slug, row]));
  let nextSubcatId = existingRows.reduce((max: number, row) => Math.max(max, row.subcat_id), 0) + 1;

  let inserted = 0;
  let reused = 0;
  const l2ToSubcatIdMap = new Map<string, number>();

  for (const [l1Code, l2Categories] of l1ToL2Map.entries()) {
    const catId = L1_MAPPING[l1Code];

    for (const l2 of l2Categories) {
      const slug = l2.code.toLowerCase();
      const existing = existingBySlug.get(slug);
      const subcatId = existing?.subcat_id ?? nextSubcatId++;

      l2ToSubcatIdMap.set(l2.code, subcatId);

      if (!dryRun) {
        const { error } = await supabase.from('skills_subcategories').upsert(
          {
            cat_id: catId,
            subcat_id: subcatId,
            slug,
            name_i18n: { en: l2.name },
            description_i18n: { en: `${l2.name} skills and competencies` },
            display_order: subcatId,
          },
          { onConflict: 'slug' }
        );

        if (error) {
          console.error(`Error upserting L2 ${l2.code}:`, error);
          continue;
        }
      }

      if (existing) {
        reused++;
      } else {
        inserted++;
      }
    }
  }

  console.log(`✅ L2 complete: ${inserted} created, ${reused} reused`);
  return { l2ToSubcatIdMap, inserted };
}

/**
 * Seed L3 subcategories
 * Returns a map of "L2_CODE:L3_NAME" to their global l3_id values
 */
async function seedL3Subcategories(
  l1ToL2Map: Map<string, L2Category[]>,
  l2ToSubcatIdMap: Map<string, number>,
  dryRun: boolean = false
): Promise<{ l3ToIdMap: Map<string, number>; inserted: number }> {
  console.log('\n📦 Seeding L3 subcategories...');

  const existingRows = await fetchAllRows<{
    cat_id: number;
    subcat_id: number;
    l3_id: number;
    slug: string;
  }>('skills_l3', 'cat_id, subcat_id, l3_id, slug');

  const existingBySlug = new Map(existingRows.map((row) => [row.slug, row]));
  let nextL3Id = existingRows.reduce((max: number, row) => Math.max(max, row.l3_id), 0) + 1;

  let inserted = 0;
  let reused = 0;
  const l3ToIdMap = new Map<string, number>();

  for (const [l1Code, l2Categories] of l1ToL2Map.entries()) {
    const catId = L1_MAPPING[l1Code];

    for (const l2 of l2Categories) {
      const subcatId = l2ToSubcatIdMap.get(l2.code);

      if (!subcatId) {
        console.error(`❌ Missing subcat_id for L2: ${l2.code}`);
        continue;
      }

      for (const l3Name of l2.l3Items) {
        const slug = `${l2.code.toLowerCase()}-${slugify(l3Name)}`;
        const existing = existingBySlug.get(slug);
        const l3Id = existing?.l3_id ?? nextL3Id++;

        l3ToIdMap.set(`${l2.code}:${l3Name}`, l3Id);

        if (!dryRun) {
          const { error } = await supabase.from('skills_l3').upsert(
            {
              cat_id: catId,
              subcat_id: subcatId,
              l3_id: l3Id,
              slug,
              name_i18n: { en: l3Name },
              description_i18n: { en: `${l3Name} related skills` },
              display_order: l3Id,
            },
            { onConflict: 'slug' }
          );

          if (error) {
            console.error(`Error upserting L3 ${l2.code}:${l3Name}:`, error);
            continue;
          }
        }

        if (existing) {
          reused++;
        } else {
          inserted++;
        }
      }
    }
  }

  console.log(`✅ L3 complete: ${inserted} created, ${reused} reused`);
  return { l3ToIdMap, inserted };
}

/**
 * Build L2/L3 lookup maps for L4 seeding using actual global IDs
 */
function buildLookupMaps(
  l1ToL2Map: Map<string, L2Category[]>,
  l2ToSubcatIdMap: Map<string, number>,
  l3ToIdMap: Map<string, number>
) {
  const l2Lookup = new Map<string, { catId: number; subcatId: number; l2Code: string }>();
  const l2LookupNormalized = new Map<string, { catId: number; subcatId: number; l2Code: string }>();
  const l3Lookup = new Map<string, { catId: number; subcatId: number; l3Id: number }>();
  const l3LookupNormalized = new Map<string, { catId: number; subcatId: number; l3Id: number }>();
  const missingL3MapKeys: string[] = [];

  for (const [l1Code, l2Categories] of l1ToL2Map.entries()) {
    const catId = L1_MAPPING[l1Code];

    for (const l2 of l2Categories) {
      const subcatId = l2ToSubcatIdMap.get(l2.code);

      if (!subcatId) {
        continue;
      }

      const l2Value = { catId, subcatId, l2Code: l2.code };
      l2Lookup.set(`${l1Code}:${l2.name}`, l2Value);
      l2LookupNormalized.set(`${l1Code}:${normalizeForMatch(l2.name)}`, l2Value);

      for (const l3Name of l2.l3Items) {
        const l3Id = l3ToIdMap.get(`${l2.code}:${l3Name}`);

        if (!l3Id) {
          missingL3MapKeys.push(`${l2.code}:${l3Name}`);
          continue;
        }

        const l3Value = { catId, subcatId, l3Id };
        l3Lookup.set(`${l1Code}:${l2.code}:${l3Name}`, l3Value);
        l3LookupNormalized.set(`${l1Code}:${l2.code}:${normalizeForMatch(l3Name)}`, l3Value);
      }
    }
  }

  return { l2Lookup, l2LookupNormalized, l3Lookup, l3LookupNormalized, missingL3MapKeys };
}

/**
 * Seed L4 skills from JSON file
 */
async function seedL4Skills(
  jsonPath: string,
  l1ToL2Map: Map<string, L2Category[]>,
  l2ToSubcatIdMap: Map<string, number>,
  l3ToIdMap: Map<string, number>,
  dryRun: boolean = false
): Promise<{ inserted: number; skipped: number; errors: number }> {
  console.log('\n📦 Seeding L4 skills...');

  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const skills: L4Skill[] = data.skills;

  console.log(`Found ${skills.length} skills to insert`);

  const { l2Lookup, l2LookupNormalized, l3Lookup, l3LookupNormalized, missingL3MapKeys } =
    buildLookupMaps(l1ToL2Map, l2ToSubcatIdMap, l3ToIdMap);

  if (missingL3MapKeys.length > 0) {
    const sample = missingL3MapKeys.slice(0, 10);
    console.warn(
      `⚠️  L3 mapping coverage is incomplete before L4 seeding: ${missingL3MapKeys.length} missing L3 entries`
    );
    console.warn(`   Sample missing L3 keys: ${sample.join(' | ')}`);
  }

  let inserted = 0;
  let skipped = 0;
  let errors = 0;
  const missingL2 = new Map<string, number>();
  const missingL3 = new Map<string, number>();

  // Process in batches of 100
  const BATCH_SIZE = 100;

  for (let i = 0; i < skills.length; i += BATCH_SIZE) {
    const batch = skills.slice(i, i + BATCH_SIZE);
    const taxonomyRecords = [];

    for (let j = 0; j < batch.length; j++) {
      const skill = batch[j];
      const skillIdInBatch = i + j + 1;

      const l2Key = `${skill.l1_code}:${skill.l2_name}`;
      const l2Info =
        l2Lookup.get(l2Key) ||
        l2LookupNormalized.get(`${skill.l1_code}:${normalizeForMatch(skill.l2_name)}`);

      if (!l2Info) {
        missingL2.set(l2Key, (missingL2.get(l2Key) || 0) + 1);
        skipped++;
        continue;
      }

      const l3Key = `${skill.l1_code}:${skill.l2_code}:${skill.l3_name}`;
      const l3Info =
        l3Lookup.get(l3Key) ||
        l3LookupNormalized.get(
          `${skill.l1_code}:${skill.l2_code}:${normalizeForMatch(skill.l3_name)}`
        );

      if (!l3Info) {
        missingL3.set(l3Key, (missingL3.get(l3Key) || 0) + 1);
        skipped++;
        continue;
      }

      const code = `${String(l3Info.catId).padStart(2, '0')}.${String(l3Info.subcatId).padStart(3, '0')}.${String(l3Info.l3Id).padStart(3, '0')}.${String(skillIdInBatch).padStart(5, '0')}`;
      const slug = slugify(skill.name);

      taxonomyRecords.push({
        code,
        cat_id: l3Info.catId,
        subcat_id: l3Info.subcatId,
        l3_id: l3Info.l3Id,
        skill_id: skillIdInBatch,
        slug: `${slug}-${skillIdInBatch}`,
        name_i18n: { en: skill.name },
        aliases_i18n:
          skill.aliases && skill.aliases.length > 0
            ? skill.aliases.map((alias: string) => ({ en: alias }))
            : [],
        description_i18n: skill.description
          ? { en: skill.description }
          : { en: `${skill.name} skill` },
        tags: [skill.l1_code.toLowerCase(), l2Info.l2Code.toLowerCase(), slugify(skill.l3_name)],
        status: 'active',
      });
    }

    // Batch insert
    if (taxonomyRecords.length > 0) {
      if (!dryRun) {
        const { error } = await supabase
          .from('skills_taxonomy')
          .upsert(taxonomyRecords, { onConflict: 'code' });

        if (error) {
          console.error(`❌ Error inserting batch ${i / BATCH_SIZE + 1}:`, error.message);
          errors += taxonomyRecords.length;
          continue;
        }
      }

      inserted += taxonomyRecords.length;
      if ((i / BATCH_SIZE) % 10 === 0) {
        console.log(`   Progress: ${inserted} / ${skills.length} skills inserted...`);
      }
    }
  }

  console.log(`\n✅ L4 Seeding complete:`);
  console.log(`   - Inserted: ${inserted}`);
  console.log(`   - Skipped: ${skipped}`);
  console.log(`   - Errors: ${errors}`);

  if (missingL2.size > 0) {
    const topMissingL2 = [...missingL2.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    console.warn(`   - Missing L2 keys: ${missingL2.size} unique`);
    console.warn(
      `     Samples: ${topMissingL2.map(([key, count]) => `${key} (${count})`).join(' | ')}`
    );
  }

  if (missingL3.size > 0) {
    const topMissingL3 = [...missingL3.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    console.warn(`   - Missing L3 keys: ${missingL3.size} unique`);
    console.warn(
      `     Samples: ${topMissingL3.map(([key, count]) => `${key} (${count})`).join(' | ')}`
    );
  }

  return { inserted, skipped, errors };
}

/**
 * Main execution
 */
async function getCounts() {
  const [l1, l2, l3, l4] = await Promise.all([
    supabase.from('skills_categories').select('*', { count: 'exact', head: true }),
    supabase.from('skills_subcategories').select('*', { count: 'exact', head: true }),
    supabase.from('skills_l3').select('*', { count: 'exact', head: true }),
    supabase.from('skills_taxonomy').select('*', { count: 'exact', head: true }),
  ]);

  return {
    l1: l1.count || 0,
    l2: l2.count || 0,
    l3: l3.count || 0,
    l4: l4.count || 0,
  };
}

async function buildMapsFromExistingTaxonomy(l1ToL2Map: Map<string, L2Category[]>) {
  const l2Rows = await fetchAllRows<{ cat_id: number; subcat_id: number; slug: string }>(
    'skills_subcategories',
    'cat_id, subcat_id, slug'
  );
  const l3Rows = await fetchAllRows<{
    cat_id: number;
    subcat_id: number;
    l3_id: number;
    name_i18n: { en?: string };
  }>('skills_l3', 'cat_id, subcat_id, l3_id, name_i18n');

  const l2BySlug = new Map(l2Rows.map((row) => [row.slug, row]));
  const l3ByHierarchyAndName = new Map<string, any>();
  for (const row of l3Rows) {
    const name = row.name_i18n?.en || '';
    l3ByHierarchyAndName.set(`${row.cat_id}:${row.subcat_id}:${name}`, row);
  }

  const l2ToSubcatIdMap = new Map<string, number>();
  const l3ToIdMap = new Map<string, number>();
  let expectedL3 = 0;

  for (const [l1Code, l2Categories] of l1ToL2Map.entries()) {
    const catId = L1_MAPPING[l1Code];
    for (const l2 of l2Categories) {
      const slug = l2.code.toLowerCase();
      const existingL2 = l2BySlug.get(slug);
      if (!existingL2) continue;

      l2ToSubcatIdMap.set(l2.code, existingL2.subcat_id);
      for (const l3Name of l2.l3Items) {
        expectedL3++;
        const existingL3 = l3ByHierarchyAndName.get(`${catId}:${existingL2.subcat_id}:${l3Name}`);
        if (existingL3) {
          l3ToIdMap.set(`${l2.code}:${l3Name}`, existingL3.l3_id);
        }
      }
    }
  }

  if (l3ToIdMap.size < expectedL3) {
    console.warn(
      `⚠️  Existing L3 map is partial: ${l3ToIdMap.size}/${expectedL3}. Run full seed (without --l4-only) to reconcile missing L3 rows.`
    );
  }

  return { l2ToSubcatIdMap, l3ToIdMap };
}

export async function seedExpertiseTaxonomy(
  options: SeedTaxonomyOptions = {}
): Promise<SeedTaxonomySummary> {
  const dryRun = Boolean(options.dryRun);
  const l4Only = Boolean(options.l4Only);

  console.log('🚀 Starting Expertise Atlas Taxonomy Seeding\n');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'APPLY'}${l4Only ? ' (L4 only)' : ''}`);

  const taxonomyPath = resolveFirstExistingPath(TAXONOMY_MARKDOWN_CANDIDATES, options.taxonomyPath);
  const l4JsonPath = resolveFirstExistingPath(L4_JSON_CANDIDATES, options.l4JsonPath);

  console.log(`📖 Reading taxonomy from: ${taxonomyPath}`);
  console.log(`📖 Reading L4 skills from: ${l4JsonPath}`);

  const l1ToL2Map = parseTaxonomyMarkdown(taxonomyPath);
  console.log(`✅ Parsed ${l1ToL2Map.size} L1 domains`);

  let insertedL2 = 0;
  let insertedL3 = 0;
  let l2ToSubcatIdMap = new Map<string, number>();
  let l3ToIdMap = new Map<string, number>();

  if (l4Only) {
    const existingMaps = await buildMapsFromExistingTaxonomy(l1ToL2Map);
    l2ToSubcatIdMap = existingMaps.l2ToSubcatIdMap;
    l3ToIdMap = existingMaps.l3ToIdMap;
  } else {
    const l2Result = await seedL2Categories(l1ToL2Map, dryRun);
    insertedL2 = l2Result.inserted;
    l2ToSubcatIdMap = l2Result.l2ToSubcatIdMap;

    const l3Result = await seedL3Subcategories(l1ToL2Map, l2ToSubcatIdMap, dryRun);
    insertedL3 = l3Result.inserted;
    l3ToIdMap = l3Result.l3ToIdMap;
  }

  const l4Result = await seedL4Skills(l4JsonPath, l1ToL2Map, l2ToSubcatIdMap, l3ToIdMap, dryRun);

  const finalCounts = dryRun ? await getCounts() : await getCounts();

  console.log('\n📊 Final counts:');
  console.log(`   - L1 domains: ${finalCounts.l1}`);
  console.log(`   - L2 categories: ${finalCounts.l2}`);
  console.log(`   - L3 subcategories: ${finalCounts.l3}`);
  console.log(`   - L4 skills: ${finalCounts.l4}`);
  console.log('\n🎉 Taxonomy seeding completed successfully!');

  return {
    taxonomyPath,
    l4JsonPath,
    insertedL2,
    insertedL3,
    insertedL4: l4Result.inserted,
    skippedL4: l4Result.skipped,
    erroredL4: l4Result.errors,
    finalCounts,
  };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has('--dry-run');
  const l4Only = args.has('--l4-only');

  try {
    await seedExpertiseTaxonomy({ dryRun, l4Only });
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
