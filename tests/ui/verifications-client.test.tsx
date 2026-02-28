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
    request_type: 'skill',
    id: 'req-1',
    skill_id: 'skill-1',
    requester_profile_id: 'profile-1',
    verifier_email: 'reviewer@example.com',
    verifier_source: 'peer',
    status: 'pending',
    created_at: '2026-02-20T10:00:00.000Z',
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
        verifier_email: 'mentor@company.com',
        status: 'pending',
      }),
      makeRequest({
        id: 'sent-accepted',
        verifier_email: 'lead@company.com',
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

    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Accepted')).toBeInTheDocument();
    expect(screen.getByText('Declined')).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
  });

  it('renders incoming impact-story requests in read-only mode', () => {
    const incomingRequests = [
      makeRequest({
        id: 'incoming-impact-pending',
        request_type: 'impact_story',
        impact_story_id: 'story-1',
        impact_story_title: 'Climate adaptation rollout',
        verifier_source: undefined,
        verifier_relationship: 'Program partner',
        status: 'pending',
      }),
    ];

    const sentRequests = [
      makeRequest({
        id: 'sent-impact-accepted',
        request_type: 'impact_story',
        impact_story_id: 'story-2',
        impact_story_title: 'Public health transformation',
        verifier_source: undefined,
        verifier_relationship: 'Client',
        status: 'pending',
        verifier_email: 'partner@example.org',
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
      screen.getByText('Respond using the verification link that was sent to your email.')
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /accept/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /decline/i })).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^Sent/i })).toBeInTheDocument();
  });

  it('refreshes the page after custom verification request creation', () => {
    render(
      <VerificationsClient incomingRequests={[]} sentRequests={[]} userEmail="me@proofound.io" />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Trigger custom request created' }));

    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it('deletes a non-bundled pending sent request', async () => {
    const sentRequests = [
      makeRequest({
        id: 'sent-delete-1',
        verifier_email: 'mentor@company.com',
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
        '/api/expertise/verifications/sent/skill/sent-delete-1',
        expect.objectContaining({ method: 'DELETE' })
      )
    );

    await waitFor(() => {
      expect(screen.queryByText('mentor@company.com')).not.toBeInTheDocument();
    });
  });

  it('opens bundle cancellation dialog for bundled pending sent skill request', async () => {
    const sentRequests = [
      makeRequest({
        id: 'sent-bundle-1',
        verifier_email: 'bundle@company.com',
        status: 'pending',
        custom_request_id: 'bundle-request-1',
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
    fireEvent.click(screen.getByRole('button', { name: 'Manage Bundle' }));

    expect(screen.getByTestId('bundle-dialog-open')).toHaveTextContent('bundle-request-1');
    expect(apiFetchMock).not.toHaveBeenCalled();
  });
});
