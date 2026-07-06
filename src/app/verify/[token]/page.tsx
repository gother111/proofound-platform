'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { VerificationRequestStateCard } from '@/components/verification/VerificationRequestStateCard';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Loader2,
  AlertCircle,
  MinusCircle,
} from 'lucide-react';
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
  buildVisualSkillVerificationResponse,
  clientVerificationLinkVisualFixturesEnabled,
  VISUAL_VERIFY_TOKENS,
} from '@/lib/verification/visual-link-fixtures';

type VerificationStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'failed';
type SubmissionIntent = 'accept' | 'decline' | 'yes' | 'partly' | 'no';

interface SkillVerificationData {
  id: string;
  verification_type?: 'skill';
  skill_name: string;
  skill_code: string | null;
  proofs?: SkillProofData[];
  requester_name: string;
  requester_email: string;
  requester_avatar?: string;
  verifier_source: 'peer' | 'manager' | 'external';
  verifier_relationship?: string | null;
  request_kind?: 'generic_verification' | 'human_observed_attestation';
  attestation_request?: {
    skillIds: string[];
    skillLabels: string[];
  } | null;
  message?: string;
  status: VerificationStatus;
  requires_authenticated_verifier?: boolean;
  integrity_status?: 'clear' | 'flagged';
  integrity_reason?: string | null;
  created_at: string;
  expires_at: string;
}

interface ImpactClaim {
  id: string;
  label: string;
  outcomeId?: string;
  enabled?: boolean;
}

interface SkillProofData {
  id: string;
  proof_type: string;
  title: string;
  description?: string | null;
  url?: string | null;
  file_path?: string | null;
  issued_date?: string | null;
  expires_date?: string | null;
}

interface ImpactVerificationData {
  id: string;
  verification_type: 'impact_story';
  story_id: string | null;
  story_title: string;
  requester_name: string;
  requester_email: string;
  requester_avatar?: string;
  verifier_email: string;
  verifier_name?: string | null;
  verifier_relationship?: string | null;
  message?: string;
  status: VerificationStatus;
  requires_authenticated_verifier?: boolean;
  integrity_status?: 'clear' | 'flagged';
  integrity_reason?: string | null;
  created_at: string;
  expires_at: string;
  why_you_are_receiving_this: string;
  claims?: {
    roleClaim?: ImpactClaim;
    outcomeClaims?: ImpactClaim[];
    artifactsClaim?: ImpactClaim;
  };
}

type VerificationData = SkillVerificationData | ImpactVerificationData;

function isImpactVerification(data: VerificationData | null): data is ImpactVerificationData {
  return Boolean(data && data.verification_type === 'impact_story');
}

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

function skillProofTypeLabel(value: string): string {
  switch (value) {
    case 'certification':
      return 'Certification';
    case 'project':
      return 'Project';
    case 'media':
      return 'Media';
    case 'reference':
      return 'Reference';
    case 'document':
      return 'Document';
    case 'link':
    default:
      return 'Link';
  }
}

function isImageProof(url: string | null | undefined): boolean {
  if (!url) {
    return false;
  }

  const normalized = url.toLowerCase();
  return (
    normalized.includes('.png') ||
    normalized.includes('.jpg') ||
    normalized.includes('.jpeg') ||
    normalized.includes('.webp') ||
    normalized.includes('.heif') ||
    normalized.includes('.heic')
  );
}

function getSourceLabel(source: string) {
  switch (source) {
    case 'manager':
      return 'Manager / Supervisor';
    case 'external':
      return 'Client / External';
    default:
      return 'Peer / Colleague';
  }
}

