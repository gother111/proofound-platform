'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  MinusCircle,
  Shield,
  XCircle,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api/fetch';
import {
  HumanObservedAttestationFields,
  buildHumanObservedAttestationPayload,
  createDefaultHumanObservedAttestationForm,
  type HumanObservedAttestationFormValue,
} from '@/components/verification/HumanObservedAttestationFields';
import {
  relationshipDisplayLabel,
  type CustomVerificationRelationship,
} from '@/lib/verification/custom-verification-labels';
import {
  buildVisualCustomVerificationResponse,
  VISUAL_VERIFY_TOKENS,
} from '@/lib/verification/visual-link-fixtures';

type VerifyItem = {
  id: string;
  artifact_type: 'skill' | 'experience' | 'education' | 'impact_story' | 'project' | 'volunteering';
  artifact_id: string;
  display_label: string;
  claim_template: string;
  claim_label: string;
  support_label: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
};

type VerificationData = {
  id: string;
  requester_name: string;
  requester_avatar?: string | null;
  relationship: CustomVerificationRelationship;
  request_kind?: 'generic_verification' | 'human_observed_attestation';
  attestation_request?: {
    skillIds: string[];
    skillLabels: string[];
  } | null;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at: string;
  expires_at: string;
  responded_at?: string | null;
  response_message?: string | null;
  items: VerifyItem[];
};

function resolveHumanObservedSubmitPayload(args: {
  action: 'accept' | 'decline';
  requestKind?: 'generic_verification' | 'human_observed_attestation';
  attestationRequest?: {
    skillIds: string[];
  } | null;
  form: HumanObservedAttestationFormValue;
  verdict?: 'yes' | 'partly' | 'no';
}) {
  if (args.requestKind !== 'human_observed_attestation') {
    return undefined;
  }

  return buildHumanObservedAttestationPayload({
    form: {
      ...args.form,
      verdict: args.verdict ?? (args.action === 'decline' ? 'no' : args.form.verdict),
    },
    skillIds: args.attestationRequest?.skillIds || [],
  });
}

function artifactTypeLabel(type: VerifyItem['artifact_type']): string {
  switch (type) {
    case 'impact_story':
      return 'Impact story';
    case 'project':
      return 'Project';
    case 'experience':
      return 'Experience';
    case 'education':
      return 'Education';
    case 'volunteering':
      return 'Volunteering';
    case 'skill':
    default:
      return 'Skill';
  }
}

function clientVisualVerificationEnabled() {
  return process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE === 'true';
}

function verificationLoadError(status: number, error?: string | null) {
  if (status === 410 || /expired/i.test(error ?? '')) {
    return 'This verification request has expired. Ask the requester to send a new link if needed.';
  }

  if (status === 404 || status === 400 || /not found|invalid|unavailable/i.test(error ?? '')) {
    return 'This verification link is invalid, expired, or no longer available.';
  }

  return 'We could not open this verification request right now.';
}

