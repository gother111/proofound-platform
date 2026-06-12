import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

  it('shows inline export failure feedback instead of a native alert', async () => {
    const alertSpy = vi.fn();
    vi.stubGlobal('alert', alertSpy);

    render(<DataBreakdown />);

    fireEvent.click(await screen.findByRole('button', { name: /Download my data/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Export could not start');
    expect(alert).toHaveTextContent('We could not prepare your data export');
    expect(screen.getByRole('button', { name: /Retry export/i })).toBeInTheDocument();
    expect(alertSpy).not.toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledWith('/api/user/export');
  });

  it('keeps failed exports retryable without leaving the data view', async () => {
    const createObjectURLMock = vi.fn(() => 'blob:proofound-export');
    const revokeObjectURLMock = vi.fn();
    const anchorClickMock = vi.fn();
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    const originalCreateElement = document.createElement.bind(document);
    let exportAttempts = 0;

    URL.createObjectURL = createObjectURLMock;
    URL.revokeObjectURL = revokeObjectURLMock;
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName);
      if (tagName.toLowerCase() === 'a') {
        element.click = anchorClickMock;
      }
      return element;
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url === '/api/user/data-inventory') {
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
        }

        if (url === '/api/user/export') {
          exportAttempts += 1;
          if (exportAttempts === 1) {
            return { ok: false, json: async () => ({}) };
          }

          return {
            ok: true,
            blob: async () => new Blob(['{"ok":true}'], { type: 'application/json' }),
          };
        }

        return { ok: false, json: async () => ({}) };
      }) as unknown as typeof fetch
    );

    try {
      render(<DataBreakdown />);

      fireEvent.click(await screen.findByRole('button', { name: /Download my data/i }));

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('Export could not start');

      fireEvent.click(screen.getByRole('button', { name: /Retry export/i }));

      expect(await screen.findByRole('status')).toHaveTextContent('Export started');
      expect(exportAttempts).toBe(2);
      expect(anchorClickMock).toHaveBeenCalled();
      expect(createObjectURLMock).toHaveBeenCalled();
      expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:proofound-export');
      expect(screen.getByText('Proof and verification')).toBeInTheDocument();
    } finally {
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
    }
  });
});
