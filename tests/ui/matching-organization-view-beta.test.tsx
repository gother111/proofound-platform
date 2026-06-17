import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MatchingOrganizationView } from '@/components/matching/MatchingOrganizationView';

const apiFetchMock = vi.fn();
const pushMock = vi.fn();
const dispatchClientErrorDiagnosticMock = vi.fn();
let searchParamAssignment = '';

vi.mock('next/navigation', () => ({
  useParams: () => ({ slug: 'acme' }),
  useRouter: () => ({
    push: pushMock,
  }),
  useSearchParams: () => new URLSearchParams(searchParamAssignment),
}));

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: (...args: any[]) => apiFetchMock(...args),
}));

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientErrorDiagnostic: (...args: unknown[]) => dispatchClientErrorDiagnosticMock(...args),
}));

vi.mock('@/components/matching/MatchResultCard', () => ({
  MatchResultCard: ({ result }: { result: any }) => (
    <div data-testid="match-card">{result?.id}</div>
  ),
}));

vi.mock('@/lib/ui/recovery-actions', () => ({
  getOrganizationRecoveryActions: () => [],
}));

describe('MatchingOrganizationView launch corridor', () => {
  const assignments = [
    {
      id: 'assignment-1',
      orgId: 'org-1',
      role: 'Designer',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    searchParamAssignment = '';
    window.localStorage.clear();
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
  });

  it('keeps the no-assignment prompt proof-submission scoped', () => {
    render(<MatchingOrganizationView assignments={[]} onCreateNew={vi.fn()} />);

    expect(screen.getByText('Select an assignment corridor')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Choose one assignment in the left sidebar to start reviewing proof submissions.'
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(/matched submissions/i)).not.toBeInTheDocument();
  });

  it('does not render the archived beta test initiation CTA', async () => {
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] }),
    });

    render(<MatchingOrganizationView assignments={assignments as any} onCreateNew={vi.fn()} />);

    expect(screen.getByText('Proof submission review')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Select an assignment, review proof-backed submissions, and request intros only when the evidence is ready.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Assignment corridors')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('No proof submissions yet')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /initiate test/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/mission-first/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/skills-first/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/balanced/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /weights & filters/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/shortlist fits/i)).not.toBeInTheDocument();
  });

  it('keeps the reviewed-empty queue proof-submission scoped', async () => {
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            id: 'match-reviewed',
            assignmentId: 'assignment-1',
            reviewStage: 'shortlisted',
            revealScope: 'shortlist_identity',
            corridorState: 'shortlist',
            reviewCard: {
              candidateLabel: 'Submission B8K4',
              fitSummary: {
                headline: 'Proof signals are ready for intro review.',
                bullets: [],
                reasonCodes: [],
              },
            },
            profile: {
              skills: {},
            },
          },
        ],
      }),
    });

    render(<MatchingOrganizationView assignments={assignments as any} onCreateNew={vi.fn()} />);

    expect(await screen.findByText('Review queue is empty')).toBeInTheDocument();
    expect(
      screen.getByText('All proof submissions for this assignment have been reviewed.')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('All matching submissions for this assignment have been reviewed.')
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /view shortlist and intros \(1\)/i }));

    expect((await screen.findAllByText('Submission B8K4')).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: /^shortlist and intros \(1\)$/i }));

    expect(screen.queryByText('No submissions shortlisted yet')).not.toBeInTheDocument();
    expect(screen.queryByText(/Shortlist qualified submissions/i)).not.toBeInTheDocument();
  });

  it('keeps the empty shortlist tab proof-submission scoped', async () => {
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            id: 'match-reviewed',
            assignmentId: 'assignment-1',
            reviewStage: 'passed',
            revealScope: 'blind',
            corridorState: 'blind_review',
            reviewCard: {
              candidateLabel: 'Submission B8K4',
              fitSummary: {
                headline: 'Proof signals have already been reviewed.',
                bullets: [],
                reasonCodes: [],
              },
            },
            profile: {
              skills: {},
            },
          },
        ],
      }),
    });

    render(<MatchingOrganizationView assignments={assignments as any} onCreateNew={vi.fn()} />);

    fireEvent.click(await screen.findByRole('button', { name: /^shortlist and intros \(0\)$/i }));

    expect(screen.getByText('No proof submissions shortlisted yet')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Shortlist qualified proof submissions to request introductions and reveal identities.'
      )
    ).toBeInTheDocument();
    expect(screen.queryByText('No submissions shortlisted yet')).not.toBeInTheDocument();
    expect(screen.queryByText(/Shortlist qualified submissions/i)).not.toBeInTheDocument();
  });

  it('routes reviewers back to the queue when the shortlist segment is empty', async () => {
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            id: 'match-queue',
            assignmentId: 'assignment-1',
            reviewStage: 'blind_review',
            revealScope: 'blind',
            corridorState: 'blind_review',
            reviewCard: {
              candidateLabel: 'Submission Q5M2',
              fitSummary: {
                headline: 'Fresh proof signals need review.',
                bullets: [],
                reasonCodes: [],
              },
            },
            profile: {
              skills: {},
            },
          },
        ],
      }),
    });

    render(<MatchingOrganizationView assignments={assignments as any} onCreateNew={vi.fn()} />);

    expect((await screen.findAllByText('Submission Q5M2')).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: /^shortlist and intros \(0\)$/i }));

    expect(screen.getByText('No proof submissions shortlisted yet')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /back to review queue \(1\)/i }));

    expect(screen.getAllByText('Submission Q5M2').length).toBeGreaterThan(0);
    expect(screen.queryByText('No proof submissions shortlisted yet')).not.toBeInTheDocument();
  });

  it('stays on the assignment match API and never calls archived test-match endpoints', async () => {
    apiFetchMock.mockImplementation(async (url: string) => {
      if (url === '/api/match/assignment') {
        return {
          ok: true,
          json: async () => ({ items: [] }),
        };
      }

      throw new Error(`Unexpected url: ${url}`);
    });

    render(<MatchingOrganizationView assignments={assignments as any} onCreateNew={vi.fn()} />);

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith(
        '/api/match/assignment',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    expect(apiFetchMock.mock.calls.some(([url]) => String(url).includes('/test-matches'))).toBe(
      false
    );
  });

  it('shows a retryable load failure instead of the empty submissions state', async () => {
    apiFetchMock
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'matching service unavailable' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              id: 'match-1',
              assignmentId: 'assignment-1',
              reviewStage: 'blind_review',
              revealScope: 'blind',
              corridorState: 'generated',
              reviewCard: {
                candidateLabel: 'Submission A7F2',
                fitSummary: {
                  headline: 'Fresh proof signals are attached.',
                  bullets: [],
                  reasonCodes: [],
                },
              },
              profile: {
                skills: {},
              },
            },
          ],
        }),
      });

    render(<MatchingOrganizationView assignments={assignments as any} onCreateNew={vi.fn()} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Proof submissions could not load');
    expect(screen.getByText(/Your review queue is still safe/i)).toBeInTheDocument();
    expect(screen.queryByText('No proof submissions yet')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /retry review queue/i }));

    expect((await screen.findAllByText('Submission A7F2')).length).toBeGreaterThan(0);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(apiFetchMock).toHaveBeenCalledTimes(2);
  });

  it('keeps failed review actions safe, visible, and retryable without changing the queue', async () => {
    apiFetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              id: 'match-1',
              assignmentId: 'assignment-1',
              reviewStage: 'blind_review',
              revealScope: 'blind',
              corridorState: 'generated',
              canRequestIntro: true,
              reviewCard: {
                candidateLabel: 'Submission A7F2',
                fitSummary: {
                  headline: 'Fresh proof signals are attached.',
                  bullets: [],
                  reasonCodes: [],
                },
              },
              profile: {
                skills: {},
              },
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Review service temporarily unavailable' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          reviewStage: 'shortlisted',
          revealScope: 'shortlist_identity',
          progressiveRevealStage: 'shortlist_identity',
          corridorState: 'shortlist',
          visibleIdentityFields: [],
        }),
      });

    render(<MatchingOrganizationView assignments={assignments as any} onCreateNew={vi.fn()} />);

    expect(await screen.findByText('Submission A7F2')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Shortlist' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Shortlist did not save');
    expect(alert).toHaveTextContent(
      'No shortlist, decline, or intro action was changed. Retry this action before moving to the next submission.'
    );
    expect(alert).not.toHaveTextContent('Review service temporarily unavailable');
    expect(screen.getAllByText('Submission A7F2').length).toBeGreaterThan(0);
    expect(dispatchClientErrorDiagnosticMock).toHaveBeenCalledWith(
      'matching.organization_view.review_action_failed',
      expect.any(Error)
    );
    expect((dispatchClientErrorDiagnosticMock.mock.calls[0]?.[1] as Error).message).toBe(
      'Review service temporarily unavailable'
    );

    fireEvent.click(screen.getByRole('button', { name: /retry shortlist/i }));

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
    expect(apiFetchMock).toHaveBeenCalledWith(
      '/api/org/org-1/matches/match-1/review',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ action: 'shortlist' }),
      })
    );
    expect(apiFetchMock).toHaveBeenCalledTimes(3);
  });

  it('uses shortlist-specific recovery copy when removing a shortlisted submission fails', async () => {
    apiFetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              id: 'match-shortlisted',
              assignmentId: 'assignment-1',
              reviewStage: 'shortlisted',
              revealScope: 'shortlist_identity',
              corridorState: 'shortlist',
              canRequestIntro: true,
              reviewCard: {
                candidateLabel: 'Submission B8K4',
                fitSummary: {
                  headline: 'Proof signals are ready for intro review.',
                  bullets: [],
                  reasonCodes: [],
                },
              },
              profile: {
                skills: {},
              },
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Review service temporarily unavailable' }),
      });

    render(<MatchingOrganizationView assignments={assignments as any} onCreateNew={vi.fn()} />);

    fireEvent.click(await screen.findByRole('button', { name: /^shortlist and intros \(1\)$/i }));
    expect((await screen.findAllByText('Submission B8K4')).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Remove from shortlist' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Remove from shortlist did not save');
    expect(alert).toHaveTextContent(
      'No shortlist, decline, or intro action was changed. Retry this action before moving to the next submission.'
    );
    expect(alert).not.toHaveTextContent('Review service temporarily unavailable');
    expect(screen.getByRole('button', { name: /retry remove from shortlist/i })).toBeEnabled();
    expect(screen.queryByText('Decline did not save')).not.toBeInTheDocument();
    expect(dispatchClientErrorDiagnosticMock).toHaveBeenCalledWith(
      'matching.organization_view.review_action_failed',
      expect.any(Error)
    );
    expect(apiFetchMock).toHaveBeenCalledWith(
      '/api/org/org-1/matches/match-shortlisted/review',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ action: 'pass' }),
      })
    );
  });

  it('opens assignment-specific matching from the assignment card', async () => {
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] }),
    });

    render(
      <MatchingOrganizationView
        assignments={
          [
            ...assignments,
            {
              id: 'assignment-2',
              orgId: 'org-1',
              role: 'Research Lead',
              status: 'active',
              createdAt: new Date().toISOString(),
            },
          ] as any
        }
        onCreateNew={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith(
        '/api/match/assignment',
        expect.objectContaining({
          body: expect.stringContaining('"assignmentId":"assignment-1"'),
        })
      );
    });

    fireEvent.click(screen.getByRole('button', { name: /research lead/i }));

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith(
        '/api/match/assignment',
        expect.objectContaining({
          body: expect.stringContaining('"assignmentId":"assignment-2"'),
        })
      );
    });
    expect(pushMock).toHaveBeenCalledWith('/app/o/acme/assignments?matching=assignment-2');
    expect(screen.getByRole('link', { name: 'Edit assignment context' })).toHaveAttribute(
      'href',
      '/app/o/acme/assignments/assignment-2/review'
    );
  });

  it('shows a lightweight badge only for assignments with unseen matching activity', async () => {
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] }),
    });

    render(
      <MatchingOrganizationView
        assignments={
          [
            {
              ...assignments[0],
              matchingSummary: {
                candidateCount: 2,
                reviewChangeCount: 0,
                lastCandidateAt: '2026-05-15T10:00:00.000Z',
                lastReviewChangeAt: null,
                lastActivityAt: '2026-05-15T10:00:00.000Z',
              },
            },
          ] as any
        }
        onCreateNew={vi.fn()}
      />
    );

    expect(screen.getByText('New submissions')).toBeInTheDocument();
    expect(screen.getAllByText('2 submissions').length).toBeGreaterThan(0);
    expect(screen.queryByText('2 matches')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /designer/i }));

    await waitFor(() => {
      expect(screen.queryByText('New submissions')).not.toBeInTheDocument();
    });
  });

  it('uses proof-submission fallback labels when review card labels are missing', async () => {
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            id: 'match-1',
            assignmentId: 'assignment-1',
            score: 0.76,
            reviewStage: 'blind_review',
            revealScope: 'blind',
            reviewCard: null,
            profile: {
              skills: {},
            },
          },
        ],
      }),
    });

    render(<MatchingOrganizationView assignments={assignments as any} onCreateNew={vi.fn()} />);

    expect(await screen.findByText('Submission #1')).toBeInTheDocument();
    expect(screen.queryByText('Candidate #1')).not.toBeInTheDocument();
  });

  it('keeps low-supply discovery copy proof-submission scoped', async () => {
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            id: 'match-low-supply',
            assignmentId: 'assignment-1',
            reviewStage: 'blind_review',
            revealScope: 'blind',
            supplyState: 'browse_only_low_candidate_supply',
            reviewCard: {
              candidateLabel: 'Submission C9Q1',
              fitSummary: {
                headline: 'Broader proof review is available.',
                bullets: [],
                reasonCodes: [],
              },
            },
            profile: {
              skills: {},
            },
          },
        ],
      }),
    });

    render(<MatchingOrganizationView assignments={assignments as any} onCreateNew={vi.fn()} />);

    expect(await screen.findByText('Submission C9Q1')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Low proof-submission supply is showing broader review possibilities. Intro gates are unchanged.'
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(/broader possible matches/i)).not.toBeInTheDocument();
  });

  it('keeps required-skill explanation labels proof-submission scoped', async () => {
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            id: 'match-skills',
            assignmentId: 'assignment-1',
            reviewStage: 'blind_review',
            revealScope: 'blind',
            reviewCard: {
              candidateLabel: 'Submission A7F2',
              fitSummary: {
                headline: 'Relevant proof signals are attached.',
                bullets: [],
                reasonCodes: [],
              },
            },
          },
        ],
      }),
    });
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        proofSignals: {
          skills: 'Clear support',
        },
        skillsMatch: {
          required: [
            {
              skillName: 'Evidence operations',
              requiredLevel: 3,
              yourLevel: 4,
              met: true,
            },
          ],
          nice: [],
        },
      }),
    });

    render(<MatchingOrganizationView assignments={assignments as any} onCreateNew={vi.fn()} />);

    expect(await screen.findByText('Submission A7F2')).toBeInTheDocument();
    expect(await screen.findByText('Evidence operations')).toBeInTheDocument();
    expect(screen.getByText(/Required: Lvl 3 .* Submission has: Lvl 4/)).toBeInTheDocument();
    expect(screen.queryByText(/Candidate has: Lvl 4/)).not.toBeInTheDocument();
  });
});
