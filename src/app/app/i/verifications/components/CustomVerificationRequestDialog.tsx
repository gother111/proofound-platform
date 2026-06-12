'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Loader2, MailCheck, RefreshCcw, Send } from 'lucide-react';
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
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';
import {
  CUSTOM_VERIFICATION_SELECTABLE_RELATIONSHIPS,
  relationshipDisplayLabel,
  type SelectableCustomVerificationRelationship,
} from '@/lib/verification/custom-verification-labels';

type ArtifactType =
  | 'skill'
  | 'experience'
  | 'education'
  | 'impact_story'
  | 'project'
  | 'volunteering';

type Artifact = {
  id: string;
  type: ArtifactType;
  label: string;
  subtitle?: string;
};

type ArtifactsResponse = {
  artifacts: Record<ArtifactType, Artifact[]>;
  total: number;
};

type EmailHintKind = 'verifier_email_ready';
type SubmissionFeedback = {
  title: string;
  message: string;
};

const GROUP_LABELS: Record<ArtifactType, string> = {
  skill: 'Skills',
  experience: 'Work and Experience',
  education: 'Education',
  impact_story: 'Impact Stories',
  project: 'Projects',
  volunteering: 'Volunteering',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CUSTOM_VERIFICATION_SEND_FAILED_MESSAGE =
  'Custom verification request could not be sent. Your selections are unchanged; please try again.';

function emptyArtifactsByGroup(): Record<ArtifactType, Artifact[]> {
  return {
    skill: [],
    experience: [],
    education: [],
    impact_story: [],
    project: [],
    volunteering: [],
  };
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
};

export function CustomVerificationRequestDialog({ open, onOpenChange, onCreated }: Props) {
  const [loadingArtifacts, setLoadingArtifacts] = useState(false);
  const [artifactLoadError, setArtifactLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [artifactsByGroup, setArtifactsByGroup] =
    useState<Record<ArtifactType, Artifact[]>>(emptyArtifactsByGroup);

  const [verifierEmail, setVerifierEmail] = useState('');
  const [relationship, setRelationship] =
    useState<SelectableCustomVerificationRelationship>('peer');
  const [message, setMessage] = useState('');
  const [selectedArtifacts, setSelectedArtifacts] = useState<Record<string, Artifact>>({});
  const [submissionFeedback, setSubmissionFeedback] = useState<SubmissionFeedback | null>(null);

  const [emailHint, setEmailHint] = useState<EmailHintKind | null>(null);
  const [loadingHint, setLoadingHint] = useState(false);

  const selectedCount = useMemo(() => Object.keys(selectedArtifacts).length, [selectedArtifacts]);

  const loadArtifacts = useCallback(async () => {
    if (!open) {
      return;
    }

    setLoadingArtifacts(true);
    setArtifactLoadError(null);

    try {
      const response = await fetch('/api/verification/requests/custom/artifacts', {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Could not load artifacts');
      }

      const data = (await response.json()) as ArtifactsResponse;
      setArtifactsByGroup(data.artifacts || emptyArtifactsByGroup());
    } catch (error) {
      dispatchClientErrorDiagnostic('verifications.custom_dialog.artifacts_load_failed', error);
      setArtifactsByGroup(emptyArtifactsByGroup());
      setSelectedArtifacts({});
      setArtifactLoadError(
        'Your verification drafts are still safe. Retry artifact loading before sending this request.'
      );
      toast.error('Could not load unverified artifacts. Please try again.');
    } finally {
      setLoadingArtifacts(false);
    }
  }, [open]);

  useEffect(() => {
    void loadArtifacts();
  }, [loadArtifacts]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const email = verifierEmail.trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      setEmailHint(null);
      setLoadingHint(false);
      return;
    }

    let active = true;
    setLoadingHint(true);

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/verification/requests/email-hint?email=${encodeURIComponent(email)}`,
          {
            cache: 'no-store',
          }
        );

        if (!response.ok) {
          throw new Error('Hint request failed');
        }

        const data = (await response.json()) as { kind: EmailHintKind };
        if (active) {
          setEmailHint(data.kind);
        }
      } catch (_error) {
        if (active) {
          setEmailHint(null);
        }
      } finally {
        if (active) {
          setLoadingHint(false);
        }
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [verifierEmail, open]);

  const allArtifacts = useMemo(() => Object.values(artifactsByGroup).flat(), [artifactsByGroup]);

  const toggleArtifact = (artifact: Artifact) => {
    const key = `${artifact.type}:${artifact.id}`;
    setSubmissionFeedback(null);
    setSelectedArtifacts((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = artifact;
      }
      return next;
    });
  };

  const resetForm = () => {
    setVerifierEmail('');
    setRelationship('peer');
    setMessage('');
    setSelectedArtifacts({});
    setEmailHint(null);
    setLoadingHint(false);
    setArtifactLoadError(null);
    setSubmissionFeedback(null);
  };

  const handleSubmit = async () => {
    if (selectedCount === 0) {
      setSubmissionFeedback({
        title: 'Select at least one artifact',
        message: 'Choose the proof artifacts this verifier can review before sending.',
      });
      toast.error('Select at least one artifact.');
      return;
    }

    if (!EMAIL_REGEX.test(verifierEmail.trim())) {
      setSubmissionFeedback({
        title: 'Enter a valid verifier email',
        message: 'Use a complete email address so Proofound can send this request.',
      });
      toast.error('Enter a valid verifier email.');
      return;
    }

    setSubmitting(true);
    setSubmissionFeedback(null);

    try {
      const payload = {
        verifierEmail: verifierEmail.trim(),
        relationship,
        message: message.trim() || undefined,
        artifacts: Object.values(selectedArtifacts).map((artifact) => ({
          type: artifact.type,
          id: artifact.id,
        })),
      };

      const response = await fetch('/api/verification/requests/custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = (await response.json().catch(() => ({}))) as { error?: unknown };
      if (!response.ok) {
        const diagnosticMessage =
          typeof responseData.error === 'string' && responseData.error.trim().length > 0
            ? responseData.error
            : `Custom verification request failed with status ${response.status}`;
        dispatchClientErrorDiagnostic(
          'verifications.custom_dialog.send_failed',
          new Error(diagnosticMessage)
        );
        setSubmissionFeedback({
          title: 'Request could not be sent',
          message: CUSTOM_VERIFICATION_SEND_FAILED_MESSAGE,
        });
        toast.error(CUSTOM_VERIFICATION_SEND_FAILED_MESSAGE);
        return;
      }

      toast.success('Custom verification request sent.');
      resetForm();
      onOpenChange(false);
      onCreated?.();
    } catch (error) {
      dispatchClientErrorDiagnostic('verifications.custom_dialog.send_failed', error);
      setSubmissionFeedback({
        title: 'Request could not be sent',
        message: CUSTOM_VERIFICATION_SEND_FAILED_MESSAGE,
      });
      toast.error(CUSTOM_VERIFICATION_SEND_FAILED_MESSAGE);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          resetForm();
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: '#FDFCFA' }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: '#2D3330' }}>Custom verification request</DialogTitle>
          <DialogDescription style={{ color: '#6B7470' }}>
            Send one request that lets a verifier review multiple unverified artifacts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="custom-verifier-email" style={{ color: '#2D3330' }}>
              Verifier email address
            </Label>
            <Input
              id="custom-verifier-email"
              type="email"
              placeholder="colleague@example.com"
              value={verifierEmail}
              onChange={(event) => {
                setVerifierEmail(event.target.value);
                setSubmissionFeedback(null);
              }}
              autoComplete="email"
            />
            <div className="h-5">
              {loadingHint && EMAIL_REGEX.test(verifierEmail.trim()) ? (
                <p className="text-xs" style={{ color: '#6B7470' }}>
                  Checking account status...
                </p>
              ) : emailHint === 'verifier_email_ready' ? (
                <p className="text-xs inline-flex items-center gap-1" style={{ color: '#1C4D3A' }}>
                  <MailCheck className="h-3.5 w-3.5" />
                  We&apos;ll send the request to this email address
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label style={{ color: '#2D3330' }}>Relationship to requester</Label>
            <Select
              value={relationship}
              onValueChange={(value) => {
                setRelationship(value as SelectableCustomVerificationRelationship);
                setSubmissionFeedback(null);
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
            <div className="flex items-center justify-between">
              <Label style={{ color: '#2D3330' }}>Select unverified artifacts</Label>
              <Badge variant="outline">{selectedCount} selected</Badge>
            </div>

            <div className="rounded-lg border border-proofound-stone bg-japandi-bg p-3 space-y-3 max-h-[320px] overflow-y-auto">
              {loadingArtifacts ? (
                <div
                  className="py-10 flex items-center justify-center gap-2"
                  style={{ color: '#6B7470' }}
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading artifacts...
                </div>
              ) : artifactLoadError ? (
                <div className="py-8 text-center" role="alert">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#fff1d6] text-[#8a5b00]">
                    <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <p className="text-sm font-medium" style={{ color: '#2D3330' }}>
                    Verification artifacts could not load
                  </p>
                  <p
                    className="mx-auto mt-2 max-w-sm text-xs leading-5"
                    style={{ color: '#6B7470' }}
                  >
                    {artifactLoadError}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void loadArtifacts()}
                    className="mt-4 min-h-9 rounded-full border-proofound-stone/85 bg-white px-3 text-xs text-proofound-forest hover:border-proofound-forest hover:bg-proofound-parchment/30"
                  >
                    <RefreshCcw className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                    Retry artifacts
                  </Button>
                </div>
              ) : allArtifacts.length === 0 ? (
                <div className="py-8 text-center text-sm" style={{ color: '#6B7470' }}>
                  No unverified artifacts are currently available.
                </div>
              ) : (
                (Object.keys(artifactsByGroup) as ArtifactType[]).map((group) => {
                  const items = artifactsByGroup[group];
                  if (items.length === 0) {
                    return null;
                  }

                  return (
                    <div key={group} className="space-y-2">
                      <p
                        className="text-xs font-semibold uppercase tracking-wide"
                        style={{ color: '#6B7470' }}
                      >
                        {GROUP_LABELS[group]} ({items.length})
                      </p>
                      <div className="space-y-2">
                        {items.map((artifact) => {
                          const key = `${artifact.type}:${artifact.id}`;
                          const checked = Boolean(selectedArtifacts[key]);

                          return (
                            <label
                              key={key}
                              className="flex items-start gap-3 rounded-md border border-proofound-stone bg-white p-2.5 cursor-pointer"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={() => toggleArtifact(artifact)}
                              />
                              <span className="flex-1 min-w-0">
                                <span className="block text-sm" style={{ color: '#2D3330' }}>
                                  {artifact.label}
                                </span>
                                {artifact.subtitle && (
                                  <span
                                    className="block text-xs mt-0.5"
                                    style={{ color: '#6B7470' }}
                                  >
                                    {artifact.subtitle}
                                  </span>
                                )}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-request-message" style={{ color: '#2D3330' }}>
              Message (optional)
            </Label>
            <Textarea
              id="custom-request-message"
              rows={3}
              value={message}
              onChange={(event) => {
                setMessage(event.target.value);
                setSubmissionFeedback(null);
              }}
              placeholder="Add context for the verifier..."
            />
          </div>

          {submissionFeedback ? (
            <div
              className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900"
              role="alert"
            >
              <p className="font-semibold">{submissionFeedback.title}</p>
              <p>{submissionFeedback.message}</p>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || selectedCount === 0 || !EMAIL_REGEX.test(verifierEmail.trim())}
            style={{ backgroundColor: '#1C4D3A', color: '#F7F6F1' }}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send request
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
