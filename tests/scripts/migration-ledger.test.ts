import { describe, expect, it } from 'vitest';
import { computeDrift } from '../../scripts/lib/migration-ledger.mjs';

describe('migration ledger reconciliation model', () => {
  it('reconciles synthetic drift to zero after restoring files and baseline stamping', () => {
    const localEntries = [
      { file: '20251108_add_profile_snippets.sql', version: '20251108' },
      { file: '20260211123000_cron_idempotency_guards.sql', version: '20260211123000' },
    ];

    const dbRows = [
      { version: '20251108141000', name: 'add_profile_snippets_precise' },
      { version: '20251026094406', name: 'legacy_migration' },
    ];

    const initial = computeDrift(localEntries, dbRows);
    expect(initial.fileNotApplied.map((x) => x.version)).toContain('20260211123000');
    expect(initial.appliedMissingFile.map((x) => x.version)).toContain('20251026094406');

    const restoredLocal = [
      ...localEntries,
      { file: '20251026094406_legacy_migration.sql', version: '20251026094406' },
    ];
    const stampedDb = [
      ...dbRows,
      { version: '20260211123000', name: '20260211123000_cron_idempotency_guards' },
    ];

    const post = computeDrift(restoredLocal, stampedDb);
    expect(post.fileNotApplied).toHaveLength(0);
    expect(post.appliedMissingFile).toHaveLength(0);
  });
});
