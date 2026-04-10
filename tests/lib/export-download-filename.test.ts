import { describe, expect, it } from 'vitest';

import { buildUserExportDownloadFilename } from '@/lib/privacy/export-download';

describe('buildUserExportDownloadFilename', () => {
  it('returns a stable owner-safe export filename without user identifiers', () => {
    expect(buildUserExportDownloadFilename('2026-04-09T12:00:00.000Z')).toBe(
      'proofound-data-export-2026-04-09.json'
    );
  });

  it('falls back to a date-based filename when the input is invalid', () => {
    expect(buildUserExportDownloadFilename('not-a-date')).toMatch(
      /^proofound-data-export-\d{4}-\d{2}-\d{2}\.json$/
    );
  });
});
