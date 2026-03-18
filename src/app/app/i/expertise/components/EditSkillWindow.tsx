'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Save, Trash2 } from 'lucide-react';

import { apiFetch } from '@/lib/api/fetch';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { uploadFile, validateFile } from '@/lib/upload';

import { DeleteSkillDialog } from './edit-skill/DeleteSkillDialog';
import { ProofsSection } from './edit-skill/ProofsSection';
import { VerificationSection } from './edit-skill/VerificationSection';
import type { Proof, ProofDraft, VerificationDraft, VerificationRequest } from './edit-skill/types';

const LEVEL_LABELS = [
  { value: 1, label: 'Novice', description: 'Learning the basics' },
  { value: 2, label: 'Competent', description: 'Can work independently' },
  { value: 3, label: 'Proficient', description: 'Experienced practitioner' },
  { value: 4, label: 'Advanced', description: 'Deep expertise' },
  { value: 5, label: 'Expert', description: 'Recognized authority' },
];
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function deriveProofTitleFromUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    const pathname = parsed.pathname.replace(/\/+$/, '');
    const lastSegment = pathname.split('/').filter(Boolean).pop();

    if (lastSegment) {
      const decoded = decodeURIComponent(lastSegment).replace(/[-_]+/g, ' ').trim();
      if (decoded.length > 0) return decoded.slice(0, 80);
    }

    return parsed.hostname || 'Proof Link';
  } catch {
    return 'Proof Link';
  }
}

function toDateInputValue(value?: string | null): string {
  if (!value) return '';

  const trimmed = value.trim();
  if (!trimmed) return '';

  if (DATE_ONLY_PATTERN.test(trimmed)) {
    return trimmed;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return parsed.toISOString().split('T')[0];
}

function normalizeLastUsedAtForPayload(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return new Date().toISOString();
  }

  if (DATE_ONLY_PATTERN.test(trimmed)) {
    return `${trimmed}T00:00:00.000Z`;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return trimmed;
  }

  return parsed.toISOString();
}

type SkillRecord = {
  id: string;
  level?: number;
  last_used_at?: string;
  lastUsedAt?: string;
  relevance?: 'current' | 'emerging' | 'obsolete';
  skill_name?: string;
  custom_skill_name?: string;
  taxonomy?: {
    name_i18n?: {
      en?: string;
    };
    tags?: string[];
  };
};

type DeleteVerificationResponse = {
  error?: string;
  code?: string;
};

interface EditSkillWindowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skill: SkillRecord | null;
  initialFocus?: 'details' | 'proofs' | 'verification' | null;
  onSkillUpdated: () => void;
  onSkillDeleted: () => void;
}

