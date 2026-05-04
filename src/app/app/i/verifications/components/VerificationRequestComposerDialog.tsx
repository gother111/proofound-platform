'use client';

import { useMemo, useState } from 'react';
import { Loader2, Send, Wand2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api/fetch';
import type { VerificationComposerProofPackOption } from '@/lib/verification/request-feed';
import {
  CUSTOM_VERIFICATION_SELECTABLE_RELATIONSHIPS,
  relationshipDisplayLabel,
  type SelectableCustomVerificationRelationship,
} from '@/lib/verification/custom-verification';
import type { VerificationComposerField, VerificationScope } from '@/lib/ai/verification-composer';

type ComposerDraft = {
  suggestionId?: string | null;
  fallback?: boolean;
  subject: string;
  message: string;
  claimScope: string;
  verificationQuestions: string[];
  privacyNotes: string[];
  tooBroadWarnings: string[];
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proofPacks: VerificationComposerProofPackOption[];
  onSent?: () => void;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FIELD_OPTIONS: Array<{ value: VerificationComposerField; label: string }> = [
  { value: 'title', label: 'Title' },
  { value: 'claim_statement', label: 'Claim' },
  { value: 'ownership_statement', label: 'Ownership' },
  { value: 'outcome_summary', label: 'Outcome' },
  { value: 'timeframe', label: 'Timeframe' },
  { value: 'evidence_titles', label: 'Evidence titles' },
];

const SCOPE_OPTIONS: Array<{ value: VerificationScope; label: string }> = [
  { value: 'observed_behavior', label: 'Observed behavior' },
  { value: 'ownership', label: 'Ownership' },
  { value: 'outcome_observation', label: 'Outcome observation' },
  { value: 'artifact_familiarity', label: 'Artifact familiarity' },
  { value: 'relationship_fact', label: 'Relationship fact' },
];

function recordSuggestionEvent(
  suggestionId: string | null | undefined,
  eventType: 'accepted' | 'edited' | 'dismissed' | 'published',
  field: string,
  edited?: boolean
) {
  if (!suggestionId) return;
  void apiFetch('/api/ai/suggestions/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      suggestionId,
      eventType,
      field,
      fields: [{ field, edited, applied: eventType === 'accepted' || eventType === 'published' }],
      metadata: { uiSurface: 'verification_request_composer' },
    }),
  }).catch(() => undefined);
}

