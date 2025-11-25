#!/usr/bin/env npx ts-node

/**
 * Backfill Script: Generate embeddings for existing profiles and assignments
 *
 * This script:
 * 1. Fetches all profiles and assignments without embeddings
 * 2. Generates embeddings using the local transformer model
 * 3. Updates the database with the new embeddings
 *
 * Usage:
 *   npx ts-node scripts/backfill-embeddings.ts
 *
 * Options:
 *   --profiles-only   Only backfill profile embeddings
 *   --assignments-only Only backfill assignment embeddings
 *   --batch-size N    Process N records at a time (default: 50)
 *   --dry-run         Show what would be updated without making changes
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import {
  generateEmbedding,
  formatEmbeddingForPostgres,
  EMBEDDING_CONFIG,
} from '../src/lib/matching/embeddings';

// Load environment variables from .env.local (relative to project root)
config({ path: '.env.local' });

// Parse command line arguments
const args = process.argv.slice(2);
const profilesOnly = args.includes('--profiles-only');
const assignmentsOnly = args.includes('--assignments-only');
const dryRun = args.includes('--dry-run');
const batchSizeIndex = args.indexOf('--batch-size');
const batchSize = batchSizeIndex !== -1 ? parseInt(args[batchSizeIndex + 1]) || 50 : 50;

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ProfileRecord {
  user_id: string;
  mission: string | null;
  vision: string | null;
  mission_embedding: number[] | null;
  vision_embedding: number[] | null;
}

interface AssignmentRecord {
  id: string;
  description: string | null;
  business_value: string | null;
  expected_impact: string | null;
  mission_embedding: number[] | null;
  vision_embedding: number[] | null;
}

/**
 * Generate combined purpose embedding from mission and vision
 */
function combinePurposeEmbedding(missionEmbedding: number[], visionEmbedding: number[]): number[] {
  // Average the two embeddings
  const combined: number[] = [];
  for (let i = 0; i < EMBEDDING_CONFIG.DIMENSIONS; i++) {
    combined.push((missionEmbedding[i] + visionEmbedding[i]) / 2);
  }

  // Normalize the combined embedding
  const magnitude = Math.sqrt(combined.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < combined.length; i++) {
      combined[i] /= magnitude;
    }
  }

  return combined;
}

/**
 * Backfill individual profile embeddings
 */
