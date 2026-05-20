import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { EnhancedMatchFilters } from '@/components/matching/EnhancedMatchFilters';
import { FocusAreasSection } from '@/components/matching/FocusAreasSection';
import { MatchResultCard } from '@/components/matching/MatchResultCard';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock('@/components/matching/MatchExplainerModal', () => ({
  MatchExplainerModal: () => <div>Match explainer modal</div>,
}));

vi.mock('@/components/matching/SnoozeDialog', () => ({
  SnoozeDialog: () => <div>Snooze dialog</div>,
}));

vi.mock('@/components/matching/VerificationGatesWarning', () => ({
  VerificationGatesWarning: () => <div>Verification gates warning</div>,
}));

vi.mock('@/components/matching/ConsentToShareDialog', () => ({
  ConsentToShareDialog: () => <div>Consent dialog</div>,
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  },
}));

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverStub as typeof ResizeObserver;

describe('individual matching mobile clarity', () => {
  it('renders readable individual match skill chips and a stable card hook', () => {
    render(
      <MatchResultCard
        result={{
          id: 'visual-individual-match-1',
          score: 0.86,
          assignmentId: 'visual-assignment-proof-ops',
          assignment: {
            role: 'Proof operations lead for a privacy-safe assignment review',
            locationMode: 'remote',
            workMode: 'contract',
            hoursMin: 24,
            hoursMax: 32,
            skills: {
              'proof-systems': { level: 4 },
            },
          },
          contributions: {
            proof_fit: 0.91,
            skills_fit: 0.88,
            verification_fit: 0.84,
          },
        }}
        variant="blind"
        skills={[{ id: 'proof-systems', label: 'proof-systems', level: 4 }]}
      />
    );

    expect(screen.getByTestId('match-card')).toBeInTheDocument();
    expect(screen.getByText('proof-systems L4')).toHaveClass('text-proofound-charcoal');
  });

  it('keeps first setup role input full-width before the add action on mobile', () => {
    render(<FocusAreasSection profile={{ desiredRoles: [], orgTypes: [] }} onChange={vi.fn()} />);

    expect(screen.getByPlaceholderText('e.g., Software Engineer, Product Manager')).toHaveClass(
      'min-w-0'
    );
    expect(screen.getByRole('button', { name: 'Add' }).parentElement).toHaveClass('flex-col');
  });

  it('keeps filter actions in a sticky footer and announces active filters clearly', () => {
    render(
      <EnhancedMatchFilters
        activeFilters={{ skillDomains: [], locationMode: 'hybrid' }}
        onFiltersChange={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Filters, 1 active' }));

    expect(screen.getByRole('dialog')).toHaveTextContent('Filter Assignment Reviews');
    expect(screen.queryByText(/Narrow down opportunities/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apply Filters' }).parentElement).toHaveClass(
      'sticky'
    );
    expect(screen.getByRole('button', { name: 'Clear All' }).parentElement).toHaveClass('bottom-0');
  });
});
