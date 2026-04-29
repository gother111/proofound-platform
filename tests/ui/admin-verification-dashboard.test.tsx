import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiFetchMock = vi.fn();
const toastErrorMock = vi.fn();
const toastSuccessMock = vi.fn();

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: (...args: any[]) => apiFetchMock(...args),
}));

vi.mock('sonner', () => ({
  toast: {
    error: (...args: any[]) => toastErrorMock(...args),
    success: (...args: any[]) => toastSuccessMock(...args),
  },
}));

import { AdminVerificationDashboard } from '@/components/admin/AdminVerificationDashboard';

function buildJsonResponse(payload: unknown, ok = true) {
  return {
    ok,
    json: vi.fn().mockResolvedValue(payload),
  } as any;
}

const queuePayload = {
  queues: [
    {
      id: 'verification',
      label: 'Verification',
      description: 'Manual trust review items.',
      openCount: 0,
      items: [],
    },
    {
      id: 'privacy_reveal_exception',
      label: 'Privacy / reveal disputes',
      description: 'Reveal disputes.',
      openCount: 0,
      items: [],
    },
    {
      id: 'correction_revocation',
      label: 'Redaction / risky upload',
      description: 'Risky uploads.',
      openCount: 1,
      items: [
        {
          id: '33333333-3333-4333-8333-333333333333',
          queueType: 'correction_revocation',
          status: 'in_progress',
          priority: 'high',
          linkedEntityType: 'uploaded_file',
          linkedEntityId: '22222222-2222-2222-2222-222222222222',
          summary: 'Risky evidence upload held for privacy-safe review.',
          metadata: { reviewReasons: ['metadata_exif'] },
          createdAt: '2026-03-21T10:00:00.000Z',
          updatedAt: '2026-03-21T11:00:00.000Z',
          resolvedAt: null,
        },
      ],
    },
    {
      id: 'pilot_ops',
      label: 'Pilot ops',
      description: 'Pilot follow-through.',
      openCount: 0,
      items: [],
    },
  ],
  stats: {
    total: 1,
    open: 1,
  },
};

const actionableQueuePayload = {
  ...queuePayload,
  queues: queuePayload.queues.map((queue) =>
    queue.id === 'verification'
      ? {
          ...queue,
          openCount: 1,
          items: [
            {
              id: '33333333-3333-4333-8333-333333333333',
              queueType: 'verification',
              status: 'in_progress',
              priority: 'high',
              linkedEntityType: 'verification_request',
              linkedEntityId: '22222222-2222-2222-2222-222222222222',
              summary: 'Risky evidence upload held for privacy-safe review.',
              metadata: { reviewReasons: ['metadata_exif'] },
              createdAt: '2026-03-21T10:00:00.000Z',
              updatedAt: '2026-03-21T11:00:00.000Z',
              resolvedAt: null,
            },
          ],
        }
      : queue
  ),
};

describe('AdminVerificationDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads the generic internal ops queue endpoint and renders the narrow queue labels', async () => {
    apiFetchMock.mockResolvedValue(buildJsonResponse(queuePayload));

    render(<AdminVerificationDashboard />);

    await screen.findByText('Redaction / risky upload');

    expect(apiFetchMock).toHaveBeenCalledWith('/api/admin/internal-ops/queues');
    expect(screen.getByText('Privacy / reveal disputes')).toBeInTheDocument();
    expect(screen.getByText('Pilot ops')).toBeInTheDocument();
  });

  it('requires a note for resolve actions and patches the generic queue endpoint once provided', async () => {
    apiFetchMock
      .mockResolvedValueOnce(buildJsonResponse(actionableQueuePayload))
      .mockResolvedValueOnce(
        buildJsonResponse({
          success: true,
          item: {
            ...actionableQueuePayload.queues[0].items[0],
            status: 'resolved',
            resolvedAt: '2026-03-21T12:00:00.000Z',
          },
        })
      )
      .mockResolvedValueOnce(
        buildJsonResponse({
          ...actionableQueuePayload,
          queues: actionableQueuePayload.queues.map((queue) =>
            queue.id === 'verification'
              ? {
                  ...queue,
                  openCount: 0,
                  items: [
                    {
                      ...queue.items[0],
                      status: 'resolved',
                      resolvedAt: '2026-03-21T12:00:00.000Z',
                    },
                  ],
                }
              : queue
          ),
          stats: {
            total: 1,
            open: 0,
          },
        })
      );

    render(<AdminVerificationDashboard />);

    await screen.findByText('Risky evidence upload held for privacy-safe review.');

    fireEvent.click(screen.getByRole('button', { name: 'Resolve' }));
    expect(toastErrorMock).toHaveBeenCalledWith(
      'Add an operator note before resolving, cancelling, or reopening this item.'
    );
    expect(apiFetchMock).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByLabelText(/operator note/i), {
      target: { value: 'Safe after review.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Resolve' }));

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith(
        '/api/admin/internal-ops/queues/33333333-3333-4333-8333-333333333333',
        expect.objectContaining({
          method: 'PATCH',
        })
      );
    });
    await waitFor(() => {
      expect(toastSuccessMock).toHaveBeenCalledWith('Queue item moved to Resolved.');
    });
  });
});
