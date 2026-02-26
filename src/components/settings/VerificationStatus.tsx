'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Mail, Loader2, AlertCircle, XCircle, Linkedin } from 'lucide-react';
import { toast } from 'sonner';
import { WorkEmailVerificationForm } from './WorkEmailVerificationForm';
import { LinkedInVerification } from './LinkedInVerification';

interface VerificationStatusData {
  verified: boolean;
  verificationMethod: 'veriff' | 'work_email' | 'linkedin' | null;
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'failed';
  verifiedAt: string | null;
  linkedinVerificationStatus: 'unverified' | 'pending' | 'verified' | 'failed';
  linkedinHasIdentityVerification: boolean;
  linkedinVerifiedAt: string | null;
  workEmail: string | null;
  workEmailVerified: boolean;
  workEmailReverifyDueAt: string | null;
  workEmailNeedsReverify: boolean;
}

interface OAuthFeedbackBanner {
  type: 'success' | 'error';
  message: string;
}

function getLinkedInStatusText(status: VerificationStatusData) {
  if (status.linkedinVerificationStatus === 'pending') {
    return {
      label: 'Pending',
      helper: 'LinkedIn verification is under review.',
      tone: 'neutral' as const,
    };
  }

  if (status.linkedinVerificationStatus === 'verified') {
    if (status.linkedinHasIdentityVerification) {
      return {
        label: 'Verified (Identity badge)',
        helper: 'Official LinkedIn identity verification detected.',
        tone: 'positive' as const,
      };
    }

    return {
      label: 'Verified (no identity badge)',
      helper: 'LinkedIn verification is complete, but identity is not granted by default.',
      tone: 'neutral' as const,
    };
  }

  if (status.linkedinVerificationStatus === 'failed') {
    return {
      label: 'Failed',
      helper: 'LinkedIn verification failed. You can retry.',
      tone: 'negative' as const,
    };
  }

  return {
    label: 'Not checked',
    helper: 'Run LinkedIn verification to add an additional trust signal.',
    tone: 'neutral' as const,
  };
}

