import React from 'react';
import { render, screen } from '@testing-library/react';
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

describe('TopBar header actions', () => {
  beforeEach(() => {
    mockPathname = '/app/i/home';
  });

  it('renders profile menu trigger on individual dashboard route', () => {
    mockPathname = '/app/i/home';

    render(<TopBar userName="Alex Doe" userInitials="AD" />);

    expect(screen.getByRole('button', { name: /open profile menu/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Customize' })).not.toBeInTheDocument();
  });

  it('does not render Customize button on individual non-dashboard route', () => {
    mockPathname = '/app/i/profile';

    render(<TopBar userName="Alex Doe" userInitials="AD" />);

    expect(screen.queryByRole('button', { name: 'Customize' })).not.toBeInTheDocument();
  });

  it('renders profile menu trigger on org dashboard route', () => {
    mockPathname = '/app/o/acme/home';

    render(<TopBar userName="Acme" userInitials="AC" />);

    expect(screen.getByRole('button', { name: /open profile menu/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Customize' })).not.toBeInTheDocument();
  });

  it('does not render Customize button on org non-dashboard route', () => {
    mockPathname = '/app/o/acme/settings';

    render(<TopBar userName="Acme" userInitials="AC" />);

    expect(screen.queryByRole('button', { name: 'Customize' })).not.toBeInTheDocument();
  });

  it('updates title based on route meta when navigating', () => {
    mockPathname = '/app/i/home';
    const { rerender } = render(<TopBar userName="Alex Doe" userInitials="AD" />);
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Customize' })).not.toBeInTheDocument();

    mockPathname = '/app/i/profile';
    rerender(<TopBar userName="Alex Doe" userInitials="AD" />);
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Customize' })).not.toBeInTheDocument();

    mockPathname = '/app/i/home';
    rerender(<TopBar userName="Alex Doe" userInitials="AD" />);
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Customize' })).not.toBeInTheDocument();
  });
});
