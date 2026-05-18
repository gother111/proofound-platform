import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { AcceptInviteVisualClient } from '@/app/accept-invite/AcceptInviteVisualClient';
import { buildVisualOrgInvite, VISUAL_ORG_INVITE_TOKENS } from '@/lib/org-invites/visual-fixtures';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('AcceptInviteVisualClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the organization invite details before acceptance', () => {
    const invite = buildVisualOrgInvite(VISUAL_ORG_INVITE_TOKENS.pending);
    expect(invite).not.toBeNull();

    render(<AcceptInviteVisualClient invite={invite!} />);

    expect(screen.getByRole('heading', { level: 1, name: "You're invited" })).toBeInTheDocument();
    expect(screen.getByText('Northstar Evidence Studio')).toBeInTheDocument();
    expect(screen.getByText('org reviewer')).toBeInTheDocument();
    expect(screen.getByText('elena.reviewer@northstar-evidence.example')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /accept invitation/i })).toBeInTheDocument();
  });

  it('keeps the visual accept interaction local and shows the next step', () => {
    const invite = buildVisualOrgInvite(VISUAL_ORG_INVITE_TOKENS.pending);
    expect(invite).not.toBeNull();

    render(<AcceptInviteVisualClient invite={invite!} />);

    fireEvent.click(screen.getByRole('button', { name: /accept invitation/i }));

    expect(
      screen.getByRole('heading', { level: 1, name: 'Invitation accepted' })
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/workspace is ready/i);
    expect(screen.getByRole('link', { name: /open organization workspace/i })).toHaveAttribute(
      'href',
      '/app/o/northstar-evidence/home'
    );
  });
});
