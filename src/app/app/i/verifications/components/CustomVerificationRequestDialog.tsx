'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, MailCheck, MailX, Send } from 'lucide-react';
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
import {
  CUSTOM_VERIFICATION_SELECTABLE_RELATIONSHIPS,
  relationshipDisplayLabel,
  type SelectableCustomVerificationRelationship,
} from '@/lib/verification/custom-verification';

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

type EmailHintKind = 'proofound_user' | 'external_verifier';

const GROUP_LABELS: Record<ArtifactType, string> = {
  skill: 'Skills',
  experience: 'Work and Experience',
  education: 'Education',
  impact_story: 'Impact Stories',
  project: 'Projects',
  volunteering: 'Volunteering',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
};

export function CustomVerificationRequestDialog({ open, onOpenChange, onCreated }: Props) {
  const [loadingArtifacts, setLoadingArtifacts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [artifactsByGroup, setArtifactsByGroup] = useState<Record<ArtifactType, Artifact[]>>({
    skill: [],
    experience: [],
    education: [],
    impact_story: [],
    project: [],
    volunteering: [],
  });

  const [verifierEmail, setVerifierEmail] = useState('');
  const [relationship, setRelationship] =
    useState<SelectableCustomVerificationRelationship>('peer');
  const [message, setMessage] = useState('');
  const [selectedArtifacts, setSelectedArtifacts] = useState<Record<string, Artifact>>({});

  const [emailHint, setEmailHint] = useState<EmailHintKind | null>(null);
  const [loadingHint, setLoadingHint] = useState(false);

  const selectedCount = useMemo(() => Object.keys(selectedArtifacts).length, [selectedArtifacts]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let active = true;

    const loadArtifacts = async () => {
      setLoadingArtifacts(true);
      try {
        const response = await fetch('/api/expertise/verifications/custom/artifacts', {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Could not load artifacts');
        }

        const data = (await response.json()) as ArtifactsResponse;
        if (!active) {
          return;
        }

        setArtifactsByGroup(
          data.artifacts || {
            skill: [],
            experience: [],
            education: [],
            impact_story: [],
            project: [],
            volunteering: [],
          }
        );
      } catch (error) {
        console.error('Failed to load custom verification artifacts:', error);
        toast.error('Could not load unverified artifacts. Please try again.');
      } finally {
        if (active) {
          setLoadingArtifacts(false);
        }
      }
    };

    loadArtifacts();

    return () => {
      active = false;
    };
  }, [open]);

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
          `/api/expertise/verifications/email-hint?email=${encodeURIComponent(email)}`,
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
  };

  const handleSubmit = async () => {
    if (selectedCount === 0) {
      toast.error('Select at least one artifact.');
      return;
    }

    if (!EMAIL_REGEX.test(verifierEmail.trim())) {
      toast.error('Enter a valid verifier email.');
      return;
    }

    setSubmitting(true);

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

      const response = await fetch('/api/expertise/verifications/custom/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      if (!response.ok) {
        toast.error(responseData.error || 'Failed to send request.');
        return;
      }

      toast.success('Custom verification request sent.');
      resetForm();
      onOpenChange(false);
      onCreated?.();
    } catch (error) {
      console.error('Failed to send custom verification request:', error);
      toast.error('Failed to send custom verification request.');
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
              onChange={(event) => setVerifierEmail(event.target.value)}
              autoComplete="email"
            />
            <div className="h-5">
              {loadingHint && EMAIL_REGEX.test(verifierEmail.trim()) ? (
                <p className="text-xs" style={{ color: '#6B7470' }}>
                  Checking account status...
                </p>
              ) : emailHint === 'proofound_user' ? (
                <p className="text-xs inline-flex items-center gap-1" style={{ color: '#1C4D3A' }}>
                  <MailCheck className="h-3.5 w-3.5" />
                  Proofound user
                </p>
              ) : emailHint === 'external_verifier' ? (
                <p className="text-xs inline-flex items-center gap-1" style={{ color: '#6B7470' }}>
                  <MailX className="h-3.5 w-3.5" />
                  External verifier
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label style={{ color: '#2D3330' }}>Relationship to requester</Label>
            <Select
              value={relationship}
              onValueChange={(value) =>
                setRelationship(value as SelectableCustomVerificationRelationship)
              }
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
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Add context for the verifier..."
            />
          </div>
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