async function backfillProfiles(): Promise<number> {
  console.log('\n📊 Backfilling individual profile embeddings...');

  // Fetch profiles without embeddings
  const { data: profiles, error } = await supabase
    .from('individual_profiles')
    .select('user_id, mission, vision, mission_embedding, vision_embedding')
    .or('mission_embedding.is.null,vision_embedding.is.null')
    .not('mission', 'is', null);

  if (error) {
    console.error('❌ Failed to fetch profiles:', error.message);
    return 0;
  }

  if (!profiles || profiles.length === 0) {
    console.log('✅ No profiles need embedding updates');
    return 0;
  }

  console.log(`Found ${profiles.length} profiles to process`);

  let updated = 0;

  // Process in batches
  for (let i = 0; i < profiles.length; i += batchSize) {
    const batch = profiles.slice(i, i + batchSize);
    console.log(
      `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(profiles.length / batchSize)}`
    );

    for (const profile of batch) {
      try {
        const missionText = profile.mission || '';
        const visionText = profile.vision || '';

        // Skip if both are empty
        if (!missionText && !visionText) {
          continue;
        }

        // Generate embeddings
        const missionEmbedding = missionText
          ? await generateEmbedding(missionText)
          : new Array(EMBEDDING_CONFIG.DIMENSIONS).fill(0);
        const visionEmbedding = visionText
          ? await generateEmbedding(visionText)
          : new Array(EMBEDDING_CONFIG.DIMENSIONS).fill(0);
        const purposeEmbedding = combinePurposeEmbedding(missionEmbedding, visionEmbedding);

        if (dryRun) {
          console.log(`  [DRY RUN] Would update profile ${profile.user_id}`);
        } else {
          // Update individual_profiles
          const { error: profileError } = await supabase
            .from('individual_profiles')
            .update({
              mission_embedding: formatEmbeddingForPostgres(missionEmbedding),
              vision_embedding: formatEmbeddingForPostgres(visionEmbedding),
              embeddings_updated_at: new Date().toISOString(),
            })
            .eq('user_id', profile.user_id);

          if (profileError) {
            console.error(
              `  ❌ Failed to update profile ${profile.user_id}:`,
              profileError.message
            );
            continue;
          }

          // Also update matching_profiles if exists
          await supabase
            .from('matching_profiles')
            .update({
              mission_embedding: formatEmbeddingForPostgres(missionEmbedding),
              vision_embedding: formatEmbeddingForPostgres(visionEmbedding),
              purpose_embedding: formatEmbeddingForPostgres(purposeEmbedding),
              embeddings_updated_at: new Date().toISOString(),
            })
            .eq('profile_id', profile.user_id);

          console.log(`  ✅ Updated profile ${profile.user_id}`);
        }

        updated++;
      } catch (err) {
        console.error(`  ❌ Error processing profile ${profile.user_id}:`, err);
      }
    }

    // Small delay between batches to avoid rate limiting
    if (i + batchSize < profiles.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return updated;
}

/**
 * Backfill assignment embeddings
 */
async function backfillAssignments(): Promise<number> {
  console.log('\n📊 Backfilling assignment embeddings...');

  // Fetch assignments without embeddings
  const { data: assignments, error } = await supabase
    .from('assignments')
    .select('id, description, business_value, expected_impact, mission_embedding, vision_embedding')
    .or('mission_embedding.is.null,vision_embedding.is.null');

  if (error) {
    console.error('❌ Failed to fetch assignments:', error.message);
    return 0;
  }

  if (!assignments || assignments.length === 0) {
    console.log('✅ No assignments need embedding updates');
    return 0;
  }

  console.log(`Found ${assignments.length} assignments to process`);

  let updated = 0;

  // Process in batches
  for (let i = 0; i < assignments.length; i += batchSize) {
    const batch = assignments.slice(i, i + batchSize);
    console.log(
      `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(assignments.length / batchSize)}`
    );

    for (const assignment of batch) {
      try {
        // Use description as mission, business_value as vision
        const missionText = assignment.description || assignment.business_value || '';
        const visionText = assignment.expected_impact || '';

        // Skip if no text
        if (!missionText && !visionText) {
          continue;
        }

        // Generate embeddings
        const missionEmbedding = missionText
          ? await generateEmbedding(missionText)
          : new Array(EMBEDDING_CONFIG.DIMENSIONS).fill(0);
        const visionEmbedding = visionText
          ? await generateEmbedding(visionText)
          : new Array(EMBEDDING_CONFIG.DIMENSIONS).fill(0);
        const purposeEmbedding = combinePurposeEmbedding(missionEmbedding, visionEmbedding);

        if (dryRun) {
          console.log(`  [DRY RUN] Would update assignment ${assignment.id}`);
        } else {
          const { error: updateError } = await supabase
            .from('assignments')
            .update({
              mission_embedding: formatEmbeddingForPostgres(missionEmbedding),
              vision_embedding: formatEmbeddingForPostgres(visionEmbedding),
              purpose_embedding: formatEmbeddingForPostgres(purposeEmbedding),
              embeddings_updated_at: new Date().toISOString(),
            })
            .eq('id', assignment.id);

          if (updateError) {
            console.error(
              `  ❌ Failed to update assignment ${assignment.id}:`,
              updateError.message
            );
            continue;
          }

          console.log(`  ✅ Updated assignment ${assignment.id}`);
        }

        updated++;
      } catch (err) {
        console.error(`  ❌ Error processing assignment ${assignment.id}:`, err);
      }
    }

    // Small delay between batches
    if (i + batchSize < assignments.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return updated;
}

/**
 * Backfill organization embeddings
 */
async function backfillOrganizations(): Promise<number> {
  console.log('\n📊 Backfilling organization embeddings...');

  const { data: orgs, error } = await supabase
    .from('organizations')
    .select('id, mission, vision, mission_embedding, vision_embedding')
    .or('mission_embedding.is.null,vision_embedding.is.null')
    .not('mission', 'is', null);

  if (error) {
    console.error('❌ Failed to fetch organizations:', error.message);
    return 0;
  }

  if (!orgs || orgs.length === 0) {
    console.log('✅ No organizations need embedding updates');
    return 0;
  }

  console.log(`Found ${orgs.length} organizations to process`);

  let updated = 0;

  for (const org of orgs) {
    try {
      const missionText = org.mission || '';
      const visionText = org.vision || '';

      if (!missionText && !visionText) {
        continue;
      }

      const missionEmbedding = missionText
        ? await generateEmbedding(missionText)
        : new Array(EMBEDDING_CONFIG.DIMENSIONS).fill(0);
      const visionEmbedding = visionText
        ? await generateEmbedding(visionText)
        : new Array(EMBEDDING_CONFIG.DIMENSIONS).fill(0);

      if (dryRun) {
        console.log(`  [DRY RUN] Would update organization ${org.id}`);
      } else {
        const { error: updateError } = await supabase
          .from('organizations')
          .update({
            mission_embedding: formatEmbeddingForPostgres(missionEmbedding),
            vision_embedding: formatEmbeddingForPostgres(visionEmbedding),
            embeddings_updated_at: new Date().toISOString(),
          })
          .eq('id', org.id);

        if (updateError) {
          console.error(`  ❌ Failed to update organization ${org.id}:`, updateError.message);
          continue;
        }

        console.log(`  ✅ Updated organization ${org.id}`);
      }

      updated++;
    } catch (err) {
      console.error(`  ❌ Error processing organization ${org.id}:`, err);
    }
  }

  return updated;
}

/**
 * Main entry point
 */
async function main() {
  console.log('🚀 Embedding Backfill Script');
  console.log(`   Model: ${EMBEDDING_CONFIG.MODEL_NAME}`);
  console.log(`   Dimensions: ${EMBEDDING_CONFIG.DIMENSIONS}`);
  console.log(`   Batch size: ${batchSize}`);
  console.log(`   Dry run: ${dryRun}`);
  console.log('');

  const startTime = Date.now();
  let totalUpdated = 0;

  try {
    if (!assignmentsOnly) {
      totalUpdated += await backfillProfiles();
      totalUpdated += await backfillOrganizations();
    }

    if (!profilesOnly) {
      totalUpdated += await backfillAssignments();
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ Done! Updated ${totalUpdated} records in ${duration}s`);

    if (dryRun) {
      console.log('\n⚠️  This was a dry run. No changes were made.');
      console.log('    Run without --dry-run to apply changes.');
    }
  } catch (error) {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  }
}

main();
