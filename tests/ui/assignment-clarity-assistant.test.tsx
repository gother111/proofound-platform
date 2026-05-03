import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AssignmentClarityAssistant } from '@/components/assignments/AssignmentClarityAssistant';

const apiFetchMock = vi.fn();

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
}));

function mockResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

function Harness({ onEnsureDraft = vi.fn() }: { onEnsureDraft?: () => Promise<any> }) {
  const form = useForm({
    defaultValues: {
      role: 'Ops lead',
      businessValue: 'Make an impact.',
      description: 'Wear many hats.',
      outcomes: [{ metric: 'Launch pilot', target: 'First customer live', timeframe: '90d' }],
      expectedImpact: '',
      engagementType: 'contract_consulting',
      locationMode: 'remote',
      city: '',
      country: '',
      compMin: 100000,
      compMax: 120000,
      currency: 'USD',
      hoursMin: 20,
      hoursMax: 40,
      mustHaveSkills: [],
      verificationGates: [],
    },
  });

  return (
    <div>
      <AssignmentClarityAssistant
        form={form}
        assignmentId="11111111-1111-4111-8111-111111111111"
        orgId="22222222-2222-4222-8222-222222222222"
        orgSlug="proofound-org"
        onEnsureDraft={onEnsureDraft}
      />
      <output data-testid="role-value">{form.watch('role')}</output>
      <output data-testid="description-value">{form.watch('description')}</output>
    </div>
  );
}

describe('Assignment Clarity Assistant UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiFetchMock.mockResolvedValue(
      mockResponse({
        ambiguityFlags: ['Outcome summary is vague or missing concrete deliverables.'],
        suggestedRewrite: {
          title: 'Pilot operations lead',
          outcomeSummary: 'Own the first customer pilot launch and publish weekly risk updates.',
          proofExpectations:
            'Proof should show shipped operating work, ownership, and clear tradeoff decisions.',
          constraints: { locationMode: 'remote', hoursMin: 20, hoursMax: 40 },
        },
        reviewQuestions: ['Which proof artifact would show ownership?'],
        excludedOrRiskyCriteria: ['Removed scoring language.'],
      })
    );
  });

  it('shows the button and supports explicit accept and dismiss behavior', async () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole('button', { name: /clarify assignment/i }));

    await screen.findByText('Ambiguity flags');
    expect(screen.getByLabelText('Title')).toHaveValue('Pilot operations lead');
    expect(screen.getByTestId('role-value')).toHaveTextContent('Ops lead');

    fireEvent.click(screen.getByRole('button', { name: /accept title/i }));
    await waitFor(() =>
      expect(screen.getByTestId('role-value')).toHaveTextContent('Pilot operations lead')
    );

    fireEvent.click(screen.getByRole('button', { name: /dismiss outcome summary/i }));
    expect(screen.queryByLabelText('Outcome summary')).not.toBeInTheDocument();
    expect(screen.getByTestId('description-value')).toHaveTextContent('Wear many hats.');

    expect(apiFetchMock).toHaveBeenCalledWith(
      '/api/ai/assignments/clarify',
      expect.objectContaining({ method: 'POST' })
    );
    expect(JSON.stringify(apiFetchMock.mock.calls)).not.toContain('publish');
  });
});
