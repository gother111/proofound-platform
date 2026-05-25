import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CommunicationsHub } from '@/components/communications/CommunicationsHub';

const usePathnameMock = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => usePathnameMock(),
}));

vi.mock('@/app/app/i/interviews/IndividualInterviewsPage', () => ({
  default: () => <div>Individual interviews workspace</div>,
}));

vi.mock('@/app/app/i/messages/MessagesClient', () => ({
  MessagesClient: () => <div>Individual messages workspace</div>,
}));

vi.mock('@/app/app/o/[slug]/interviews/page', () => ({
  default: () => <div>Organization interviews workspace</div>,
}));

vi.mock('@/app/app/o/[slug]/messages/DeferredOrgMessagesClient', () => ({
  DeferredOrgMessagesClient: () => <div>Organization messages workspace</div>,
}));

describe('CommunicationsHub mobile targets', () => {
  beforeEach(() => {
    usePathnameMock.mockReturnValue('/app/i/communications');
  });

  it('renders the section switch as a full-height touch target', () => {
    render(<CommunicationsHub perspective="individual" />);

    const switchLink = screen.getByRole('link', { name: /Switch to interviews/i });

    expect(switchLink).toHaveAttribute('href', '/app/i/communications?section=interviews');
    expect(switchLink).toHaveClass('min-h-11');
    expect(switchLink).toHaveClass('w-full');
    expect(switchLink).toHaveClass('sm:w-auto');
  });

  it('keeps organization messages loading contextual while user context resolves', () => {
    usePathnameMock.mockReturnValue('/app/o/acme/communications');

    render(<CommunicationsHub perspective="organization" />);

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Preparing organization messages');
    expect(status).toHaveTextContent(/threads, intros, and reveal requests/i);
    expect(screen.queryByText('Loading messages...')).not.toBeInTheDocument();
  });

  it('uses the server-provided initial section without client search params', () => {
    render(<CommunicationsHub perspective="individual" initialSection="interviews" />);

    expect(screen.getByText('Individual interviews workspace')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Switch to messages/i })).toHaveAttribute(
      'href',
      '/app/i/communications?section=messages'
    );
  });

  it('renders organization messages through the deferred client when user context is ready', () => {
    usePathnameMock.mockReturnValue('/app/o/acme/communications');

    render(
      <CommunicationsHub
        perspective="organization"
        currentUserId="user-1"
        initialSection="messages"
      />
    );

    expect(screen.getByText('Organization messages workspace')).toBeInTheDocument();
  });
});
