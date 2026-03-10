import { PgDialect } from 'drizzle-orm/pg-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/db', () => ({
  db: {
    execute: vi.fn(),
    update: vi.fn(),
  },
  profiles: {
    id: 'profiles.id',
  },
}));

vi.mock('@/lib/security/capability-tokens', () => ({
  revokeCapabilityTokensBySource: vi.fn(),
}));

vi.mock('@/lib/uploads/lifecycle', () => ({
  deleteUploadedFile: vi.fn(),
}));

vi.mock('@/lib/portfolio/public-invalidation', () => ({
  revalidatePublicPortfolioByProfileId: vi.fn(),
}));

import { db } from '@/db';
import { executeAccountDeletionLifecycle } from '@/lib/lifecycle/reconciliation';
import { revalidatePublicPortfolioByProfileId } from '@/lib/portfolio/public-invalidation';

function sqlToText(query: { queryChunks?: any[] }) {
  if (query && typeof (query as any).toQuery === 'function') {
    const dialect = new PgDialect();
    return (query as any).toQuery({
      escapeName: dialect.escapeName,
      escapeParam: dialect.escapeParam,
      escapeString: dialect.escapeString,
      inlineParams: false,
      paramStartIndex: { value: 0 },
      casing: dialect.casing,
    }).sql as string;
  }

  return JSON.stringify(query);
}

describe('executeAccountDeletionLifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (db.execute as any).mockImplementation(async (query: any) => {
      const statement = sqlToText(query);

      if (
        statement.includes('SELECT id, capability_token_id') &&
        statement.includes('FROM profile_snippets')
      ) {
        return {
          rows: [{ id: 'snippet-1', capability_token_id: 'cap-1' }],
        };
      }

      if (statement.includes('SELECT id') && statement.includes('FROM proof_packs')) {
        return {
          rows: [{ id: 'pack-1' }],
        };
      }

      if (statement.includes('SELECT id') && statement.includes('FROM uploaded_files')) {
        return {
          rows: [{ id: 'file-1' }],
        };
      }

      return { rows: [] };
    });

    const where = vi.fn().mockResolvedValue(undefined);
    const set = vi.fn().mockReturnValue({ where });
    (db.update as any).mockReturnValue({ set });
  });

  it('removes public projections from snippets and proof packs during deletion', async () => {
    await executeAccountDeletionLifecycle({
      userId: 'user-1',
      reason: 'account_deleted',
      operationId: 'operation-1',
    });

    const statements = (db.execute as any).mock.calls.map(([query]: any[]) => sqlToText(query));

    expect(
      statements.some(
        (statement) =>
          statement.includes('UPDATE profile_snippets') &&
          statement.includes('public_surface_disabled_at')
      )
    ).toBe(true);
    expect(
      statements.some(
        (statement) =>
          statement.includes('UPDATE proof_packs') &&
          statement.includes('public_surface_disabled_at')
      )
    ).toBe(true);
    expect(revalidatePublicPortfolioByProfileId).toHaveBeenCalledWith('user-1');
    expect((db.update as any).mock.calls).toHaveLength(1);
  });
});
