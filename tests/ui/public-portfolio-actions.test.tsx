import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CopyTextButton } from '@/app/portfolio/[handle]/CopyTextButton';
import { DownloadPdfButton } from '@/app/portfolio/[handle]/DownloadPdfButton';
import { DownloadOrganizationPdfButton } from '@/app/portfolio/org/[slug]/DownloadOrganizationPdfButton';
import { ShareLinkButton } from '@/app/portfolio/[handle]/ShareLinkButton';

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientErrorDiagnostic: vi.fn(),
}));

describe('public portfolio action feedback', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let clipboardWriteText: ReturnType<typeof vi.fn>;
  let alertSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    clipboardWriteText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('fetch', fetchMock);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: clipboardWriteText,
      },
    });
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete (navigator as Partial<Navigator>).clipboard;
  });

  it('confirms proof summary copy inline instead of using a browser alert', async () => {
    fetchMock.mockResolvedValueOnce(new Response('Proof summary text', { status: 200 }));

    render(<CopyTextButton endpoint="/api/public-summary" />);

    fireEvent.click(screen.getByRole('button', { name: /copy proof summary/i }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Proof summary copied to clipboard.'
    );
    expect(clipboardWriteText).toHaveBeenCalledWith('Proof summary text');
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('confirms share-link copy inline instead of using a browser alert', async () => {
    render(<ShareLinkButton url="https://proofound.io/portfolio/jane" />);

    fireEvent.click(screen.getByRole('button', { name: /copy share link/i }));

    expect(await screen.findByRole('status')).toHaveTextContent('Public page link copied.');
    expect(clipboardWriteText).toHaveBeenCalledWith('https://proofound.io/portfolio/jane');
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('shows recoverable inline share-link failure without a browser alert', async () => {
    clipboardWriteText.mockRejectedValueOnce(new Error('Clipboard unavailable'));

    render(<ShareLinkButton url="https://proofound.io/portfolio/jane" />);

    fireEvent.click(screen.getByRole('button', { name: /copy share link/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Public page link could not be copied. Try again.'
    );
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('shows recoverable inline copy failure without a browser alert', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 500 }));

    render(<CopyTextButton endpoint="/api/public-summary" />);

    fireEvent.click(screen.getByRole('button', { name: /copy proof summary/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Proof summary could not be copied. Try again.'
    );
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('shows individual PDF download errors inline without a browser alert', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Public PDF is still being prepared.' }), {
        status: 409,
        headers: { 'content-type': 'application/json' },
      })
    );

    render(<DownloadPdfButton endpoint="/api/public-export" />);

    fireEvent.click(screen.getByRole('button', { name: /download trust pdf/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Public PDF is still being prepared.'
    );
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('keeps individual PDF fallback failures specific to the public portfolio', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 500 }));

    render(<DownloadPdfButton endpoint="/api/public-export" />);

    fireEvent.click(screen.getByRole('button', { name: /download trust pdf/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'Trust PDF could not be downloaded. Your public portfolio is still live; please try again.'
    );
    expect(alert).not.toHaveTextContent('Could not download PDF. Please try again.');
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('shows organization PDF permission errors inline without a browser alert', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 403 }));

    render(<DownloadOrganizationPdfButton slug="acme" />);

    fireEvent.click(screen.getByRole('button', { name: /download organization pdf/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Only active organization members can download this PDF.'
    );
    expect(fetchMock).toHaveBeenCalledWith('/api/portfolio/org/acme/export', {
      method: 'GET',
      cache: 'no-store',
    });
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('keeps organization PDF fallback failures specific to the trust page', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 500 }));

    render(<DownloadOrganizationPdfButton slug="acme" />);

    fireEvent.click(screen.getByRole('button', { name: /download organization pdf/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'Organization PDF could not be downloaded. The trust page is still live; please try again.'
    );
    expect(alert).not.toHaveTextContent('Could not download PDF. Please try again.');
    expect(alertSpy).not.toHaveBeenCalled();
  });
});
