'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Clock3,
  EyeOff,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api/fetch';
import {
  CANDIDATE_INVITE_FLOW_TYPE,
  CANDIDATE_INVITE_STATUS,
} from '@/lib/candidate-invites-shared';
import {
  assignmentStatusLabel,
  candidateInviteStatusLabel,
  engagementTypeLabel,
  internalValueLabel,
  skillDisplayLabel,
} from '@/lib/copy/labels';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';

type InviteState = {
  id: string;
  status: string;
  flowType: 'proof_card' | 'test_match';
  assignmentId: string | null;
  maskedEmail: string;
  expiresAt: string;
  claimedAt: string | null;
  claimedByCurrentUser: boolean;
  acceptedAt: string | null;
  acceptedByCurrentUser: boolean;
  communicationsUrl: string | null;
  proofSubmittedAt: string | null;
};

type OrganizationState = {
  id: string;
  slug: string;
  displayName: string;
  logoUrl: string | null;
};

type AssignmentSkillState = {
  label?: string | null;
  name?: string | null;
  skillName?: string | null;
  customSkillName?: string | null;
  taxonomyName?: string | null;
  id?: string | null;
  code?: string | null;
  level?: number | null;
};

type AssignmentState = {
  id: string;
  role: string | null;
  description: string | null;
  status: string;
  creationStatus?: string | null;
  engagementType?: string | null;
  businessValue?: string | null;
  expectedImpact?: string | null;
  mustHaveSkills?: AssignmentSkillState[];
  niceToHaveSkills?: AssignmentSkillState[];
  locationMode?: string | null;
  country?: string | null;
  city?: string | null;
  compMin?: number | null;
  compMax?: number | null;
  currency?: string | null;
  hoursMin?: number | null;
  hoursMax?: number | null;
  startEarliest?: string | null;
  startLatest?: string | null;
  verificationGates?: string[];
  createdAt: string;
};

type CurrentUserState = {
  id: string;
  email: string;
};

type AvailableProofPackState = {
  id: string;
  title: string;
  summary: string | null;
  evidenceSummary: string | null;
  outcomesSummary: string | null;
  verificationSummary: string | null;
  updatedAt: string;
};

type AccountSaveControls = {
  proofWorkspaceUrl: string;
  profileVisibilityUrl: string;
  privacyDataControlsUrl: string;
  verificationWorkspaceUrl: string;
  assignmentReviewUrl: string;
};

interface CandidateInviteClientProps {
  token: string;
  initialState?: CandidateInviteInitialState;
  visualMode?: boolean;
}

export type CandidateInviteInitialState = {
  invite: InviteState;
  organization: OrganizationState;
  assignment: AssignmentState | null;
  availableProofPacks?: AvailableProofPackState[];
  currentUser?: CurrentUserState | null;
};

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function formatLocation(assignment: AssignmentState) {
  const place = [assignment.city, assignment.country].filter(hasText).join(', ');
  const mode = assignment.locationMode ? internalValueLabel(assignment.locationMode) : null;

  if (mode && place) return `${mode} / ${place}`;
  return mode || place || 'Location to be confirmed in the assignment corridor.';
}

function formatHours(assignment: AssignmentState) {
  if (assignment.hoursMin != null && assignment.hoursMax != null) {
    return `${assignment.hoursMin}-${assignment.hoursMax} hours/week`;
  }
  if (assignment.hoursMin != null) {
    return `From ${assignment.hoursMin} hours/week`;
  }
  if (assignment.hoursMax != null) {
    return `Up to ${assignment.hoursMax} hours/week`;
  }
  return 'Time commitment to be clarified before deeper review.';
}

function formatStartWindow(assignment: AssignmentState) {
  const start = assignment.startEarliest
    ? new Date(assignment.startEarliest).toLocaleDateString()
    : null;
  const end = assignment.startLatest ? new Date(assignment.startLatest).toLocaleDateString() : null;

  if (start && end) return `${start} - ${end}`;
  return start || end || 'Start window to be confirmed with the organization.';
}

