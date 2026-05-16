import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { ComponentProps } from 'react';

import { VerificationsClient } from '@/app/app/i/verifications/VerificationsClient';

const { refreshMock, apiFetchMock, bundleDialogSpy } = vi.hoisted(() => ({
  refreshMock: vi.fn(),
  apiFetchMock: vi.fn(),
  bundleDialogSpy: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: (...args: any[]) => apiFetchMock(...args),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/app/app/i/verifications/components/CustomVerificationRequestDialog', () => ({
  CustomVerificationRequestDialog: ({
    onCreated,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated?: () => void;
  }) => <button onClick={() => onCreated?.()}>Trigger custom request created</button>,
}));

vi.mock('@/app/app/i/verifications/components/BundleCancelDialog', () => ({
  BundleCancelDialog: (props: {
    open: boolean;
    requestId: string | null;
    onOpenChange: (open: boolean) => void;
    onCanceled: (removedSkillRequestIds: string[]) => void;
  }) => {
    bundleDialogSpy(props);
    return props.open ? <div data-testid="bundle-dialog-open">{props.requestId}</div> : null;
  },
}));

type VerificationRequest = ComponentProps<typeof VerificationsClient>['incomingRequests'][number];

function makeRequest(overrides: Partial<VerificationRequest> = {}): VerificationRequest {
  return {
    id: 'req-1',
    subjectType: 'skill',
    subjectId: 'skill-1',
    verificationKind: 'skill_attestation_peer',
    requestKind: 'generic_verification',
    requesterProfileId: 'profile-1',
    verifierEmail: 'reviewer@example.com',
    verifierSource: 'peer',
    status: 'pending',
    createdAt: '2026-02-20T10:00:00.000Z',
    skills: {
      id: 'skill-1',
      competency_level: 3,
      name_i18n: { en: 'TypeScript' },
    },
    profiles: {
      id: 'profile-2',
      display_name: 'Jordan Verifier',
      handle: 'jordan',
    },
    ...overrides,
  } as VerificationRequest;
}

async function settleAssistiveAiFlag() {
  await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/feature-flags'));
  await act(async () => {
    await Promise.resolve();
  });
}

