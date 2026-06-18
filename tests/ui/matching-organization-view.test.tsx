import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MatchingOrganizationView } from '@/components/matching/MatchingOrganizationView';

const apiFetchMock = vi.fn();
const routerPushMock = vi.fn();
const routerReplaceMock = vi.fn();
const dispatchClientErrorDiagnosticMock = vi.fn();

vi.mock('next/navigation', () => ({
  useParams: () => ({ slug: 'test-org' }),
  useRouter: () => ({
    push: routerPushMock,
    replace: routerReplaceMock,
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
}));

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientErrorDiagnostic: (...args: unknown[]) => dispatchClientErrorDiagnosticMock(...args),
}));

vi.mock('@/lib/ui/recovery-actions', () => ({
  getOrganizationRecoveryActions: () => [],
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const buildAssignment = () => ({
  id: 'assignment-1',
  orgId: 'org-1',
  role: 'Field operations launch lead',
  status: 'active',
  createdAt: '2026-06-13T00:00:00.000Z',
  matchingSummary: {
    candidateCount: 2,
    reviewChangeCount: 0,
    lastCandidateAt: '2026-06-14T00:00:00.000Z',
    lastReviewChangeAt: null,
    lastActivityAt: '2026-06-14T00:00:00.000Z',
  },
});

const buildMatch = (id: string, label: string, headline: string) => ({
  id,
  reviewStage: 'blind_review',
  corridorState: 'review_queue',
  revealScope: 'blind_review',
  canRequestIntro: true,
  profile: {
    skills: {
      'program-operations': true,
      'stakeholder-updates': true,
    },
  },
  discoveryStatus: 'review_ready_match',
  fitBand: 'strong_evidence_overlap',
  introGate: 'intro_hold_missing_trust_anchor',
  reviewCard: {
    candidateLabel: label,
    fitBand: 'Highest-priority proof review',
    fitSummary: {
      headline,
      bullets: ['Proof shows relevant ownership and delivery context.'],
      reasonCodes: ['proof_overlap'],
    },
    strongestProof: {
      summary: 'Delivered a field-readiness proof package.',
      outcome: 'Reduced handoff risk before launch.',
      ownership: 'Owned weekly readiness decisions.',
      freshnessLabel: 'Fresh proof',
    },
  },
});

function mockViewport(isMobile: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: query.includes('max-width') ? isMobile : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  );
}

function renderView() {
  return render(
    <MatchingOrganizationView assignments={[buildAssignment()]} onCreateNew={vi.fn()} />
  );
}

describe('MatchingOrganizationView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockViewport(true);
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({}),
      }))
    );
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          buildMatch('match-a', 'Submission A', 'Strong technical and timezone alignment.'),
          buildMatch('match-b', 'Submission B', 'Robust engineering background.'),
        ],
      }),
    });
  });

  it('exposes selected assignment, review tabs, and selected proof submission semantics', async () => {
    mockViewport(false);

    renderView();

    const assignmentButton = screen.getByRole('button', {
      name: /Field operations launch lead.*Current assignment corridor/i,
    });
    expect(assignmentButton).toHaveAttribute('aria-current', 'true');

    const submissionAButton = await screen.findByRole('button', {
      name: /Select Submission A for proof review.*Selected/i,
    });
    const submissionBButton = screen.getByRole('button', {
      name: /Select Submission B for proof review\./i,
    });
    expect(screen.getAllByText('Program Operations').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Stakeholder Updates').length).toBeGreaterThan(0);
    expect(screen.queryByText('program-operations')).not.toBeInTheDocument();
    expect(screen.queryByText('stakeholder-updates')).not.toBeInTheDocument();
    expect(submissionAButton).toHaveAttribute('aria-pressed', 'true');
    expect(submissionBButton).toHaveAttribute('aria-pressed', 'false');

    const queueTab = screen.getByRole('tab', { name: /Review queue \(2\)/i });
    const shortlistTab = screen.getByRole('tab', { name: /Shortlist and intros \(0\)/i });
    expect(queueTab).toHaveAttribute('aria-selected', 'true');
    expect(shortlistTab).toHaveAttribute('aria-selected', 'false');
    expect(queueTab).toHaveClass('min-h-11');
    expect(shortlistTab).toHaveClass('min-h-11');
    expect(screen.getByRole('tabpanel', { name: /Review queue \(2\)/i })).toHaveAttribute(
      'id',
      'review-queue-panel'
    );

    fireEvent.click(submissionBButton);

    await waitFor(() => {
      expect(
        screen.getByRole('button', {
          name: /Select Submission B for proof review.*Selected/i,
        })
      ).toHaveAttribute('aria-pressed', 'true');
    });

    const skillsTab = await screen.findByRole('tab', { name: 'Skills' });
    expect(skillsTab).toHaveClass('min-h-11');

    fireEvent.click(shortlistTab);

    expect(shortlistTab).toHaveAttribute('aria-selected', 'true');
    expect(queueTab).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tabpanel', { name: /Shortlist and intros \(0\)/i })).toHaveAttribute(
      'id',
      'review-shortlist-panel'
    );
  });

  it('brings selected proof details into view on mobile submission selection', async () => {
    const scrollIntoViewMock = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

    renderView();

    const submissionBLabel = await screen.findByText('Submission B');
    const submissionBButton = submissionBLabel.closest('button');
    expect(submissionBButton).not.toBeNull();

    await act(async () => {
      fireEvent.click(submissionBButton!);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(scrollIntoViewMock).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start',
      });
    });
    expect(screen.getByLabelText('Selected proof submission review')).toHaveFocus();
    expect(screen.getByText('Proof overlap')).toBeInTheDocument();
    expect(screen.getByText('Strongest Proof Pack')).toBeInTheDocument();
    expect(
      screen.getByText(/The summary uses scoped Proof Pack signals, reason codes/i)
    ).toBeInTheDocument();
    expect(screen.queryByText('proof_overlap')).not.toBeInTheDocument();
    expect(screen.queryByText('Strongest Proof Package')).not.toBeInTheDocument();
    expect(screen.queryByText(/Complete proof details, work samples/i)).not.toBeInTheDocument();
  });

  it('stacks opposing review actions on mobile to reduce accidental taps', async () => {
    renderView();

    const shortlistButton = await screen.findByRole('button', { name: 'Shortlist' });
    const declineButton = screen.getByRole('button', { name: 'Decline' });
    const actionGroup = shortlistButton.parentElement;

    expect(actionGroup).not.toBeNull();
    expect(actionGroup).toHaveClass('flex-col');
    expect(actionGroup).toHaveClass('sm:flex-row');
    expect(shortlistButton).toHaveClass('w-full');
    expect(shortlistButton).toHaveClass('sm:w-auto');
    expect(declineButton).toHaveClass('w-full');
    expect(declineButton).toHaveClass('sm:w-auto');
  });

  it('keeps desktop submission selection inside the split review console', async () => {
    mockViewport(false);
    const scrollIntoViewMock = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

    renderView();

    const submissionBLabel = await screen.findByText('Submission B');
    const submissionBButton = submissionBLabel.closest('button');
    expect(submissionBButton).not.toBeNull();

    await act(async () => {
      fireEvent.click(submissionBButton!);
      await Promise.resolve();
    });

    expect(scrollIntoViewMock).not.toHaveBeenCalled();
  });
});
