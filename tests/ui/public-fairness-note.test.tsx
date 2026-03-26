import { access } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { classifyLaunchPagePath, getArchivedPagePolicy } from '@/lib/launch/surface-policy';

const PUBLIC_FAIRNESS_PAGE = path.join(process.cwd(), 'src/app/fairness/page.tsx');

describe('Public fairness note', () => {
  it('keeps the public fairness note archived and out of the compiled app tree', async () => {
    expect(classifyLaunchPagePath('/fairness')).toBe('archived');
    expect(getArchivedPagePolicy('/fairness')).toMatchObject({
      surfaceLabel: 'Public Pages',
    });

    await expect(access(PUBLIC_FAIRNESS_PAGE)).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });
});
