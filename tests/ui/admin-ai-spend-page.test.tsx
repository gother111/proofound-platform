import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

import AdminAiSpendPage from '@/app/admin/ai-spend/page';

const apiFetchMock = vi.fn();

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
}));

describe('Admin AI spend page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is archived behind a notFound boundary', () => {
    expect(() => render(<AdminAiSpendPage />)).toThrow('NEXT_HTTP_ERROR_FALLBACK;404');
    expect(apiFetchMock).not.toHaveBeenCalled();
  });
});
