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
    expect(screen.getByText(/Short proof-context headline/i)).toBeInTheDocument();
    expect(document.body.textContent ?? '').not.toMatch(/Profile visibility/i);
    expect(document.body.textContent ?? '').not.toMatch(/visible to everyone/i);
    expect(document.body.textContent ?? '').not.toMatch(/Professional headline/i);
  });
});
