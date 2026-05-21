import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DataBreakdown } from '@/components/privacy/DataBreakdown';

describe('privacy data breakdown', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        if (String(input) !== '/api/user/data-inventory') {
          return { ok: false, json: async () => ({}) };
        }

        return {
          ok: true,
          json: async () => ({
            counts: {
              profile: 2,
              professional: 6,
              proof: 6,
              matching: 3,
              activity: 1,
            },
          }),
        };
      }) as unknown as typeof fetch
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('builds the inventory from the owner export instead of placeholders', async () => {
    render(<DataBreakdown />);

    expect(screen.getByText('Loading your data...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Profile information')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/user/data-inventory');
    expect(screen.getByText('Proof and verification')).toBeInTheDocument();
    expect(screen.getByText('Assignment-review activity')).toBeInTheDocument();
    expect(screen.getByText('Product activity')).toBeInTheDocument();
    expect(screen.queryByText('Professional information')).not.toBeInTheDocument();
    expect(screen.queryByText('Matching activity')).not.toBeInTheDocument();
    expect(screen.getAllByText('6 records')).toHaveLength(2);
    expect(screen.getByText('3 records')).toBeInTheDocument();
    expect(screen.getByText('1 record')).toBeInTheDocument();
    expect(screen.queryByText('Trust badges')).not.toBeInTheDocument();
  });

  it('keeps the export action visible when the inventory cannot load', async () => {
    const diagnostics: Array<Record<string, unknown>> = [];
    window.addEventListener('proofound:client-diagnostic', ((event: CustomEvent) => {
      diagnostics.push(event.detail);
    }) as EventListener);

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        json: async () => ({}),
      })) as unknown as typeof fetch
    );

    render(<DataBreakdown />);

    expect(await screen.findByText(/Your data inventory could not load/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download my data/i })).toBeInTheDocument();
    expect(screen.getAllByText('0 records').length).toBeGreaterThan(0);
    expect(diagnostics).toContainEqual({
      reason: 'privacy.data_breakdown.load_failed',
      error: 'Data inventory unavailable',
    });
  });
});
