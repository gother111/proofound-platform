'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Mail, Loader2, AlertCircle, Linkedin } from 'lucide-react';
import { toast } from 'sonner';
import { WorkEmailVerificationForm } from './WorkEmailVerificationForm';
import { LinkedInVerification } from './LinkedInVerification';

interface VerificationStatusData {
  summary: {
    badgeSemanticsVersion: number;
    publicBadges: unknown[];
    orgReviewBadges?: unknown[];
    internalBadges?: unknown[];
    slots: {
      identity: { state: string };
      workplace: { state: string };
      organizationDomain: { state: string };
      organizationPlatformReview: { state: string };
    };
    activeIssues: Array<{
      slot: string;
      state: string;
      issueKey: string;
      label: string;
    }>;
  };
  workflow: {
    state: string;
    displayState: string;
    reasonCode: string | null;
    timestamps: Record<string, string | null | undefined>;
    allowedActions: string[];
  } | null;
  channels: {
    workEmail: {
      email: string | null;
      state:
        | 'unverified'
        | 'pending'
        | 'verified'
        | 'expired'
        | 'superseded'
        | 'downgraded'
        | 'contradicted'
        | 'disputed'
        | 'revoked'
        | 'declined'
        | 'cancelled'
        | 'failed';
      verifiedAt: string | null;
      reverifyDueAt: string | null;
      needsReverify: boolean;
    };
    linkedin: {
      state: 'unverified' | 'pending' | 'verified' | 'failed';
      signalLevel: 'none' | 'workplace' | 'identity';
      verifiedAt: string | null;
      hasIdentitySignal: boolean;
    };
  };
}

interface OAuthFeedbackBanner {
  type: 'success' | 'error';
  message: string;
}

type SignalTone = 'neutral' | 'positive' | 'warning' | 'negative';

function getLinkedInStatusText(status: VerificationStatusData) {
  if (status.channels.linkedin.state === 'pending') {
    return {
      label: 'Check in progress',
      helper:
        'Proofound is checking LinkedIn for official account-side signals. This does not create public trust, org review lift, or intro eligibility by itself.',
      tone: 'warning' as SignalTone,
    };
  }

  if (status.channels.linkedin.signalLevel === 'identity') {
    return {
      label: 'Identity signal detected',
      helper:
        'LinkedIn returned an identity signal. It remains an account-side compatibility signal only.',
      tone: 'positive' as SignalTone,
    };
  }

  if (status.channels.linkedin.signalLevel === 'workplace') {
    return {
      label: 'Workplace signal detected',
      helper:
        'LinkedIn workplace verification was detected. It supports account-side compatibility only.',
      tone: 'positive' as SignalTone,
    };
  }

  if (status.channels.linkedin.state === 'verified') {
    if (status.channels.linkedin.hasIdentitySignal) {
      return {
        label: 'Identity signal detected',
        helper:
          'LinkedIn returned an identity signal. It remains an account-side compatibility signal only.',
        tone: 'positive' as SignalTone,
      };
    }

    return {
      label: 'Signal recorded',
      helper:
        'LinkedIn check completed. Any result stays account-side and does not create public trust lift on its own.',
      tone: 'positive' as SignalTone,
    };
  }

  if (status.channels.linkedin.state === 'failed') {
    return {
      label: 'Check failed',
      helper:
        'LinkedIn check did not complete. Retry if you still want this account-side compatibility signal.',
      tone: 'negative' as SignalTone,
    };
  }

  return {
    label: 'Not added',
    helper:
      'Run a LinkedIn check only if you want an account-side compatibility signal alongside proof-backed trust.',
    tone: 'neutral' as SignalTone,
  };
}

