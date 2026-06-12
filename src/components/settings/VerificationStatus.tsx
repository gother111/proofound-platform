'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Linkedin, Loader2, Mail, RefreshCw } from 'lucide-react';
import { WorkEmailVerificationForm } from './WorkEmailVerificationForm';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';
import { internalValueLabel } from '@/lib/copy/labels';

interface VerificationStatusData {
  summary: {
    badgeSemanticsVersion: number;
    publicBadges: unknown[];
    orgReviewBadges?: unknown[];
    internalBadges?: unknown[];
    scopedSignals: Array<{
      verificationRecordId: string;
      subjectType: string;
      subjectId: string;
      claimTemplate: string;
      claimLabel: string;
      trustType: string;
      trustLabel: string;
      supportLabel: string;
      freshnessState: string;
      freshnessLabel: string | null;
      verifiedAt: string | null;
      updatedAt: string | null;
      contradictedAt: string | null;
      revokedAt: string | null;
      correctedAt: string | null;
      verificationKind: string | null;
    }>;
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

type SignalTone = 'neutral' | 'positive' | 'warning' | 'negative';

const VERIFICATION_STATUS_LOAD_FAILED_MESSAGE =
  'Verification status could not load. Your account signals were not changed; retry when you are ready.';

const VERIFICATION_STATUS_TIMEOUT_MESSAGE =
  'Verification status took too long to load. Your account signals were not changed; retry when your connection settles.';

function getLinkedInStatusText(status: VerificationStatusData) {
  if (status.channels.linkedin.state === 'pending') {
    return {
      label: 'Check in progress',
      helper:
        'Proofound is checking LinkedIn for account history only. This does not create public trust, org review lift, or intro eligibility by itself.',
      tone: 'warning' as SignalTone,
    };
  }

  if (status.channels.linkedin.signalLevel === 'identity') {
    return {
      label: 'Identity signal detected',
      helper: 'LinkedIn returned an identity signal. It stays account-side only.',
      tone: 'positive' as SignalTone,
    };
  }

  if (status.channels.linkedin.signalLevel === 'workplace') {
    return {
      label: 'Workplace signal detected',
      helper: 'LinkedIn workplace verification was detected. It stays account-side only.',
      tone: 'positive' as SignalTone,
    };
  }

  if (status.channels.linkedin.state === 'verified') {
    if (status.channels.linkedin.hasIdentitySignal) {
      return {
        label: 'Identity signal detected',
        helper: 'LinkedIn returned an identity signal. It stays account-side only.',
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
        'An older LinkedIn check did not complete before LinkedIn checks were removed from the launch corridor.',
      tone: 'negative' as SignalTone,
    };
  }

  return {
    label: 'Archived for launch',
    helper:
      'LinkedIn checks are outside the launch corridor. Any earlier LinkedIn signal remains read-only and never creates proof trust.',
    tone: 'neutral' as SignalTone,
  };
}

function getWorkEmailStatusText(status: VerificationStatusData) {
  const workEmail = status.channels.workEmail;

  if (workEmail.state === 'pending') {
    return {
      label: 'Check your inbox',
      helper:
        'A work email link is waiting for confirmation. This keeps an account-side organization link current.',
      tone: 'warning' as SignalTone,
    };
  }

  if (workEmail.needsReverify || workEmail.state === 'expired') {
    return {
      label: 'Needs recheck',
      helper:
        'Reconfirm this work email to keep the account-side organization link current. It still does not create public trust on its own.',
      tone: 'warning' as SignalTone,
    };
  }

  if (workEmail.state === 'verified') {
    return {
      label: 'Confirmed',
      helper:
        'This account has a confirmed workplace email. It can help with organization linking, but not with public trust or intro eligibility by itself.',
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
        'This work email is not current. Retry only if you still need organization-linking support.',
      tone: 'negative' as SignalTone,
    };
  }

  return {
    label: 'Not added',
    helper:
      'Add a work email only if you want organization-linking support. It does not create public trust on its own.',
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
          <p className="text-sm font-medium">LinkedIn account check</p>
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
          <p className="text-sm font-medium">Work email account check</p>
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

function AccountSignalAlerts({ status }: { status: VerificationStatusData }) {
  const workEmailChannel = status.channels.workEmail;
  const linkedinChannel = status.channels.linkedin;

  return (
    <>
      {(workEmailChannel.state === 'pending' || linkedinChannel.state === 'pending') && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            An account-side check is in progress. It will not create proof trust by itself.
          </AlertDescription>
        </Alert>
      )}
      {linkedinChannel.state === 'failed' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            An older LinkedIn account-history check failed before LinkedIn checks were removed from
            the launch corridor.
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
}: {
  status: VerificationStatusData;
  onWorkEmail: () => void;
}) {
  const workEmailConfirmed = status.channels.workEmail.state === 'verified';

  return (
    <div className="grid grid-cols-1 gap-4">
      <Card
        variant="bento"
        className="border-2 transition-colors hover:border-proofound-terracotta/30"
      >
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-proofound-terracotta/10">
              <Mail className="h-6 w-6 text-proofound-terracotta" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold">Work email</h4>
              <p className="mb-4 mt-1 text-sm text-muted-foreground">
                Keep a workplace-linked account check current for organization linking. This is
                optional and never a public trust badge.
              </p>
              <Button
                onClick={onWorkEmail}
                variant="outline"
                className="w-full border-proofound-terracotta text-proofound-terracotta hover:bg-proofound-terracotta/10 sm:w-auto"
              >
                {workEmailConfirmed ? 'Recheck work email' : 'Add work email'}
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
}: {
  status: VerificationStatusData;
  onWorkEmail: () => void;
}) {
  const scopedSignals = status.summary.scopedSignals || [];
  const hasTrustAnchor = scopedSignals.some(
    (signal) => signal.trustType !== 'self_claimed' && signal.freshnessState === 'active'
  );

  return (
    <div className="space-y-6">
      <VerificationGroupCard
        eyebrow="Proof verifications / attestations"
        title="Attach trust to proof, not to profile hype"
        body="Proof-backed trust belongs on specific Proof Packs and claim snapshots. Use the verification requests area to see which proof, claim, verifier, and outcome each request is tied to."
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap">
            <Button
              variant="outline"
              onClick={() => window.location.assign('/app/i/verifications')}
              className="w-full border-proofound-forest text-proofound-forest hover:bg-proofound-forest/5 sm:w-auto"
            >
              Open proof verification requests
            </Button>
            <p className="max-w-xl text-sm text-muted-foreground">
              Ask for verification only when a specific proof or claim needs independent
              confirmation.
            </p>
          </div>
          {scopedSignals.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No scoped proof verifications are active yet. That is okay while staying
              portfolio-ready.
            </p>
          ) : (
            <div className="space-y-3">
              {scopedSignals.map((signal) => (
                <div
                  key={signal.verificationRecordId}
                  className="rounded-xl border border-proofound-stone/80 bg-muted/20 p-4"
                >
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{signal.claimLabel}</Badge>
                    <Badge variant="outline" className="capitalize">
                      {signal.trustLabel}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {signal.freshnessLabel || signal.freshnessState}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Scope: {internalValueLabel(signal.subjectType)}
                    {' • '}
                    Basis: {signal.supportLabel}
                  </p>
                  {(signal.updatedAt || signal.verifiedAt) && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Updated on{' '}
                      {new Date(signal.updatedAt || signal.verifiedAt || '').toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </VerificationGroupCard>

      <VerificationGroupCard
        eyebrow="Intro-readiness verification"
        title="Optional for portfolio-ready, harder for intros"
        body="Skipping verification is fine while getting portfolio-ready. It can still block intro-eligible status and some gated intros until you have at least one non-self verification attached to real proof."
      >
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            {hasTrustAnchor
              ? 'You already have at least one non-self verification on the account. Keep future requests scoped to proof and claim.'
              : 'No non-self verification is active yet. That is okay for portfolio-ready, but it can still hold back intro-readiness.'}
          </AlertDescription>
        </Alert>
      </VerificationGroupCard>

      <VerificationGroupCard
        eyebrow="Account-side checks"
        title="Keep account-side checks narrow and honest"
        body="Work email is the only launch-active account-side check here. Any LinkedIn state is read-only history and never counts as proof trust or public reputation."
      >
        <div className="space-y-4">
          <AccountSignalAlerts status={status} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <WorkEmailStatusPanel status={status} />
            <LinkedInStatusPanel status={status} />
          </div>
          <AccountSignalActions status={status} onWorkEmail={onWorkEmail} />
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
      scopedSignals: [],
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

  const fetchStatus = useCallback(async () => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    try {
      setLoading(true);
      setError(null);

      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('/api/verification/status', {
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as {
          error?: unknown;
          details?: unknown;
        };
        const errorMessage =
          typeof errorData.error === 'string' && errorData.error.trim().length > 0
            ? errorData.error
            : `Verification status request failed with status ${response.status}`;
        const errorDetails =
          typeof errorData.details === 'string' && errorData.details.trim().length > 0
            ? `: ${errorData.details}`
            : '';
        throw new Error(`${errorMessage}${errorDetails}`);
      }

      const data = await response.json();
      setStatus(data);
    } catch (err) {
      dispatchClientErrorDiagnostic('settings.verification_status.load_failed', err);

      if (err instanceof Error && err.name === 'AbortError') {
        setError(VERIFICATION_STATUS_TIMEOUT_MESSAGE);
        setStatus(getDefaultStatus());
      } else {
        setError(VERIFICATION_STATUS_LOAD_FAILED_MESSAGE);
      }
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleVerificationSuccess = () => {
    setShowWorkEmailForm(false);
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
            <span className="mt-2 block text-xs text-muted-foreground">
              No verification, public trust, or intro-readiness state changed.
            </span>
          </AlertDescription>
        </Alert>
        <Button onClick={fetchStatus} variant="outline" className="w-full">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry verification status
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
        <WorkEmailVerificationForm onSuccess={handleVerificationSuccess} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <VerificationOverview status={status} onWorkEmail={() => setShowWorkEmailForm(true)} />
      <div className="flex justify-end">
        <Button onClick={fetchStatus} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh status
        </Button>
      </div>
    </div>
  );
}
