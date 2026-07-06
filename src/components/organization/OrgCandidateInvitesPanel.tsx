'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api/fetch';
import { candidateInviteStatusLabel } from '@/lib/copy/labels';

interface CandidateInviteRow {
  id: string;
  inviteeEmail: string;
  status: 'pending' | 'claimed' | 'proof_submitted' | 'revoked' | 'expired';
  expiresAt: string;
  invitedBy: string | null;
  claimedByProfileId: string | null;
  claimedAt: string | null;
  proofSnippetId: string | null;
  proofSubmittedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
  claimedProfileHandle: string | null;
  claimedProfileName: string | null;
}

interface OrgCandidateInvitesPanelProps {
  orgId: string;
}

function parseEmails(raw: string): string[] {
  return raw
    .split(/[\n,;]+/g)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function OrgCandidateInvitesPanel({ orgId }: OrgCandidateInvitesPanelProps) {
  const [invites, setInvites] = useState<CandidateInviteRow[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [emailsInput, setEmailsInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [canManage, setCanManage] = useState(false);
  const inviteEmailsInputRef = useRef<HTMLTextAreaElement | null>(null);

  const loadInvites = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiFetch(`/api/organizations/${orgId}/candidate-invites`);
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.error ?? 'Failed to load invited candidates.');
        setInvites([]);
        return;
      }

      setInvites(payload?.invites ?? []);
      setCanManage(Boolean(payload?.permissions?.canManage));
    } catch (loadError) {
      console.error('Failed to load candidate invites:', loadError);
      setError('Failed to load invited candidates.');
      setInvites([]);
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    void loadInvites();
  }, [loadInvites]);

  const filteredInvites = useMemo(() => {
    if (filter === 'all') return invites;
    return invites.filter((invite) => invite.status === filter);
  }, [invites, filter]);

  const submitInvites = async () => {
    const emails = parseEmails(emailsInput);
    if (emails.length === 0) {
      setError('Enter at least one email address.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiFetch(`/api/organizations/${orgId}/candidate-invites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emails }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(payload?.error ?? 'Failed to send candidate invites.');
        return;
      }

      const duplicateCount = Array.isArray(payload?.duplicates) ? payload.duplicates.length : 0;
      setSuccess(
        duplicateCount > 0
          ? `Sent ${payload?.createdCount ?? 0} invite(s). ${duplicateCount} already had active invites.`
          : `Sent ${payload?.createdCount ?? 0} invite(s).`
      );
      setEmailsInput('');
      await loadInvites();
    } catch (submitError) {
      console.error('Failed to send candidate invites:', submitError);
      setError('Failed to send candidate invites.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateInvite = async (inviteId: string, action: 'resend' | 'revoke') => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiFetch(`/api/organizations/${orgId}/candidate-invites/${inviteId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(payload?.error ?? `Failed to ${action} invite.`);
        return;
      }

      setSuccess(action === 'resend' ? 'Invite resent.' : 'Invite revoked.');
      await loadInvites();
    } catch (updateError) {
      console.error(`Failed to ${action} invite:`, updateError);
      setError(`Failed to ${action} invite.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const focusInviteForm = () => {
    setFilter('all');
    inviteEmailsInputRef.current?.focus();
  };

  const isFirstInviteEmptyState = !isLoading && invites.length === 0 && filter === 'all';

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold text-primary-500">Invited candidates</h2>
        <p className="text-sm text-neutral-dark-600">
          Invite candidates by email, then review submitted Proof Cards in one queue.
        </p>
      </header>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      {canManage ? (
        <Card className="p-4 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="candidate-invite-emails">Invite candidate emails</Label>
            <textarea
              ref={inviteEmailsInputRef}
              id="candidate-invite-emails"
              value={emailsInput}
              onChange={(event) => setEmailsInput(event.target.value)}
              placeholder="candidate@company.com, another@domain.com"
              className="min-h-24 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-neutral-dark-500">
              Separate multiple emails with commas, semicolons, or new lines.
            </p>
            <Button onClick={submitInvites} disabled={isSubmitting}>
              Send invites
            </Button>
          </div>
        </Card>
      ) : null}

      <div className="flex items-center gap-2">
        <Label htmlFor="invite-status-filter" className="text-sm text-neutral-dark-600">
          Status
        </Label>
        <select
          id="invite-status-filter"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="h-9 rounded-md border border-neutral-300 bg-white px-2 text-sm"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="claimed">Claimed</option>
          <option value="proof_submitted">Proof submitted</option>
          <option value="revoked">Revoked</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {isLoading ? (
        <Card className="p-6">
          <p className="text-sm text-neutral-dark-600">Loading invited candidates...</p>
        </Card>
      ) : isFirstInviteEmptyState ? (
        <Card className="p-12 flex flex-col items-center justify-center text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex max-w-xl flex-col items-center justify-center space-y-3"
          >
            <div className="space-y-1">
              <p className="text-lg font-semibold text-primary-500">No applicants invited yet</p>
              <p className="text-sm text-muted-foreground">
                Candidate submissions will appear here after an invited applicant claims the link
                and submits a proof card.
              </p>
            </div>
            {canManage ? (
              <Button onClick={focusInviteForm} disabled={isSubmitting}>
                Invite your first applicant — they&apos;ll answer with structured proof instead of a
                CV
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Ask an owner or manager to invite the first applicant.
              </p>
            )}
          </motion.div>
        </Card>
      ) : filteredInvites.length === 0 ? (
        <Card className="p-12 flex flex-col items-center justify-center text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center space-y-3"
          >
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg
                className="absolute inset-0 w-full h-full text-muted-foreground/30 animate-pulse"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>
            </div>
            <div className="space-y-1">
              <p className="text-base font-medium">No candidates found</p>
              <p className="text-sm text-muted-foreground">
                There are no candidates matching the current filter.
              </p>
            </div>
          </motion.div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredInvites.map((invite) => {
            const canResend = canManage && invite.status === 'pending';
            const canRevoke =
              canManage && !['revoked', 'expired', 'proof_submitted'].includes(invite.status);

            return (
              <Card key={invite.id} className="p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-neutral-dark-700">
                      {invite.inviteeEmail}
                    </p>
                    <p className="text-xs text-neutral-dark-500">
                      Invited {new Date(invite.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline">{candidateInviteStatusLabel(invite.status)}</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-neutral-dark-600">
                  <p>Expires: {new Date(invite.expiresAt).toLocaleString()}</p>
                  <p>
                    Claimed: {invite.claimedAt ? new Date(invite.claimedAt).toLocaleString() : 'No'}
                  </p>
                  <p>
                    Submitted:{' '}
                    {invite.proofSubmittedAt
                      ? new Date(invite.proofSubmittedAt).toLocaleString()
                      : 'No'}
                  </p>
                </div>

                {invite.claimedProfileName || invite.claimedProfileHandle ? (
                  <p className="text-xs text-neutral-dark-600">
                    Claimed by:{' '}
                    <span className="font-medium">
                      {invite.claimedProfileName || invite.claimedProfileHandle}
                    </span>
                  </p>
                ) : null}
                <div className="flex items-center gap-2">
                  {canResend ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isSubmitting}
                      onClick={() => updateInvite(invite.id, 'resend')}
                    >
                      Resend
                    </Button>
                  ) : null}
                  {canRevoke ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isSubmitting}
                      onClick={() => updateInvite(invite.id, 'revoke')}
                    >
                      Revoke
                    </Button>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
