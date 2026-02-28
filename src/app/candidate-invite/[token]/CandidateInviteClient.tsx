'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api/fetch';
import {
  CANDIDATE_INVITE_FLOW_TYPE,
  CANDIDATE_INVITE_STATUS,
  CANDIDATE_PROOF_CARD_DEFAULT_FIELDS,
} from '@/lib/candidate-invites-shared';

type InviteState = {
  id: string;
  status: string;
  flowType: 'proof_card' | 'test_match';
  assignmentId: string | null;
  maskedEmail: string;
  expiresAt: string;
  claimedAt: string | null;
  claimedByProfileId: string | null;
  acceptedAt: string | null;
  acceptedByProfileId: string | null;
  matchId: string | null;
  conversationId: string | null;
  proofSubmittedAt: string | null;
  proofShareToken: string | null;
};

type OrganizationState = {
  id: string;
  slug: string;
  displayName: string;
  logoUrl: string | null;
};

type AssignmentState = {
  id: string;
  role: string | null;
  status: string;
  createdAt: string;
};

type CurrentUserState = {
  id: string;
  email: string;
};

interface CandidateInviteClientProps {
  token: string;
}

function extractShareToken(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    return '';
  }

  if (!trimmed.includes('/')) {
    return trimmed;
  }

  const withoutQuery = trimmed.split('?')[0];
  const parts = withoutQuery.split('/').filter(Boolean);
  return parts[parts.length - 1] ?? '';
}

