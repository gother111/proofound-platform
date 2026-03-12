import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { IndividualSetup } from '@/components/onboarding/IndividualSetup';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('@/actions/onboarding', () => ({
  completeIndividualOnboarding: vi.fn(),
}));

describe('IndividualSetup', () => {
  it('renders the locked first-session step order', () => {
    render(<IndividualSetup />);

    expect(
      screen.getByRole('heading', { name: /build your first proof-backed portfolio/i })
    ).toBeInTheDocument();

    const steps = [
      'Create safe shell',
      'Add one real context',
      'Add first proof',
      'Structure first Proof Pack',
      'Optional verification',
      'Publish portfolio',
    ];

    steps.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });
});
