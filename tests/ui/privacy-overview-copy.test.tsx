import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PrivacyOverview } from '@/components/settings/PrivacyOverview';

const apiFetchMock = vi.fn();
const dispatchClientErrorDiagnosticMock = vi.fn();

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: (...args: any[]) => apiFetchMock(...args),
}));

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientErrorDiagnostic: (...args: unknown[]) => dispatchClientErrorDiagnosticMock(...args),
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

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows plain-language data classification labels without tier wording', () => {
    render(<PrivacyOverview userId="user-1" />);

    expect(screen.getByText('Personal')).toBeInTheDocument();
    expect(screen.getAllByText('Sensitive').length).toBeGreaterThan(0);
    expect(screen.getByText('Operational')).toBeInTheDocument();
    expect(screen.queryByText('Operational (Pseudonymized)')).not.toBeInTheDocument();
    expect(
      screen.getByText(/Create your profile and support assignment-review preferences/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Support proof-led assignment reviews with evidence you control/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Trusted review context')).toBeInTheDocument();
    expect(screen.getByText('Assignment review')).toBeInTheDocument();
    expect(screen.getByText('Field visibility choices')).toBeInTheDocument();
    expect(
      screen.getByText(/Counts show the visibility level selected for each Public Page section/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Visible on your Public Page')).toBeInTheDocument();
    expect(screen.getByText('Visible only in trusted review contexts')).toBeInTheDocument();
    expect(
      screen.getByText('Allowed only when assignment-review access applies')
    ).toBeInTheDocument();
    expect(screen.getByText('Only visible to you')).toBeInTheDocument();
    expect(screen.getByText(/what stays private until assignment review/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Available only inside assignment-review surfaces/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Provide context for Proof Packs and assignment-specific review/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Assignment review history')).toBeInTheDocument();
    expect(
      screen.getByText(/Assignment reviews, proof submissions, conversations/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Connect you with assignment-review workflows/i)).toBeInTheDocument();
    expect(screen.queryByText('Connections')).not.toBeInTheDocument();
    expect(screen.queryByText('Match history')).not.toBeInTheDocument();
    expect(screen.queryByText('After match')).not.toBeInTheDocument();
    expect(screen.queryByText(/Visible to matched organizations/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/sharing your profile/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Showcase your work and impact/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/relevant opportunities/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/match you with opportunities/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Help match you with/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Connect you with opportunities/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Matches, applications, conversations/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Matches, proof submissions, conversations/i)
    ).not.toBeInTheDocument();

    expect(screen.queryByText(/Tier 1/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Tier 2/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Tier 3/i)).not.toBeInTheDocument();
    expect(screen.queryByText('What others can see')).not.toBeInTheDocument();
  });

  it('keeps the primary privacy header icon paired with the title and copy block', () => {
    render(<PrivacyOverview userId="user-1" />);

    const heading = screen.getByRole('heading', { name: 'Your Privacy Controls' });
    const headerGrid = heading.closest('.grid');
    const iconTile = headerGrid?.firstElementChild;
    const actions = screen.getAllByRole('button', { name: /review field visibility/i })[0]
      .parentElement;

    expect(headerGrid?.className).toContain('grid-cols-[2.5rem_minmax(0,1fr)]');
    expect(headerGrid?.className).toContain('sm:grid-cols-[3rem_minmax(0,1fr)]');
    expect(headerGrid?.className).toContain('items-start');
    expect(headerGrid?.className).not.toContain('sm:items-center');
    expect(iconTile).not.toHaveClass('sm:row-span-2');
    expect(iconTile).toHaveClass('sm:self-center');
    expect(actions).toHaveClass('col-span-2');
    expect(actions).toHaveClass('sm:col-start-2');
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

  it('routes the full-page primary privacy action to field visibility controls', () => {
    const target = document.createElement('section');
    target.id = 'privacy-field-visibility';
    document.body.appendChild(target);

    render(<PrivacyOverview userId="user-1" fullPageNavigation />);

    fireEvent.click(screen.getAllByRole('button', { name: /review field visibility/i })[0]);

    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(focusMock).toHaveBeenCalledWith({ preventScroll: true });
    expect(screen.queryByText('← Back to Privacy Overview')).not.toBeInTheDocument();

    target.remove();
  });

  it('routes the full-page visibility summary action to field visibility controls', () => {
    const target = document.createElement('section');
    target.id = 'privacy-field-visibility';
    document.body.appendChild(target);

    render(<PrivacyOverview userId="user-1" fullPageNavigation />);

    fireEvent.click(screen.getByRole('button', { name: /review visibility choices/i }));

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

  it('uses a named loading state while checking the visibility summary', async () => {
    let resolveSummary: ((response: Response) => void) | undefined;
    apiFetchMock.mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveSummary = resolve;
        })
    );

    render(<PrivacyOverview userId="user-1" />);

    expect(screen.getAllByText('Checking visibility')).toHaveLength(4);
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith('/api/profile/privacy-settings');
    });

    resolveSummary?.({
      ok: true,
      json: async () => ({
        fieldVisibility: {
          displayName: 'public',
        },
      }),
    } as Response);

    await waitFor(() => {
      expect(screen.getByText('1 section')).toBeInTheDocument();
    });
    expect(
      screen.getByRole('group', {
        name: /Public: 1 section\. Visible on your Public Page\./i,
      })
    ).toBeInTheDocument();
  });

  it('shows inline export failure feedback instead of a native alert', async () => {
    const alertSpy = vi.fn();
    vi.stubGlobal('alert', alertSpy);

    (global as any).fetch = vi.fn(async (url: string) => {
      if (url === '/api/feature-flags') {
        return {
          ok: true,
          json: async () => ({ flags: { privacySummary: true } }),
        };
      }

      if (url === '/api/user/export') {
        return {
          ok: false,
          json: async () => ({}),
        };
      }

      return {
        ok: true,
        json: async () => ({}),
      };
    });

    render(<PrivacyOverview userId="user-1" />);

    fireEvent.click(screen.getByRole('button', { name: /Download my data/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Export could not start');
    expect(alert).toHaveTextContent('We could not prepare your data export');
    expect(screen.getByRole('button', { name: /Retry export/i })).toHaveClass('min-h-[44px]');
    expect(alertSpy).not.toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledWith('/api/user/export');
  });

  it('keeps overview data exports retryable after a failed download start', async () => {
    const createObjectURLMock = vi.fn(() => 'blob:privacy-overview-export');
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

    (global as any).fetch = vi.fn(async (url: string) => {
      if (url === '/api/feature-flags') {
        return {
          ok: true,
          json: async () => ({ flags: { privacySummary: true } }),
        };
      }

      if (url === '/api/user/export') {
        exportAttempts += 1;
        if (exportAttempts === 1) {
          return {
            ok: false,
            json: async () => ({}),
          };
        }

        return {
          ok: true,
          blob: async () => new Blob(['{"ok":true}'], { type: 'application/json' }),
        };
      }

      return {
        ok: true,
        json: async () => ({}),
      };
    });

    try {
      render(<PrivacyOverview userId="user-1" />);

      fireEvent.click(screen.getByRole('button', { name: /Download my data/i }));

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('Export could not start');
      expect(screen.getByRole('button', { name: /Retry export/i })).toHaveClass('min-h-[44px]');

      fireEvent.click(screen.getByRole('button', { name: /Retry export/i }));

      expect(await screen.findByRole('status')).toHaveTextContent('Export started');
      expect(exportAttempts).toBe(2);
      expect(anchorClickMock).toHaveBeenCalled();
      expect(createObjectURLMock).toHaveBeenCalled();
      expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:privacy-overview-export');
    } finally {
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
    }
  });

  it('does not present zero visibility counts when the summary fails to load', async () => {
    apiFetchMock
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          fieldVisibility: {
            displayName: 'public',
            email: 'private',
            location: 'network_only',
            impactStory: 'match_only',
          },
        }),
      });

    render(<PrivacyOverview userId="user-1" />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Visibility summary needs a refresh');
    expect(alert).toHaveTextContent('Your saved field controls are still available below');
    expect(screen.getAllByText('Needs refresh')).toHaveLength(4);
    expect(screen.queryByText('0 sections')).not.toBeInTheDocument();
    expect(dispatchClientErrorDiagnosticMock).toHaveBeenCalledWith(
      'settings.privacy_overview.visibility_summary_failed',
      expect.any(Error)
    );

    fireEvent.click(screen.getByRole('button', { name: 'Retry summary' }));

    await waitFor(() => {
      expect(screen.getAllByText('1 section')).toHaveLength(4);
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(apiFetchMock).toHaveBeenCalledTimes(2);
  });
});
