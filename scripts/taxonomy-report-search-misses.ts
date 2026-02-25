#!/usr/bin/env tsx

import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

loadEnv({ path: '.env.local', quiet: true });

type AnalyticsEventRow = {
  event_type: string;
  created_at: string;
  properties?: {
    query_hash?: string;
    query_class?: string;
    result_count?: number;
    used_fallback?: boolean;
    rpc_failed?: boolean;
  };
};

function parseArg(flag: string, defaultValue: string): string {
  const index = process.argv.indexOf(flag);
  if (index === -1) return defaultValue;
  const value = process.argv[index + 1];
  return value || defaultValue;
}

async function main() {
  const days = Number(parseArg('--days', '30'));
  const top = Number(parseArg('--top', '30'));

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
    .select('event_type, created_at, properties')
    .in('event_type', ['taxonomy_search_zero_results', 'taxonomy_search_error'])
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(10000);

  if (error) {
    throw new Error(`Failed to read analytics_events: ${error.message}`);
  }

  const rows = (data || []) as AnalyticsEventRow[];

  const byHash = new Map<
    string,
    {
      count: number;
      zeroResults: number;
      errors: number;
      rpcFailures: number;
      fallbackUsed: number;
      classes: Set<string>;
      lastSeen: string;
    }
  >();

  for (const row of rows) {
    const hash = row.properties?.query_hash || 'unknown';
    const current = byHash.get(hash) || {
      count: 0,
      zeroResults: 0,
      errors: 0,
      rpcFailures: 0,
      fallbackUsed: 0,
      classes: new Set<string>(),
      lastSeen: row.created_at,
    };

    current.count += 1;
    if (row.event_type === 'taxonomy_search_zero_results') current.zeroResults += 1;
    if (row.event_type === 'taxonomy_search_error') current.errors += 1;
    if (row.properties?.rpc_failed) current.rpcFailures += 1;
    if (row.properties?.used_fallback) current.fallbackUsed += 1;
    if (row.properties?.query_class) current.classes.add(row.properties.query_class);
    if (row.created_at > current.lastSeen) current.lastSeen = row.created_at;

    byHash.set(hash, current);
  }

  const sorted = Array.from(byHash.entries())
    .map(([queryHash, metrics]) => ({
      queryHash,
      count: metrics.count,
      zeroResults: metrics.zeroResults,
      errors: metrics.errors,
      rpcFailures: metrics.rpcFailures,
      fallbackUsed: metrics.fallbackUsed,
      queryClasses: Array.from(metrics.classes).sort(),
      lastSeen: metrics.lastSeen,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, top);

  console.log('[taxonomy-report-search-misses]');
  console.log(`- window_days: ${days}`);
  console.log(`- events_scanned: ${rows.length}`);
  console.log(`- unique_query_hashes: ${byHash.size}`);
  console.log(`- showing_top: ${sorted.length}`);

  if (!sorted.length) {
    console.log('\nNo taxonomy search miss/error events found in the selected window.');
    return;
  }

  console.log('\nTop query hashes by miss/error volume:');
  for (const row of sorted) {
    console.log(
      `- ${row.queryHash}: total=${row.count}, zero_results=${row.zeroResults}, errors=${row.errors}, rpc_failures=${row.rpcFailures}, fallback_used=${row.fallbackUsed}, classes=${row.queryClasses.join('|') || 'n/a'}, last_seen=${row.lastSeen}`
    );
  }
}

main().catch((error) => {
  console.error('[taxonomy-report-search-misses] Failed:', error.message);
  process.exit(1);
});