function getWorkEmailStatusText(status: VerificationStatusData) {
  const workEmail = status.channels.workEmail;

  if (workEmail.state === 'pending') {
    return {
      label: 'Check your inbox',
      helper:
        'A work email link is waiting for confirmation. This keeps an account-side compatibility signal current and can help with organization linking.',
      tone: 'warning' as SignalTone,
    };
  }

  if (workEmail.needsReverify || workEmail.state === 'expired') {
    return {
      label: 'Needs recheck',
      helper:
        'Reconfirm this work email to keep the account-side compatibility signal current. It still does not create public trust on its own.',
      tone: 'warning' as SignalTone,
    };
  }

  if (workEmail.state === 'verified') {
    return {
      label: 'Confirmed',
      helper:
        'This account has a workplace-linked compatibility signal. It can help with organization linking, but not with public trust or intro eligibility by itself.',
      tone: 'positive' as SignalTone,
    };
  }

  if (
    workEmail.state === 'failed' ||
    workEmail.state === 'contradicted' ||
    workEmail.state === 'disputed' ||
    workEmail.state === 'revoked'
  ) {
    return {
      label: 'Needs attention',
      helper:
        'This work email signal is not current. Retry only if you still need account-side compatibility or organization-linking support.',
      tone: 'negative' as SignalTone,
    };
  }

  return {
    label: 'Not added',
    helper:
      'Add a work email only if you want account-side compatibility and organization-linking support. It does not create public trust on its own.',
    tone: 'neutral' as SignalTone,
  };
}