export function VerificationRequestComposerDialog({
  open,
  onOpenChange,
  proofPacks,
  onSent,
}: Props) {
  const [proofPackId, setProofPackId] = useState(proofPacks[0]?.proofPackId || '');
  const [relationship, setRelationship] =
    useState<SelectableCustomVerificationRelationship>('peer');
  const [verificationScope, setVerificationScope] =
    useState<VerificationScope>('observed_behavior');
  const [selectedFields, setSelectedFields] = useState<VerificationComposerField[]>([
    'title',
    'claim_statement',
    'ownership_statement',
    'outcome_summary',
  ]);
  const [verifierEmail, setVerifierEmail] = useState('');
  const [draft, setDraft] = useState<ComposerDraft | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [sending, setSending] = useState(false);
  const [reviewed, setReviewed] = useState(false);

  const selectedProofPack = useMemo(
    () => proofPacks.find((pack) => pack.proofPackId === proofPackId) || proofPacks[0] || null,
    [proofPackId, proofPacks]
  );

  const reset = () => {
    setProofPackId(proofPacks[0]?.proofPackId || '');
    setRelationship('peer');
    setVerificationScope('observed_behavior');
    setSelectedFields(['title', 'claim_statement', 'ownership_statement', 'outcome_summary']);
    setVerifierEmail('');
    setDraft(null);
    setReviewed(false);
  };

  const dismissDraft = () => {
    recordSuggestionEvent(draft?.suggestionId, 'dismissed', 'composer');
    reset();
    onOpenChange(false);
  };

  const toggleField = (field: VerificationComposerField) => {
    setDraft(null);
    setReviewed(false);
    setSelectedFields((current) => {
      if (current.includes(field)) {
        return current.length === 1 ? current : current.filter((item) => item !== field);
      }
      return [...current, field];
    });
  };

  const handleDraft = async () => {
    if (!selectedProofPack) {
      toast.error('Choose one Proof Pack before drafting.');
      return;
    }

    setDrafting(true);
    setReviewed(false);
    try {
      const response = await apiFetch('/api/ai/verifications/compose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proofPackId: selectedProofPack.proofPackId,
          claimId: selectedProofPack.claimId,
          verifierRelationshipType: relationshipDisplayLabel(relationship),
          verificationScope,
          selectedPublicSafeProofFields: selectedFields,
          idempotencyKey: `${selectedProofPack.proofPackId}:${Date.now()}`,
        }),
      });

      const body = await response.json();
      if (!response.ok) {
        toast.error(body.error || 'Failed to draft verification request.');
        return;
      }

      setDraft(body as ComposerDraft);
    } catch (error) {
      console.error('Failed to draft verification request:', error);
      toast.error('Failed to draft verification request.');
    } finally {
      setDrafting(false);
    }
  };

  const handleSend = async () => {
    if (!selectedProofPack || !draft) {
      return;
    }
    if (!reviewed) {
      toast.error('Review the draft before sending.');
      return;
    }
    if (!EMAIL_REGEX.test(verifierEmail.trim())) {
      toast.error('Enter a valid verifier email.');
      return;
    }

    setSending(true);
    try {
      const response = await apiFetch('/api/verification/requests/skill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          skillId: selectedProofPack.primarySubjectId,
          verifierEmail: verifierEmail.trim(),
          relationship,
          message: draft.message,
        }),
      });

      const body = await response.json();
      if (!response.ok) {
        toast.error(body.error || 'Failed to send verification request.');
        return;
      }

      toast.success('Verification request sent.');
      recordSuggestionEvent(draft.suggestionId, 'published', 'verification_request');
      reset();
      onOpenChange(false);
      onSent?.();
    } catch (error) {
      console.error('Failed to send drafted verification request:', error);
      toast.error('Failed to send verification request.');
    } finally {
      setSending(false);
    }
  };

  const noProofPacks = proofPacks.length === 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          dismissDraft();
          return;
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto bg-japandi-bg">
        <DialogHeader>
          <DialogTitle>Draft scoped request</DialogTitle>
          <DialogDescription>
            AI suggestions are drafts. They do not verify, score, rank, or evaluate anyone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Proof Pack</Label>
            <Select
              value={selectedProofPack?.proofPackId || ''}
              onValueChange={(value) => {
                setProofPackId(value);
                setDraft(null);
                setReviewed(false);
              }}
              disabled={noProofPacks}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a Proof Pack" />
              </SelectTrigger>
              <SelectContent>
                {proofPacks.map((pack) => (
                  <SelectItem key={pack.proofPackId} value={pack.proofPackId}>
                    {pack.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProofPack ? (
              <p className="text-xs leading-5 text-muted-foreground">
                Claim: {selectedProofPack.claimStatement}
              </p>
            ) : (
              <p className="text-xs leading-5 text-muted-foreground">
                Add a skill-linked Proof Pack before drafting a verification request here.
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Verifier relationship</Label>
              <Select
                value={relationship}
                onValueChange={(value) => {
                  setRelationship(value as SelectableCustomVerificationRelationship);
                  setDraft(null);
                  setReviewed(false);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CUSTOM_VERIFICATION_SELECTABLE_RELATIONSHIPS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {relationshipDisplayLabel(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Verification scope</Label>
              <Select
                value={verificationScope}
                onValueChange={(value) => {
                  setVerificationScope(value as VerificationScope);
                  setDraft(null);
                  setReviewed(false);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCOPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label>Selected public-safe proof fields</Label>
              <Badge variant="outline">{selectedFields.length} selected</Badge>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {FIELD_OPTIONS.map((field) => (
                <label
                  key={field.value}
                  className="flex items-center gap-2 rounded-md border border-proofound-stone bg-white p-2.5 text-sm"
                >
                  <Checkbox
                    checked={selectedFields.includes(field.value)}
                    onCheckedChange={() => toggleField(field.value)}
                  />
                  <span>{field.label}</span>
                </label>
              ))}
            </div>
          </div>

          <Button
            type="button"
            onClick={handleDraft}
            disabled={drafting || noProofPacks || selectedFields.length === 0}
            className="bg-proofound-forest text-white hover:bg-proofound-forest/90"
          >
            {drafting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            Draft scoped request
          </Button>

          {draft && (
            <div className="space-y-4 rounded-lg border border-proofound-stone bg-white p-4">
              {draft.fallback ? (
                <div className="rounded-md border border-proofound-stone bg-japandi-bg px-3 py-2 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Manual checklist draft</p>
                  <p>
                    Provider assistance was unavailable, so this deterministic draft uses selected
                    public-safe fields only. Manual editing still works.
                  </p>
                </div>
              ) : (
                <div className="rounded-md border border-proofound-stone bg-japandi-bg px-3 py-2 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Draft assistance</p>
                  <p>Review, edit, accept, dismiss, or ignore this draft before sending.</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="verification-draft-subject">Subject</Label>
                <Input
                  id="verification-draft-subject"
                  value={draft.subject}
                  onChange={(event) => {
                    setDraft({ ...draft, subject: event.target.value });
                    setReviewed(false);
                  }}
                  onBlur={() =>
                    recordSuggestionEvent(draft.suggestionId, 'edited', 'subject', true)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="verification-draft-message">Message</Label>
                <Textarea
                  id="verification-draft-message"
                  rows={7}
                  value={draft.message}
                  onChange={(event) => {
                    setDraft({ ...draft, message: event.target.value });
                    setReviewed(false);
                  }}
                  onBlur={() =>
                    recordSuggestionEvent(draft.suggestionId, 'edited', 'message', true)
                  }
                />
              </div>

              <div className="space-y-2 text-sm">
                <p className="font-medium text-proofound-charcoal">Scoped questions</p>
                <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                  {draft.verificationQuestions.map((question) => (
                    <li key={question}>{question}</li>
                  ))}
                </ul>
              </div>

              {[...draft.privacyNotes, ...draft.tooBroadWarnings].length > 0 && (
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-proofound-charcoal">Review notes</p>
                  <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                    {[...draft.privacyNotes, ...draft.tooBroadWarnings].map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="composer-verifier-email">Verifier email address</Label>
                <Input
                  id="composer-verifier-email"
                  type="email"
                  value={verifierEmail}
                  onChange={(event) => setVerifierEmail(event.target.value)}
                  placeholder="colleague@example.com"
                  autoComplete="email"
                />
              </div>

              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <Checkbox
                  id="composer-reviewed-draft"
                  checked={reviewed}
                  onCheckedChange={(value) => {
                    const nextReviewed = value === true;
                    setReviewed(nextReviewed);
                    if (nextReviewed) {
                      recordSuggestionEvent(draft.suggestionId, 'accepted', 'composer_review');
                    }
                  }}
                />
                <Label
                  htmlFor="composer-reviewed-draft"
                  className="text-sm font-normal leading-5 text-muted-foreground"
                >
                  I reviewed this claim-scoped draft and want to send it.
                </Label>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={dismissDraft} disabled={sending}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={!draft || !reviewed || sending || !EMAIL_REGEX.test(verifierEmail.trim())}
            className="bg-proofound-forest text-white hover:bg-proofound-forest/90"
          >
            {sending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Send request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
