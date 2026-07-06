import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import { criticalTables } from '../../scripts/lib/db-checkpoint-utils.mjs';

const repoRoot = path.resolve(__dirname, '../..');

describe('database checkpoint critical tables', () => {
  it('covers the active MVP data corridor for restore fingerprints', () => {
    expect(criticalTables).toEqual([
      'profiles',
      'individual_profiles',
      'organizations',
      'organization_members',
      'proof_artifacts',
      'proof_packs',
      'proof_pack_items',
      'verification_records',
      'capability_tokens',
      'capability_token_events',
      'portfolio_publication_states',
      'assignments',
      'matches',
      'match_review_states',
      'intro_workflows',
      'reveal_events',
      'interviews',
      'decisions',
      'engagement_verifications',
      'conversations',
      'messages',
      'data_portability_exports',
      'profile_deletion_requests',
      'uploaded_files',
      'internal_ops_queue_items',
      'audit_logs',
      'analytics_events',
    ]);
  });

  it('does not treat retired compatibility tables as launch restore gates', () => {
    expect(criticalTables).not.toEqual(
      expect.arrayContaining([
        'fairness_notes',
        'verification_requests',
        'user_video_integrations',
        'decision_reminders',
      ])
    );
  });

  it('only names tables declared in the current Drizzle schema', () => {
    const schemaText = fs.readFileSync(path.join(repoRoot, 'src/db/schema.ts'), 'utf8');
    const schemaTables = new Set(
      [...schemaText.matchAll(/pgTable\(\s*['"]([^'"]+)['"]/g)].map((match) => match[1])
    );

    expect(criticalTables.filter((table) => !schemaTables.has(table))).toEqual([]);
  });
});
