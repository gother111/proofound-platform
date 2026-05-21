'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';

type DownloadPdfButtonProps = {
  endpoint?: string;
};

export function DownloadPdfButton({ endpoint = '/api/portfolio/export' }: DownloadPdfButtonProps) {
  const [loading, setLoading] = useState(false);

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

    return payloadMessage || 'Could not download PDF. Please try again.';
  };

  const handleDownload = async () => {
    try {
      setLoading(true);
      const res = await fetch(endpoint, {
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
      link.download = 'proofound-trust.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      dispatchClientErrorDiagnostic('portfolio.public_pdf.download_failed', err);
      alert(
        err instanceof Error && err.message
          ? err.message
          : 'Could not download PDF. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleDownload}
      disabled={loading}
      className="gap-2"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
      {loading ? 'Preparing...' : 'Download trust PDF'}
    </Button>
  );
}
