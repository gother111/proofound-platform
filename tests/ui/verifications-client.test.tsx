import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

describe('VerificationsClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  it('renders incoming and sent requests in separate top-level tabs', () => {
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

    expect(screen.getByText('Jordan Verifier')).toBeInTheDocument();
    expect(screen.queryByText('mentor@company.com')).not.toBeInTheDocument();

    expect(screen.getByRole('tab', { name: /^Incoming/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^Sent/i })).toBeInTheDocument();

    expect(screen.getAllByText('Pending').length).toBeGreaterThan(0);
    expect(screen.getByText('Accepted')).toBeInTheDocument();
    expect(screen.getByText('Declined')).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
  });

  it('renders incoming impact-story requests in read-only mode', () => {
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

    expect(screen.getByText('Climate adaptation rollout')).toBeInTheDocument();
    expect(
      screen.getByText('Use the emailed link to respond to this proof confirmation request.')
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /accept/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /decline/i })).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^Sent/i })).toBeInTheDocument();
  });

  it('does not surface a custom verification request trigger in the current client', () => {
    render(
      <VerificationsClient incomingRequests={[]} sentRequests={[]} userEmail="me@proofound.io" />
    );

    expect(
      screen.queryByRole('button', { name: 'Trigger custom request created' })
    ).not.toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
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
