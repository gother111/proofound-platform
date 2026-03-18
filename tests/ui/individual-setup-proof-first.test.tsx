import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
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

  it('keeps the context step light and turns Proof Pack into a real editor', () => {
    render(<IndividualSetup />);

    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: 'Jane Founder' },
    });
    fireEvent.change(screen.getByLabelText(/^handle/i), {
      target: { value: 'jane_founder' },
    });
    fireEvent.change(screen.getByLabelText(/headline/i), {
      target: { value: 'Proof-first builder' },
    });
    fireEvent.change(screen.getByLabelText(/broad location/i), {
      target: { value: 'Stockholm, Sweden' },
    });
    fireEvent.change(screen.getByLabelText(/timezone/i), {
      target: { value: 'Europe/Stockholm' },
    });
    fireEvent.change(screen.getByLabelText(/target role or focus area/i), {
      target: { value: 'Proof-first onboarding' },
    });
    fireEvent.change(screen.getByLabelText(/work preference/i), {
      target: { value: 'remote' },
    });
    fireEvent.change(screen.getByLabelText(/engagement preference/i), {
      target: { value: 'contract' },
    });
    fireEvent.click(screen.getByRole('button', { name: /continue to real context/i }));

    expect(screen.getByLabelText(/context type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/title or focus/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/organization or institution/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/duration/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/context summary/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/outcome or contribution/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/collaboration or supporting detail/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/what should stand out/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/title or focus/i), {
      target: { value: 'Onboarding lead' },
    });
    fireEvent.change(screen.getByLabelText(/organization or institution/i), {
      target: { value: 'Proofound' },
    });
    fireEvent.change(screen.getByLabelText(/duration/i), {
      target: { value: '2025 to present' },
    });
    fireEvent.change(screen.getByLabelText(/context summary/i), {
      target: { value: 'Led the MVP onboarding corridor.' },
    });
    fireEvent.change(screen.getByLabelText(/outcome or contribution/i), {
      target: { value: 'Reduced friction so one session could reach portfolio-ready.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /continue to add your first proof/i }));

    fireEvent.change(screen.getByLabelText(/proof title/i), {
      target: { value: 'Proof-first corridor launch' },
    });
    fireEvent.change(screen.getByLabelText(/proof link/i), {
      target: { value: 'https://example.com/proof-first' },
    });
    fireEvent.change(screen.getByLabelText(/evidence item note/i), {
      target: { value: 'Launch note showing the shipped proof-first onboarding corridor.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /continue to structure proof pack/i }));

    expect(screen.getByLabelText(/claim/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ownership/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^outcome \*/i)).toBeInTheDocument();
    expect(screen.getByText(/proof pack preview/i)).toBeInTheDocument();
    expect(screen.getByText(/claim:/i)).toBeInTheDocument();
    expect(screen.getByText(/ownership:/i)).toBeInTheDocument();
    expect(screen.getByText(/anchor context:/i)).toBeInTheDocument();
    expect(screen.getByText(/evidence item:/i)).toBeInTheDocument();
    expect(screen.getByText(/visibility summary:/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Proof-first corridor launch')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('Reduced friction so one session could reach portfolio-ready.')
    ).toBeInTheDocument();
  });
});