export function CandidateInviteClient({ token }: CandidateInviteClientProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invite, setInvite] = useState<InviteState | null>(null);
  const [organization, setOrganization] = useState<OrganizationState | null>(null);
  const [assignment, setAssignment] = useState<AssignmentState | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUserState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [existingShareToken, setExistingShareToken] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const nextParam = useMemo(() => encodeURIComponent(`/candidate-invite/${token}`), [token]);

  const loadState = useCallback(async () => {
    setLoading(true);
    setError(null);

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
        if (inviteResponse.status === 404) {
          setError('This invitation could not be found.');
          return;
        }
        if (inviteResponse.status === 410) {
          setError('This invitation has expired.');
          return;
        }

        const payload = await inviteResponse.json().catch(() => null);
        setError(payload?.error ?? 'Unable to load invitation.');
        return;
      }

      const invitePayload = await inviteResponse.json();
      setInvite(invitePayload.invite);
      setOrganization(invitePayload.organization);
      setAssignment(invitePayload.assignment ?? null);

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
      console.error('Failed to load candidate invite state:', loadError);
      setError('Unable to load invitation.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadState();
  }, [loadState]);

  const claimInvite = async () => {
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await apiFetch(`/api/candidate-invites/${token}/claim`, {
        method: 'POST',
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(payload?.error ?? 'Failed to claim invite.');
        return;
      }

      if (invite?.flowType === CANDIDATE_INVITE_FLOW_TYPE.TEST_MATCH) {
        setSuccessMessage('Test match accepted. You can now message the organization.');
      } else {
        setSuccessMessage('Invite claimed. You can now submit your Proof Card.');
      }

      await loadState();
    } catch (claimError) {
      console.error('Failed to claim invite:', claimError);
      setError('Failed to claim invite.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitProofCard = async (shareToken: string) => {
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await apiFetch(`/api/candidate-invites/${token}/proof-card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shareToken }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(payload?.error ?? 'Failed to submit Proof Card.');
        return;
      }

      setSuccessMessage('Proof Card submitted successfully.');
      await loadState();
    } catch (submitError) {
      console.error('Failed to submit proof card:', submitError);
      setError('Failed to submit Proof Card.');
    } finally {
      setSubmitting(false);
    }
  };

  const generateAndSubmitProofCard = async () => {
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const snippetResponse = await apiFetch('/api/profile/snippet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileType: 'individual',
          fields: CANDIDATE_PROOF_CARD_DEFAULT_FIELDS,
          format: 'card',
          theme: 'auto',
        }),
      });

      const snippetPayload = await snippetResponse.json().catch(() => null);
      if (!snippetResponse.ok) {
        setError(snippetPayload?.error ?? 'Failed to generate Proof Card.');
        return;
      }

      const shareToken = snippetPayload?.snippet?.shareToken;
      if (!shareToken || typeof shareToken !== 'string') {
        setError('Proof Card generation returned an invalid token.');
        return;
      }

      await submitProofCard(shareToken);
    } catch (generationError) {
      console.error('Failed to generate proof card:', generationError);
      setError('Failed to generate Proof Card.');
      setSubmitting(false);
    }
  };

  const submitExistingProofCard = async () => {
    const shareToken = extractShareToken(existingShareToken);
    if (!shareToken) {
      setError('Enter a valid Proof Card share token or /p/ URL.');
      return;
    }

    await submitProofCard(shareToken);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F6F1] flex items-center justify-center p-6">
        <p className="text-sm text-slate-600">Loading invitation...</p>
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen bg-[#F7F6F1] flex items-center justify-center p-6">
        <Card className="max-w-xl w-full">
          <CardHeader>
            <CardTitle>Invitation unavailable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">{error}</p>
            <p className="text-sm text-slate-600">
              Ask the company to send a new invite if needed.
            </p>
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
    invite.status === CANDIDATE_INVITE_STATUS.CLAIMED &&
      currentUser &&
      invite.claimedByProfileId === currentUser.id
  );

  const headline = isTestFlow ? 'Test invite' : 'Candidate invite';
  const inviteDescription = isTestFlow
    ? `${organization.displayName} invited ${invite.maskedEmail} to start a beta test match${
        assignment?.role ? ` for ${assignment.role}` : ''
      }.`
    : `${organization.displayName} invited ${invite.maskedEmail} to submit a Proof Card.`;

  return (
    <div className="min-h-screen bg-[#F7F6F1] flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <CardTitle>{headline}</CardTitle>
            <Badge variant="outline">{invite.status}</Badge>
          </div>
          <p className="text-sm text-slate-600">{inviteDescription}</p>
          {assignment ? (
            <p className="text-xs text-slate-500">
              Assignment: {assignment.role || 'Untitled'} ({assignment.status})
            </p>
          ) : null}
          <p className="text-xs text-slate-500">
            Expires on {new Date(invite.expiresAt).toLocaleString()}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {successMessage ? <p className="text-sm text-emerald-700">{successMessage}</p> : null}

          {!currentUser ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-700">
                Sign in or create an account using the invited email to continue.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href={`/login?next=${nextParam}`}>
                  <Button>Sign in</Button>
                </Link>
                <Link href={`/signup/individual?next=${nextParam}`}>
                  <Button variant="outline">Create account</Button>
                </Link>
              </div>
            </div>
          ) : null}

          {currentUser && invite.status === CANDIDATE_INVITE_STATUS.PENDING ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-700">
                Signed in as <strong>{currentUser.email}</strong>.
              </p>
              <Button onClick={claimInvite} disabled={submitting}>
                {isTestFlow ? 'Accept test invite' : 'Claim invite'}
              </Button>
            </div>
          ) : null}

          {!isTestFlow && currentUser && !isCompleted && isClaimedByCurrentUser ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-700">
                Create a new Proof Card with invite-safe defaults, or submit an existing one.
              </p>

              <Button onClick={generateAndSubmitProofCard} disabled={submitting}>
                Generate and submit Proof Card
              </Button>

              <div className="space-y-2">
                <Label htmlFor="proof-share-token">Existing Proof Card token or URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="proof-share-token"
                    value={existingShareToken}
                    onChange={(event) => setExistingShareToken(event.target.value)}
                    placeholder="token or https://proofound.io/p/<token>"
                  />
                  <Button variant="outline" onClick={submitExistingProofCard} disabled={submitting}>
                    Submit
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {isTestFlow && isClaimedByCurrentUser ? (
            <div className="space-y-3">
              <p className="text-sm text-emerald-700">
                Test match accepted. You can now use messages and matching.
              </p>
              <div className="flex flex-wrap gap-2">
                {invite.conversationId ? (
                  <Link href={`/app/i/messages?conversation=${invite.conversationId}`}>
                    <Button>Open Messages</Button>
                  </Link>
                ) : null}
                <Link href="/app/i/matching">
                  <Button variant="outline">Open Matching</Button>
                </Link>
              </div>
            </div>
          ) : null}

          {!isTestFlow && isCompleted ? (
            <div className="space-y-3">
              <p className="text-sm text-emerald-700">
                Proof Card submitted. The company can now review it.
              </p>
              {invite.proofShareToken ? (
                <Link href={`/p/${invite.proofShareToken}`} target="_blank">
                  <Button variant="outline">Open submitted Proof Card</Button>
                </Link>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
