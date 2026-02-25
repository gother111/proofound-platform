import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { L4Card } from '@/app/app/i/expertise/components/L4Card';

describe('L4Card proof focus actions', () => {
  it('shows proof summary and routes actions to focused edit sections', () => {
    const onEdit = vi.fn();

    render(
      <L4Card
        onEdit={onEdit}
        skill={{
          id: 'skill-1',
          skillCode: '01.02.03.04',
          level: 4,
          competencyLabel: 'C4',
          relevance: 'current',
          lastUsedAt: new Date().toISOString(),
          monthsExperience: 18,
          evidenceStrength: 0.8,
          impactScore: 0.7,
          skill_name: 'TypeScript',
          proof_count: 2,
          verification_count: 1,
          taxonomy: {
            code: '01.02.03.04',
            tags: ['frontend'],
          },
        }}
      />
    );

    expect(screen.getByText(/Proofs and verifications/i)).toBeInTheDocument();
    expect(screen.getByText(/2 proofs/i)).toBeInTheDocument();

    const openProofButtons = screen.getAllByRole('button', { name: /Open Proofs/i });
    fireEvent.click(openProofButtons[0]);
    expect(onEdit).toHaveBeenCalledWith('proofs');

    fireEvent.click(screen.getByRole('button', { name: /Request Verification/i }));
    expect(onEdit).toHaveBeenCalledWith('verification');
  });
});