function LinkedInStatusPanel({ status }: { status: VerificationStatusData }) {
  const linkedInStatus = getLinkedInStatusText(status);
  const statusToneClass =
    linkedInStatus.tone === 'positive'
      ? 'border-green-200 bg-green-50'
      : linkedInStatus.tone === 'negative'
        ? 'border-red-200 bg-red-50'
        : 'border-slate-200 bg-slate-50';

  return (
    <div className={`rounded-xl border p-4 ${statusToneClass}`}>
      <div className="flex items-start gap-3">
        <Linkedin className="w-5 h-5 text-[#0A66C2] mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-medium">LinkedIn Trust Signal</p>
          <p className="text-sm">{linkedInStatus.label}</p>
          <p className="text-xs text-muted-foreground">{linkedInStatus.helper}</p>
          {status.linkedinVerifiedAt && (
            <p className="text-xs text-muted-foreground">
              Updated on {new Date(status.linkedinVerifiedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function VerificationStatus() {
  const [status, setStatus] = useState<VerificationStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWorkEmailForm, setShowWorkEmailForm] = useState(false);
  const [showLinkedInFlow, setShowLinkedInFlow] = useState(false);
  const [oauthFeedback, setOauthFeedback] = useState<OAuthFeedbackBanner | null>(null);
  const [autoStartLinkedInCheck, setAutoStartLinkedInCheck] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    const verification = searchParams?.get('verification');
    const verificationError = searchParams?.get('verification_error');
    const message = searchParams?.get('message');

    if (verification !== 'linkedin_connected' && verificationError !== 'linkedin_auth_failed') {
      return;
    }

    if (verification === 'linkedin_connected') {
      setShowLinkedInFlow(true);
      setAutoStartLinkedInCheck(true);
      setOauthFeedback({
        type: 'success',
        message: 'LinkedIn connected successfully. Running verification check now.',
      });
      toast.success('LinkedIn connected successfully.');
    } else if (verificationError === 'linkedin_auth_failed') {
      const errorMessage = message || 'LinkedIn connection failed. Please try again.';
      setOauthFeedback({
        type: 'error',
        message: errorMessage,
      });
      toast.error(errorMessage);
    }

    fetchStatus();

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.delete('verification');
      urlParams.delete('verification_error');
      urlParams.delete('message');

      const query = urlParams.toString();
      const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
      window.history.replaceState({}, '', nextUrl);
    }
  }, [searchParams]);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('/api/verification/status', {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error || `Failed to fetch verification status (${response.status})`;
        const errorDetails = errorData.details ? `: ${errorData.details}` : '';
        throw new Error(`${errorMessage}${errorDetails}`);
      }

      const data = await response.json();
      setStatus(data);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        const timeoutMessage = 'Request timed out. Please check your connection and try again.';
        setError(timeoutMessage);
        setStatus({
          verified: false,
          verificationMethod: null,
          verificationStatus: 'unverified',
          verifiedAt: null,
          linkedinVerificationStatus: 'unverified',
          linkedinHasIdentityVerification: false,
          linkedinVerifiedAt: null,
          workEmail: null,
          workEmailVerified: false,
          workEmailReverifyDueAt: null,
          workEmailNeedsReverify: false,
        });
      } else {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load verification status';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSuccess = () => {
    setShowWorkEmailForm(false);
    setShowLinkedInFlow(false);
    setAutoStartLinkedInCheck(false);
    fetchStatus();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-proofound-forest" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <br />
            <span className="text-xs mt-2 block">
              Check your browser console (F12) for more details.
            </span>
          </AlertDescription>
        </Alert>
        <Button onClick={fetchStatus} variant="outline" className="w-full">
          <Loader2 className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  if (showWorkEmailForm) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setShowWorkEmailForm(false)} className="mb-2">
          ← Back to options
        </Button>
        <WorkEmailVerificationForm onSuccess={handleVerificationSuccess} />
      </div>
    );
  }

  if (showLinkedInFlow) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setShowLinkedInFlow(false)} className="mb-2">
          ← Back to options
        </Button>
        {oauthFeedback && (
          <Alert variant={oauthFeedback.type === 'error' ? 'destructive' : 'default'}>
            {oauthFeedback.type === 'error' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <AlertDescription>{oauthFeedback.message}</AlertDescription>
          </Alert>
        )}
        <LinkedInVerification
          onSuccess={handleVerificationSuccess}
          autoStart={autoStartLinkedInCheck}
          onAutoStartHandled={() => setAutoStartLinkedInCheck(false)}
        />
      </div>
    );
  }

  const canAddLinkedInVerification =
    status.linkedinVerificationStatus !== 'verified' &&
    status.linkedinVerificationStatus !== 'pending';

  // Show verification options based on identity status
  if (status.verificationStatus === 'verified' && status.verified) {
    return (
      <div className="space-y-4">
        {oauthFeedback && (
          <Alert variant={oauthFeedback.type === 'error' ? 'destructive' : 'default'}>
            {oauthFeedback.type === 'error' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <AlertDescription>{oauthFeedback.message}</AlertDescription>
          </Alert>
        )}
        <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl">
          <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-green-900 dark:text-green-100">Identity Verified</p>
            <p className="text-sm text-green-700 dark:text-green-300">
              Verified via{' '}
              {status.verificationMethod === 'veriff'
                ? 'Government ID'
                : status.verificationMethod === 'work_email'
                  ? 'Work Email'
                  : 'LinkedIn'}
              {status.verifiedAt && ` on ${new Date(status.verifiedAt).toLocaleDateString()}`}
            </p>
            {status.workEmail && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Work email: {status.workEmail}
              </p>
            )}
          </div>
        </div>

        <LinkedInStatusPanel status={status} />

        <p className="text-sm text-muted-foreground">
          Your verified badge is now visible on your profile to organizations.
        </p>
        {status.workEmailNeedsReverify && (
          <Alert className="border-amber-300 bg-amber-50 text-amber-900">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your work email verification has expired. Re-verify to keep your work-email trust
              signal active.
            </AlertDescription>
          </Alert>
        )}
        {canAddLinkedInVerification && (
          <Button
            variant="outline"
            onClick={() => setShowLinkedInFlow(true)}
            className="border-[#0A66C2] text-[#0A66C2] hover:bg-[#0A66C2]/10"
          >
            <Linkedin className="w-4 h-4 mr-2" />
            Add LinkedIn Verification
          </Button>
        )}
      </div>
    );
  }

  if (status.verificationStatus === 'pending') {
    return (
      <div className="space-y-4">
        {oauthFeedback && (
          <Alert variant={oauthFeedback.type === 'error' ? 'destructive' : 'default'}>
            {oauthFeedback.type === 'error' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <AlertDescription>{oauthFeedback.message}</AlertDescription>
          </Alert>
        )}
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Identity verification is in progress. This may take a few moments.
          </AlertDescription>
        </Alert>
        <LinkedInStatusPanel status={status} />
        <Button variant="outline" onClick={fetchStatus} className="w-full">
          Refresh Status
        </Button>
      </div>
    );
  }

  if (status.verificationStatus === 'failed') {
    return (
      <div className="space-y-4">
        {oauthFeedback && (
          <Alert variant={oauthFeedback.type === 'error' ? 'destructive' : 'default'}>
            {oauthFeedback.type === 'error' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <AlertDescription>{oauthFeedback.message}</AlertDescription>
          </Alert>
        )}
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Identity verification failed. Please try again or contact support if the issue persists.
          </AlertDescription>
        </Alert>
        <LinkedInStatusPanel status={status} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => setShowWorkEmailForm(true)}
            className="flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Retry with Email
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowLinkedInFlow(true)}
            className="flex items-center gap-2"
          >
            <Linkedin className="w-4 h-4" />
            Retry with LinkedIn
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {oauthFeedback && (
        <Alert variant={oauthFeedback.type === 'error' ? 'destructive' : 'default'}>
          {oauthFeedback.type === 'error' ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          <AlertDescription>{oauthFeedback.message}</AlertDescription>
        </Alert>
      )}
      {status.workEmailNeedsReverify && (
        <Alert className="border-amber-300 bg-amber-50 text-amber-900">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your work email verification expired
            {status.workEmailReverifyDueAt
              ? ` on ${new Date(status.workEmailReverifyDueAt).toLocaleDateString()}`
              : ''}{' '}
            and now requires re-verification.
          </AlertDescription>
        </Alert>
      )}
      <LinkedInStatusPanel status={status} />
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Verify your identity to unlock the verified badge on your profile. Choose one of the
          following methods:
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Card className="border-2 hover:border-proofound-terracotta/30 transition-colors cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-proofound-terracotta/10 flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-proofound-terracotta" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Work Email Verification</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Verify using your company email address. This will also link your profile to your
                  organization.
                </p>
                <Button
                  onClick={() => setShowWorkEmailForm(true)}
                  variant="outline"
                  className="border-proofound-terracotta text-proofound-terracotta hover:bg-proofound-terracotta/10"
                >
                  Verify with Work Email
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-[#0A66C2]/30 transition-colors cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[#0A66C2]/10 flex items-center justify-center flex-shrink-0">
                <Linkedin className="w-6 h-6 text-[#0A66C2]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">LinkedIn Verification</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Check LinkedIn verification signals and complete admin review. LinkedIn identity
                  badge can grant identity verification.
                </p>
                <Button
                  onClick={() => setShowLinkedInFlow(true)}
                  variant="outline"
                  className="border-[#0A66C2] text-[#0A66C2] hover:bg-[#0A66C2]/10"
                >
                  Verify with LinkedIn
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>
          <strong>Why verify?</strong> Verified profiles get a badge that helps organizations trust
          your identity and improves match quality.
        </AlertDescription>
      </Alert>
    </div>
  );
}