function formatCompensation(assignment: AssignmentState) {
  if (assignment.compMin != null && assignment.compMax != null) {
    return `${assignment.currency ?? 'USD'} ${assignment.compMin.toLocaleString()}-${assignment.compMax.toLocaleString()}`;
  }
  if (assignment.compMin != null) {
    return `From ${assignment.currency ?? 'USD'} ${assignment.compMin.toLocaleString()}`;
  }
  if (assignment.compMax != null) {
    return `Up to ${assignment.currency ?? 'USD'} ${assignment.compMax.toLocaleString()}`;
  }
  return 'Compensation details are not shown on this invite.';
}

function skillLabels(skills: AssignmentState['mustHaveSkills']) {
  return (skills ?? [])
    .map((skill) => skillDisplayLabel(skill, ''))
    .filter((label) => hasText(label))
    .slice(0, 6);
}

const CANDIDATE_VISIBLE_VERIFICATION_GATE_LABELS: Record<string, string> = {
  identity: 'Identity check',
  work_email: 'Work email check',
  background_check: 'Background check',
  education: 'Education check',
};

function candidateVisibleVerificationGateLabel(gate: string) {
  return CANDIDATE_VISIBLE_VERIFICATION_GATE_LABELS[gate] ?? null;
}

const DEFAULT_ACCOUNT_SAVE_CONTROLS: AccountSaveControls = {
  proofWorkspaceUrl: '/app/i/profile?profileView=full&tab=proof_packs',
  profileVisibilityUrl: '/app/i/profile?profileView=full&tab=visibility',
  privacyDataControlsUrl: '/app/i/settings/privacy',
  verificationWorkspaceUrl: '/app/i/verifications',
  assignmentReviewUrl: '/app/i/matching',
};

function candidateInviteLoadError(status: number, error?: string | null) {
  if (status === 410 || /expired/i.test(error ?? '')) {
    return 'This invitation has expired. Ask the company to send a new invite if needed.';
  }

  if (status === 404 || status === 400 || /not found|invalid|unavailable/i.test(error ?? '')) {
    return 'This invitation link is invalid, expired, or no longer available.';
  }

  return 'We could not open this invitation right now.';
}

