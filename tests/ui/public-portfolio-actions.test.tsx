import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CopyTextButton } from '@/app/portfolio/[handle]/CopyTextButton';
import { DownloadPdfButton } from '@/app/portfolio/[handle]/DownloadPdfButton';
import { DownloadOrganizationPdfButton } from '@/app/portfolio/org/[slug]/DownloadOrganizationPdfButton';
import { ShareLinkButton } from '@/app/portfolio/[handle]/ShareLinkButton';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientErrorDiagnostic: vi.fn(),
}));

function createDeferredResponse() {
  let resolve!: (response: Response) => void;
  const promise = new Promise<Response>((promiseResolve) => {
    resolve = promiseResolve;
  });

  return { promise, resolve };
}

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

  it('renders public trust actions with touch-safe targets by default', () => {
    render(
      <div>
        <CopyTextButton endpoint="/api/public-summary" />
        <ShareLinkButton url="https://proofound.io/portfolio/jane" />
        <DownloadPdfButton endpoint="/api/public-export" />
        <DownloadOrganizationPdfButton slug="acme" />
      </div>
    );

    expect(screen.getByRole('button', { name: /copy proof summary/i })).toHaveClass('min-h-[44px]');
    expect(screen.getByRole('button', { name: /copy share link/i })).toHaveClass('min-h-[44px]');
    expect(screen.getByRole('button', { name: /download trust pdf/i })).toHaveClass('min-h-[44px]');
    expect(screen.getByRole('button', { name: /download trust pdf/i })).toHaveClass(
      'border-proofound-stone/85'
    );
    expect(screen.getByRole('button', { name: /download trust pdf/i })).toHaveClass(
      'text-proofound-charcoal'
    );
    expect(screen.getByRole('button', { name: /download organization pdf/i })).toHaveClass(
      'min-h-[44px]'
    );
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

  it('keeps proof-summary copy loading feedback specific while text is prepared', async () => {
    const deferred = createDeferredResponse();
    fetchMock.mockReturnValueOnce(deferred.promise);

    render(<CopyTextButton endpoint="/api/public-summary" />);

    fireEvent.click(screen.getByRole('button', { name: /copy proof summary/i }));

    expect(screen.getByRole('button', { name: /preparing proof summary/i })).toBeDisabled();

    deferred.resolve(new Response('', { status: 500 }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Proof summary could not be prepared. Refresh this page or try again.'
    );
  });

  it('confirms share-link copy inline instead of using a browser alert', async () => {
    render(<ShareLinkButton url="https://proofound.io/portfolio/jane" />);

    fireEvent.click(screen.getByRole('button', { name: /copy share link/i }));

    expect(await screen.findByRole('status')).toHaveTextContent('Public page link copied.');
    expect(clipboardWriteText).toHaveBeenCalledWith('https://proofound.io/portfolio/jane');
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('uses organization trust-page copy for organization share links', async () => {
    render(
      <ShareLinkButton
        url="https://proofound.io/portfolio/org/acme"
        surface="organization-trust-page"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /copy share link/i }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Organization trust page link copied.'
    );
    expect(clipboardWriteText).toHaveBeenCalledWith('https://proofound.io/portfolio/org/acme');
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('shows recoverable inline share-link failure without a browser alert', async () => {
    clipboardWriteText.mockRejectedValueOnce(new Error('Clipboard unavailable'));

    render(<ShareLinkButton url="https://proofound.io/portfolio/jane" />);

    fireEvent.click(screen.getByRole('button', { name: /copy share link/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Public page link could not be copied. Select the link below or try again.'
    );
    const manualCopyInput = screen.getByLabelText('Share link for manual copy');
    expect(manualCopyInput).toHaveValue('https://proofound.io/portfolio/jane');
    expect(manualCopyInput).toHaveClass('min-h-[44px]');
    expect(
      screen.queryByText('Public page link could not be copied. Try again.')
    ).not.toBeInTheDocument();
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('keeps organization trust-page share failures recoverable with the right label', async () => {
    clipboardWriteText.mockRejectedValueOnce(new Error('Clipboard unavailable'));

    render(
      <ShareLinkButton
        url="https://proofound.io/portfolio/org/acme"
        surface="organization-trust-page"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /copy share link/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Organization trust page link could not be copied. Select the link below or try again.'
    );
    const manualCopyInput = screen.getByLabelText('Organization trust page link for manual copy');
    expect(manualCopyInput).toHaveValue('https://proofound.io/portfolio/org/acme');
    expect(manualCopyInput).toHaveClass('min-h-[44px]');
    expect(
      screen.queryByText('Organization trust page link could not be copied. Try again.')
    ).not.toBeInTheDocument();
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('shows recoverable inline copy failure without a browser alert', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 500 }));

    render(<CopyTextButton endpoint="/api/public-summary" />);

    fireEvent.click(screen.getByRole('button', { name: /copy proof summary/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Proof summary could not be prepared. Refresh this page or try again.'
    );
    expect(
      screen.queryByText('Proof summary could not be copied. Try again.')
    ).not.toBeInTheDocument();
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('keeps fetched proof-summary text available when clipboard copy fails', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('Jane Doe\nProof Pack: Strategy delivery\nScoped public summary', {
        status: 200,
      })
    );
    clipboardWriteText.mockRejectedValueOnce(new Error('Clipboard unavailable'));

    render(<CopyTextButton endpoint="/api/public-summary" />);

    fireEvent.click(screen.getByRole('button', { name: /copy proof summary/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Proof summary could not be copied. Select the summary below or try again.'
    );
    expect(screen.getByLabelText('Proof summary for manual copy')).toHaveValue(
      'Jane Doe\nProof Pack: Strategy delivery\nScoped public summary'
    );
    expect(
      screen.queryByText('Proof summary could not be copied. Try again.')
    ).not.toBeInTheDocument();
    expect(dispatchClientErrorDiagnostic).toHaveBeenCalledWith(
      'portfolio.public_text_pack.copy_failed',
      expect.any(Error)
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

  it('keeps trust PDF loading feedback specific while the export is prepared', async () => {
    const deferred = createDeferredResponse();
    fetchMock.mockReturnValueOnce(deferred.promise);

    render(<DownloadPdfButton endpoint="/api/public-export" />);

    fireEvent.click(screen.getByRole('button', { name: /download trust pdf/i }));

    expect(screen.getByRole('button', { name: /preparing trust pdf/i })).toBeDisabled();

    deferred.resolve(
      new Response(JSON.stringify({ message: 'Public PDF is still being prepared.' }), {
        status: 409,
        headers: { 'content-type': 'application/json' },
      })
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Public PDF is still being prepared.'
    );
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

  it('keeps individual PDF browser download failures safe, cleaned up, and retryable', async () => {
    let createObjectUrlAttempts = 0;
    const createObjectURLMock = vi.fn(() => {
      createObjectUrlAttempts += 1;
      return `blob:trust-pdf-${createObjectUrlAttempts}`;
    });
    const revokeObjectURLMock = vi.fn();
    let clickAttempts = 0;
    let firstAnchor: HTMLAnchorElement | null = null;
    const anchorClickMock = vi.fn(() => {
      clickAttempts += 1;
      if (clickAttempts === 1) {
        throw new Error('raw browser trust pdf click failure');
      }
    });
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tagName: string) => {
        const element = originalCreateElement(tagName);
        if (tagName.toLowerCase() === 'a') {
          if (!firstAnchor) {
            firstAnchor = element as HTMLAnchorElement;
          }
          element.click = anchorClickMock;
        }
        return element;
      });

    URL.createObjectURL = createObjectURLMock;
    URL.revokeObjectURL = revokeObjectURLMock;
    fetchMock.mockImplementation(() =>
      Promise.resolve(
        new Response(new Blob(['pdf-bytes'], { type: 'application/pdf' }), {
          status: 200,
          headers: { 'content-type': 'application/pdf' },
        })
      )
    );

    try {
      render(<DownloadPdfButton endpoint="/api/public-export" />);

      fireEvent.click(screen.getByRole('button', { name: /download trust pdf/i }));

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(
        'Trust PDF could not be downloaded. Your public portfolio is still live; please try again.'
      );
      expect(alert).not.toHaveTextContent('raw browser trust pdf click failure');
      expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:trust-pdf-1');
      expect(firstAnchor?.isConnected).toBe(false);
      expect(dispatchClientErrorDiagnostic).toHaveBeenCalledWith(
        'portfolio.public_pdf.download_failed',
        expect.any(Error)
      );

      fireEvent.click(screen.getByRole('button', { name: /download trust pdf/i }));

      expect(await screen.findByRole('status')).toHaveTextContent('Trust PDF download started.');
      expect(anchorClickMock).toHaveBeenCalledTimes(2);
      expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:trust-pdf-2');
    } finally {
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
      createElementSpy.mockRestore();
    }
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

  it('keeps organization PDF browser download failures safe, cleaned up, and retryable', async () => {
    let createObjectUrlAttempts = 0;
    const createObjectURLMock = vi.fn(() => {
      createObjectUrlAttempts += 1;
      return `blob:org-pdf-${createObjectUrlAttempts}`;
    });
    const revokeObjectURLMock = vi.fn();
    let clickAttempts = 0;
    let firstAnchor: HTMLAnchorElement | null = null;
    const anchorClickMock = vi.fn(() => {
      clickAttempts += 1;
      if (clickAttempts === 1) {
        throw new Error('raw browser org pdf click failure');
      }
    });
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tagName: string) => {
        const element = originalCreateElement(tagName);
        if (tagName.toLowerCase() === 'a') {
          if (!firstAnchor) {
            firstAnchor = element as HTMLAnchorElement;
          }
          element.click = anchorClickMock;
        }
        return element;
      });

    URL.createObjectURL = createObjectURLMock;
    URL.revokeObjectURL = revokeObjectURLMock;
    fetchMock.mockImplementation(() =>
      Promise.resolve(
        new Response(new Blob(['pdf-bytes'], { type: 'application/pdf' }), {
          status: 200,
          headers: { 'content-type': 'application/pdf' },
        })
      )
    );

    try {
      render(<DownloadOrganizationPdfButton slug="acme" />);

      fireEvent.click(screen.getByRole('button', { name: /download organization pdf/i }));

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(
        'Organization PDF could not be downloaded. The trust page is still live; please try again.'
      );
      expect(alert).not.toHaveTextContent('raw browser org pdf click failure');
      expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:org-pdf-1');
      expect(firstAnchor?.isConnected).toBe(false);
      expect(dispatchClientErrorDiagnostic).toHaveBeenCalledWith(
        'portfolio.organization_pdf.download_failed',
        expect.any(Error)
      );

      fireEvent.click(screen.getByRole('button', { name: /download organization pdf/i }));

      expect(await screen.findByRole('status')).toHaveTextContent(
        'Organization PDF download started.'
      );
      expect(anchorClickMock).toHaveBeenCalledTimes(2);
      expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:org-pdf-2');
    } finally {
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
      createElementSpy.mockRestore();
    }
  });
});
