#!/usr/bin/env tsx

import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

loadEnv({ path: '.env.local', quiet: true });

type AnalyticsEventRow = {
  event_type: string;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
  properties?: {
    action?: string;
    candidate_hash?: string;
    candidate_category?: string;
    quality_bucket?: string;
    top_suggestion_skill_id?: string | null;
    selected_skill_id?: string | null;
    review_outcome?: string | null;
    risk_reasons?: string[];
  };
};

function parseArg(flag: string, defaultValue: string): string {
  const index = process.argv.indexOf(flag);
  if (index === -1) return defaultValue;
  return process.argv[index + 1] || defaultValue;
}

async function main() {
  const days = Number(parseArg('--days', '30'));
  const top = Number(parseArg('--top', '20'));

  if (!Number.isFinite(days) || days <= 0) {
    throw new Error('--days must be a positive number');
  }

  if (!Number.isFinite(top) || top <= 0) {
    throw new Error('--top must be a positive number');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRole) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const supabase = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from('analytics_events')
    .select('event_type, entity_type, entity_id, created_at, properties')
    .eq('event_type', 'custom')
    .eq('entity_type', 'cv_import_review')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(10000);

  if (error) {
    throw new Error(`Failed to read analytics_events: ${error.message}`);
  }

  const rows = (data || []) as AnalyticsEventRow[];
  const byAction = new Map<string, number>();
  const bySelectedSkill = new Map<string, number>();
  const byTopSuggestion = new Map<string, number>();
  const byRiskReason = new Map<string, number>();
  const byOutcome = new Map<string, number>();
  const unresolvedCandidates = new Set<string>();

  for (const row of rows) {
    const action = row.properties?.action || row.entity_id || 'unknown';
    byAction.set(action, (byAction.get(action) || 0) + 1);

    const selectedSkillId = row.properties?.selected_skill_id;
    if (selectedSkillId) {
      bySelectedSkill.set(selectedSkillId, (bySelectedSkill.get(selectedSkillId) || 0) + 1);
    }

    const topSuggestionSkillId = row.properties?.top_suggestion_skill_id;
    if (topSuggestionSkillId) {
      byTopSuggestion.set(
        topSuggestionSkillId,
        (byTopSuggestion.get(topSuggestionSkillId) || 0) + 1
      );
    }

    for (const reason of row.properties?.risk_reasons || []) {
      byRiskReason.set(reason, (byRiskReason.get(reason) || 0) + 1);
    }

    const reviewOutcome = row.properties?.review_outcome;
    if (reviewOutcome) {
      byOutcome.set(reviewOutcome, (byOutcome.get(reviewOutcome) || 0) + 1);
    }

    if (reviewOutcome === 'kept_unmapped' || reviewOutcome === 'not_skill') {
      const candidateHash = row.properties?.candidate_hash;
      if (candidateHash) {
        unresolvedCandidates.add(candidateHash);
      }
    }
  }

  const topEntries = (map: Map<string, number>) =>
    Array.from(map.entries())
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, top);

  console.log('[cv-import-review-report]');
  console.log(`- window_days: ${days}`);
  console.log(`- events_scanned: ${rows.length}`);
  console.log(`- unique_resolved_candidate_hashes: ${unresolvedCandidates.size}`);

  console.log('\nActions:');
  for (const [key, value] of topEntries(byAction)) {
    console.log(`- ${key}: ${value}`);
  }

  console.log('\nReview outcomes:');
  for (const [key, value] of topEntries(byOutcome)) {
    console.log(`- ${key}: ${value}`);
  }

  console.log('\nTop selected skill IDs:');
  for (const [key, value] of topEntries(bySelectedSkill)) {
    console.log(`- ${key}: ${value}`);
  }

  console.log('\nTop top-suggestion skill IDs:');
  for (const [key, value] of topEntries(byTopSuggestion)) {
    console.log(`- ${key}: ${value}`);
  }

  console.log('\nRisk reasons:');
  for (const [key, value] of topEntries(byRiskReason)) {
    console.log(`- ${key}: ${value}`);
  }
}

main().catch((error) => {
  console.error('[cv-import-review-report] Failed:', error.message);
  process.exit(1);
});
