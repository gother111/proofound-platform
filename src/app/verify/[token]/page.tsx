'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
} from '@/lib/verification/custom-verification';

type VerificationStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'failed';

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

        const response = await fetch(`/api/verify/${token}`);

        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to load verification request');
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
        setError('Failed to load verification request');
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
    setError(null);
    setAuthRequired(false);

    try {
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
        setError(errorData.error || 'Failed to submit response');
        return;
      }

      setSubmitted(true);
      setSubmittedAction(
        humanObservedVerdict === 'partly' ? 'partly' : action === 'accept' ? 'accepted' : 'declined'
      );
    } catch {
      setError('Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F6F1] to-[#E5E3DA] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-12 pb-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-proofound-forest mx-auto mb-4" />
            <p className="text-muted-foreground">Loading verification request...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F6F1] to-[#E5E3DA] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-12 pb-12 text-center">
            <AlertCircle className="h-12 w-12 text-proofound-terracotta mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Unable to Load Request</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button variant="outline" onClick={() => router.push('/')}>
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
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
          'This verification request has expired. The requester will need to send a new request.',
      },
      failed: {
        icon: AlertCircle,
        color: 'text-amber-700',
        bgColor: 'bg-amber-50',
        title: 'Request Failed',
        message: 'This verification request is no longer active.',
      },
      pending: {
        icon: Clock,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        title: 'Pending',
        message: 'This verification request is still pending.',
      },
    } as const;

    const config = statusConfig[data.status];
    const Icon = config.icon;

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F6F1] to-[#E5E3DA] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className={`pt-12 pb-12 text-center ${config.bgColor} rounded-lg`}>
            <Icon className={`h-16 w-16 ${config.color} mx-auto mb-4`} />
            <h2 className="text-xl font-semibold text-foreground mb-2">{config.title}</h2>
            <p className="text-muted-foreground">{config.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F6F1] to-[#E5E3DA] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-12 pb-12 text-center">
            {submittedAction === 'accepted' ? (
              <>
                <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-foreground mb-2">Thank You!</h2>
                <p className="text-muted-foreground mb-4">
                  {isImpactVerification(data)
                    ? `You've successfully submitted verification for ${data.requester_name}.`
                    : data.request_kind === 'human_observed_attestation'
                      ? `You've recorded a bounded observed-in-practice attestation for ${data.requester_name}.`
                      : `You've successfully submitted verification for ${data.requester_name}.`}
                </p>
              </>
            ) : submittedAction === 'partly' ? (
              <>
                <MinusCircle className="h-16 w-16 text-amber-600 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-foreground mb-2">
                  Partial Response Recorded
                </h2>
                <p className="text-muted-foreground">
                  You recorded a structured partial attestation. It has been stored for review and
                  audit.
                </p>
              </>
            ) : (
              <>
                <XCircle className="h-16 w-16 text-proofound-terracotta mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-foreground mb-2">Response Recorded</h2>
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
    <div className="min-h-screen bg-gradient-to-br from-[#F7F6F1] to-[#E5E3DA] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="bg-gradient-to-r from-[#1C4D3A] to-[#2D5F4A] text-white rounded-t-lg">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8" />
            <CardTitle className="text-xl">
              {isImpactVerification(data)
                ? 'Impact Story Verification Request'
                : 'Skill Verification Request'}
            </CardTitle>
          </div>
          <p className="text-white/80 text-sm">
            {isImpactVerification(data)
              ? 'Review claims and tick only what you can confirm.'
              : data.request_kind === 'human_observed_attestation'
                ? 'Record bounded observed-in-practice evidence for a small skill set.'
                : "You are being asked to verify someone's professional skill."}
          </p>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          <div className="flex items-center gap-4 p-4 bg-japandi-bg rounded-lg">
            <div className="h-12 w-12 rounded-full bg-proofound-forest text-white flex items-center justify-center text-lg font-semibold">
              {data.requester_name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="font-semibold text-foreground">{data.requester_name}</p>
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
                <div className="p-3 bg-japandi-bg rounded-lg text-sm text-foreground">
                  {data.why_you_are_receiving_this ||
                    `${data.requester_name} asked you to verify this impact story.`}
                </div>
              </div>

              <p className="text-sm font-medium text-muted-foreground">Impact story</p>
              <div className="p-4 border-l-4 border-proofound-forest bg-white rounded-r-lg">
                <p className="font-semibold text-lg text-proofound-forest">{data.story_title}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Claims to confirm</p>
                <div className="space-y-2 rounded-lg border p-3 bg-white">
                  {getImpactClaims(data).length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No claims available on this request.
                    </p>
                  ) : (
                    getImpactClaims(data).map((claim) => (
                      <div key={claim.id} className="flex items-start gap-2">
                        <Checkbox
                          id={`claim-${claim.id}`}
                          checked={confirmedClaimIds.includes(claim.id)}
                          onCheckedChange={(checked) =>
                            handleClaimToggle(claim.id, Boolean(checked))
                          }
                        />
                        <Label
                          htmlFor={`claim-${claim.id}`}
                          className="text-sm leading-5 cursor-pointer"
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
                <div className="p-4 border-l-4 border-proofound-forest bg-white rounded-r-lg">
                  <p className="font-semibold text-lg text-proofound-forest">{data.skill_name}</p>
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
                  <div className="space-y-2 rounded-lg border p-3 bg-white">
                    {data.proofs.map((proof) => (
                      <div
                        key={proof.id}
                        className="rounded-md border border-proofound-stone px-3 py-2 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-medium text-foreground">{proof.title}</p>
                          <Badge variant="outline" className="text-xs whitespace-nowrap">
                            {skillProofTypeLabel(proof.proof_type)}
                          </Badge>
                        </div>

                        {proof.description && (
                          <p className="text-xs text-muted-foreground">{proof.description}</p>
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
                            className="max-h-40 rounded border border-proofound-stone"
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
              <div className="p-3 bg-japandi-bg rounded-lg italic text-foreground">
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

          {error && <p className="text-sm text-red-600">{error}</p>}

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

        <CardFooter className="flex gap-3 border-t pt-6">
          {isImpactVerification(data) || data.request_kind !== 'human_observed_attestation' ? (
            <>
              <Button
                variant="outline"
                className="flex-1 border-[#C76B4A] text-proofound-terracotta hover:bg-[#FFF0F0]"
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
                className="flex-1 bg-proofound-forest text-white hover:bg-proofound-forest/90"
                onClick={() => handleSubmit('accept')}
                disabled={submitting}
              >
                {submitting ? (
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
                className="flex-1 border-[#C76B4A] text-proofound-terracotta hover:bg-[#FFF0F0]"
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
                className="flex-1 border-amber-300 text-amber-800 hover:bg-amber-50"
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
                className="flex-1 bg-proofound-forest text-white hover:bg-proofound-forest/90"
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
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
