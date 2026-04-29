import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrivacyOverview } from '@/components/settings/PrivacyOverview';

const apiFetchMock = vi.fn();

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: (...args: any[]) => apiFetchMock(...args),
}));

vi.mock('@/components/privacy/VisibilitySettingsModal', () => ({
  VisibilitySettingsModal: () => null,
}));

vi.mock('@/components/settings/EnhancedDataImportDialog', () => ({
  EnhancedDataImportDialog: () => null,
}));

describe('PrivacyOverview copy', () => {
  beforeEach(() => {
    vi.clearAllMocks();

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
});
