import { access } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { classifyLaunchPagePath, getArchivedPagePolicy } from '@/lib/launch/surface-policy';

const LEGACY_PUBLIC_SNIPPET_PAGE = path.join(process.cwd(), 'src/app/p/[token]/page.tsx');

describe('Public snippet page', () => {
  it('keeps the legacy public snippet route archived and out of the compiled app tree', async () => {
    expect(classifyLaunchPagePath('/p/token-value')).toBe('archived');
    expect(getArchivedPagePolicy('/p/token-value')).toMatchObject({
      surfaceLabel: 'Public Pages',
    });

    await expect(access(LEGACY_PUBLIC_SNIPPET_PAGE)).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });
});
