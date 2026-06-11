import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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

const pilotWorkflowPayload = {
  queues: [
    {
      id: 'pilot_ops',
      label: 'Pilot ops',
      description: 'Pilot follow-through.',
      openCount: 1,
      items: [
        {
          id: '55555555-5555-4555-8555-555555555555',
          queueType: 'pilot_ops',
          status: 'open',
          priority: 'high',
          linkedEntityType: 'engagement_verification',
          linkedEntityId: '66666666-6666-4666-8666-666666666666',
          summary: 'Pilot workflow is stuck after engagement decision.',
          metadata: {
            assignmentStatus: 'published',
            trustTier: 'verified',
            organizationTrustPageStatus: 'published',
            revealStage: 'candidate_consented',
            candidateConsentStatus: 'granted',
            decisionState: 'hire',
            workflowStatus: 'pending_both_confirmations',
            pendingParty: 'candidate',
            privateCandidateEmail: 'candidate@example.com',
            rawInterviewNotes: 'Candidate private notes',
          },
          createdAt: '2026-03-21T10:00:00.000Z',
          updatedAt: '2026-03-21T11:00:00.000Z',
          resolvedAt: null,
        },
      ],
    },
  ],
  stats: {
    total: 1,
    open: 1,
  },
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
    expect(screen.getByRole('link', { name: /verification review sop/i })).toHaveAttribute(
      'href',
      expect.stringContaining('/docs/internal-ops/verification-review-sop.md')
    );
  });

  it.each([
    [
      'privacy_reveal_exception',
      /reveal privacy dispute sop/i,
      '/docs/internal-ops/reveal-privacy-dispute-sop.md',
    ],
    [
      'correction_revocation',
      /redaction and risky upload sop/i,
      '/docs/internal-ops/redaction-risky-upload-sop.md',
    ],
    [
      'pilot_ops',
      /pilot assignment quality checklist/i,
      '/docs/internal-ops/assignment-quality-checklist.md',
    ],
  ])('renders the current SOP link for %s queues', async (queueId, linkName, expectedPath) => {
    const queue = queuePayload.queues.find((entry) => entry.id === queueId);
    expect(queue).toBeDefined();
    apiFetchMock.mockResolvedValue(
      buildJsonResponse({
        queues: [queue],
        stats: {
          total: queue?.items.length ?? 0,
          open: queue?.openCount ?? 0,
        },
      })
    );

    render(<AdminVerificationDashboard />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: linkName })).toHaveAttribute(
        'href',
        expect.stringContaining(expectedPath)
      );
    });
  });

  it('requires a note for resolve actions and patches the generic queue endpoint once provided', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm');
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

    const resolveDialog = await screen.findByRole('alertdialog', { name: 'Resolve queue item?' });
    expect(resolveDialog).toBeInTheDocument();
    expect(within(resolveDialog).getByText('Safe after review.')).toBeInTheDocument();
    expect(apiFetchMock).toHaveBeenCalledTimes(1);

    fireEvent.click(within(resolveDialog).getByRole('button', { name: 'Confirm resolve' }));

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
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
    expect(confirmSpy).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('lets operators filter queue items by active status and priority', async () => {
    apiFetchMock.mockResolvedValue(
      buildJsonResponse({
        queues: [
          {
            ...actionableQueuePayload.queues[0],
            items: [
              actionableQueuePayload.queues[0].items[0],
              {
                ...actionableQueuePayload.queues[0].items[0],
                id: '44444444-4444-4444-8444-444444444444',
                status: 'resolved',
                priority: 'low',
                summary: 'Resolved pilot evidence check.',
                resolvedAt: '2026-03-21T12:00:00.000Z',
              },
            ],
          },
        ],
        stats: {
          total: 2,
          open: 1,
        },
      })
    );

    render(<AdminVerificationDashboard />);

    await screen.findByText('Risky evidence upload held for privacy-safe review.');

    expect(screen.getByText(/Age /)).toBeInTheDocument();
    expect(screen.queryByText('Resolved pilot evidence check.')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'all' } });
    expect(await screen.findByText('Resolved pilot evidence check.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Priority'), { target: { value: 'high_urgent' } });
    expect(screen.queryByText('Resolved pilot evidence check.')).not.toBeInTheDocument();
    expect(
      screen.getByText('Risky evidence upload held for privacy-safe review.')
    ).toBeInTheDocument();
  });

  it('renders a narrow pilot corridor drilldown without private workflow notes', async () => {
    apiFetchMock.mockResolvedValue(buildJsonResponse(pilotWorkflowPayload));

    render(<AdminVerificationDashboard />);

    await screen.findByText('Pilot workflow is stuck after engagement decision.');
    expect(
      screen.queryByText('Pilot workflow is stuck after hire decision.')
    ).not.toBeInTheDocument();

    expect(screen.getByText('Pilot corridor')).toBeInTheDocument();
    expect(screen.getByText('Assignment:')).toBeInTheDocument();
    expect(screen.getAllByText('Published')).toHaveLength(2);
    expect(screen.getByText('Org trust:')).toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();
    expect(screen.getByText('Decision:')).toBeInTheDocument();
    expect(screen.getByText('Hire')).toBeInTheDocument();
    expect(screen.getByText('Engagement:')).toBeInTheDocument();
    expect(screen.getByText('Pending Both Confirmations')).toBeInTheDocument();
    expect(screen.getByText('Proof-review participant consent:')).toBeInTheDocument();
    expect(screen.getByText('Proof-review participant consent status:')).toBeInTheDocument();
    expect(screen.getAllByText('Proof-review participant consented').length).toBeGreaterThan(0);
    expect(screen.queryByText('Candidate consent:')).not.toBeInTheDocument();
    expect(screen.queryByText('Candidate Consent Status:')).not.toBeInTheDocument();
    expect(screen.getByText('Pending party:')).toBeInTheDocument();
    expect(screen.getAllByText('Proof-review participant').length).toBeGreaterThan(0);
    expect(screen.queryByText('Candidate')).not.toBeInTheDocument();
    expect(screen.queryByText('Candidate Consented')).not.toBeInTheDocument();
    expect(screen.queryByText('candidate@example.com')).not.toBeInTheDocument();
    expect(screen.queryByText('Candidate private notes')).not.toBeInTheDocument();
  });

  it('uses explicit approve and reject actions for uploaded-file queue items', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm');
    const uploadQueuePayload = {
      queues: [queuePayload.queues[2]],
      stats: queuePayload.stats,
    };

    apiFetchMock
      .mockResolvedValueOnce(buildJsonResponse(uploadQueuePayload))
      .mockResolvedValueOnce(
        buildJsonResponse({
          success: true,
          item: {
            ...queuePayload.queues[2].items[0],
            status: 'resolved',
            resolvedAt: '2026-03-21T12:00:00.000Z',
          },
        })
      )
      .mockResolvedValueOnce(
        buildJsonResponse({
          queues: [
            {
              ...queuePayload.queues[2],
              openCount: 0,
              items: [
                {
                  ...queuePayload.queues[2].items[0],
                  status: 'resolved',
                  resolvedAt: '2026-03-21T12:00:00.000Z',
                },
              ],
            },
          ],
          stats: {
            total: 1,
            open: 0,
          },
        })
      );

    render(<AdminVerificationDashboard />);

    await screen.findByText('Risky evidence upload held for privacy-safe review.');

    expect(screen.getByRole('button', { name: /approve private evidence/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reject upload/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Resolve' })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/operator note/i), {
      target: { value: 'Inspected metadata flags; safe for private evidence only.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /approve private evidence/i }));

    const approveDialog = await screen.findByRole('alertdialog', {
      name: 'Approve private evidence queue item?',
    });
    expect(approveDialog).toBeInTheDocument();
    expect(
      within(approveDialog).getByText('Inspected metadata flags; safe for private evidence only.')
    ).toBeInTheDocument();
    expect(apiFetchMock).toHaveBeenCalledTimes(1);

    fireEvent.click(
      within(approveDialog).getByRole('button', { name: /confirm approve private evidence/i })
    );

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith(
        '/api/admin/internal-ops/queues/33333333-3333-4333-8333-333333333333',
        expect.objectContaining({
          method: 'PATCH',
        })
      );
    });

    const patchCall = apiFetchMock.mock.calls.find(([url]) =>
      String(url).includes('/api/admin/internal-ops/queues/33333333-3333-4333-8333-333333333333')
    );
    expect(JSON.parse(patchCall?.[1]?.body as string)).toEqual({
      status: 'resolved',
      uploadReviewAction: 'approve',
      note: 'Inspected metadata flags; safe for private evidence only.',
    });
    expect(confirmSpy).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(toastSuccessMock).toHaveBeenCalledWith('Upload approved for private evidence.');
    });
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    confirmSpy.mockRestore();
  });
});
