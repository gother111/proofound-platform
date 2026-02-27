import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { VerificationsClient } from '@/app/app/i/verifications/VerificationsClient';

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
});