export default function VerifyCustomRequestPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<VerificationData | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submittedAction, setSubmittedAction] = useState<'accepted' | 'declined' | 'partly' | null>(
    null
  );
  const [attestationForm, setAttestationForm] = useState<HumanObservedAttestationFormValue>(
    createDefaultHumanObservedAttestationForm()
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        if (clientVisualVerificationEnabled()) {
          const visualResponse = buildVisualCustomVerificationResponse(token);
          if (visualResponse) {
            const nextData = visualResponse.request as VerificationData;
            setData(nextData);
            if (nextData.request_kind === 'human_observed_attestation') {
              setAttestationForm(
                createDefaultHumanObservedAttestationForm(
                  relationshipDisplayLabel(nextData.relationship)
                )
              );
            }
            return;
          }
        }

        const response = await fetch(`/api/verify/custom/${token}`);

        if (!response.ok) {
          const errorData = await response.json();
          setError(verificationLoadError(response.status, errorData.error));
          return;
        }

        const result = await response.json();
        const nextData = result.request as VerificationData;
        setData(nextData);
        if (nextData.request_kind === 'human_observed_attestation') {
          setAttestationForm(
            createDefaultHumanObservedAttestationForm(
              relationshipDisplayLabel(nextData.relationship)
            )
          );
        }
      } catch (_loadError) {
        setError('This verification link is invalid, expired, or no longer available.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadData();
    }
  }, [token]);

  const handleSubmit = async (
    action: 'accept' | 'decline',
    humanObservedVerdict?: 'yes' | 'partly' | 'no'
  ) => {
    if (!data) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (clientVisualVerificationEnabled() && token === VISUAL_VERIFY_TOKENS.customBundle) {
        setSubmitted(true);
        setSubmittedAction(
          humanObservedVerdict === 'partly'
            ? 'partly'
            : action === 'accept'
              ? 'accepted'
              : 'declined'
        );
        return;
      }

      const response = await apiFetch(`/api/verify/custom/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          message: responseMessage.trim() || undefined,
          attestation: resolveHumanObservedSubmitPayload({
            action,
            requestKind: data.request_kind,
            attestationRequest: data.attestation_request,
            form: attestationForm,
            verdict: humanObservedVerdict,
          }),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to submit response');
        return;
      }

      setSubmitted(true);
      setSubmittedAction(
        humanObservedVerdict === 'partly' ? 'partly' : action === 'accept' ? 'accepted' : 'declined'
      );
    } catch (_submitError) {
      setError('Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-proofound-parchment p-4 py-10">
        <Card className="w-full max-w-xl rounded-[24px] border-proofound-stone bg-white/95 shadow-[0_4px_24px_rgba(29,51,48,0.08)]">
          <CardContent className="pb-12 pt-12 text-center">
            <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-proofound-forest/10">
              <Loader2 className="h-6 w-6 animate-spin text-proofound-forest" />
            </span>
            <h1 className="font-display text-2xl font-semibold leading-none tracking-tight text-proofound-charcoal">
              Loading verification request
            </h1>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-proofound-parchment p-4 py-10">
        <Card className="w-full max-w-xl rounded-[24px] border-proofound-stone bg-white/95 shadow-[0_4px_24px_rgba(29,51,48,0.08)]">
          <CardContent className="pb-12 pt-12 text-center">
            <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </span>
            <h1 className="mb-2 font-display text-2xl font-semibold leading-none tracking-tight text-proofound-charcoal">
              Unable to load request
            </h1>
            <p className="mb-6 text-sm leading-6 text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={() => router.push('/')}>
              Return home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (data?.status !== 'pending') {
    const statusConfig = {
      accepted: {
        icon: CheckCircle2,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        title: 'Already Verified',
        message: 'This request has already been accepted. Thank you for your response.',
      },
      declined: {
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        title: 'Already Declined',
        message: 'This verification request has already been declined.',
      },
      expired: {
        icon: Clock,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        title: 'Request Expired',
        message:
          'This verification request has expired. The requester will need to send a new one.',
      },
    };

    const config = statusConfig[data?.status as keyof typeof statusConfig] || statusConfig.expired;
    const Icon = config.icon;

    return (
      <div className="flex min-h-screen items-center justify-center bg-proofound-parchment p-4 py-10">
        <Card className="w-full max-w-xl rounded-[24px] border-proofound-stone bg-white/95 shadow-[0_4px_24px_rgba(29,51,48,0.08)]">
          <CardContent className="pb-12 pt-12 text-center">
            <span
              className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${config.bgColor}`}
            >
              <Icon className={`h-6 w-6 ${config.color}`} />
            </span>
            <h1 className="mb-2 font-display text-2xl font-semibold leading-none tracking-tight text-proofound-charcoal">
              {config.title}
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">{config.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-proofound-parchment p-4 py-10">
        <Card className="w-full max-w-xl rounded-[24px] border-proofound-stone bg-white/95 shadow-[0_4px_24px_rgba(29,51,48,0.08)]">
          <CardContent className="pb-12 pt-12 text-center">
            {submittedAction === 'accepted' ? (
              <>
                <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h1 className="text-2xl font-semibold text-foreground mb-2">Thank You!</h1>
                <p className="text-muted-foreground mb-4">
                  {data?.request_kind === 'human_observed_attestation'
                    ? `You've recorded a bounded observed-in-practice attestation for ${data?.requester_name}.`
                    : `You've verified ${data?.requester_name}'s selected profile artifacts.`}
                </p>
                <p className="text-sm text-muted-foreground">
                  Your response helps strengthen trust and credibility on Proofound.
                </p>
              </>
            ) : submittedAction === 'partly' ? (
              <>
                <MinusCircle className="h-16 w-16 text-amber-600 mx-auto mb-4" />
                <h1 className="text-2xl font-semibold text-foreground mb-2">
                  Partial Response Recorded
                </h1>
                <p className="text-muted-foreground">
                  You recorded a structured partial attestation. It has been stored for review and
                  audit.
                </p>
              </>
            ) : (
              <>
                <XCircle className="h-16 w-16 text-proofound-terracotta mx-auto mb-4" />
                <h1 className="text-2xl font-semibold text-foreground mb-2">Response Recorded</h1>
                <p className="text-muted-foreground">
                  You've declined this verification request. The requester has been notified.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-proofound-parchment p-4 py-10">
      <Card className="w-full max-w-xl overflow-hidden rounded-[24px] border-proofound-stone bg-white/95 shadow-[0_4px_24px_rgba(29,51,48,0.08)]">
        <CardHeader className="bg-proofound-forest text-white">
          <div className="mb-2 flex min-w-0 items-center gap-3">
            <Shield className="h-8 w-8 shrink-0" />
            <h1 className="min-w-0 font-display text-xl font-semibold leading-7 tracking-tight">
              Custom Verification Request
            </h1>
          </div>
          <p className="text-sm leading-6 text-white/80">
            {data?.request_kind === 'human_observed_attestation'
              ? 'Review a bounded observed-in-practice attestation request.'
              : 'Review one request that covers multiple artifacts'}
          </p>
        </CardHeader>

        <CardContent className="pt-6 space-y-5">
          <div className="flex min-w-0 items-center gap-4 rounded-lg bg-japandi-bg p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-proofound-forest text-lg font-semibold text-white">
              {data?.requester_name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <p className="break-words font-semibold text-foreground">{data?.requester_name}</p>
              <p className="text-sm text-muted-foreground">
                {data?.request_kind === 'human_observed_attestation'
                  ? 'is requesting your bounded observation'
                  : 'is requesting your verification'}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Your Relationship</p>
            <Badge variant="outline" className="text-proofound-forest border-proofound-forest">
              {relationshipDisplayLabel(data?.relationship || 'peer')}
            </Badge>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">
              {data?.request_kind === 'human_observed_attestation'
                ? 'Skills in scope'
                : 'Artifacts to Verify'}
            </p>
            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {data?.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex min-w-0 flex-col gap-3 rounded-md border border-proofound-stone bg-white px-3 py-3 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="break-words text-sm font-medium leading-5 text-foreground">
                      {item.claim_label}
                    </p>
                    <p className="break-words text-xs leading-5 text-muted-foreground">
                      Context: {item.display_label}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-start gap-2 sm:flex-col sm:items-end">
                    <Badge variant="outline" className="text-xs">
                      {artifactTypeLabel(item.artifact_type)}
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">
                      {item.support_label}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {data?.message && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Message from {data.requester_name}
              </p>
              <div className="p-3 bg-japandi-bg rounded-lg italic text-foreground">
                &ldquo;{data.message}&rdquo;
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="custom-response-message"
              className="text-sm font-medium text-muted-foreground"
            >
              Add a note (optional)
            </label>
            <Textarea
              id="custom-response-message"
              className="mt-2"
              rows={3}
              placeholder="Share any context for your decision..."
              value={responseMessage}
              onChange={(event) => setResponseMessage(event.target.value)}
            />
          </div>

          {data?.request_kind === 'human_observed_attestation' && (
            <HumanObservedAttestationFields
              value={attestationForm}
              onChange={setAttestationForm}
              skillLabels={
                data.attestation_request?.skillLabels ||
                data.items
                  .filter((item) => item.artifact_type === 'skill')
                  .map((item) => item.display_label)
              }
              disabled={submitting}
            />
          )}

          <p className="text-xs text-muted-foreground text-center">
            This request expires on {new Date(data?.expires_at || '').toLocaleDateString()}
          </p>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 border-t pt-6 sm:flex-row">
          {data?.request_kind === 'human_observed_attestation' ? (
            <>
              <Button
                variant="outline"
                className="w-full border-[#C76B4A] text-proofound-terracotta hover:bg-[#FFF0F0] sm:flex-1"
                onClick={() => handleSubmit('decline', 'no')}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                No
              </Button>
              <Button
                variant="outline"
                className="w-full border-amber-300 text-amber-800 hover:bg-amber-50 sm:flex-1"
                onClick={() => handleSubmit('accept', 'partly')}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <MinusCircle className="h-4 w-4 mr-2" />
                )}
                Partly
              </Button>
              <Button
                className="w-full bg-proofound-forest text-white hover:bg-proofound-forest/90 sm:flex-1"
                onClick={() => handleSubmit('accept', 'yes')}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Yes
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                className="w-full border-[#C76B4A] text-proofound-terracotta hover:bg-[#FFF0F0] sm:flex-1"
                onClick={() => handleSubmit('decline')}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Decline
              </Button>
              <Button
                className="w-full bg-proofound-forest text-white hover:bg-proofound-forest/90 sm:flex-1"
                onClick={() => handleSubmit('accept')}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Verify Artifacts
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