export function EditSkillWindow({
  open,
  onOpenChange,
  skill,
  initialFocus = 'details',
  onSkillUpdated,
  onSkillDeleted,
}: EditSkillWindowProps) {
  const { toast } = useToast();

  const [level, setLevel] = useState(2);
  const [lastUsedDate, setLastUsedDate] = useState('');
  const [saving, setSaving] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [proofs, setProofs] = useState<Proof[]>([]);
  const [loadingProofs, setLoadingProofs] = useState(false);
  const [showAddProof, setShowAddProof] = useState(false);
  const [addingProof, setAddingProof] = useState(false);
  const [newProof, setNewProof] = useState<ProofDraft>({
    proofType: 'project',
    title: '',
    description: '',
    url: '',
    filePath: '',
    uploadedFileId: '',
    issuedDate: '',
    expiresDate: '',
  });
  const [proofUploading, setProofUploading] = useState(false);
  const [proofUploadError, setProofUploadError] = useState<string | null>(null);
  const [proofUploadName, setProofUploadName] = useState('');

  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [loadingVerifications, setLoadingVerifications] = useState(false);
  const [showRequestVerification, setShowRequestVerification] = useState(false);
  const [requestingVerification, setRequestingVerification] = useState(false);
  const [deletingVerificationId, setDeletingVerificationId] = useState<string | null>(null);
  const [newVerificationRequest, setNewVerificationRequest] = useState<VerificationDraft>({
    verifierEmail: '',
    relationship: 'peer',
    message: '',
  });
  const proofsSectionRef = useRef<HTMLDivElement | null>(null);
  const verificationSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!skill || !open) {
        return;
      }

      setLevel(skill.level || 2);
      setLastUsedDate(toDateInputValue(skill.last_used_at || skill.lastUsedAt || ''));
      setProofUploading(false);
      setProofUploadError(null);
      setProofUploadName('');

      setLoadingProofs(true);
      try {
        const response = await apiFetch(`/api/expertise/user-skills/${skill.id}/proofs`);
        if (response.ok) {
          const data = (await response.json()) as { proofs?: Proof[] };
          setProofs(data.proofs || []);
        }
      } catch (error) {
        console.error('Error loading proofs:', error);
      } finally {
        setLoadingProofs(false);
      }

      setLoadingVerifications(true);
      try {
        const response = await apiFetch(
          `/api/verification/requests/skill?skillId=${encodeURIComponent(skill.id)}`
        );
        if (response.ok) {
          const data = (await response.json()) as { requests?: VerificationRequest[] };
          setVerificationRequests(data.requests || []);
        }
      } catch (error) {
        console.error('Error loading verification requests:', error);
      } finally {
        setLoadingVerifications(false);
      }
    };

    loadData();
  }, [skill, open]);

  useEffect(() => {
    if (!open || !initialFocus || initialFocus === 'details') return;

    const target =
      initialFocus === 'proofs' ? proofsSectionRef.current : verificationSectionRef.current;
    if (!target) return;

    const timer = window.setTimeout(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);

    return () => {
      window.clearTimeout(timer);
    };
  }, [initialFocus, loadingProofs, loadingVerifications, open]);

  if (!skill) {
    return null;
  }

  const skillName =
    skill.skill_name || skill.taxonomy?.name_i18n?.en || skill.custom_skill_name || 'Unknown Skill';

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        level,
        last_used_at: normalizeLastUsedAtForPayload(lastUsedDate),
      };

      const response = await apiFetch(`/api/expertise/user-skills/${skill.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({
          title: '✅ Skill Updated',
          description: `"${skillName}" has been updated successfully.`,
        });
        onSkillUpdated();
        onOpenChange(false);
        return;
      }

      const error = (await response.json()) as { error?: string };
      toast({
        title: 'Error',
        description: error.error || 'Failed to update skill. Please try again.',
        variant: 'destructive',
      });
    } catch (error) {
      console.error('Error updating skill:', error);
      toast({
        title: 'Error',
        description: 'Failed to update skill. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await apiFetch(`/api/expertise/user-skills/${skill.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: '🗑️ Skill Removed',
          description: `"${skillName}" has been removed from your Expertise Atlas.`,
        });
        onSkillDeleted();
        onOpenChange(false);
        setShowDeleteConfirm(false);
        return;
      }

      const error = (await response.json()) as { error?: string };
      toast({
        title: 'Error',
        description: error.error || 'Failed to delete skill. Please try again.',
        variant: 'destructive',
      });
    } catch (error) {
      console.error('Error deleting skill:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete skill. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleAddProof = async () => {
    const hasTitle = Boolean(newProof.title?.trim());
    const hasUrl = Boolean(newProof.url?.trim());
    const hasFilePath = Boolean(newProof.filePath?.trim());
    const hasUploadedFileId = Boolean(newProof.uploadedFileId?.trim());

    if (!hasTitle && !hasUrl && !hasFilePath && !hasUploadedFileId) {
      toast({
        title: 'Missing proof details',
        description: 'Add a title, URL, or uploaded file before submitting a proof.',
        variant: 'destructive',
      });
      return;
    }

    if (newProof.issuedDate && newProof.expiresDate) {
      const issuedAt = new Date(newProof.issuedDate).getTime();
      const expiresAt = new Date(newProof.expiresDate).getTime();
      if (Number.isFinite(issuedAt) && Number.isFinite(expiresAt) && expiresAt < issuedAt) {
        toast({
          title: 'Invalid proof dates',
          description: 'Expiration date must be on or after issued date.',
          variant: 'destructive',
        });
        return;
      }
    }

    const payload: ProofDraft = {
      ...newProof,
      title: hasTitle ? newProof.title.trim() : deriveProofTitleFromUrl(newProof.url.trim()),
      description: newProof.description?.trim() || '',
      url: newProof.url?.trim() || '',
      filePath: newProof.filePath?.trim() || '',
      uploadedFileId: newProof.uploadedFileId?.trim() || '',
    };

    setAddingProof(true);
    try {
      const response = await apiFetch(`/api/expertise/user-skills/${skill.id}/proofs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = (await response.json()) as { proof: Proof };
        setProofs((current) => [...current, data.proof]);
        toast({
          title: '📎 Proof Added',
          description: `"${payload.title}" has been attached to this skill.`,
        });
        setNewProof({
          proofType: 'project',
          title: '',
          description: '',
          url: '',
          filePath: '',
          uploadedFileId: '',
          issuedDate: '',
          expiresDate: '',
        });
        setProofUploadError(null);
        setProofUploadName('');
        setShowAddProof(false);
        onSkillUpdated();
        return;
      }

      const error = (await response.json()) as { error?: string; message?: string };
      toast({
        title: 'Error',
        description: error.message || error.error || 'Failed to add proof. Please try again.',
        variant: 'destructive',
      });
    } catch (error) {
      console.error('Error adding proof:', error);
      toast({
        title: 'Error',
        description: 'Failed to add proof. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setAddingProof(false);
    }
  };

  const handleProofFileUpload = async (file: File | null) => {
    if (!file) return;

    const validation = validateFile(file, 'document', { category: 'proof' });
    if (!validation.valid) {
      setProofUploadError(validation.error || 'Invalid file');
      return;
    }

    setProofUploadError(null);
    setProofUploading(true);
    setProofUploadName(file.name);

    try {
      const result = await uploadFile({
        file,
        type: 'document',
        category: 'proof',
      });

      if (!result.success || !result.uploadedFileId) {
        setProofUploadError(result.error || result.message || 'Upload failed');
        return;
      }

      setNewProof((current) => ({
        ...current,
        proofType: 'document',
        url: result.url || current.url,
        filePath: result.path || '',
        uploadedFileId: result.uploadedFileId || '',
        title:
          current.title.trim() || result.artifactDisplayName || result.fileName || file.name || '',
      }));
      setProofUploadError(null);
    } catch (error) {
      console.error('Error uploading proof document:', error);
      setProofUploadError('Upload failed. Please try again.');
    } finally {
      setProofUploading(false);
    }
  };

  const handleDeleteProof = async (proofId: string) => {
    try {
      const response = await apiFetch(`/api/expertise/user-skills/${skill.id}/proofs/${proofId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProofs((current) => current.filter((proof) => proof.id !== proofId));
        toast({
          title: 'Proof Removed',
          description: 'The proof has been removed from this skill.',
        });
        onSkillUpdated();
        return;
      }

      const error = (await response.json()) as { error?: string };
      toast({
        title: 'Error',
        description: error.error || 'Failed to delete proof. Please try again.',
        variant: 'destructive',
      });
    } catch (error) {
      console.error('Error deleting proof:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete proof. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleRequestVerification = async () => {
    if (proofs.length === 0) {
      toast({
        title: 'Add proof first',
        description: 'Attach a proof link or document before asking someone to confirm this skill.',
        variant: 'destructive',
      });
      return;
    }

    const normalizedVerifierEmail = newVerificationRequest.verifierEmail.trim().toLowerCase();
    if (!normalizedVerifierEmail) {
      return;
    }

    setRequestingVerification(true);
    try {
      const response = await apiFetch('/api/verification/requests/skill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newVerificationRequest,
          skillId: skill.id,
          verifierEmail: normalizedVerifierEmail,
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as {
          request: VerificationRequest;
          email_sent?: boolean;
        };
        setVerificationRequests((current) => [data.request, ...current]);
        if (data.email_sent) {
          toast({
            title: '✉️ Verification Request Sent',
            description: `An email has been sent to ${normalizedVerifierEmail}.`,
          });
        } else {
          toast({
            title: 'Verification Request Saved',
            description:
              'The request was saved, but the email could not be sent. Please check email configuration.',
            variant: 'destructive',
          });
        }
        setNewVerificationRequest({
          verifierEmail: '',
          relationship: 'peer',
          message: '',
        });
        setShowRequestVerification(false);
        return;
      }

      const error = (await response.json()) as { error?: string };
      toast({
        title: 'Error',
        description: error.error || 'Failed to request verification. Please try again.',
        variant: 'destructive',
      });
    } catch (error) {
      console.error('Error requesting verification:', error);
      toast({
        title: 'Error',
        description: 'Failed to request verification. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRequestingVerification(false);
    }
  };

  const handleDeleteVerificationRequest = async (verificationRequest: VerificationRequest) => {
    setDeletingVerificationId(verificationRequest.id);
    try {
      const response = await apiFetch(
        `/api/verification/requests/skill/${verificationRequest.id}`,
        {
          method: 'DELETE',
        }
      );

      let body: DeleteVerificationResponse = {};
      try {
        body = (await response.json()) as DeleteVerificationResponse;
      } catch {
        body = {};
      }

      if (response.ok) {
        setVerificationRequests((current) =>
          current.filter((request) => request.id !== verificationRequest.id)
        );
        toast({
          title: 'Verification Request Removed',
          description: 'The pending verification request has been deleted.',
        });
        onSkillUpdated();
        return;
      }

      if (response.status === 409 && body.code === 'BUNDLED_REQUEST') {
        toast({
          title: 'Bundled verification request',
          description:
            'This request is part of a bundle. Open Verification Requests to cancel specific artifacts.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Error',
        description: body.error || 'Failed to delete verification request. Please try again.',
        variant: 'destructive',
      });
    } catch (error) {
      console.error('Error deleting verification request:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete verification request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeletingVerificationId(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-foreground">Edit Skill</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Update your skill details, attach proof, and request proof-scoped confirmation when
              needed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div>
              <Label className="text-foreground font-medium">Skill</Label>
              <div className="mt-2 p-3 bg-japandi-bg rounded-md border border-proofound-stone">
                <p className="font-medium text-foreground">{skillName}</p>
                {skill.taxonomy?.tags && skill.taxonomy.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {skill.taxonomy.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs bg-white">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label className="text-foreground mb-3 block font-medium">Proficiency Level</Label>
              <RadioGroup
                value={level.toString()}
                onValueChange={(val: string) => setLevel(parseInt(val, 10))}
              >
                {LEVEL_LABELS.map((entry) => (
                  <div
                    key={entry.value}
                    className="flex items-center space-x-3 mb-2 p-3 rounded-lg border border-proofound-stone hover:bg-japandi-bg transition-colors"
                  >
                    <RadioGroupItem
                      value={entry.value.toString()}
                      id={`edit-level-${entry.value}`}
                    />
                    <Label htmlFor={`edit-level-${entry.value}`} className="flex-1 cursor-pointer">
                      <div className="font-medium text-foreground">{entry.label}</div>
                      <div className="text-sm text-muted-foreground">{entry.description}</div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="edit-last-used" className="text-foreground font-medium">
                Last Used
              </Label>
              <Input
                id="edit-last-used"
                type="date"
                value={lastUsedDate}
                onChange={(e) => setLastUsedDate(e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                When did you last use this skill?
              </p>
            </div>

            <Separator />

            <div ref={proofsSectionRef}>
              <ProofsSection
                proofs={proofs}
                loadingProofs={loadingProofs}
                showAddProof={showAddProof}
                setShowAddProof={setShowAddProof}
                newProof={newProof}
                setNewProof={setNewProof}
                addingProof={addingProof}
                proofUploading={proofUploading}
                proofUploadError={proofUploadError}
                proofUploadName={proofUploadName}
                onProofFileSelected={handleProofFileUpload}
                onAddProof={handleAddProof}
                onDeleteProof={handleDeleteProof}
              />
            </div>

            <Separator />

            <div ref={verificationSectionRef}>
              <VerificationSection
                hasProofContext={proofs.length > 0}
                verificationRequests={verificationRequests}
                loadingVerifications={loadingVerifications}
                showRequestVerification={showRequestVerification}
                setShowRequestVerification={setShowRequestVerification}
                newVerificationRequest={newVerificationRequest}
                setNewVerificationRequest={setNewVerificationRequest}
                requestingVerification={requestingVerification}
                deletingVerificationId={deletingVerificationId}
                onRequestVerification={handleRequestVerification}
                onDeleteVerificationRequest={handleDeleteVerificationRequest}
              />
            </div>

            <Separator />

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                className="border-[#C76B4A] text-proofound-terracotta hover:bg-[#FFF0F0]"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Skill
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-proofound-forest text-white hover:bg-proofound-forest/90"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteSkillDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        deleting={deleting}
        skillName={skillName}
        onDelete={handleDelete}
      />
    </>
  );
}
