#!/usr/bin/env tsx
/**
 * Batch insert L2 categories
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function convertToBatchInsert() {
  const l2File = path.join(__dirname, 'l2-categories.sql');
  const content = fs.readFileSync(l2File, 'utf-8');

  // Extract VALUES clauses
  const valuesPattern = /VALUES \((.*?)\)/g;
  const matches = [...content.matchAll(valuesPattern)];

  console.log(`Found ${matches.length} L2 category inserts`);

  // Create batches of 50
  const batchSize = 50;
  const batches: string[][] = [];

  for (let i = 0; i < matches.length; i += batchSize) {
    const batch = matches.slice(i, i + batchSize).map((m) => `(${m[1]})`);
    batches.push(batch);
  }

  console.log(`Created ${batches.length} batches`);

  // Generate batch SQL files
  batches.forEach((batch, index) => {
    const batchSql = `INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES
${batch.join(',\n')}
ON CONFLICT (cat_id, subcat_id) DO NOTHING;`;

    fs.writeFileSync(path.join(__dirname, `l2-batch-${index + 1}.sql`), batchSql);
  });

  console.log(`✅ Generated ${batches.length} batch files`);
}

convertToBatchInsert();
