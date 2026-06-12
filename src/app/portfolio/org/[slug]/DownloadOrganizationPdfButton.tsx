'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';
import { cn } from '@/lib/utils';

type DownloadFeedback = {
  kind: 'success' | 'error';
  message: string;
};

const ORGANIZATION_PDF_RETRY_MESSAGE =
  'Organization PDF could not be downloaded. The trust page is still live; please try again.';

export function DownloadOrganizationPdfButton({
  slug,
  className,
}: {
  slug: string;
  className?: string;
}) {
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
      return 'Please sign in again to download this organization PDF.';
    }
    if (res.status === 403) {
      return 'Only active organization members can download this PDF.';
    }
    if (res.status === 404) {
      return 'Organization trust page is not ready for PDF export yet.';
    }

    return payloadMessage || ORGANIZATION_PDF_RETRY_MESSAGE;
  };

  const handleDownload = async () => {
    try {
      setLoading(true);
      setFeedback(null);
      const res = await fetch(`/api/portfolio/org/${encodeURIComponent(slug)}/export`, {
        method: 'GET',
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error(await getErrorMessage(res));
      }

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/pdf')) {
        throw new Error('Received an unexpected response while generating your PDF.');
      }

      const blob = await res.blob();
      if (blob.size === 0) {
        throw new Error('Generated PDF was empty. Please try again.');
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `proofound-org-${slug}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setFeedback({ kind: 'success', message: 'Organization PDF download started.' });
    } catch (err) {
      dispatchClientErrorDiagnostic('portfolio.organization_pdf.download_failed', err);
      setFeedback({
        kind: 'error',
        message: err instanceof Error && err.message ? err.message : ORGANIZATION_PDF_RETRY_MESSAGE,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col items-stretch gap-1.5 sm:w-auto sm:items-start">
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownload}
        disabled={loading}
        className={cn(
          'inline-flex w-full items-center justify-center gap-1.5 sm:w-auto',
          className
        )}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
        {loading ? 'Preparing...' : 'Download organization PDF'}
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
