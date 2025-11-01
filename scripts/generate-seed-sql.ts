#!/usr/bin/env tsx
/**
 * Generate SQL INSERT statements for seeding taxonomy
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface L2Category {
  code: string;
  name: string;
  l3Items: string[];
}

const L1_MAPPING: Record<string, { id: number; name: string }> = {
  'U': { id: 1, name: 'Universal Capabilities' },
  'F': { id: 2, name: 'Functional Competencies' },
  'T': { id: 3, name: 'Tools & Technologies' },
  'L': { id: 4, name: 'Languages & Culture' },
  'M': { id: 5, name: 'Methods & Practices' },
  'D': { id: 6, name: 'Domain Knowledge' },
};

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

function escapeString(str: string): string {
  return str.replace(/'/g, "''");
}

function generateSQL(): string {
  const markdownPath = path.join(__dirname, '..', 'Expertise_Atlas_Taxonomy_L1_L2_L3_Expanded.md');
  const l1ToL2Map = parseTaxonomyMarkdown(markdownPath);
  
  let sql = '-- Seed Expertise Atlas Taxonomy\n\n';
  
  // 1. Insert L1 domains
  sql += '-- Insert L1 domains\n';
  for (const [code, info] of Object.entries(L1_MAPPING)) {
    sql += `INSERT INTO skills_categories (cat_id, slug, name_i18n, description_i18n, icon, display_order, version, created_at, updated_at)
VALUES (${info.id}, '${code.toLowerCase()}', '{"en": "${escapeString(info.name)}"}', '{"en": "${escapeString(info.name)} domain"}', 'Briefcase', ${info.id}, 1, NOW(), NOW())
ON CONFLICT (cat_id) DO NOTHING;\n\n`;
  }
  
  // 2. Insert L2 categories
  sql += '-- Insert L2 categories\n';
  let globalSubcatId = 1;
  const l2ToSubcatIdMap = new Map<string, number>();
  
  for (const [l1Code, l2Categories] of l1ToL2Map.entries()) {
    const catId = L1_MAPPING[l1Code].id;
    
    for (const l2 of l2Categories) {
      const subcatId = globalSubcatId++;
      const slug = l2.code.toLowerCase();
      l2ToSubcatIdMap.set(l2.code, subcatId);
      
      sql += `INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (${catId}, ${subcatId}, '${slug}', '{"en": "${escapeString(l2.name)}"}', '{"en": "${escapeString(l2.name)} skills and competencies"}', ${subcatId}, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;\n\n`;
    }
  }
  
  // 3. Insert L3 subcategories
  sql += '-- Insert L3 subcategories\n';
  let globalL3Id = 1;
  
  for (const [l1Code, l2Categories] of l1ToL2Map.entries()) {
    const catId = L1_MAPPING[l1Code].id;
    
    for (const l2 of l2Categories) {
      const subcatId = l2ToSubcatIdMap.get(l2.code)!;
      
      for (const l3Name of l2.l3Items) {
        const l3Id = globalL3Id++;
        const slug = l3Name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        
        sql += `INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (${catId}, ${subcatId}, ${l3Id}, '${l2.code.toLowerCase()}-${slug}', '{"en": "${escapeString(l3Name)}"}', '{"en": "${escapeString(l3Name)} related skills"}', ${l3Id}, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;\n\n`;
      }
    }
  }
  
  return sql;
}

// Generate and write SQL
const sql = generateSQL();
fs.writeFileSync(path.join(__dirname, 'seed-taxonomy.sql'), sql);
console.log('✅ SQL generation complete! File: scripts/seed-taxonomy.sql');
console.log(`   Total SQL size: ${(sql.length / 1024).toFixed(2)} KB`);

