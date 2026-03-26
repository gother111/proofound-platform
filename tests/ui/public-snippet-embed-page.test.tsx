import { access } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { classifyLaunchPagePath, getArchivedPagePolicy } from '@/lib/launch/surface-policy';

const LEGACY_PUBLIC_SNIPPET_EMBED_PAGE = path.join(
  process.cwd(),
  'src/app/p/[token]/embed/page.tsx'
);

describe('Public snippet embed page', () => {
  it('keeps the legacy public snippet embed route archived and out of the compiled app tree', async () => {
    expect(classifyLaunchPagePath('/p/token-value/embed')).toBe('archived');
    expect(getArchivedPagePolicy('/p/token-value/embed')).toMatchObject({
      surfaceLabel: 'Public Pages',
    });

    await expect(access(LEGACY_PUBLIC_SNIPPET_EMBED_PAGE)).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });
});
