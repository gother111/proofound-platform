import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  path.join(
    process.cwd(),
    'src/db/migrations/20260516180500_secure_match_score_trigger_wrappers.sql'
  ),
  'utf8'
);

const matchScoreTriggerFunctions = [
  'proofound_match_score_contract_profile_trigger',
  'proofound_match_score_contract_skill_trigger',
  'proofound_match_score_contract_assignment_trigger',
  'proofound_match_score_contract_assignment_matrix_trigger',
  'proofound_match_score_contract_verification_trigger',
  'proofound_match_score_contract_user_consent_trigger',
  'proofound_match_score_contract_consent_obligation_trigger',
] as const;

function getFunctionBlock(functionName: string) {
  const marker = `CREATE OR REPLACE FUNCTION public.${functionName}()`;
  const start = migration.indexOf(marker);
  expect(start).toBeGreaterThanOrEqual(0);

  const nextFunction = migration.indexOf('CREATE OR REPLACE FUNCTION', start + marker.length);
  const revokeStart = migration.indexOf('REVOKE EXECUTE', start + marker.length);
  const endCandidates = [nextFunction, revokeStart].filter((value) => value > start);
  const end = Math.min(...endCandidates);

  return migration.slice(start, end);
}

describe('Supabase public surface hardening migrations', () => {
  it('runs match-score maintenance through secure trigger wrappers', () => {
    for (const functionName of matchScoreTriggerFunctions) {
      const block = getFunctionBlock(functionName);

      expect(block).toContain('RETURNS trigger');
      expect(block).toContain('SECURITY DEFINER');
      expect(block).toContain('SET search_path = public');
    }
  });

  it('keeps match-score trigger wrappers out of the public RPC surface', () => {
    for (const functionName of matchScoreTriggerFunctions) {
      expect(migration).toContain(
        `REVOKE EXECUTE ON FUNCTION public.${functionName}()\n  FROM PUBLIC, anon, authenticated;`
      );
    }

    expect(migration).not.toMatch(/GRANT\s+EXECUTE/i);
  });
});
