import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { FirstProofDialog } from '@/components/proofs/FirstProofDialog';

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => (open ? <div role="dialog">{children}</div> : null),
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <footer>{children}</footer>,
  DialogHeader: ({ children }: any) => <header>{children}</header>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
}));

describe('first proof entry point', () => {
  it('opens the proof artifact dialog instead of the Add Skill to Atlas panel', () => {
    render(
      <FirstProofDialog
        open
        onOpenChange={vi.fn()}
        onProofAdded={vi.fn()}
        skills={[{ id: 'skill-1', name: 'Systems thinking' }]}
        anchors={[
          {
            id: '11111111-1111-4111-8111-111111111111',
            type: 'experience',
            label: 'Proof-first launch work',
            detail: 'Proofound · 2026',
          },
        ]}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Add your first proof' })).toBeInTheDocument();
    expect(screen.getByLabelText('Skill or capability')).toHaveDisplayValue('Systems thinking');
    expect(screen.getByLabelText('Real context')).toHaveDisplayValue('Proof-first launch work');
    expect(screen.getByLabelText('Proof link')).toBeInTheDocument();
    expect(screen.getByLabelText('Upload proof file')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save first proof' })).toBeInTheDocument();
    expect(screen.queryByText('Add Skill to Atlas')).not.toBeInTheDocument();
  });
});
