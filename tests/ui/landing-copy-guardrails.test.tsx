import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EarlyProofSection } from '@/components/landing/sections/EarlyProofSection';

describe('landing copy guardrails', () => {
  it('keeps the early-proof section inside the narrow MVP story', () => {
    render(<EarlyProofSection />);

    expect(screen.getAllByText(/stronger signal than CVs/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/public proof portfolio/i)).toBeInTheDocument();
    expect(screen.getByText(/org trust page/i)).toBeInTheDocument();
    expect(screen.getByText(/privacy-safe proof/i)).toBeInTheDocument();
    expect(screen.getByText(/assignment corridor/i)).toBeInTheDocument();

    expect(screen.queryByText(/pricing/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/manifesto/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/protocol/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ecosystem/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/placeholder/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/future pilot/i)).not.toBeInTheDocument();
  });
});
