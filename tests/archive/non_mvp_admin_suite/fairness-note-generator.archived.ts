import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  execute: vi.fn(),
  insert: vi.fn(),
  values: vi.fn(),
  returning: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    execute: (...args: unknown[]) => mocks.execute(...args),
    insert: (...args: unknown[]) => mocks.insert(...args),
  },
}));

import { generateFairnessNoteResult } from '@/lib/analytics/fairness-note-generator';

describe('generateFairnessNoteResult', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.returning.mockResolvedValue([{ id: 'note-1' }]);
    mocks.values.mockReturnValue({ returning: mocks.returning });
    mocks.insert.mockReturnValue({ values: mocks.values });
  });

  it('stores an insufficient-data note instead of throwing', async () => {
    mocks.execute.mockResolvedValue([]);

    const result = await generateFairnessNoteResult({
      releaseVersion: '2026-03-06',
      publicationStatus: 'published',
    });

    expect(result).toMatchObject({
      noteId: 'note-1',
      status: 'insufficient_data',
      releaseVersion: '2026-03-06',
      cohortsAnalyzed: 0,
      findingsCount: 1,
      hasSignificantGaps: false,
    });
    expect(mocks.insert).toHaveBeenCalledTimes(1);
  });

  it('stores a successful note when enough cohorts are available', async () => {
    mocks.execute.mockResolvedValue([
      {
        role_family: 'engineering',
        seniority: 'senior',
        geography: 'eu',
        sample_size: '8',
        median_ttsc: '40',
      },
      {
        role_family: 'design',
        seniority: 'mid',
        geography: 'eu',
        sample_size: '7',
        median_ttsc: '20',
      },
    ]);

    const result = await generateFairnessNoteResult({
      releaseVersion: '2026-03-06',
      createdBy: 'admin-1',
      publicationStatus: 'draft',
    });

    expect(result).toMatchObject({
      noteId: 'note-1',
      status: 'success',
      releaseVersion: '2026-03-06',
      cohortsAnalyzed: 2,
      findingsCount: 2,
      hasSignificantGaps: true,
    });
    expect(mocks.values).toHaveBeenCalledWith(
      expect.objectContaining({
        releaseVersion: '2026-03-06',
        status: 'draft',
        createdBy: 'admin-1',
      })
    );
  });
});
