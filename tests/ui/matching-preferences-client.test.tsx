import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { pushMock, refreshMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

vi.mock('@/components/matching/MatchingProfileSetup', () => ({
  MatchingProfileSetup: ({ onComplete, onCancel }: any) => (
    <div>
      <button onClick={onComplete}>complete setup</button>
      <button onClick={onCancel}>cancel setup</button>
    </div>
  ),
}));

import { MatchingPreferencesClient } from '@/components/matching/MatchingPreferencesClient';

describe('MatchingPreferencesClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('navigates to matching page and refreshes after completion', () => {
    render(<MatchingPreferencesClient />);

    fireEvent.click(screen.getByRole('button', { name: 'complete setup' }));

    expect(pushMock).toHaveBeenCalledWith('/app/i/matching');
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it('navigates to matching page when cancelled', () => {
    render(<MatchingPreferencesClient />);

    fireEvent.click(screen.getByRole('button', { name: 'cancel setup' }));

    expect(pushMock).toHaveBeenCalledWith('/app/i/matching');
  });
});
