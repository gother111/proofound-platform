import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CommandPalette } from '@/components/navigation/CommandPalette';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe('CommandPalette archived surface links', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global as any).ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('does not expose archived expertise commands and keeps verifications accessible', () => {
    render(<CommandPalette />);

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Matching')).toBeInTheDocument();
    expect(screen.getByText('Public Portfolio')).toBeInTheDocument();
    expect(screen.getByText('Review verifications')).toBeInTheDocument();
    expect(screen.queryByText('Expertise Atlas')).not.toBeInTheDocument();
  });
});
