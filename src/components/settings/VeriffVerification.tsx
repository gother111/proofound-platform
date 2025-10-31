'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldCheck, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface VeriffVerificationProps {
  onSuccess: () => void;
}

declare global {
  interface Window {
    Veriff?: any;
  }
}

export function VeriffVerification({ onSuccess }: VeriffVerificationProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [veriffLoaded, setVeriffLoaded] = useState(false);
  const [sessionUrl, setSessionUrl] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // Check if SDK is already loaded
    if (window.Veriff) {
      setVeriffLoaded(true);
      return;
    }

    // Load Veriff SDK
    const script = document.createElement('script');
    script.src = 'https://cdn.veriff.me/sdk/js/1.3/veriff.min.js';
    script.async = true;
    script.onload = () => {
      // Verify SDK is actually available
      if (window.Veriff) {
        setVeriffLoaded(true);
      } else {
        setError('Veriff SDK loaded but not available. Please refresh the page.');
      }
    };
    script.onerror = () => {
      setError('Failed to load Veriff SDK. Please check your internet connection and try again.');
    };
    document.body.appendChild(script);

    return () => {
      // Only remove if we added it
      if (script.parentNode) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const createVeriffSession = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/verification/veriff/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || 'Failed to create verification session';
        const errorDetails = data.details ? ` ${data.details}` : '';
        throw new Error(`${errorMessage}${errorDetails}`);
      }

      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create verification session');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const startVerification = async () => {
    const sessionData = await createVeriffSession();
    
    if (!sessionData || !sessionData.sessionUrl) {
      return;
    }

    setSessionUrl(sessionData.sessionUrl);

    if (!window.Veriff) {
      setError('Veriff SDK not loaded. Please refresh and try again.');
      return;
    }

    try {
      // Initialize Veriff
      const veriff = window.Veriff({
        host: sessionData.sessionUrl,
        apiKey: sessionData.apiKey,
        parentId: 'veriff-root',
        onSession: function (err: any, response: any) {
          if (err) {
            setError('Failed to start verification session');
            return;
          }
          
          // Session started successfully
          console.log('Veriff session started:', response);
        },
      });

      // Mount and start
      veriff.mount({
        formLabel: {
          vendorData: sessionData.vendorData,
        },
      });

      veriff.on('finished', () => {
        // Verification flow completed
        console.log('Veriff flow finished');
        pollForVerificationResult();
      });

      veriff.on('canceled', () => {
        setError('Verification was canceled. Please try again when ready.');
      });

    } catch (err) {
      console.error('Veriff error:', err);
      setError('Failed to start verification. Please try again.');
    }
  };

  const pollForVerificationResult = async () => {
    setChecking(true);
    
    // Poll every 3 seconds for up to 2 minutes
    const maxAttempts = 40;
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch('/api/verification/status');
        const data = await response.json();

        if (data.verificationStatus === 'verified') {
          setChecking(false);
          onSuccess();
          return;
        }

        if (data.verificationStatus === 'failed') {
          setChecking(false);
          setError('Verification failed. Please try again or contact support.');
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 3000);
        } else {
          setChecking(false);
          setError('Verification is taking longer than expected. Please refresh the page in a few minutes.');
        }
      } catch (err) {
        console.error('Error polling verification status:', err);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 3000);
        } else {
          setChecking(false);
        }
      }
    };

    poll();
  };

  if (checking) {
    return (
      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        <AlertDescription className="text-blue-900 dark:text-blue-100">
          <strong>Processing verification...</strong>
          <br />
          Please wait while we verify your identity. This usually takes less than a minute.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm text-blue-900 dark:text-blue-100">
            <p className="font-medium mb-2">What you&apos;ll need:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>A valid government-issued ID (passport, driver&apos;s license, or national ID)</li>
              <li>A device with a camera (phone or computer)</li>
              <li>Good lighting for clear photos</li>
              <li>About 5 minutes</li>
            </ul>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div id="veriff-root" />

        {!sessionUrl && (
          <Button
            onClick={startVerification}
            disabled={loading || !veriffLoaded}
            className="w-full bg-proofound-forest hover:bg-proofound-forest/90"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Starting verification...
              </>
            ) : !veriffLoaded ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 mr-2" />
                Start ID Verification
              </>
            )}
          </Button>
        )}
      </div>

      <div className="pt-4 border-t">
        <p className="text-xs text-muted-foreground">
          <strong>Your privacy matters:</strong>
          <br />
          Verification is powered by Veriff, a trusted identity verification provider. Your ID photos are encrypted and used only for verification. We don&apos;t store your ID images.
        </p>
      </div>
    </div>
  );
}

