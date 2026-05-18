import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CommunicationsHub } from '@/components/communications/CommunicationsHub';

const usePathnameMock = vi.fn();
const useSearchParamsMock = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => usePathnameMock(),
  useSearchParams: () => useSearchParamsMock(),
}));

vi.mock('@/app/app/i/interviews/page', () => ({
  default: () => <div>Individual interviews workspace</div>,
}));

vi.mock('@/app/app/i/messages/MessagesClient', () => ({
  MessagesClient: () => <div>Individual messages workspace</div>,
}));

vi.mock('@/app/app/o/[slug]/interviews/page', () => ({
  default: () => <div>Organization interviews workspace</div>,
}));

vi.mock('@/app/app/o/[slug]/messages/OrgMessagesClient', () => ({
  OrgMessagesClient: () => <div>Organization messages workspace</div>,
}));

describe('CommunicationsHub mobile targets', () => {
  beforeEach(() => {
    usePathnameMock.mockReturnValue('/app/i/communications');
    useSearchParamsMock.mockReturnValue(new URLSearchParams());
  });

  it('renders the section switch as a full-height touch target', () => {
    render(<CommunicationsHub perspective="individual" />);

    const switchLink = screen.getByRole('link', { name: /Switch to interviews/i });

    expect(switchLink).toHaveAttribute('href', '/app/i/communications?section=interviews');
    expect(switchLink).toHaveClass('min-h-11');
    expect(switchLink).toHaveClass('w-full');
    expect(switchLink).toHaveClass('sm:w-auto');
  });
});
