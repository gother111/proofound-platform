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
import { deleteUploadedFile } from '@/lib/uploads/lifecycle';

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
    (deleteUploadedFile as any).mockResolvedValue(true);

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

  it('deletes owned private context and disables public portfolio state', async () => {
    await executeAccountDeletionLifecycle({
      userId: 'user-1',
      reason: 'Privacy concerns',
      operationId: 'operation-1',
    });

    const statements = (db.execute as any).mock.calls.map(([query]: any[]) => sqlToText(query));
    const allSql = statements.join('\n');

    expect(allSql).toContain('UPDATE proof_artifacts');
    expect(allSql).toContain("lifecycle_state = 'deleted'");
    expect(allSql).toContain('UPDATE verification_records');
    expect(allSql).toContain(
      "metadata = jsonb_build_object('retention', 'account_deleted_minimized')"
    );
    expect(allSql).toContain('DELETE FROM evidence');
    expect(allSql).toContain('DELETE FROM capabilities');
    expect(allSql).toContain('DELETE FROM skill_proofs');
    expect(allSql).toContain('DELETE FROM skills');
    expect(allSql).toContain('DELETE FROM impact_stories');
    expect(allSql).toContain('DELETE FROM experiences');
    expect(allSql).toContain('DELETE FROM education');
    expect(allSql).toContain('DELETE FROM volunteering');
    expect(allSql).toContain('DELETE FROM projects');
    expect(allSql).toContain('DELETE FROM individual_profiles');
    expect(allSql).toContain('DELETE FROM matching_profiles');
    expect((db.update as any).mock.results[0].value.set).toHaveBeenCalledWith(
      expect.objectContaining({
        lifecycleState: 'deleted',
        publicPortfolioState: 'unavailable',
        searchIndexingEnabledAt: null,
        matchingEnabled: false,
        deleted: true,
        deletionReason: 'Privacy concerns',
      })
    );
  });

  it('fails closed when owned storage object deletion fails', async () => {
    (deleteUploadedFile as any).mockResolvedValue(false);

    await expect(
      executeAccountDeletionLifecycle({
        userId: 'user-1',
        reason: 'Privacy concerns',
        operationId: 'operation-1',
      })
    ).rejects.toThrow('Account deletion storage cleanup failed');

    expect(deleteUploadedFile).toHaveBeenCalledWith('file-1', 'user-1', 'system_cleanup');
    const statements = (db.execute as any).mock.calls.map(([query]: any[]) => sqlToText(query));
    const allSql = statements.join('\n');
    expect(allSql).toContain('failure_code');
    expect(allSql).not.toContain('DELETE FROM individual_profiles');
    expect((db.update as any).mock.calls).toHaveLength(0);
  });
});
