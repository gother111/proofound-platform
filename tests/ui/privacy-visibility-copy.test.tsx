import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { IndividualFieldVisibilityControls } from '@/components/profile/IndividualFieldVisibilityControls';

describe('privacy visibility copy', () => {
  it('frames visibility as Public Page control instead of broad profile exposure', () => {
    render(
      <IndividualFieldVisibilityControls userId="user-1" initialVisibility={{}} onSave={vi.fn()} />
    );

    expect(
      screen.getByRole('heading', { level: 3, name: 'Public Page visibility' })
    ).toBeInTheDocument();
    expect(screen.getByText(/Visible on your Public Page/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Trusted review context/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Visible only in trusted review contexts/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Assignment review/i).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/Visible only after assignment-review access applies/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Short proof-context headline/i)).toBeInTheDocument();
    expect(screen.getByText(/Public Page and assignment-review surfaces/i)).toBeInTheDocument();
    expect(document.body.textContent ?? '').not.toMatch(/Profile visibility/i);
    expect(document.body.textContent ?? '').not.toMatch(/visible to everyone/i);
    expect(document.body.textContent ?? '').not.toMatch(/Professional headline/i);
    expect(document.body.textContent ?? '').not.toMatch(/Visible to your connections/i);
    expect(document.body.textContent ?? '').not.toMatch(/Visible after a mutual match/i);
  });
});
