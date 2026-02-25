import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TopBar } from '@/components/app/TopBar';

let mockPathname = '/app/i/home';

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

vi.mock('@/actions/auth', () => ({
  signOut: vi.fn(),
}));

vi.mock('@/components/notifications/NotificationBell', () => ({
  NotificationBell: () => <div data-testid="notification-bell" />,
}));

vi.mock('@/components/brand/Logo', () => ({
  Logo: () => <div data-testid="logo" />,
}));

vi.mock('@/components/dashboard/CustomizeModal', () => ({
  CustomizeModal: ({ open }: { open: boolean }) => (
    <div data-testid="customize-modal-state">{open ? 'open' : 'closed'}</div>
  ),
}));

describe('TopBar customize visibility', () => {
  beforeEach(() => {
    mockPathname = '/app/i/home';
  });

  it('shows Customize button on individual dashboard route', () => {
    mockPathname = '/app/i/home';

    render(<TopBar userName="Alex Doe" userInitials="AD" />);

    expect(screen.getByRole('button', { name: 'Customize' })).toBeInTheDocument();
  });

  it('hides Customize button on individual non-dashboard route', () => {
    mockPathname = '/app/i/profile';

    render(<TopBar userName="Alex Doe" userInitials="AD" />);

    expect(screen.queryByRole('button', { name: 'Customize' })).not.toBeInTheDocument();
  });

  it('shows Customize button on org dashboard route', () => {
    mockPathname = '/app/o/acme/home';

    render(<TopBar userName="Acme" userInitials="AC" />);

    expect(screen.getByRole('button', { name: 'Customize' })).toBeInTheDocument();
  });

  it('hides Customize button on org non-dashboard route', () => {
    mockPathname = '/app/o/acme/settings';

    render(<TopBar userName="Acme" userInitials="AC" />);

    expect(screen.queryByRole('button', { name: 'Customize' })).not.toBeInTheDocument();
  });

  it('resets open customize modal when navigating away from dashboard', () => {
    mockPathname = '/app/i/home';
    const { rerender } = render(<TopBar userName="Alex Doe" userInitials="AD" />);

    fireEvent.click(screen.getByRole('button', { name: 'Customize' }));
    expect(screen.getByTestId('customize-modal-state')).toHaveTextContent('open');

    mockPathname = '/app/i/profile';
    rerender(<TopBar userName="Alex Doe" userInitials="AD" />);
    expect(screen.queryByTestId('customize-modal-state')).not.toBeInTheDocument();

    mockPathname = '/app/i/home';
    rerender(<TopBar userName="Alex Doe" userInitials="AD" />);
    expect(screen.getByTestId('customize-modal-state')).toHaveTextContent('closed');
  });
});
