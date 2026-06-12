import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SnoozeDialog } from '@/components/matching/SnoozeDialog';
import { apiFetch } from '@/lib/api/fetch';
import { toast } from 'sonner';

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: vi.fn(),
}));

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientErrorDiagnostic: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/hooks/use-responsive-modal-mode', () => ({
  useResponsiveModalMode: () => true,
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({
    children,
    open,
  }: {
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }) => (open ? <div>{children}</div> : null),
  DialogContent: ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) => (
    <div role="dialog" {...props}>
      {children}
    </div>
  ),
  DialogDescription: ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLParagraphElement> & { children: React.ReactNode }) => (
    <p {...props}>{children}</p>
  ),
  DialogFooter: ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) => (
    <div {...props}>{children}</div>
  ),
  DialogHeader: ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) => (
    <div {...props}>{children}</div>
  ),
  DialogTitle: ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLHeadingElement> & { children: React.ReactNode }) => (
    <h2 {...props}>{children}</h2>
  ),
}));

vi.mock('@/components/ui/drawer', () => ({
  Drawer: ({
    children,
    open,
  }: {
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }) => (open ? <div>{children}</div> : null),
  DrawerContent: ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) => (
    <div {...props}>{children}</div>
  ),
}));

const apiFetchMock = vi.mocked(apiFetch);
const toastSuccessMock = vi.mocked(toast.success);

describe('SnoozeDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('frames the action as pausing an assignment review', () => {
    render(
      <SnoozeDialog
        open
        onOpenChange={vi.fn()}
        matchId="match-1"
        assignmentTitle="Proof operations lead"
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Pause this assignment review' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Temporarily pause "Proof operations lead" in your assignment reviews/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pause for 1 week' })).toBeInTheDocument();
    expect(screen.getByText(/Pausing does not change your proof readiness/i)).toBeInTheDocument();
    expect(screen.queryByText('Snooze This Match')).not.toBeInTheDocument();
    expect(screen.queryByText(/from your matches/i)).not.toBeInTheDocument();
  });

  it('keeps the existing pause endpoint while showing assignment-review success copy', async () => {
    const onOpenChange = vi.fn();
    const onSnoozed = vi.fn();
    apiFetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ snoozeUntil: '2026-06-19T00:00:00.000Z' }),
    } as any);

    render(
      <SnoozeDialog
        open
        onOpenChange={onOpenChange}
        matchId="match-1"
        assignmentTitle="Proof operations lead"
        onSnoozed={onSnoozed}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Pause for 1 week' }));

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith('/api/matches/match-1/snooze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration: 7 }),
      });
    });
    expect(toastSuccessMock.mock.calls[0]?.[0]).toContain('Assignment review paused until');
    expect(toastSuccessMock.mock.calls[0]?.[1]).toEqual({
      description: '"Proof operations lead" will reappear in 1 week.',
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onSnoozed).toHaveBeenCalled();
  });
});
