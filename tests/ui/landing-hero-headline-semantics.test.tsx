import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LandingHeroHeadline } from '@/components/landing/sections/ScrollytellingSection';

describe('LandingHeroHeadline', () => {
  it('keeps the split visual headline readable as one spaced phrase', () => {
    render(<LandingHeroHeadline />);

    const heading = screen.getByRole('heading', { level: 1, name: 'Proof behind the claim' });

    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toBe('Proof behind the claim');
  });
});