export function CandidateInviteClient({
  token,
  initialState,
  visualMode = false,
}: CandidateInviteClientProps) {
  const [loading, setLoading] = useState(!initialState);
  const [submitting, setSubmitting] = useState(false);
  const [invite, setInvite] = useState<InviteState | null>(initialState?.invite ?? null);
  const [organization, setOrganization] = useState<OrganizationState | null>(
    initialState?.organization ?? null
  );
  const [assignment, setAssignment] = useState<AssignmentState | null>(
    initialState?.assignment ?? null
  );
  const [currentUser, setCurrentUser] = useState<CurrentUserState | null>(
    initialState?.currentUser ?? null
  );
  const [error, setError] = useState<string | null>(null);
  const [availableProofPacks, setAvailableProofPacks] = useState<AvailableProofPackState[]>(
    initialState?.availableProofPacks ?? []
  );
  const [proofPackId, setProofPackId] = useState(initialState?.availableProofPacks?.[0]?.id ?? '');
  const [reviewProofPackId, setReviewProofPackId] = useState('');
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [accountSaveControls, setAccountSaveControls] = useState<AccountSaveControls>(
    DEFAULT_ACCOUNT_SAVE_CONTROLS
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  const nextParam = useMemo(() => encodeURIComponent(`/candidate-invite/${token}`), [token]);

  const loadState = useCallback(async () => {
    if (initialState) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setErrorDetail(null);

    try {
      const [inviteResponse, userResponse] = await Promise.all([
        fetch(`/api/candidate-invites/${token}`, {
          credentials: 'include',
        }),
        fetch('/api/user/me', {
          credentials: 'include',
        }),
      ]);

      if (!inviteResponse.ok) {
        const payload = await inviteResponse.json().catch(() => null);
        setError(candidateInviteLoadError(inviteResponse.status, payload?.error));
        setErrorDetail(null);
        return;
      }

      const invitePayload = await inviteResponse.json();
      setInvite({
        ...invitePayload.invite,
        claimedByCurrentUser: Boolean(invitePayload.invite?.claimedByCurrentUser),
        acceptedByCurrentUser: Boolean(invitePayload.invite?.acceptedByCurrentUser),
        communicationsUrl: invitePayload.invite?.communicationsUrl ?? null,
      });
      setOrganization(invitePayload.organization);
      setAssignment(invitePayload.assignment ?? null);
      const proofPacks = Array.isArray(invitePayload.availableProofPacks)
        ? invitePayload.availableProofPacks
        : [];
      setAvailableProofPacks(proofPacks);
      setProofPackId((current) =>
        proofPacks.some((pack: AvailableProofPackState) => pack.id === current)
          ? current
          : proofPacks[0]?.id || current
      );

      if (userResponse.ok) {
        const userPayload = await userResponse.json();
        setCurrentUser({
          id: userPayload.id,
          email: userPayload.email,
        });
      } else {
        setCurrentUser(null);
      }
    } catch (loadError) {
      dispatchClientErrorDiagnostic('candidate_invite.client.load_failed', loadError);
      setError('This invitation link is invalid, expired, or no longer available.');
      setErrorDetail(null);
    } finally {
      setLoading(false);
    }
  }, [initialState, token]);

  useEffect(() => {
    void loadState();
  }, [loadState]);

  const claimInvite = async () => {
    setSubmitting(true);
    setError(null);
    setErrorDetail(null);
    setSuccessMessage(null);

    try {
      const response = await apiFetch(`/api/candidate-invites/${token}/claim`, {
        method: 'POST',
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(payload?.error ?? 'Failed to claim invite.');
        setErrorDetail(null);
        return;
      }

      if (invite?.flowType === CANDIDATE_INVITE_FLOW_TYPE.TEST_MATCH) {
        setSuccessMessage('Test match accepted. You can now message the organization.');
      } else {
        setSuccessMessage('Application started. Review visibility before you submit proof.');
      }

      await loadState();
    } catch (claimError) {
      dispatchClientErrorDiagnostic('candidate_invite.client.claim_failed', claimError);
      setError('Failed to claim invite.');
      setErrorDetail(null);
    } finally {
      setSubmitting(false);
    }
  };

  const openProofPackReview = () => {
    const normalizedProofPackId = proofPackId.trim();
    if (!normalizedProofPackId) {
      setError('Choose an owner-only Proof Pack before submitting assignment proof.');
      setErrorDetail(null);
      return;
    }

    setError(null);
    setErrorDetail(null);
    setSuccessMessage(null);
    setReviewConfirmed(false);
    setReviewProofPackId(normalizedProofPackId);
  };

  const submitReviewedProofPack = async () => {
    const normalizedProofPackId = reviewProofPackId.trim();
    if (!normalizedProofPackId) {
      setError('Review a Proof Pack before submitting.');
      setErrorDetail(null);
      return;
    }

    if (!reviewConfirmed) {
      setError('Confirm the final visibility review before submitting.');
      setErrorDetail(null);
      return;
    }

    setSubmitting(true);
    setError(null);
    setErrorDetail(null);
    setSuccessMessage(null);

    try {
      if (visualMode) {
        setAccountSaveControls(DEFAULT_ACCOUNT_SAVE_CONTROLS);
        setSuccessMessage(
          'Assignment proof submitted for blind-first review. No verification emails were sent.'
        );
        setInvite((current) =>
          current
            ? {
                ...current,
                status: CANDIDATE_INVITE_STATUS.PROOF_SUBMITTED,
                proofSubmittedAt: new Date().toISOString(),
              }
            : current
        );
        setReviewProofPackId('');
        setReviewConfirmed(false);
        return;
      }

      const response = await apiFetch(`/api/candidate-invites/${token}/proof-card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ proofPackId: normalizedProofPackId, reviewConfirmed: true }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(payload?.error ?? 'Assignment proof could not be submitted.');
        setErrorDetail(
          'Your selected Proof Pack and visibility review are still here. Check the summary, then try submitting again.'
        );
        return;
      }

      if (payload?.accountSave?.controls) {
        setAccountSaveControls(payload.accountSave.controls);
      }
      setSuccessMessage(
        'Assignment proof submitted for blind-first review. No verification emails were sent.'
      );
      setReviewProofPackId('');
      setReviewConfirmed(false);
      await loadState();
    } catch (submitError) {
      dispatchClientErrorDiagnostic('candidate_invite.client.proof_submit_failed', submitError);
      setError('Assignment proof could not be submitted.');
      setErrorDetail(
        'Your selected Proof Pack and visibility review are still here. Check the summary, then try submitting again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-japandi-bg p-6">
        <Card className="w-full max-w-md rounded-[24px] border-proofound-stone bg-white/90 shadow-[0_4px_24px_rgba(29,51,48,0.08)]">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-proofound-forest/10">
              <Clock3 className="h-5 w-5 text-proofound-forest" />
            </div>
            <CardTitle className="font-display text-2xl text-proofound-charcoal">
              Loading invitation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-sm leading-6 text-muted-foreground">
              We&apos;re checking the invite and your current account state.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-japandi-bg p-6">
        <Card className="w-full max-w-xl rounded-[24px] border-proofound-stone bg-white/90 shadow-[0_4px_24px_rgba(29,51,48,0.08)]">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-proofound-forest/10">
              <ShieldCheck className="h-5 w-5 text-proofound-forest" />
            </div>
            <CardTitle className="font-display text-2xl text-proofound-charcoal">
              Invitation unavailable
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-sm leading-6 text-muted-foreground">{error}</p>
            <p className="text-center text-sm leading-6 text-muted-foreground">
              Ask the company to send a new invite if needed.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Return home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invite || !organization) {
    return null;
  }

  const isTestFlow = invite.flowType === CANDIDATE_INVITE_FLOW_TYPE.TEST_MATCH;
  const isCompleted = invite.status === CANDIDATE_INVITE_STATUS.PROOF_SUBMITTED;
  const isClaimedByCurrentUser = Boolean(
    invite.status === CANDIDATE_INVITE_STATUS.CLAIMED && currentUser && invite.claimedByCurrentUser
  );

  const assignmentTitle = assignment?.role?.trim() || 'Untitled assignment';
  const assignmentSkills = assignment ? skillLabels(assignment.mustHaveSkills) : [];
  const verificationGates = (assignment?.verificationGates ?? [])
    .map((gate) => candidateVisibleVerificationGateLabel(gate))
    .filter((label): label is string => Boolean(label));
  const selectedProofPack = availableProofPacks.find((pack) => pack.id === proofPackId);
  const reviewProofPack = availableProofPacks.find((pack) => pack.id === reviewProofPackId);
  const headline = isTestFlow
    ? `Trial match for ${assignmentTitle}`
    : assignment
      ? assignmentTitle
      : 'Submission invite';
  const inviteDescription = isTestFlow
    ? `${organization.displayName} invited ${invite.maskedEmail} to start a trial match after reviewing this assignment context.`
    : assignment
      ? `${organization.displayName} invited ${invite.maskedEmail} to submit assignment-specific proof grounded in this role.`
      : `${organization.displayName} invited ${invite.maskedEmail} to submit scoped proof.`;
  const proofOnboardingHref = `/onboarding?next=${nextParam}`;
  const proofPackCreateLabel =
    availableProofPacks.length > 0 ? 'Create another Proof Pack' : 'Create first Proof Pack';
  const assignmentUnavailable = !assignment;

  return (
    <div className="min-h-screen bg-japandi-bg text-proofound-charcoal">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-8 md:py-12">
        <header className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)] lg:items-start">
          <section className="space-y-5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-proofound-forest">
              <span>{organization.displayName}</span>
              <span className="text-proofound-charcoal/35">/</span>
              <span>Assignment invite</span>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-proofound-charcoal/65">
                Assignment: {assignmentTitle}
              </p>
              <h1 className="font-display text-4xl font-semibold leading-tight text-proofound-charcoal md:text-5xl">
                {headline}
              </h1>
              <p className="max-w-3xl text-base leading-7 text-proofound-charcoal/75 md:text-lg">
                {inviteDescription} Review the work, proof expectations, practical constraints, and
                privacy posture before you continue.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="border-proofound-stone bg-white/60">
                {candidateInviteStatusLabel(invite.status)}
              </Badge>
              {assignment ? (
                <Badge variant="outline" className="border-proofound-stone bg-white/60">
                  {assignmentStatusLabel(assignment.status)}
                </Badge>
              ) : null}
              {assignment?.engagementType ? (
                <Badge variant="outline" className="border-proofound-stone bg-white/60">
                  {engagementTypeLabel(assignment.engagementType)}
                </Badge>
              ) : null}
            </div>
          </section>

          <aside className="rounded-lg border border-proofound-stone/80 bg-white/75 p-5 shadow-sm">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-proofound-forest" />
                <div>
                  <h2 className="text-sm font-semibold text-proofound-charcoal">
                    Private review first
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-proofound-charcoal/70">
                    Early review focuses on assignment-relevant proof and approved context. Identity
                    and contact details wait for a consented reveal step.
                  </p>
                </div>
              </div>

              <dl className="grid gap-3 border-t border-proofound-stone/70 pt-4 text-sm">
                <div>
                  <dt className="text-proofound-charcoal/55">Invited address</dt>
                  <dd className="font-medium text-proofound-charcoal">{invite.maskedEmail}</dd>
                </div>
                <div>
                  <dt className="text-proofound-charcoal/55">Invite expires</dt>
                  <dd className="font-medium text-proofound-charcoal">
                    {new Date(invite.expiresAt).toLocaleString()}
                  </dd>
                </div>
              </dl>

              <Button
                asChild={!assignmentUnavailable}
                disabled={assignmentUnavailable}
                className="w-full bg-proofound-forest text-white hover:bg-proofound-forest/90"
              >
                {assignmentUnavailable ? (
                  <span>
                    Assignment context unavailable
                    <ShieldCheck className="ml-2 h-4 w-4" />
                  </span>
                ) : (
                  <a href="#apply">
                    Submit proof
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                )}
              </Button>
            </div>
          </aside>
        </header>

        {assignment ? (
          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-proofound-stone/75 bg-white/70 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-proofound-forest" />
                <h2 className="text-base font-semibold text-proofound-charcoal">Role and focus</h2>
              </div>
              <div className="space-y-4 text-sm leading-6 text-proofound-charcoal/75">
                <div>
                  <p className="font-medium text-proofound-charcoal">Why this role exists</p>
                  <p>
                    {assignment.businessValue ||
                      'The organization has not added a role purpose yet.'}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-proofound-charcoal">Work summary</p>
                  <p>
                    {assignment.description ||
                      'The detailed work summary will be clarified inside the assignment corridor.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-proofound-stone/75 bg-white/70 p-5">
              <div className="mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-proofound-forest" />
                <h2 className="text-base font-semibold text-proofound-charcoal">
                  Proof expectations
                </h2>
              </div>
              <div className="space-y-4 text-sm leading-6 text-proofound-charcoal/75">
                <p>
                  {assignment.expectedImpact ||
                    'The organization will review one focused proof artifact tied to real work, ownership, and outcomes.'}
                </p>
                {assignmentSkills.length > 0 ? (
                  <div>
                    <p className="mb-2 font-medium text-proofound-charcoal">Relevant signals</p>
                    <div className="flex flex-wrap gap-2">
                      {assignmentSkills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="outline"
                          className="border-proofound-stone bg-proofound-parchment/70"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-lg border border-proofound-stone/75 bg-white/70 p-5">
              <div className="mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-proofound-forest" />
                <h2 className="text-base font-semibold text-proofound-charcoal">
                  Practical constraints
                </h2>
              </div>
              <dl className="grid gap-3 text-sm text-proofound-charcoal/75 sm:grid-cols-2">
                <div>
                  <dt className="text-proofound-charcoal/55">Engagement</dt>
                  <dd className="font-medium text-proofound-charcoal">
                    {engagementTypeLabel(assignment.engagementType)}
                  </dd>
                </div>
                <div>
                  <dt className="text-proofound-charcoal/55">Location / work mode</dt>
                  <dd className="font-medium text-proofound-charcoal">
                    {formatLocation(assignment)}
                  </dd>
                </div>
                <div>
                  <dt className="text-proofound-charcoal/55">Time commitment</dt>
                  <dd className="font-medium text-proofound-charcoal">{formatHours(assignment)}</dd>
                </div>
                <div>
                  <dt className="text-proofound-charcoal/55">Start window</dt>
                  <dd className="font-medium text-proofound-charcoal">
                    {formatStartWindow(assignment)}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-proofound-charcoal/55">Compensation</dt>
                  <dd className="font-medium text-proofound-charcoal">
                    {formatCompensation(assignment)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-lg border border-proofound-stone/75 bg-white/70 p-5">
              <div className="mb-4 flex items-center gap-2">
                <EyeOff className="h-5 w-5 text-proofound-forest" />
                <h2 className="text-base font-semibold text-proofound-charcoal">Review process</h2>
              </div>
              <div className="space-y-4 text-sm leading-6 text-proofound-charcoal/75">
                <p>
                  The organization reviews proof and outcomes first. Your direct identity, contact
                  information, and direct portfolio link stay hidden until a later reveal step that
                  requires your approval.
                </p>
                {verificationGates.length > 0 ? (
                  <div>
                    <p className="mb-2 font-medium text-proofound-charcoal">Verification checks</p>
                    <div className="flex flex-wrap gap-2">
                      {verificationGates.map((gate) => (
                        <Badge
                          key={gate}
                          variant="outline"
                          className="border-proofound-stone bg-proofound-parchment/70"
                        >
                          {gate}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p>
                    Verification is scoped to the proof you choose to share, not a broad background
                    profile.
                  </p>
                )}
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-lg border border-amber-200 bg-amber-50/80 p-5">
            <h2 className="text-base font-semibold text-amber-950">
              Assignment context unavailable
            </h2>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              This invite is missing the structured assignment context required for an
              assignment-specific proof submission. Ask {organization.displayName} to send a new
              assignment-bound invite before sharing proof.
            </p>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              Proof submission is paused here so owner-only proof, public portfolio links, and
              identity-bearing details cannot be routed into an unclear review.
            </p>
          </section>
        )}

        <section
          id="apply"
          className="grid gap-5 rounded-lg border border-proofound-forest/30 bg-proofound-parchment/80 p-5 md:grid-cols-[1fr_auto] md:items-center"
        >
          {error ? (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-900 md:col-span-2"
            >
              <p>{error}</p>
              {errorDetail ? (
                <p className="mt-2 text-xs leading-5 text-red-800">{errorDetail}</p>
              ) : null}
            </div>
          ) : null}

          {successMessage ? (
            <div
              role="status"
              aria-live="polite"
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900 md:col-span-2"
            >
              {successMessage}
            </div>
          ) : null}

          {assignmentUnavailable ? (
            <>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-proofound-forest" />
                  <h2 className="text-lg font-semibold text-proofound-charcoal">
                    Proof submission paused
                  </h2>
                </div>
                <p className="max-w-3xl text-sm leading-6 text-proofound-charcoal/70">
                  Submission invites must be tied to a structured assignment before Proof Packs can
                  be submitted for review.
                </p>
              </div>
              <div className="md:min-w-80">
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link href="/">Return home</Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-5 w-5 text-proofound-forest" />
                  <h2 className="text-lg font-semibold text-proofound-charcoal">
                    Submit proof for this assignment
                  </h2>
                </div>
                <p className="max-w-3xl text-sm leading-6 text-proofound-charcoal/70">
                  Continue when the assignment context is clear. The next step keeps the proof
                  submission tied to this role and asks for proof only after this context.
                </p>
              </div>

              <div
                className="grid gap-3 rounded-lg border border-proofound-stone bg-white/70 p-4 text-sm sm:grid-cols-3"
                data-testid="candidate-proof-submission-path"
              >
                <div className="space-y-1">
                  <p className="font-medium text-proofound-charcoal">1. Build proof</p>
                  <p className="text-xs leading-5 text-proofound-charcoal/60">
                    Use one claim or outcome tied to this assignment.
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-proofound-charcoal">2. Attach evidence</p>
                  <p className="text-xs leading-5 text-proofound-charcoal/60">
                    Attach a real artifact or link that supports the claim.
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-proofound-charcoal">3. Review privacy</p>
                  <p className="text-xs leading-5 text-proofound-charcoal/60">
                    Submit only after checking what the organization can see.
                  </p>
                </div>
              </div>

              <Button asChild variant="outline">
                <Link href={proofOnboardingHref}>
                  {proofPackCreateLabel}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              {!currentUser ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-700">
                    Continue with the invited email when you are ready to submit assignment proof.
                  </p>
                  <p className="text-xs leading-5 text-proofound-charcoal/60">
                    After account creation, privacy, export, and deletion controls are available
                    from individual privacy settings.
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <Button
                      asChild
                      className="w-full bg-proofound-forest text-white hover:bg-proofound-forest/90 sm:w-auto"
                    >
                      <Link href={`/signup/individual?next=${nextParam}`}>
                        Continue to proof submission
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full sm:w-auto">
                      <Link href={`/login?next=${nextParam}`}>Sign in</Link>
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="rounded-lg border border-proofound-stone bg-white/70 p-3 text-xs leading-5 text-proofound-charcoal/60">
                Minimum submission packet: one claim or outcome, one evidence artifact or link, one
                trust or verification signal, and one privacy confirmation.
              </div>

              {!isTestFlow && currentUser && !isCompleted && isClaimedByCurrentUser ? (
                <div className="space-y-5">
                  <p className="text-sm text-slate-700">
                    Create or choose one owner-only Proof Pack for this assignment. The submission
                    does not publish a public page or broaden visibility beyond this assignment.
                  </p>

                  <Button asChild variant="outline" className="w-full sm:w-auto">
                    <Link href={proofOnboardingHref}>
                      {proofPackCreateLabel}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>

                  <div className="space-y-3 rounded-lg border border-proofound-stone bg-white/70 p-4">
                    {availableProofPacks.length > 0 ? (
                      <div className="space-y-2">
                        <Label htmlFor="proof-pack-id">Owner-only Proof Pack</Label>
                        <select
                          id="proof-pack-id"
                          value={proofPackId}
                          onChange={(event) => {
                            setProofPackId(event.target.value);
                            setReviewProofPackId('');
                            setReviewConfirmed(false);
                          }}
                          className="flex h-11 w-full rounded-lg border border-proofound-stone bg-white px-4 py-2 text-sm text-proofound-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest"
                        >
                          {availableProofPacks.map((pack) => (
                            <option key={pack.id} value={pack.id}>
                              {pack.title}
                            </option>
                          ))}
                        </select>
                        {selectedProofPack ? (
                          <p className="text-xs leading-5 text-proofound-charcoal/60">
                            {selectedProofPack.summary ||
                              selectedProofPack.evidenceSummary ||
                              'Selected Proof Pack stays owner-only until you submit it for this assignment.'}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-proofound-charcoal">
                          No owner-only Proof Pack is ready for this assignment yet.
                        </p>
                        <p className="text-xs leading-5 text-proofound-charcoal/60">
                          Create one from your proof workspace, then return to this invite to review
                          and submit it for this assignment. Public Page links and legacy snippet
                          URLs are not accepted in this assignment flow.
                        </p>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      onClick={openProofPackReview}
                      disabled={submitting || availableProofPacks.length === 0}
                      className="w-full sm:w-auto"
                    >
                      Review assignment proof
                    </Button>
                  </div>

                  {reviewProofPackId ? (
                    <div className="space-y-4 rounded-lg border border-proofound-forest/50 bg-white p-4">
                      <div>
                        <p className="text-sm font-semibold text-proofound-charcoal">
                          Final review before submission
                        </p>
                        <p className="mt-1 text-sm leading-6 text-proofound-charcoal/70">
                          Confirm what {organization.displayName} can see before this proof
                          submission is sent.
                        </p>
                      </div>

                      <div className="grid gap-3 text-sm md:grid-cols-2">
                        <div className="rounded-md border border-proofound-stone bg-proofound-parchment/50 p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-proofound-charcoal/55">
                            Submitted for
                          </p>
                          <p className="mt-1 font-medium text-proofound-charcoal">
                            {assignmentTitle} at {organization.displayName}
                          </p>
                        </div>
                        <div className="rounded-md border border-proofound-stone bg-proofound-parchment/50 p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-proofound-charcoal/55">
                            Proof/context included
                          </p>
                          <p className="mt-1 font-medium text-proofound-charcoal">
                            {reviewProofPack?.title || `Proof Pack ${reviewProofPackId}`}
                          </p>
                          {reviewProofPack?.evidenceSummary || reviewProofPack?.outcomesSummary ? (
                            <p className="mt-1 text-xs leading-5 text-proofound-charcoal/60">
                              {[reviewProofPack?.evidenceSummary, reviewProofPack?.outcomesSummary]
                                .filter(Boolean)
                                .join(' ')}
                            </p>
                          ) : null}
                        </div>
                        <div className="rounded-md border border-proofound-stone bg-proofound-parchment/50 p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-proofound-charcoal/55">
                            Employer visibility
                          </p>
                          <p className="mt-1 leading-6 text-proofound-charcoal/75">
                            Owner-only proof-submission packet. It does not publish your Public
                            Page, broaden visibility, expose a share link, or reveal contact
                            details.
                          </p>
                        </div>
                        <div className="rounded-md border border-proofound-stone bg-proofound-parchment/50 p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-proofound-charcoal/55">
                            Verification requests
                          </p>
                          <p className="mt-1 leading-6 text-proofound-charcoal/75">
                            None will be sent from this submission. Save-without-sending and
                            send-now choices stay inside explicit verification flows.
                          </p>
                        </div>
                      </div>

                      <div className="rounded-md border border-proofound-stone bg-proofound-parchment/40 p-3 text-sm leading-6 text-proofound-charcoal/70">
                        Intro, reveal, interview, decision, and feedback states continue in
                        Communications. Identity-bearing reveal still requires the
                        participant-controlled reveal step.
                      </div>

                      <label className="flex items-start gap-3 text-sm leading-6 text-proofound-charcoal/75">
                        <input
                          id="candidate-submit-review-confirmed"
                          type="checkbox"
                          className="mt-1"
                          checked={reviewConfirmed}
                          onChange={(event) => setReviewConfirmed(event.target.checked)}
                        />
                        <span>
                          I reviewed the visibility summary and confirm this owner-only Proof Pack
                          should be submitted to {organization.displayName}.
                        </span>
                      </label>

                      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setReviewProofPackId('');
                            setReviewConfirmed(false);
                          }}
                          disabled={submitting}
                        >
                          Back
                        </Button>
                        <Button
                          type="button"
                          onClick={submitReviewedProofPack}
                          disabled={submitting || !reviewConfirmed}
                          className="w-full sm:w-auto"
                        >
                          Submit reviewed proof
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  <div className="rounded-lg border border-proofound-stone bg-white/70 p-3 text-xs leading-5 text-proofound-charcoal/60">
                    Account controls: manage privacy, export, and deletion from{' '}
                    <Link
                      href={accountSaveControls.privacyDataControlsUrl}
                      className="font-medium text-proofound-forest"
                    >
                      privacy settings
                    </Link>
                    .
                  </div>
                </div>
              ) : null}

              {isTestFlow && isClaimedByCurrentUser ? (
                <div className="space-y-3">
                  <p className="text-sm text-emerald-700">
                    Trial match accepted. You can now use messages and matching.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {invite.communicationsUrl ? (
                      <Link href={invite.communicationsUrl}>
                        <Button>Open Communications</Button>
                      </Link>
                    ) : null}
                    <Link href="/app/i/matching">
                      <Button variant="outline">Open Matching</Button>
                    </Link>
                  </div>
                </div>
              ) : null}

              {!isTestFlow && isCompleted ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" />
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-emerald-900">
                          Saved privately to your submission workspace
                        </p>
                        <p className="text-sm leading-6 text-emerald-800">
                          Assignment proof is submitted for blind-first review. Your reusable Proof
                          Pack, privacy settings, export controls, and deletion controls stay in
                          your account.
                        </p>
                        <div className="grid gap-2 text-xs text-emerald-900 sm:grid-cols-2">
                          <span className="flex items-center gap-2">
                            <EyeOff className="h-3.5 w-3.5" />
                            Public Page not auto-published
                          </span>
                          <span className="flex items-center gap-2">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Assignment review state remains separate
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Button asChild className="w-full sm:w-auto">
                      <Link href={accountSaveControls.proofWorkspaceUrl}>Open Proof Packs</Link>
                    </Button>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                      <Link
                        href={accountSaveControls.profileVisibilityUrl}
                        className="font-medium text-proofound-forest hover:text-proofound-charcoal"
                      >
                        Visibility
                      </Link>
                      <Link
                        href={accountSaveControls.privacyDataControlsUrl}
                        className="font-medium text-proofound-forest hover:text-proofound-charcoal"
                      >
                        Export or delete
                      </Link>
                      <Link
                        href={accountSaveControls.assignmentReviewUrl}
                        className="font-medium text-proofound-forest hover:text-proofound-charcoal"
                      >
                        Assignment review
                      </Link>
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
