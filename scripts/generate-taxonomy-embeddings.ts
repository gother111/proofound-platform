/**
 * Generate Embeddings for Skills Taxonomy
 *
 * This script generates embeddings for all skills in the taxonomy database
 * using the local Transformers.js embedding model. Run this once to populate
 * the embedding field for semantic search.
 *
 * Usage: npx tsx scripts/generate-taxonomy-embeddings.ts
 */

import { config } from 'dotenv';
import { pipeline, Pipeline, env } from '@xenova/transformers';
import pg from 'pg';

// Load environment variables
config({ path: '.env.local' });

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = false;

const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';
const BATCH_SIZE = 50; // Process 50 skills at a time
const EMBEDDING_DIMENSION = 384; // all-MiniLM-L6-v2 outputs 384 dimensions

interface TaxonomySkill {
  code: string;
  name_i18n: { en?: string };
  aliases_i18n: string[] | null;
}

async function main() {
  console.log('🚀 Starting taxonomy embedding generation...\n');

  // 1. Connect to database
  console.log('📦 Connecting to database...');
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (!connectionString) {
    console.error('❌ No DATABASE_URL or POSTGRES_URL found in environment');
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString });

  try {
    // Test connection
    await pool.query('SELECT 1');
    console.log('✅ Database connected\n');

    // 2. Load embedding model
    console.log('🧠 Loading embedding model (this may take a moment on first run)...');
    const startLoadTime = Date.now();
    const pipe = await pipeline('feature-extraction', MODEL_NAME, {
      quantized: true,
    });
    console.log(`✅ Model loaded in ${Date.now() - startLoadTime}ms\n`);

    // 3. Check if pgvector extension exists and embedding column
    console.log('🔍 Checking database schema...');
    const extensionCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
      ) as has_vector
    `);

    if (!extensionCheck.rows[0].has_vector) {
      console.log('📌 pgvector extension not found. Creating...');
      await pool.query('CREATE EXTENSION IF NOT EXISTS vector');
      console.log('✅ pgvector extension created');
    }

    // Check embedding column type and dimension
    const columnCheck = await pool.query(`
      SELECT 
        attname as column_name,
        format_type(atttypid, atttypmod) as column_type
      FROM pg_attribute 
      WHERE attrelid = 'skills_taxonomy'::regclass 
        AND attname = 'embedding'
    `);

    if (columnCheck.rows.length === 0) {
      console.log('📌 Embedding column not found. Adding...');
      await pool.query(`
        ALTER TABLE skills_taxonomy
        ADD COLUMN IF NOT EXISTS embedding vector(${EMBEDDING_DIMENSION})
      `);
      console.log('✅ Embedding column added');
    } else {
      const columnType = columnCheck.rows[0].column_type;
      if (!columnType.includes(`${EMBEDDING_DIMENSION}`)) {
        console.log(
          `⚠️  Embedding column has wrong dimension. Current: ${columnType}, Expected: vector(${EMBEDDING_DIMENSION})`
        );
        console.log('📌 Fixing dimension...');
        await pool.query(`
          ALTER TABLE skills_taxonomy DROP COLUMN IF EXISTS embedding;
          ALTER TABLE skills_taxonomy ADD COLUMN embedding vector(${EMBEDDING_DIMENSION});
        `);
        console.log('✅ Embedding column dimension fixed');
      }
    }
    console.log('✅ Database schema verified\n');

    // 4. Get all skills from taxonomy
    console.log('📊 Fetching skills from taxonomy...');
    const skillsResult = await pool.query<TaxonomySkill>(`
      SELECT code, name_i18n, aliases_i18n
      FROM skills_taxonomy
      WHERE status = 'active'
      ORDER BY code
    `);

    const skills = skillsResult.rows;
    console.log(`✅ Found ${skills.length} active skills\n`);

    if (skills.length === 0) {
      console.log('⚠️  No skills found in taxonomy. Please seed the taxonomy first.');
      return;
    }

    // 5. Check how many already have embeddings
    const embeddedCount = await pool.query(`
      SELECT COUNT(*) as count
      FROM skills_taxonomy
      WHERE embedding IS NOT NULL
    `);
    console.log(`📈 Skills with existing embeddings: ${embeddedCount.rows[0].count}\n`);

    // 6. Filter to skills without embeddings (or regenerate all with --force flag)
    const forceRegenerate = process.argv.includes('--force');
    let skillsToProcess: TaxonomySkill[];

    if (forceRegenerate) {
      console.log('🔄 Force regenerate mode: Processing ALL skills...\n');
      skillsToProcess = skills;
    } else {
      const noEmbeddingResult = await pool.query<TaxonomySkill>(`
        SELECT code, name_i18n, aliases_i18n
        FROM skills_taxonomy
        WHERE status = 'active' AND embedding IS NULL
        ORDER BY code
      `);
      skillsToProcess = noEmbeddingResult.rows;
      console.log(`📝 Skills needing embeddings: ${skillsToProcess.length}\n`);
    }

    if (skillsToProcess.length === 0) {
      console.log('✅ All skills already have embeddings. Use --force to regenerate.');
      return;
    }

    // 7. Process in batches
    console.log(`🔄 Generating embeddings in batches of ${BATCH_SIZE}...`);
    const totalBatches = Math.ceil(skillsToProcess.length / BATCH_SIZE);
    let processedCount = 0;
    let errorCount = 0;
    const startProcessTime = Date.now();

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batchStart = batchIndex * BATCH_SIZE;
      const batchEnd = Math.min(batchStart + BATCH_SIZE, skillsToProcess.length);
      const batch = skillsToProcess.slice(batchStart, batchEnd);

      // Generate texts for embedding (name + aliases)
      const textsToEmbed = batch.map((skill) => {
        const name = skill.name_i18n?.en || '';
        const aliases = skill.aliases_i18n || [];
        // Combine name with aliases for better semantic representation
        return [name, ...aliases.slice(0, 3)].filter(Boolean).join(' | ');
      });

      try {
        // Generate embeddings for batch
        const embeddings = await Promise.all(
          textsToEmbed.map(async (text) => {
            if (!text || text.trim().length === 0) return null;
            const output = await pipe(text, { pooling: 'mean', normalize: true });
            return Array.from(output.data as Float32Array);
          })
        );

        // Update database
        for (let i = 0; i < batch.length; i++) {
          const skill = batch[i];
          const embedding = embeddings[i];

          if (embedding) {
            const vectorStr = `[${embedding.join(',')}]`;
            await pool.query(`UPDATE skills_taxonomy SET embedding = $1::vector WHERE code = $2`, [
              vectorStr,
              skill.code,
            ]);
            processedCount++;
          }
        }
      } catch (error) {
        console.error(`\n❌ Error in batch ${batchIndex + 1}:`, error);
        errorCount += batch.length;
      }

      // Progress update
      const progress = (((batchIndex + 1) / totalBatches) * 100).toFixed(1);
      const elapsed = ((Date.now() - startProcessTime) / 1000).toFixed(1);
      process.stdout.write(
        `\r   Batch ${batchIndex + 1}/${totalBatches} (${progress}%) - ${processedCount} processed - ${elapsed}s elapsed`
      );
    }

    console.log('\n');

    // 8. Summary
    const totalTime = ((Date.now() - startProcessTime) / 1000).toFixed(1);
    console.log('═══════════════════════════════════════════');
    console.log('📊 EMBEDDING GENERATION COMPLETE');
    console.log('═══════════════════════════════════════════');
    console.log(`✅ Skills processed: ${processedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`⏱️  Total time: ${totalTime}s`);
    console.log(`📈 Average: ${(processedCount / parseFloat(totalTime)).toFixed(1)} skills/second`);
    console.log('═══════════════════════════════════════════\n');

    // 9. Verify final count
    const finalCount = await pool.query(`
      SELECT COUNT(*) as count
      FROM skills_taxonomy
      WHERE embedding IS NOT NULL
    `);
    console.log(`📦 Total skills with embeddings: ${finalCount.rows[0].count}\n`);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('👋 Database connection closed');
  }
}

// Run the script
main().catch(console.error);
