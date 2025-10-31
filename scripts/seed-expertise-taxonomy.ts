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

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// L1 to cat_id mapping
const L1_MAPPING: Record<string, number> = {
  'U': 1,
  'F': 2,
  'T': 3,
  'L': 4,
  'M': 5,
  'D': 6,
};

interface L2Category {
  code: string;
  name: string;
  l3Items: string[];
}

interface L3Subcategory {
  name: string;
}

interface L4Skill {
  name: string;
  l1_code: string;
  l1_name: string;
  l2_code: string;
  l2_name: string;
  l3_name: string;
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
async function seedL2Categories(l1ToL2Map: Map<string, L2Category[]>): Promise<Map<string, number>> {
  console.log('\n📦 Seeding L2 categories...');
  
  let totalInserted = 0;
  let globalSubcatId = 1; // Global counter for unique primary keys
  const l2ToSubcatIdMap = new Map<string, number>(); // Track L2 code → subcat_id mapping
  
  for (const [l1Code, l2Categories] of l1ToL2Map.entries()) {
    const catId = L1_MAPPING[l1Code];
    
    for (const l2 of l2Categories) {
      const subcatId = globalSubcatId++;
      const slug = l2.code.toLowerCase();
      
      // Store mapping for later use
      l2ToSubcatIdMap.set(l2.code, subcatId);
      
      const { error } = await supabase
        .from('skills_subcategories')
        .insert({
          cat_id: catId,
          subcat_id: subcatId,
          slug,
          name_i18n: { en: l2.name },
          description_i18n: { en: `${l2.name} skills and competencies` },
          display_order: subcatId,
        });
      
      if (error && !error.message.includes('duplicate key')) {
        console.error(`Error inserting L2 ${l2.code}:`, error);
      } else {
        totalInserted++;
      }
    }
  }
  
  console.log(`✅ Inserted ${totalInserted} L2 categories`);
  return l2ToSubcatIdMap;
}

/**
 * Seed L3 subcategories
 * Returns a map of "L2_CODE:L3_NAME" to their global l3_id values
 */
async function seedL3Subcategories(
  l1ToL2Map: Map<string, L2Category[]>,
  l2ToSubcatIdMap: Map<string, number>
): Promise<Map<string, number>> {
  console.log('\n📦 Seeding L3 subcategories...');
  
  let totalInserted = 0;
  let globalL3Id = 1; // Global counter for unique primary keys
  const l3ToIdMap = new Map<string, number>(); // Track "L2_CODE:L3_NAME" → l3_id mapping
  
  for (const [l1Code, l2Categories] of l1ToL2Map.entries()) {
    for (const l2 of l2Categories) {
      const subcatId = l2ToSubcatIdMap.get(l2.code);
      
      if (!subcatId) {
        console.error(`❌ Missing subcat_id for L2: ${l2.code}`);
        continue;
      }
      
      for (const l3Name of l2.l3Items) {
        const l3Id = globalL3Id++;
        const slug = l3Name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        
        // Store mapping for later use
        l3ToIdMap.set(`${l2.code}:${l3Name}`, l3Id);
        
        const { error } = await supabase
          .from('skills_l3')
          .insert({
            subcat_id: subcatId,
            l3_id: l3Id,
            slug: `${l2.code.toLowerCase()}-${slug}`,
            name_i18n: { en: l3Name },
            description_i18n: { en: `${l3Name} related skills` },
            display_order: l3Id,
          });
        
        if (error && !error.message.includes('duplicate key')) {
          console.error(`Error inserting L3 ${l3Name}:`, error);
        } else {
          totalInserted++;
        }
      }
    }
  }
  
  console.log(`✅ Inserted ${totalInserted} L3 subcategories`);
  return l3ToIdMap;
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
  const l3Lookup = new Map<string, { catId: number; subcatId: number; l3Id: number }>();
  
  for (const [l1Code, l2Categories] of l1ToL2Map.entries()) {
    const catId = L1_MAPPING[l1Code];
    
    for (const l2 of l2Categories) {
      const subcatId = l2ToSubcatIdMap.get(l2.code);
      
      if (!subcatId) {
        console.error(`❌ Missing subcat_id for L2: ${l2.code}`);
        continue;
      }
      
      // Build L2 lookup key: "L1_CODE:L2_NAME"
      l2Lookup.set(`${l1Code}:${l2.name}`, { catId, subcatId, l2Code: l2.code });
      
      for (const l3Name of l2.l3Items) {
        const l3Id = l3ToIdMap.get(`${l2.code}:${l3Name}`);
        
        if (!l3Id) {
          console.error(`❌ Missing l3_id for L3: ${l2.code}:${l3Name}`);
          continue;
        }
        
        // Build L3 lookup key: "L1_CODE:L2_CODE:L3_NAME"
        l3Lookup.set(`${l1Code}:${l2.code}:${l3Name}`, { catId, subcatId, l3Id });
      }
    }
  }
  
  return { l2Lookup, l3Lookup };
}

/**
 * Seed L4 skills from JSON file
 */
async function seedL4Skills(
  jsonPath: string,
  l1ToL2Map: Map<string, L2Category[]>,
  l2ToSubcatIdMap: Map<string, number>,
  l3ToIdMap: Map<string, number>
): Promise<void> {
  console.log('\n📦 Seeding L4 skills...');
  
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const skills: L4Skill[] = data.skills;
  
  console.log(`Found ${skills.length} skills to insert`);
  
  const { l2Lookup, l3Lookup } = buildLookupMaps(l1ToL2Map, l2ToSubcatIdMap, l3ToIdMap);
  
  let inserted = 0;
  let skipped = 0;
  let errors = 0;
  
  // Process in batches of 100
  const BATCH_SIZE = 100;
  
  for (let i = 0; i < skills.length; i += BATCH_SIZE) {
    const batch = skills.slice(i, i + BATCH_SIZE);
    const taxonomyRecords = [];
    
    for (let j = 0; j < batch.length; j++) {
      const skill = batch[j];
      const skillIdInBatch = i + j + 1;
      
      // Look up L2 info
      const l2Key = `${skill.l1_code}:${skill.l2_name}`;
      const l2Info = l2Lookup.get(l2Key);
      
      if (!l2Info) {
        console.warn(`⚠️  L2 not found for: ${l2Key}`);
        skipped++;
        continue;
      }
      
      // Look up L3 info
      const l3Key = `${skill.l1_code}:${skill.l2_code}:${skill.l3_name}`;
      const l3Info = l3Lookup.get(l3Key);
      
      if (!l3Info) {
        console.warn(`⚠️  L3 not found for: ${l3Key}`);
        skipped++;
        continue;
      }
      
      // Generate skill code: "01.002.003.00042"
      const code = `${String(l3Info.catId).padStart(2, '0')}.${String(l3Info.subcatId).padStart(3, '0')}.${String(l3Info.l3Id).padStart(3, '0')}.${String(skillIdInBatch).padStart(5, '0')}`;
      const slug = skill.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      
      taxonomyRecords.push({
        code,
        cat_id: l3Info.catId,
        subcat_id: l3Info.subcatId,
        l3_id: l3Info.l3Id,
        skill_id: skillIdInBatch,
        slug: `${slug}-${skillIdInBatch}`,
        name_i18n: { en: skill.name },
        aliases_i18n: [],
        description_i18n: { en: `${skill.name} skill` },
        tags: [skill.l1_code.toLowerCase(), l2Info.l2Code.toLowerCase(), skill.l3_name.toLowerCase().split(' ')[0]],
        status: 'active',
      });
    }
    
    // Batch insert
    if (taxonomyRecords.length > 0) {
      const { error } = await supabase
        .from('skills_taxonomy')
        .insert(taxonomyRecords);
      
      if (error) {
        console.error(`❌ Error inserting batch ${i / BATCH_SIZE + 1}:`, error.message);
        errors += taxonomyRecords.length;
      } else {
        inserted += taxonomyRecords.length;
        if ((i / BATCH_SIZE) % 10 === 0) {
          console.log(`   Progress: ${inserted} / ${skills.length} skills inserted...`);
        }
      }
    }
  }
  
  console.log(`\n✅ L4 Seeding complete:`);
  console.log(`   - Inserted: ${inserted}`);
  console.log(`   - Skipped: ${skipped}`);
  console.log(`   - Errors: ${errors}`);
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting Expertise Atlas Taxonomy Seeding\n');
  
  try {
    // Parse L1/L2/L3 from markdown
    const taxonomyPath = path.join(process.cwd(), 'Expertise_Atlas_Taxonomy_L1_L2_L3_Expanded.md');
    console.log(`📖 Reading taxonomy from: ${taxonomyPath}`);
    
    if (!fs.existsSync(taxonomyPath)) {
      throw new Error(`Taxonomy file not found: ${taxonomyPath}`);
    }
    
    const l1ToL2Map = parseTaxonomyMarkdown(taxonomyPath);
    console.log(`✅ Parsed ${l1ToL2Map.size} L1 domains`);
    
    // Seed L2 categories and get global ID mappings
    const l2ToSubcatIdMap = await seedL2Categories(l1ToL2Map);
    
    // Seed L3 subcategories and get global ID mappings
    const l3ToIdMap = await seedL3Subcategories(l1ToL2Map, l2ToSubcatIdMap);
    
    // Seed L4 skills
    const l4JsonPath = path.join(process.cwd(), 'data/expertise-atlas-20k-l4-final.json');
    console.log(`\n📖 Reading L4 skills from: ${l4JsonPath}`);
    
    if (!fs.existsSync(l4JsonPath)) {
      throw new Error(`L4 skills file not found: ${l4JsonPath}`);
    }
    
    await seedL4Skills(l4JsonPath, l1ToL2Map, l2ToSubcatIdMap, l3ToIdMap);
    
    console.log('\n🎉 Taxonomy seeding completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

main();


