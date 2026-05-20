import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrivacyOverview } from '@/components/settings/PrivacyOverview';

const apiFetchMock = vi.fn();

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: (...args: any[]) => apiFetchMock(...args),
}));

vi.mock('@/components/privacy/VisibilitySettingsModal', () => ({
  VisibilitySettingsModal: () => null,
}));

describe('PrivacyOverview copy', () => {
  const scrollIntoViewMock = vi.fn();
  const focusMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    Element.prototype.scrollIntoView = scrollIntoViewMock;
    HTMLElement.prototype.focus = focusMock;

    (global as any).fetch = vi.fn(async (url: string) => {
      if (url === '/api/feature-flags') {
        return {
          ok: true,
          json: async () => ({ flags: { privacySummary: true } }),
        };
      }

      return {
        ok: true,
        json: async () => ({}),
      };
    });

    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        fieldVisibility: {
          first_name: 'public',
          email: 'private',
        },
      }),
    });
  });

  it('shows plain-language data classification labels without tier wording', () => {
    render(<PrivacyOverview userId="user-1" />);

    expect(screen.getByText('Personal')).toBeInTheDocument();
    expect(screen.getAllByText('Sensitive').length).toBeGreaterThan(0);
    expect(screen.getByText('Operational')).toBeInTheDocument();
    expect(screen.queryByText('Operational (Pseudonymized)')).not.toBeInTheDocument();

    expect(screen.queryByText(/Tier 1/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Tier 2/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Tier 3/i)).not.toBeInTheDocument();
  });

  it('uses existing full-page privacy sections instead of opening duplicate drill-downs', () => {
    const target = document.createElement('section');
    target.id = 'privacy-activity';
    document.body.appendChild(target);

    render(<PrivacyOverview userId="user-1" fullPageNavigation />);

    fireEvent.click(screen.getAllByRole('button', { name: /view account history/i })[0]);

    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(focusMock).toHaveBeenCalledWith({ preventScroll: true });
    expect(screen.queryByText('← Back to Privacy Overview')).not.toBeInTheDocument();

    target.remove();
  });

  it('uses the read-only data inventory for inline data review', async () => {
    render(<PrivacyOverview userId="user-1" />);

    expect(
      screen.getByText(/Review stored data categories and export your data/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /import data/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /view your data/i }));

    expect(await screen.findByText('Your data')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith('/api/user/data-inventory');
    expect(global.fetch).not.toHaveBeenCalledWith('/api/user/export');
  });
});
