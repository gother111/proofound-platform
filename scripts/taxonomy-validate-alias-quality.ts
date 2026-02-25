#!/usr/bin/env tsx

import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { SEARCH_COVERAGE_REQUIRED_TERMS } from './taxonomy-wave-config';

loadEnv({ path: '.env.local', quiet: true });

type AliasRow = {
  skill_code: string;
  locale: string;
  alias: string;
  alias_norm: string;
  source: string;
  confidence: number;
  status: string;
  taxonomy?: {
    name_i18n?: { en?: string };
  };
};

function normalize(value: string): string {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[\u2019\u2018']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

async function fetchAllAliases() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRole) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  const supabase = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const rows: AliasRow[] = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from('skills_taxonomy_aliases')
      .select(
        'skill_code, locale, alias, alias_norm, source, confidence, status, taxonomy:skills_taxonomy!skills_taxonomy_aliases_skill_code_fkey(name_i18n)'
      )
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch skills_taxonomy_aliases ${from}-${to}: ${error.message}`);
    }

    const page = (data || []) as AliasRow[];
    if (!page.length) break;

    rows.push(...page);
    if (page.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}

async function main() {
  const rows = await fetchAllAliases();

  const active = rows.filter((row) => row.status === 'active');
  const invalidLength = active.filter((row) => row.alias.length < 2 || row.alias.length > 80);

  const sameAsCanonical = active.filter((row) => {
    const canonical = normalize(row.taxonomy?.name_i18n?.en || '');
    return canonical !== '' && canonical === normalize(row.alias);
  });

  const byNorm = new Map<string, Set<string>>();
  for (const row of active) {
    const key = `${row.locale}:${row.alias_norm}`;
    if (!byNorm.has(key)) byNorm.set(key, new Set<string>());
    byNorm.get(key)!.add(row.skill_code);
  }

  const collisions = Array.from(byNorm.entries())
    .filter(([, skillCodes]) => skillCodes.size > 1)
    .map(([key, skillCodes]) => ({
      key,
      skillCodes: Array.from(skillCodes).sort(),
    }));

  const searchableTerms = new Set<string>();
  for (const row of active) {
    searchableTerms.add(normalize(row.alias));
    searchableTerms.add(row.alias_norm);
    const canonical = normalize(row.taxonomy?.name_i18n?.en || '');
    if (canonical) searchableTerms.add(canonical);
  }

  const missingRequiredTerms = SEARCH_COVERAGE_REQUIRED_TERMS.filter((term) => {
    const normalized = normalize(term);
    if (!normalized) return false;
    return !Array.from(searchableTerms).some(
      (candidate) => candidate.includes(normalized) || normalized.includes(candidate)
    );
  });

  console.log('[taxonomy-validate-alias-quality] Summary');
  console.log(`- total aliases: ${rows.length}`);
  console.log(`- active aliases: ${active.length}`);
  console.log(`- invalid length: ${invalidLength.length}`);
  console.log(`- same as canonical: ${sameAsCanonical.length}`);
  console.log(`- active collisions: ${collisions.length}`);
  console.log(`- missing required terms: ${missingRequiredTerms.length}`);

  if (invalidLength.length) {
    console.error('\nInvalid alias length examples:');
    for (const row of invalidLength.slice(0, 20)) {
      console.error(`- ${row.skill_code}: "${row.alias}" (len=${row.alias.length})`);
    }
  }

  if (sameAsCanonical.length) {
    console.error('\nAlias equals canonical examples:');
    for (const row of sameAsCanonical.slice(0, 20)) {
      console.error(
        `- ${row.skill_code}: alias="${row.alias}" canonical="${row.taxonomy?.name_i18n?.en || ''}"`
      );
    }
  }

  if (collisions.length) {
    console.error('\nCollision examples:');
    for (const collision of collisions.slice(0, 20)) {
      console.error(`- ${collision.key} -> ${collision.skillCodes.join(', ')}`);
    }
  }

  if (missingRequiredTerms.length) {
    console.error('\nMissing required terms:');
    for (const term of missingRequiredTerms) {
      console.error(`- ${term}`);
    }
  }

  if (
    invalidLength.length ||
    sameAsCanonical.length ||
    collisions.length ||
    missingRequiredTerms.length
  ) {
    process.exit(1);
  }

  console.log('\nAlias quality check passed.');
}

main().catch((error) => {
  console.error('[taxonomy-validate-alias-quality] Failed:', error.message);
  process.exit(1);
});
