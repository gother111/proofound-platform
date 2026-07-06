import React from 'react';
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import AcceptInvitePage from '@/app/accept-invite/page';

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('AcceptInvitePage', () => {
  it('gives invite links without a token a safe recovery state', async () => {
    render(
      await AcceptInvitePage({
        searchParams: Promise.resolve({}),
      })
    );

    expect(screen.getByRole('heading', { name: 'Invite link is invalid' })).toBeInTheDocument();
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Open the full invite link from your email');
    expect(alert).toHaveTextContent(
      'Your current account, role, and organization access are unchanged.'
    );
    expect(
      screen.getByText(/No organization membership was created from this page/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /return home/i })).toHaveAttribute('href', '/');
  });

  it('uses a mobile-safe shell for authenticated invitation review', async () => {
    const source = readFileSync('src/app/accept-invite/page.tsx', 'utf8');

    expect(source).toContain('min-h-[calc(100vh-8rem)]');
    expect(source).toContain('py-8');
    expect(source).not.toContain('w-full h-[calc(100vh-8rem)]');
  });
});
