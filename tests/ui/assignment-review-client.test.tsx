import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { AssignmentReviewClient } from '@/components/assignments/AssignmentReviewClient';

const pushMock = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: vi.fn(),
}));

const baseAssignment = {
  id: 'assignment-1',
  orgId: 'org-1',
  title: 'Proof operations lead',
  role: 'Proof operations lead',
  engagementType: 'contract_consulting',
  rolePurpose: 'Lead the review loop for regulated proof intake.',
  businessValue: 'Keep proof review specific enough for privacy-safe matching decisions.',
  description: 'Own the assignment review workflow and make proof expectations concrete.',
  proofExpectations: 'Show delivered proof operations work with clear ownership and outcomes.',
  expectedOutcomes: [
    {
      metric: 'Review quality',
      target: 'Raise review completeness',
      timeframe: 'First month',
    },
  ],
  outcomes: [],
  compensationMin: 80000,
  compensationMax: 100000,
  currency: 'SEK',
  location: 'Remote',
  requiredSkills: [
    { label: 'Evidence review', level: 4 },
    { label: 'Privacy operations', level: 4 },
  ],
  verificationGates: ['work_email'],
  status: 'draft',
};

describe('AssignmentReviewClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('summarizes publish readiness before the section cards', () => {
    render(
      <AssignmentReviewClient
        initialAssignment={baseAssignment}
        assignmentId="assignment-1"
        slug="acme"
      />
    );

    expect(screen.getByText('Review readiness')).toBeInTheDocument();
    expect(screen.getByText('Ready to publish.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Publish Assignment/i })).toBeEnabled();
    expect(screen.getAllByText('Role purpose').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Work summary').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Proof expectations').length).toBeGreaterThan(0);
  });

  it('keeps publish disabled and routes users to missing draft details', () => {
    render(
      <AssignmentReviewClient
        initialAssignment={{
          ...baseAssignment,
          description: '',
          expectedOutcomes: [],
          outcomes: [],
          proofExpectations: '',
          expectedImpact: '',
          requiredSkills: [],
        }}
        assignmentId="assignment-1"
        slug="acme"
      />
    );

    expect(screen.getByText('4 items need review.')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Finish the missing items before publishing so candidates see a specific, proof-led assignment.'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Publish Assignment/i })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /Edit missing items/i }));

    expect(pushMock).toHaveBeenCalledWith('/app/o/acme/assignments/new?draftId=assignment-1');
  });

  it('shows a generic warning for unsupported trust requirements without naming LinkedIn', () => {
    render(
      <AssignmentReviewClient
        initialAssignment={{
          ...baseAssignment,
          verificationGates: ['work_email', 'linkedin'],
        }}
        assignmentId="assignment-1"
        slug="acme"
      />
    );

    expect(screen.getByText('Work Email Verification')).toBeInTheDocument();
    expect(
      screen.getByText(/Remove unsupported trust requirements before publishing this assignment/i)
    ).toBeInTheDocument();
    expect(document.body.textContent ?? '').not.toMatch(/LinkedIn/i);
  });
});
