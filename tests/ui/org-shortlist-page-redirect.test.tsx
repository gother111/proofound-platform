import { describe, expect, it, vi } from 'vitest';

const redirectMock = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

import OrgShortlistPage from '@/app/app/o/[slug]/shortlist/page';

describe('OrgShortlistPage launch shortcut', () => {
  it('redirects the legacy shortlist shortcut into the active assignments corridor', async () => {
    await OrgShortlistPage({
      params: Promise.resolve({ slug: 'proof ops' }),
    });

    expect(redirectMock).toHaveBeenCalledWith('/app/o/proof%20ops/assignments');
  });
});