describe('VerificationsClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input) === '/api/feature-flags') {
        return {
          ok: true,
          json: async () => ({ flags: { assistiveAiUi: true } }),
        } as Response;
      }
      throw new Error(`Unexpected fetch call: ${String(input)}`);
    }) as any;
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  it('renders incoming and sent requests in separate top-level tabs', async () => {
    const incomingRequests = [
      makeRequest({ id: 'incoming-pending', status: 'pending' }),
      makeRequest({
        id: 'incoming-accepted',
        status: 'accepted',
        profiles: { id: 'profile-3', display_name: 'Sofia Reviewer' },
      }),
    ];

    const sentRequests = [
      makeRequest({
        id: 'sent-pending',
        verifierEmail: 'mentor@company.com',
        status: 'pending',
      }),
      makeRequest({
        id: 'sent-accepted',
        verifierEmail: 'lead@company.com',
        status: 'accepted',
      }),
    ];

    render(
      <VerificationsClient
        incomingRequests={incomingRequests}
        sentRequests={sentRequests}
        userEmail="me@proofound.io"
      />
    );
    await settleAssistiveAiFlag();

    expect(screen.getByText('Jordan Verifier')).toBeInTheDocument();
    expect(screen.queryByText('mentor@company.com')).not.toBeInTheDocument();

    expect(screen.getByRole('tab', { name: /^Incoming/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^Sent/i })).toBeInTheDocument();

    expect(screen.getAllByText('Pending').length).toBeGreaterThan(0);
    expect(screen.getByText('Accepted')).toBeInTheDocument();
    expect(screen.getByText('Declined')).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
  });

  it('filters verification state buckets and sorts the list by scope', async () => {
    const incomingRequests = [
      makeRequest({
        id: 'recent-active',
        status: 'accepted',
        proofLabel: 'Z skill proof',
        claimSummary: 'A scoped TypeScript skill claim.',
        createdAt: '2026-03-03T10:00:00.000Z',
      }),
      makeRequest({
        id: 'attention-failed',
        subjectType: 'impact_story',
        subjectId: 'impact-1',
        verificationKind: 'impact_attestation',
        requestKind: 'impact_attestation',
        status: 'failed',
        proofLabel: 'Alpha outcome proof',
        claimSummary: 'An outcome confirmation needs manual attention.',
        createdAt: '2026-03-01T10:00:00.000Z',
      }),
      makeRequest({
        id: 'stale-active',
        status: 'accepted',
        proofLabel: 'Gamma stale proof',
        expiresAt: '2020-01-01T00:00:00.000Z',
        createdAt: '2026-03-02T10:00:00.000Z',
      }),
      makeRequest({
        id: 'corrected-record',
        status: 'corrected',
        proofLabel: 'Beta corrected proof',
        createdAt: '2026-02-28T10:00:00.000Z',
      }),
    ];

    render(
      <VerificationsClient
        incomingRequests={incomingRequests}
        sentRequests={[]}
        userEmail="me@proofound.io"
      />
    );
    await settleAssistiveAiFlag();

    expect(screen.getAllByTestId('verification-request-row')[0]).toHaveTextContent('Z skill proof');

    fireEvent.click(screen.getByRole('button', { name: /Needs attention/i }));
    expect(screen.getByText('Alpha outcome proof')).toBeInTheDocument();
    expect(screen.queryByText('Z skill proof')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Expired \/ stale/i }));
    expect(screen.getByText('Gamma stale proof')).toBeInTheDocument();
    expect(screen.queryByText('Alpha outcome proof')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Revoked \/ corrected/i }));
    expect(screen.getByText('Beta corrected proof')).toBeInTheDocument();
    expect(screen.queryByText('Gamma stale proof')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^All/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Scope$/i }));

    const rows = screen.getAllByTestId('verification-request-row');
    expect(rows[0]).toHaveTextContent('Alpha outcome proof');
    expect(rows[1]).toHaveTextContent('Beta corrected proof');
  });

  it('renders incoming impact-story requests in read-only mode', async () => {
    const incomingRequests = [
      makeRequest({
        id: 'incoming-impact-pending',
        subjectType: 'impact_story',
        subjectId: 'story-1',
        verificationKind: 'impact_attestation',
        requestKind: 'impact_attestation',
        impactStoryTitle: 'Climate adaptation rollout',
        verifierSource: undefined,
        verifierRelationship: 'Program partner',
        status: 'pending',
      }),
    ];

    const sentRequests = [
      makeRequest({
        id: 'sent-impact-accepted',
        subjectType: 'impact_story',
        subjectId: 'story-2',
        verificationKind: 'impact_attestation',
        requestKind: 'impact_attestation',
        impactStoryTitle: 'Public health transformation',
        verifierSource: undefined,
        verifierRelationship: 'Client',
        status: 'pending',
        verifierEmail: 'partner@example.org',
      }),
    ];

    render(
      <VerificationsClient
        incomingRequests={incomingRequests}
        sentRequests={sentRequests}
        userEmail="me@proofound.io"
      />
    );
    await settleAssistiveAiFlag();

    expect(screen.getByText('Climate adaptation rollout')).toBeInTheDocument();
    expect(
      screen.getByText('Use the emailed link to respond to this proof confirmation request.')
    ).toBeInTheDocument();
    const incomingRow = screen.getByText('Climate adaptation rollout').closest('[role="listitem"]');
    expect(incomingRow).not.toBeNull();
    expect(within(incomingRow as HTMLElement).queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^Sent/i })).toBeInTheDocument();
  });

  it('does not surface a custom verification request trigger in the current client', async () => {
    render(
      <VerificationsClient incomingRequests={[]} sentRequests={[]} userEmail="me@proofound.io" />
    );
    await settleAssistiveAiFlag();

    expect(
      screen.queryByRole('button', { name: 'Trigger custom request created' })
    ).not.toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it('drafts a claim-scoped verification request without sending until explicit review', async () => {
    apiFetchMock.mockImplementation(async (url: string) => {
      if (url === '/api/ai/verifications/compose') {
        return {
          ok: true,
          json: async () => ({
            suggestionId: '33333333-3333-4333-8333-333333333333',
            subject: 'Can you confirm this TypeScript claim?',
            message: 'Please confirm this one TypeScript claim from direct observation.',
            claimScope: 'I used TypeScript in a production migration.',
            verificationQuestions: ['Can you confirm this specific TypeScript claim?'],
            privacyNotes: ['Uses selected public-safe fields only.'],
            tooBroadWarnings: [],
          }),
        };
      }

      if (url === '/api/verification/requests/skill') {
        return {
          ok: true,
          json: async () => ({ request: { id: 'request-1' } }),
        };
      }

      if (url === '/api/ai/suggestions/events') {
        return {
          ok: true,
          json: async () => ({ ok: true }),
        };
      }

      throw new Error(`Unexpected API call: ${url}`);
    });

    render(
      <VerificationsClient
        incomingRequests={[]}
        sentRequests={[]}
        userEmail="me@proofound.io"
        composerProofPacks={[
          {
            proofPackId: '11111111-1111-4111-8111-111111111111',
            claimId: '22222222-2222-4222-8222-222222222222',
            title: 'TypeScript migration proof',
            claimStatement: 'I used TypeScript in a production migration.',
            ownershipStatement: 'I owned the migration plan.',
            outcomeSummary: 'The migration shipped.',
            timeframe: '2026 Q1',
            evidenceTitles: ['Migration checklist'],
            primarySubjectType: 'skill',
            primarySubjectId: '22222222-2222-4222-8222-222222222222',
          },
        ]}
      />
    );

    fireEvent.click(await screen.findByRole('button', { name: /^Draft scoped request$/i }));

    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: /^Draft scoped request$/i }));

    await screen.findByDisplayValue(
      'Please confirm this one TypeScript claim from direct observation.'
    );

    expect(apiFetchMock).toHaveBeenCalledWith(
      '/api/ai/verifications/compose',
      expect.objectContaining({ method: 'POST' })
    );
    expect(JSON.stringify(apiFetchMock.mock.calls)).not.toContain(
      '/api/verification/requests/skill'
    );

    fireEvent.change(within(dialog).getByLabelText(/Verifier email address/i), {
      target: { value: 'mentor@example.com' },
    });
    fireEvent.click(within(dialog).getByRole('checkbox', { name: /I reviewed this/i }));
    fireEvent.click(within(dialog).getByRole('button', { name: /^Send request$/i }));

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith(
        '/api/verification/requests/skill',
        expect.objectContaining({ method: 'POST' })
      );
    });

    const sendCall = apiFetchMock.mock.calls.find(
      (call) => call[0] === '/api/verification/requests/skill'
    );
    expect(JSON.parse(sendCall?.[1]?.body as string)).toMatchObject({
      skillId: '22222222-2222-4222-8222-222222222222',
      verifierEmail: 'mentor@example.com',
      message: 'Please confirm this one TypeScript claim from direct observation.',
    });

    expect(apiFetchMock).toHaveBeenCalledWith(
      '/api/ai/suggestions/events',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"eventType":"published"'),
      })
    );
    const eventBodies = apiFetchMock.mock.calls
      .filter((call) => call[0] === '/api/ai/suggestions/events')
      .map((call) => String(call[1]?.body));
    expect(eventBodies.join('\n')).not.toContain('mentor@example.com');
    expect(eventBodies.join('\n')).not.toContain(
      'Please confirm this one TypeScript claim from direct observation.'
    );
  });

  it('hides the scoped request composer when assistive AI UI is disabled', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ flags: { assistiveAiUi: false } }),
    });

    render(
      <VerificationsClient incomingRequests={[]} sentRequests={[]} userEmail="me@proofound.io" />
    );

    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: /^Draft scoped request$/i })
      ).not.toBeInTheDocument();
    });
  });

  it('deletes a non-bundled pending sent request', async () => {
    const sentRequests = [
      makeRequest({
        id: 'sent-delete-1',
        verifierEmail: 'mentor@company.com',
        status: 'pending',
      }),
    ];

    render(
      <VerificationsClient
        incomingRequests={[]}
        sentRequests={sentRequests}
        userEmail="me@proofound.io"
      />
    );

    const sentTab = screen.getByRole('tab', { name: /^Sent/i });
    fireEvent.mouseDown(sentTab);
    fireEvent.click(sentTab);
    fireEvent.keyDown(sentTab, { key: 'Enter' });
    await waitFor(() => expect(screen.getByText('mentor@company.com')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() =>
      expect(apiFetchMock).toHaveBeenCalledWith(
        '/api/verification/requests/skill/sent-delete-1',
        expect.objectContaining({ method: 'DELETE' })
      )
    );

    await waitFor(() => {
      expect(screen.queryByText('mentor@company.com')).not.toBeInTheDocument();
    });
  });

  it('resends a non-bundled pending sent request', async () => {
    const sentRequests = [
      makeRequest({
        id: 'sent-resend-1',
        verifierEmail: 'mentor@company.com',
        status: 'pending',
      }),
    ];

    render(
      <VerificationsClient
        incomingRequests={[]}
        sentRequests={sentRequests}
        userEmail="me@proofound.io"
      />
    );

    const sentTab = screen.getByRole('tab', { name: /^Sent/i });
    fireEvent.mouseDown(sentTab);
    fireEvent.click(sentTab);
    fireEvent.keyDown(sentTab, { key: 'Enter' });
    await waitFor(() => expect(screen.getByText('mentor@company.com')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Resend request' }));

    await waitFor(() =>
      expect(apiFetchMock).toHaveBeenCalledWith(
        '/api/verification/requests/skill/sent-resend-1',
        expect.objectContaining({ method: 'POST' })
      )
    );
  });

  it('opens bundle cancellation dialog for bundled pending sent skill request', async () => {
    const sentRequests = [
      makeRequest({
        id: 'bundle-request-1',
        subjectType: 'custom_bundle',
        subjectId: 'bundle-request-1',
        verificationKind: 'verification_bundle',
        requestKind: 'custom_bundle',
        verifierEmail: 'bundle@company.com',
        verifierRelationship: 'peer',
        status: 'pending',
        bundleId: 'bundle-request-1',
        bundleItemCount: 2,
        bundlePreviewLabels: ['TypeScript', 'Staff Engineer'],
      }),
    ];

    render(
      <VerificationsClient
        incomingRequests={[]}
        sentRequests={sentRequests}
        userEmail="me@proofound.io"
      />
    );

    const sentTab = screen.getByRole('tab', { name: /^Sent/i });
    fireEvent.mouseDown(sentTab);
    fireEvent.click(sentTab);
    fireEvent.keyDown(sentTab, { key: 'Enter' });
    await waitFor(() => expect(screen.getByText('bundle@company.com')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Manage legacy bundle' }));

    expect(screen.getByTestId('bundle-dialog-open')).toHaveTextContent('bundle-request-1');
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('resends bundled skill requests and refreshes on bundled response', async () => {
    const sentRequests = [
      makeRequest({
        id: 'bundle-request-2',
        subjectType: 'custom_bundle',
        subjectId: 'bundle-request-2',
        verificationKind: 'verification_bundle',
        requestKind: 'custom_bundle',
        verifierEmail: 'bundle@company.com',
        verifierRelationship: 'peer',
        status: 'pending',
        bundleId: 'bundle-request-2',
        bundleItemCount: 2,
        bundlePreviewLabels: ['TypeScript', 'Staff Engineer'],
      }),
    ];

    apiFetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, bundled: true, resentRequestId: 'bundle-request-2' }),
    });

    render(
      <VerificationsClient
        incomingRequests={[]}
        sentRequests={sentRequests}
        userEmail="me@proofound.io"
      />
    );

    const sentTab = screen.getByRole('tab', { name: /^Sent/i });
    fireEvent.mouseDown(sentTab);
    fireEvent.click(sentTab);
    fireEvent.keyDown(sentTab, { key: 'Enter' });
    await waitFor(() => expect(screen.getByText('bundle@company.com')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Resend bundle' }));

    await waitFor(() =>
      expect(apiFetchMock).toHaveBeenCalledWith(
        '/api/verification/requests/bundles/bundle-request-2',
        expect.objectContaining({ method: 'POST' })
      )
    );
    await waitFor(() => expect(refreshMock).toHaveBeenCalledTimes(1));
  });
});