function LinkedInStatusPanel({ status }: { status: VerificationStatusData }) {
  const linkedInStatus = getLinkedInStatusText(status);
  const statusToneClass =
    linkedInStatus.tone === 'negative'
      ? 'border-red-200 bg-red-50'
      : linkedInStatus.tone === 'positive'
        ? 'border-emerald-200 bg-emerald-50'
        : linkedInStatus.tone === 'warning'
          ? 'border-amber-200 bg-amber-50'
          : 'border-slate-200 bg-slate-50';

  return (
    <div className={`rounded-xl border p-4 ${statusToneClass}`}>
      <div className="flex items-start gap-3">
        <Linkedin className="mt-0.5 h-5 w-5 text-[#0A66C2]" />
        <div className="space-y-1">
          <p className="text-sm font-medium">LinkedIn compatibility signal</p>
          <p className="text-sm">{linkedInStatus.label}</p>
          <p className="text-xs text-muted-foreground">{linkedInStatus.helper}</p>
          {status.channels.linkedin.verifiedAt && (
            <p className="text-xs text-muted-foreground">
              Updated on {new Date(status.channels.linkedin.verifiedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function WorkEmailStatusPanel({ status }: { status: VerificationStatusData }) {
  const workEmailStatus = getWorkEmailStatusText(status);
  const statusToneClass =
    workEmailStatus.tone === 'negative'
      ? 'border-red-200 bg-red-50'
      : workEmailStatus.tone === 'positive'
        ? 'border-emerald-200 bg-emerald-50'
        : workEmailStatus.tone === 'warning'
          ? 'border-amber-200 bg-amber-50'
          : 'border-slate-200 bg-slate-50';

  return (
    <div className={`rounded-xl border p-4 ${statusToneClass}`}>
      <div className="flex items-start gap-3">
        <Mail className="mt-0.5 h-5 w-5 text-proofound-terracotta" />
        <div className="space-y-1">
          <p className="text-sm font-medium">Work email compatibility signal</p>
          <p className="text-sm">{workEmailStatus.label}</p>
          <p className="text-xs text-muted-foreground">{workEmailStatus.helper}</p>
          {status.channels.workEmail.email && (
            <p className="text-xs text-muted-foreground">{status.channels.workEmail.email}</p>
          )}
          {status.channels.workEmail.verifiedAt && (
            <p className="text-xs text-muted-foreground">
              Confirmed on {new Date(status.channels.workEmail.verifiedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function VerificationGroupCard({
  eyebrow,
  title,
  body,
  children,
}: {
  eyebrow: string;
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <Card variant="bento" className="border-proofound-stone/80">
      <CardContent className="space-y-4 p-6">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {eyebrow}
          </p>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{body}</p>
          </div>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function StatusFeedbackAlert({ feedback }: { feedback: OAuthFeedbackBanner | null }) {
  if (!feedback) {
    return null;
  }

  return (
    <Alert variant={feedback.type === 'error' ? 'destructive' : 'default'}>
      {feedback.type === 'error' ? (
        <AlertCircle className="h-4 w-4" />
      ) : (
        <CheckCircle2 className="h-4 w-4" />
      )}
      <AlertDescription>{feedback.message}</AlertDescription>
    </Alert>
  );
}

function AccountSignalAlerts({ status }: { status: VerificationStatusData }) {
  const workEmailChannel = status.channels.workEmail;
  const linkedinChannel = status.channels.linkedin;

  return (
    <>
      {(workEmailChannel.state === 'pending' || linkedinChannel.state === 'pending') && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            An account-side compatibility check is in progress. It will not create proof trust by
            itself.
          </AlertDescription>
        </Alert>
      )}
      {linkedinChannel.state === 'failed' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            The LinkedIn compatibility check failed. Retry only if you still want that account-side
            signal.
          </AlertDescription>
        </Alert>
      )}
      {workEmailChannel.needsReverify && (
        <Alert className="border-amber-300 bg-amber-50 text-amber-900">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your work email signal expired
            {workEmailChannel.reverifyDueAt
              ? ` on ${new Date(workEmailChannel.reverifyDueAt).toLocaleDateString()}`
              : ''}{' '}
            and now needs a new confirmation.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}

function AccountSignalActions({
  status,
  onWorkEmail,
  onLinkedIn,
}: {
  status: VerificationStatusData;
  onWorkEmail: () => void;
  onLinkedIn: () => void;
}) {
  const workEmailConfirmed = status.channels.workEmail.state === 'verified';
  const linkedInChecked =
    status.channels.linkedin.state === 'verified' ||
    status.channels.linkedin.signalLevel !== 'none';

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card
        variant="bento"
        className="border-2 transition-colors hover:border-proofound-terracotta/30"
      >
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-proofound-terracotta/10">
              <Mail className="h-6 w-6 text-proofound-terracotta" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">Work email</h4>
              <p className="mb-4 mt-1 text-sm text-muted-foreground">
                Keep a workplace-linked account signal current for compatibility and organization
                linking. This is optional and never a public trust badge.
              </p>
              <Button
                onClick={onWorkEmail}
                variant="outline"
                className="border-proofound-terracotta text-proofound-terracotta hover:bg-proofound-terracotta/10"
              >
                {workEmailConfirmed ? 'Recheck work email' : 'Add work email'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card variant="bento" className="border-2 transition-colors hover:border-[#0A66C2]/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#0A66C2]/10">
              <Linkedin className="h-6 w-6 text-[#0A66C2]" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">LinkedIn</h4>
              <p className="mb-4 mt-1 text-sm text-muted-foreground">
                Check LinkedIn only if you want an account-side compatibility signal from official
                LinkedIn data. It never creates public reputation on its own.
              </p>
              <Button
                onClick={onLinkedIn}
                variant="outline"
                className="border-[#0A66C2] text-[#0A66C2] hover:bg-[#0A66C2]/10"
              >
                {linkedInChecked ? 'Run LinkedIn check again' : 'Run LinkedIn check'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function VerificationOverview({
  status,
  onWorkEmail,
  onLinkedIn,
}: {
  status: VerificationStatusData;
  onWorkEmail: () => void;
  onLinkedIn: () => void;
}) {
  const hasTrustAnchor =
    status.summary.publicBadges.length > 0 ||
    (status.summary.orgReviewBadges?.length || 0) > 0 ||
    status.summary.slots.workplace.state === 'verified' ||
    status.summary.slots.organizationPlatformReview.state === 'verified';

  return (
    <div className="space-y-6">
      <VerificationGroupCard
        eyebrow="Proof verifications / attestations"
        title="Attach trust to proof, not to profile hype"
        body="Proof-backed trust belongs on specific Proof Packs and claim snapshots. Use the verification requests area to see which proof, claim, verifier, and outcome each request is tied to."
      >
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => window.location.assign('/app/i/verifications')}
            className="border-proofound-forest text-proofound-forest hover:bg-proofound-forest/5"
          >
            Open proof verification requests
          </Button>
          <p className="max-w-xl text-sm text-muted-foreground">
            Ask for verification only when a specific proof or claim needs independent confirmation.
          </p>
        </div>
      </VerificationGroupCard>

      <VerificationGroupCard
        eyebrow="Intro-readiness trust anchors"
        title="Optional for portfolio-ready, harder for intros"
        body="Skipping verification is fine while getting portfolio-ready. It can still block intro-eligible status and some gated intros until you have at least one non-self trust anchor attached to real proof."
      >
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            {hasTrustAnchor
              ? 'You already have at least one trust anchor on the account. Keep future requests scoped to proof and claim.'
              : 'No non-self trust anchor is active yet. That is okay for portfolio-ready, but it can still hold back intro-readiness.'}
          </AlertDescription>
        </Alert>
      </VerificationGroupCard>

      <VerificationGroupCard
        eyebrow="Account compatibility signals"
        title="Keep account-side checks narrow and honest"
        body="Work email and LinkedIn can help with compatibility and organization linking. They are transport and compatibility signals, not proof trust and not public reputation."
      >
        <div className="space-y-4">
          <AccountSignalAlerts status={status} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <WorkEmailStatusPanel status={status} />
            <LinkedInStatusPanel status={status} />
          </div>
          <AccountSignalActions status={status} onWorkEmail={onWorkEmail} onLinkedIn={onLinkedIn} />
        </div>
      </VerificationGroupCard>
    </div>
  );
}

function getDefaultStatus(): VerificationStatusData {
  return {
    summary: {
      badgeSemanticsVersion: 2,
      publicBadges: [],
      orgReviewBadges: [],
      internalBadges: [],
      slots: {
        identity: { state: 'none' },
        workplace: { state: 'none' },
        organizationDomain: { state: 'none' },
        organizationPlatformReview: { state: 'none' },
      },
      activeIssues: [],
    },
    workflow: null,
    channels: {
      workEmail: {
        email: null,
        state: 'unverified',
        verifiedAt: null,
        reverifyDueAt: null,
        needsReverify: false,
      },
      linkedin: {
        state: 'unverified',
        signalLevel: 'none',
        verifiedAt: null,
        hasIdentitySignal: false,
      },
    },
  };
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
        setStatus(getDefaultStatus());
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
          ← Back to account signals
        </Button>
        <StatusFeedbackAlert feedback={oauthFeedback} />
        <WorkEmailVerificationForm onSuccess={handleVerificationSuccess} />
      </div>
    );
  }

  if (showLinkedInFlow) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setShowLinkedInFlow(false)} className="mb-2">
          ← Back to account signals
        </Button>
        <StatusFeedbackAlert feedback={oauthFeedback} />
        <LinkedInVerification
          onSuccess={handleVerificationSuccess}
          autoStart={autoStartLinkedInCheck}
          onAutoStartHandled={() => setAutoStartLinkedInCheck(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StatusFeedbackAlert feedback={oauthFeedback} />
      <VerificationOverview
        status={status}
        onWorkEmail={() => setShowWorkEmailForm(true)}
        onLinkedIn={() => setShowLinkedInFlow(true)}
      />
      <div className="flex justify-end">
        <Button onClick={fetchStatus} variant="outline">
          <Loader2 className="mr-2 h-4 w-4" />
          Refresh status
        </Button>
      </div>
    </div>
  );
}
