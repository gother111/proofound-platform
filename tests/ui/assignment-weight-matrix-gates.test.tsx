import React from 'react';
import { render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import { Step3WeightMatrix } from '@/components/matching/assignment-steps/Step3WeightMatrix';

vi.mock('@/components/matching/assignment-steps/Step5ExpertiseMapping', () => ({
  Step5ExpertiseMapping: () => <div data-testid="skill-mapping-placeholder" />,
}));

function Harness() {
  const form = useForm({
    defaultValues: {
      expectedImpact: 'Proof should show shipped customer-facing workflow improvements.',
      mustHaveSkills: [
        { id: 'ops', label: 'Operations' },
        { id: 'proof', label: 'Proof review' },
        { id: 'privacy', label: 'Privacy review' },
      ],
      verificationGates: [],
    },
  });

  return <Step3WeightMatrix form={form} onNext={vi.fn()} onBack={vi.fn()} isSubmitting={false} />;
}

describe('Step3WeightMatrix verification gates', () => {
  it('offers only launch-valid assignment trust gates', () => {
    render(<Harness />);

    expect(screen.getByText('Identity verification')).toBeInTheDocument();
    expect(screen.getByText('Work email verification')).toBeInTheDocument();
    expect(screen.getByText('Background check')).toBeInTheDocument();
    expect(screen.getByText('Education verification')).toBeInTheDocument();
    expect(screen.queryByText(/LinkedIn profile verification/i)).not.toBeInTheDocument();
  });
});
