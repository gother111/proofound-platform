import { PgDialect } from 'drizzle-orm/pg-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  execute: vi.fn(),
  getRows: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    execute: mocks.execute,
  },
}));

vi.mock('@/lib/db/rows', () => ({
  getRows: mocks.getRows,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/security/capability-tokens', () => ({
  CAPABILITY_TOKEN_CLASSES: {
    PROFILE_SNIPPET_SHARE: 'profile_snippet_share',
  },
  inspectCapabilityToken: vi.fn(),
}));

import { db } from '@/db';
import { getRows } from '@/lib/db/rows';
import { isViewerMatchedWithProfile } from '@/lib/privacy/profile-fetcher';

function sqlToQuery(query: unknown) {
  if (query && typeof (query as { toQuery?: unknown }).toQuery === 'function') {
    const dialect = new PgDialect();
    return (query as any).toQuery({
      escapeName: dialect.escapeName,
      escapeParam: dialect.escapeParam,
      escapeString: dialect.escapeString,
      inlineParams: false,
      paramStartIndex: { value: 0 },
      casing: dialect.casing,
    }) as { sql: string; params: unknown[] };
  }

  return { sql: JSON.stringify(query), params: [] };
}

describe('profile-fetcher privacy helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.execute.mockResolvedValue({ rows: [{ exists: 1 }] });
    mocks.getRows.mockReturnValue([{ exists: 1 }]);
  });

  it('scopes matched-profile access to the viewer organization membership', async () => {
    await expect(isViewerMatchedWithProfile('viewer-1', 'profile-1')).resolves.toBe(true);

    expect(db.execute).toHaveBeenCalledTimes(1);
    const { sql, params } = sqlToQuery(mocks.execute.mock.calls[0][0]);

    expect(sql).toContain('JOIN public.organization_members om ON om.org_id = a.org_id');
    expect(sql).toContain('om.user_id = $2::uuid');
    expect(sql).toContain("om.state = 'active'");
    expect(sql).toContain("a.status = 'active'");
    expect(sql).toContain('m.lifecycle_state IN');
    expect(sql).not.toContain("'hidden_due_to_policy'");
    expect(sql).not.toContain("'closed'");
    expect(sql).not.toContain("'stale'");
    expect(sql).toContain('m.snoozed_until IS NULL');
    expect(params).toEqual(['profile-1', 'viewer-1']);
    expect(getRows).toHaveBeenCalledWith({ rows: [{ exists: 1 }] });
  });

  it('does not grant matched-profile access when no scoped match exists', async () => {
    mocks.getRows.mockReturnValueOnce([]);

    await expect(isViewerMatchedWithProfile('viewer-1', 'profile-1')).resolves.toBe(false);
  });
});
