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
    const { container } = render(<CommunicationsHub perspective="individual" />);

    const switchLink = screen.getByRole('link', {
      name: /Switch to interviews: Interview times, decisions, and visible feedback/i,
    });

    expect(switchLink).toHaveAttribute('href', '/app/i/communications?section=interviews');
    expect(switchLink).toHaveClass('min-h-11');
    expect(switchLink).toHaveClass('w-full');
    expect(switchLink).toHaveClass('sm:w-auto');
    expect(switchLink).toHaveClass('focus-visible:ring-2');
    expect(switchLink).toHaveClass('focus-visible:ring-proofound-forest');
    expect(container.querySelectorAll('svg:not([aria-hidden="true"])')).toHaveLength(0);
    expect(
      screen.getByText('Introductions, reveal choices, and private threads.')
    ).toBeInTheDocument();
    expect(screen.getByText('Assignment Review Flow')).toBeInTheDocument();
    expect(screen.queryByText('Hiring Corridor')).not.toBeInTheDocument();
    expect(
      screen.getByText(
        'Messages, interview timing, and reveal decisions stay consent-bound before identity-bearing access.'
      )
    ).toBeInTheDocument();
  });

  it('keeps the active workspace clear of the mobile bottom navigation', () => {
    render(<CommunicationsHub perspective="individual" />);

    const workspace = screen.getByRole('region', { name: 'messages workspace' });
    const hubRoot = screen.getByTestId('communications-hub');

    expect(hubRoot).toHaveClass('h-[calc(100dvh-8.25rem)]');
    expect(hubRoot).toHaveClass('min-h-[calc(100dvh-8.25rem)]');
    expect(hubRoot).toHaveClass('overflow-hidden');
    expect(workspace).toHaveClass('pb-[calc(5.5rem+env(safe-area-inset-bottom))]');
    expect(workspace).toHaveClass('scroll-pb-[calc(5.5rem+env(safe-area-inset-bottom))]');
    expect(workspace).toHaveClass('md:pb-0');
    expect(workspace).toHaveClass('md:scroll-pb-0');
  });

  it('keeps organization messages loading contextual while user context resolves', () => {
    usePathnameMock.mockReturnValue('/app/o/acme/communications');

    render(<CommunicationsHub perspective="organization" />);

    expect(screen.getByText('Reviewer threads, intros, and reveal requests.')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Reviewer messages, scheduling, and reveal steps stay inside the proof-first review flow.'
      )
    ).toBeInTheDocument();
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
