'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';
import { cn } from '@/lib/utils';

type DownloadPdfButtonProps = {
  endpoint?: string;
  className?: string;
};

type DownloadFeedback = {
  kind: 'success' | 'error';
  message: string;
};

const TRUST_PDF_RETRY_MESSAGE =
  'Trust PDF could not be downloaded. Your public portfolio is still live; please try again.';

class TrustPdfDownloadError extends Error {}

export function DownloadPdfButton({
  endpoint = '/api/portfolio/export',
  className,
}: DownloadPdfButtonProps) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<DownloadFeedback | null>(null);

  const getErrorMessage = async (res: Response): Promise<string> => {
    const contentType = res.headers.get('content-type') || '';
    let payloadMessage = '';

    if (contentType.includes('application/json')) {
      const payload = await res.json().catch(() => null);
      if (payload && typeof payload === 'object') {
        if (typeof (payload as { message?: unknown }).message === 'string') {
          payloadMessage = (payload as { message: string }).message;
        } else if (typeof (payload as { error?: unknown }).error === 'string') {
          payloadMessage = (payload as { error: string }).error;
        }
      }
    }

    if (res.status === 401) {
      return 'Please sign in again to download your trust PDF.';
    }
    if (res.status === 404) {
      return 'Your profile is not ready for PDF export yet. Refresh and try again.';
    }

    return payloadMessage || TRUST_PDF_RETRY_MESSAGE;
  };

  const handleDownload = async () => {
    let downloadUrl: string | null = null;
    let downloadLink: HTMLAnchorElement | null = null;

    try {
      setLoading(true);
      setFeedback(null);
      const res = await fetch(endpoint, {
        method: 'GET',
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new TrustPdfDownloadError(await getErrorMessage(res));
      }

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/pdf')) {
        throw new TrustPdfDownloadError(
          'Received an unexpected response while generating your PDF.'
        );
      }

      const blob = await res.blob();
      if (blob.size === 0) {
        throw new TrustPdfDownloadError('Generated PDF was empty. Please try again.');
      }

      downloadUrl = window.URL.createObjectURL(blob);
      downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = 'proofound-trust.pdf';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      setFeedback({ kind: 'success', message: 'Trust PDF download started.' });
    } catch (err) {
      dispatchClientErrorDiagnostic('portfolio.public_pdf.download_failed', err);
      setFeedback({
        kind: 'error',
        message: err instanceof TrustPdfDownloadError ? err.message : TRUST_PDF_RETRY_MESSAGE,
      });
    } finally {
      if (downloadUrl) {
        window.URL.revokeObjectURL(downloadUrl);
      }
      if (downloadLink?.parentNode) {
        downloadLink.parentNode.removeChild(downloadLink);
      }
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col items-stretch gap-1.5 sm:w-auto sm:items-start">
      <Button
        variant="secondary"
        size="sm"
        onClick={handleDownload}
        disabled={loading}
        className={cn('w-full justify-center gap-2 sm:w-auto', className)}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
        {loading ? 'Preparing...' : 'Download trust PDF'}
      </Button>
      {feedback ? (
        <p
          className={
            feedback.kind === 'error'
              ? 'max-w-64 text-xs leading-5 text-[#8A3F21]'
              : 'max-w-64 text-xs leading-5 text-proofound-forest'
          }
          role={feedback.kind === 'error' ? 'alert' : 'status'}
          aria-live={feedback.kind === 'error' ? 'assertive' : 'polite'}
        >
          {feedback.message}
        </p>
      ) : null}
    </div>
  );
}