function getRelationshipLabel(relationship?: string | null, source = 'peer') {
  return relationship
    ? relationshipDisplayLabel(relationship as CustomVerificationRelationship)
    : getSourceLabel(source);
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

const VERIFICATION_RESPONSE_RETRY_MESSAGE =
  'Verification response could not be recorded. Your note and review choices are still here; please try again.';

function verificationSubmitError(error?: string | null) {
  const normalized = error?.trim();

  if (!normalized || /^Failed to submit response\.?$/i.test(normalized)) {
    return VERIFICATION_RESPONSE_RETRY_MESSAGE;
  }

  if (/auth|required|identity|sign.?in/i.test(normalized)) {
    return 'Sign in with the invited verifier email before submitting this response.';
  }

  if (/invalid|expired|not found|unavailable/i.test(normalized)) {
    return 'This verification request is invalid, expired, or no longer available.';
  }

  return VERIFICATION_RESPONSE_RETRY_MESSAGE;
}

function resolveSubmissionIntent(
  action: 'accept' | 'decline',
  humanObservedVerdict?: 'yes' | 'partly' | 'no'
): SubmissionIntent {
  return humanObservedVerdict ?? action;
}

export default function VerifySkillPage() {
  const params = useParams();
  const router = useRouter();
  const token =
    typeof params?.token === 'string'
      ? params.token
      : Array.isArray(params?.token)
        ? params.token[0]
        : null;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittingAction, setSubmittingAction] = useState<SubmissionIntent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<VerificationData | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [confirmedClaimIds, setConfirmedClaimIds] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submittedAction, setSubmittedAction] = useState<'accepted' | 'declined' | 'partly' | null>(
    null
  );
  const [authRequired, setAuthRequired] = useState(false);
  const [attestationForm, setAttestationForm] = useState<HumanObservedAttestationFormValue>(
    createDefaultHumanObservedAttestationForm()
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!token) {
          setError('Invalid verification link');
          return;
        }

        if (clientVerificationLinkVisualFixturesEnabled()) {
          const visualResponse = buildVisualSkillVerificationResponse(token);
          if (visualResponse) {
            const verification = visualResponse.verification as VerificationData;
            setData(verification);
            if (
              !isImpactVerification(verification) &&
              verification.request_kind === 'human_observed_attestation'
            ) {
              setAttestationForm(
                createDefaultHumanObservedAttestationForm(
                  getRelationshipLabel(
                    verification.verifier_relationship,
                    verification.verifier_source
                  )
                )
              );
            }
            return;
          }
        }

        const response = await fetch(`/api/verify/${token}`);

        if (!response.ok) {
          const errorData = await response.json();
          setError(verificationLoadError(response.status, errorData.error));
          return;
        }

        const result = await response.json();
        const verification = result.verification as VerificationData;
        setData(verification);
        if (
          !isImpactVerification(verification) &&
          verification.request_kind === 'human_observed_attestation'
        ) {
          setAttestationForm(
            createDefaultHumanObservedAttestationForm(
              getRelationshipLabel(verification.verifier_relationship, verification.verifier_source)
            )
          );
        }
      } catch {
        setError('This verification link is invalid, expired, or no longer available.');
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [token]);

  const handleClaimToggle = (claimId: string, checked: boolean) => {
    setConfirmedClaimIds((prev) =>
      checked
        ? [...prev.filter((id) => id !== claimId), claimId]
        : prev.filter((id) => id !== claimId)
    );
  };

  const getImpactClaims = (verification: ImpactVerificationData) => {
    const claims: ImpactClaim[] = [];

    if (verification.claims?.roleClaim) {
      claims.push(verification.claims.roleClaim);
    }

    if (verification.claims?.outcomeClaims?.length) {
      claims.push(...verification.claims.outcomeClaims);
    }

    if (verification.claims?.artifactsClaim?.enabled) {
      claims.push(verification.claims.artifactsClaim);
    }

    return claims;
  };

  const handleSubmit = async (
    action: 'accept' | 'decline',
    humanObservedVerdict?: 'yes' | 'partly' | 'no'
  ) => {
    if (!data) return;

    if (isImpactVerification(data) && action === 'accept' && confirmedClaimIds.length === 0) {
      setError('Select at least one claim to confirm, or decline the request.');
      return;
    }

    setSubmitting(true);
    setSubmittingAction(resolveSubmissionIntent(action, humanObservedVerdict));
    setError(null);
    setAuthRequired(false);

    try {
      if (
        clientVerificationLinkVisualFixturesEnabled() &&
        token === VISUAL_VERIFY_TOKENS.skillObserved
      ) {
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

      const response = await apiFetch(`/api/verify/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          message: responseMessage || undefined,
          confirmedClaimIds: isImpactVerification(data) ? confirmedClaimIds : undefined,
          attestation: !isImpactVerification(data)
            ? resolveHumanObservedSubmitPayload({
                action,
                requestKind: data.request_kind,
                attestationRequest: data.attestation_request,
                form: attestationForm,
                verdict: humanObservedVerdict,
              })
            : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (
          errorData?.code === 'AUTH_REQUIRED' ||
          errorData?.code === 'VERIFIER_IDENTITY_MISMATCH'
        ) {
          setAuthRequired(true);
        }
        setError(verificationSubmitError(errorData.error));
        return;
      }

      setSubmitted(true);
      setSubmittedAction(
        humanObservedVerdict === 'partly' ? 'partly' : action === 'accept' ? 'accepted' : 'declined'
      );
    } catch {
      setError(VERIFICATION_RESPONSE_RETRY_MESSAGE);
    } finally {
      setSubmitting(false);
      setSubmittingAction(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-proofound-parchment p-4 py-10">
        <Card className="w-full max-w-lg rounded-[24px] border-proofound-stone bg-white/95 shadow-[0_4px_24px_rgba(29,51,48,0.08)]">
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

  if (error && !data) {
    return (
      <VerificationRequestStateCard
        title="Unable to load request"
        message={error}
        Icon={AlertCircle}
        iconClassName="text-destructive"
        iconBgClassName="bg-destructive/10"
        stateNote="No verification response was recorded from this page."
        guidance="Ask the requester to send a fresh verification link if you still need to respond."
        actionLabel="Return home"
        onAction={() => router.push('/')}
        noticeRole="alert"
      />
    );
  }

  if (!data) {
    return null;
  }

  if (data.status !== 'pending') {
    const statusConfig = {
      accepted: {
        icon: CheckCircle2,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        title: 'Already Verified',
        message: 'This verification request has already been completed.',
        stateNote: 'No new verification response was recorded from this page.',
        guidance:
          'If you need to change your response, ask the requester to send a fresh verification request.',
      },
      declined: {
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        title: 'Already Declined',
        message: 'This verification request has already been declined.',
        stateNote: 'No new verification response was recorded from this page.',
        guidance:
          'If you need to change your response, ask the requester to send a fresh verification request.',
      },
      expired: {
        icon: Clock,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        title: 'Request Expired',
        message:
          'This verification request has expired. The requester will need to send a new request.',
        stateNote: 'No verification response was recorded from this page.',
        guidance:
          'Ask the requester to send a fresh verification link if you still need to respond.',
      },
      failed: {
        icon: AlertCircle,
        color: 'text-amber-700',
        bgColor: 'bg-amber-50',
        title: 'Request Failed',
        message: 'This verification request is no longer active.',
        stateNote: 'No verification response was recorded from this page.',
        guidance:
          'Ask the requester to send a fresh verification link if you still need to respond.',
      },
      pending: {
        icon: Clock,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        title: 'Pending',
        message: 'This verification request is still pending.',
        stateNote: 'No verification response was recorded from this page.',
        guidance: 'Refresh this link or ask the requester to resend it if the request looks stale.',
      },
    } as const;

    const config = statusConfig[data.status];
    const Icon = config.icon;

    return (
      <VerificationRequestStateCard
        title={config.title}
        message={config.message}
        Icon={Icon}
        iconClassName={config.color}
        iconBgClassName={config.bgColor}
        stateNote={config.stateNote}
        guidance={config.guidance}
        actionLabel="Return home"
        onAction={() => router.push('/')}
      />
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-proofound-parchment p-4 py-10">
        <Card className="w-full max-w-lg rounded-[24px] border-proofound-stone bg-white/95 shadow-[0_4px_24px_rgba(29,51,48,0.08)]">
          <CardContent className="pb-12 pt-12 text-center">
            {submittedAction === 'accepted' ? (
              <>
                <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h1 className="text-2xl font-semibold text-foreground mb-2">Thank You!</h1>
                <p className="text-muted-foreground mb-4">
                  {isImpactVerification(data)
                    ? `You've successfully submitted verification for ${data.requester_name}.`
                    : data.request_kind === 'human_observed_attestation'
                      ? `You've recorded a bounded observed-in-practice confirmation for ${data.requester_name}.`
                      : `You've successfully submitted verification for ${data.requester_name}.`}
                </p>
              </>
            ) : submittedAction === 'partly' ? (
              <>
                <MinusCircle className="h-16 w-16 text-amber-600 mx-auto mb-4" />
                <h1 className="text-2xl font-semibold text-foreground mb-2">
                  Partial Response Recorded
                </h1>
                <p className="text-muted-foreground">
                  You recorded a structured partial confirmation. It has been stored for review and
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
      <Card className="w-full max-w-2xl overflow-hidden rounded-[24px] border-proofound-stone bg-white/95 shadow-[0_4px_24px_rgba(29,51,48,0.08)]">
        <CardHeader className="bg-proofound-forest text-white">
          <div className="mb-2 flex min-w-0 items-center gap-3">
            <Shield className="h-8 w-8 shrink-0" />
            <h1 className="min-w-0 font-display text-xl font-semibold leading-7 tracking-tight">
              {isImpactVerification(data)
                ? 'Impact Story Verification Request'
                : 'Skill Verification Request'}
            </h1>
          </div>
          <p className="text-sm leading-6 text-white/80">
            {isImpactVerification(data)
              ? 'Review claims and tick only what you can confirm.'
              : data.request_kind === 'human_observed_attestation'
                ? 'Record bounded observed-in-practice evidence for a small skill set.'
                : "You are being asked to verify someone's professional skill."}
          </p>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          <div className="flex min-w-0 items-center gap-4 rounded-lg bg-japandi-bg p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-proofound-forest text-lg font-semibold text-white">
              {data.requester_name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <p className="break-words font-semibold text-foreground">{data.requester_name}</p>
              <p className="text-sm text-muted-foreground">is requesting your verification</p>
            </div>
          </div>

          {isImpactVerification(data) ? (
            <div className="space-y-3">
              {data.requires_authenticated_verifier && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                  This request requires sign-in by the intended verifier before it can be submitted.
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Why you&apos;re receiving this
                </p>
                <div className="rounded-lg bg-japandi-bg p-3 text-sm leading-6 text-foreground">
                  {data.why_you_are_receiving_this ||
                    `${data.requester_name} asked you to verify this impact story.`}
                </div>
              </div>

              <p className="text-sm font-medium text-muted-foreground">Impact story</p>
              <div className="rounded-r-lg border-l-4 border-proofound-forest bg-white p-4">
                <p className="break-words text-lg font-semibold leading-7 text-proofound-forest">
                  {data.story_title}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Claims to confirm</p>
                <div className="space-y-2 rounded-lg border bg-white p-3">
                  {getImpactClaims(data).length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No claims available on this request.
                    </p>
                  ) : (
                    getImpactClaims(data).map((claim) => (
                      <div key={claim.id} className="flex min-w-0 items-start gap-2">
                        <Checkbox
                          id={`claim-${claim.id}`}
                          checked={confirmedClaimIds.includes(claim.id)}
                          onCheckedChange={(checked) =>
                            handleClaimToggle(claim.id, Boolean(checked))
                          }
                        />
                        <Label
                          htmlFor={`claim-${claim.id}`}
                          className="min-w-0 cursor-pointer break-words text-sm leading-5"
                        >
                          {claim.label}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              {data.requires_authenticated_verifier && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                  This request requires sign-in by the intended verifier before it can be submitted.
                </div>
              )}

              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Skill to verify</p>
                <div className="rounded-r-lg border-l-4 border-proofound-forest bg-white p-4">
                  <p className="break-words text-lg font-semibold leading-7 text-proofound-forest">
                    {data.skill_name}
                  </p>
                </div>
                {data.request_kind === 'human_observed_attestation' && (
                  <p className="text-sm text-muted-foreground">
                    This request is for structured observed behaviors, not a public endorsement.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Your Relationship</p>
                <Badge variant="outline" className="text-proofound-forest border-proofound-forest">
                  {getRelationshipLabel(data.verifier_relationship, data.verifier_source || 'peer')}
                </Badge>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Supporting proof(s)</p>
                {Array.isArray(data.proofs) && data.proofs.length > 0 ? (
                  <div className="space-y-2 rounded-lg border bg-white p-3">
                    {data.proofs.map((proof) => (
                      <div
                        key={proof.id}
                        className="min-w-0 space-y-2 rounded-md border border-proofound-stone px-3 py-3"
                      >
                        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <p className="break-words text-sm font-medium leading-5 text-foreground">
                            {proof.title}
                          </p>
                          <Badge variant="outline" className="w-fit shrink-0 text-xs">
                            {skillProofTypeLabel(proof.proof_type)}
                          </Badge>
                        </div>

                        {proof.description && (
                          <p className="break-words text-xs leading-5 text-muted-foreground">
                            {proof.description}
                          </p>
                        )}

                        {(proof.issued_date || proof.expires_date) && (
                          <p className="text-xs text-muted-foreground">
                            {proof.issued_date
                              ? `Issued: ${new Date(proof.issued_date).toLocaleDateString()}`
                              : ''}
                            {proof.issued_date && proof.expires_date ? ' • ' : ''}
                            {proof.expires_date
                              ? `Expires: ${new Date(proof.expires_date).toLocaleDateString()}`
                              : ''}
                          </p>
                        )}

                        {proof.url && isImageProof(proof.url) && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={proof.url}
                            alt={`Proof image: ${proof.title}`}
                            className="max-h-40 max-w-full rounded border border-proofound-stone"
                          />
                        )}

                        {proof.url && (
                          <a
                            href={proof.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-proofound-forest hover:underline"
                          >
                            Open proof
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-proofound-stone bg-white p-3">
                    <p className="text-sm text-muted-foreground">
                      No supporting proofs were attached to this request.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {data.message && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Message from {data.requester_name}
              </p>
              <div className="rounded-lg bg-japandi-bg p-3 italic leading-6 text-foreground">
                &ldquo;{data.message}&rdquo;
              </div>
            </div>
          )}

          {data.integrity_status === 'flagged' && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              This request has integrity risk flags and accepted responses may be treated as
              non-independent.
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="response-message" className="text-sm font-medium text-muted-foreground">
              Add a note (optional)
            </label>
            <Textarea
              id="response-message"
              placeholder="Share context for your response..."
              value={responseMessage}
              onChange={(e) => setResponseMessage(e.target.value)}
              rows={3}
              className="bg-white"
            />
          </div>

          {!isImpactVerification(data) && data.request_kind === 'human_observed_attestation' && (
            <HumanObservedAttestationFields
              value={attestationForm}
              onChange={setAttestationForm}
              skillLabels={data.attestation_request?.skillLabels || [data.skill_name]}
              disabled={submitting}
            />
          )}

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          {authRequired && (
            <div className="flex flex-col gap-2 rounded-lg border border-proofound-forest/20 bg-japandi-bg p-3">
              <p className="text-sm text-foreground">
                Sign in with the verifier email to continue.
              </p>
              <Button
                variant="outline"
                className="w-fit border-proofound-forest text-proofound-forest"
                onClick={() => router.push(`/login?next=${encodeURIComponent(`/verify/${token}`)}`)}
              >
                Sign In to Continue
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center">
            This request expires on {new Date(data.expires_at || '').toLocaleDateString()}
          </p>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 border-t pt-6 sm:flex-row">
          {isImpactVerification(data) || data.request_kind !== 'human_observed_attestation' ? (
            <>
              <Button
                variant="outline"
                className="w-full border-[#C76B4A] text-proofound-terracotta hover:bg-[#FFF0F0] sm:flex-1"
                onClick={() => handleSubmit('decline')}
                disabled={submitting}
              >
                {submittingAction === 'decline' ? (
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
                {submittingAction === 'accept' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                {isImpactVerification(data) ? 'Confirm Claims' : 'Verify Skill'}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                className="w-full border-[#C76B4A] text-proofound-terracotta hover:bg-[#FFF0F0] sm:flex-1"
                onClick={() => handleSubmit('decline', 'no')}
                disabled={submitting}
              >
                {submittingAction === 'no' ? (
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
                {submittingAction === 'partly' ? (
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
                {submittingAction === 'yes' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Yes
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
