import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { NextStepsHelper } from '@/components/dashboard/NextStepsHelper';

const actions = [
  {
    id: 'proof-pack',
    title: 'Review proof record context',
    description: 'Keep the proof private until visibility is checked.',
    actionUrl: '/app/i/profile?profileView=full&tab=proof_packs',
  },
  {
    id: 'trust-anchor',
    title: 'Plan one trusted confirmation',
  },
];

describe('NextStepsHelper', () => {
  it('keeps next steps collapsed until the user asks for them', () => {
    render(<NextStepsHelper actions={actions} />);

    const button = screen.getByRole('button', { name: /next steps/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('region', { name: /next steps/i })).not.toBeInTheDocument();

    fireEvent.click(button, { detail: 1 });

    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('region', { name: /next steps/i })).toBeInTheDocument();
    expect(screen.getByText('Review proof record context')).toBeInTheDocument();
    expect(screen.getByText('Plan one trusted confirmation')).toBeInTheDocument();
  });

  it('opens on keyboard focus and keeps keyboard activation from closing it', () => {
    render(<NextStepsHelper actions={actions} />);

    const button = screen.getByRole('button', { name: /next steps/i });
    fireEvent.focus(button);

    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('region', { name: /next steps/i })).toBeInTheDocument();

    fireEvent.click(button, { detail: 0 });

    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('region', { name: /next steps/i })).toBeInTheDocument();
  });

  it('supports hover as an enhancement and reports action selection', () => {
    const onActionSelect = vi.fn();
    render(<NextStepsHelper actions={actions} onActionSelect={onActionSelect} />);

    fireEvent.mouseEnter(screen.getByRole('button', { name: /next steps/i }).parentElement!);

    const link = screen.getByRole('link', { name: /review proof record context/i });
    expect(link).toHaveAttribute('href', '/app/i/profile?profileView=full&tab=proof_packs');
    link.addEventListener('click', (event) => event.preventDefault());

    fireEvent.click(link);

    expect(onActionSelect).toHaveBeenCalledWith('proof-pack');
  });

  it('does not render an empty helper', () => {
    render(<NextStepsHelper actions={[]} />);

    expect(screen.queryByRole('button', { name: /next steps/i })).not.toBeInTheDocument();
  });
});
