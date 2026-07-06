import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const migrationPath = path.join(
  repoRoot,
  'src/db/migrations/20260520065000_harden_internal_ops_queue_rls.sql'
);

function compactSql(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

describe('internal ops queue RLS migration', () => {
  it('keeps internal_ops_queue_items server-only with explicit RLS and no client role policy', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');
    const compact = compactSql(sql);

    expect(compact).toContain(
      'ALTER TABLE public.internal_ops_queue_items ENABLE ROW LEVEL SECURITY'
    );
    expect(compact).toContain(
      'ALTER TABLE public.internal_ops_queue_items FORCE ROW LEVEL SECURITY'
    );
    expect(compact).toContain('REVOKE ALL ON TABLE public.internal_ops_queue_items FROM anon');
    expect(compact).toContain(
      'REVOKE ALL ON TABLE public.internal_ops_queue_items FROM authenticated'
    );
    expect(compact).toContain(
      'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.internal_ops_queue_items TO service_role'
    );

    for (const operation of ['SELECT', 'INSERT', 'UPDATE', 'DELETE']) {
      expect(compact).toContain(
        `ON public.internal_ops_queue_items FOR ${operation} TO service_role`
      );
    }

    expect(compact).not.toMatch(/ON public\.internal_ops_queue_items FOR \w+ TO anon/i);
    expect(compact).not.toMatch(/ON public\.internal_ops_queue_items FOR \w+ TO authenticated/i);
    expect(compact).toContain('minimum-necessary DTOs');
  });
});
