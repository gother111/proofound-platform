'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Upload } from 'lucide-react';

import { apiFetch } from '@/lib/api/fetch';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  MAX_PROOF_UPLOAD_SIZE_BYTES,
  PROOF_ALLOWED_EXTENSIONS_LABEL,
  PROOF_FILE_ACCEPT_ATTRIBUTE,
} from '@/lib/proofs/constants';
import { uploadFile, validateFile } from '@/lib/upload';

export type FirstProofSkillOption = {
  id: string;
  name: string;
};

export type FirstProofAnchorOption = {
  id: string;
  type: 'experience' | 'education' | 'volunteering';
  label: string;
  detail?: string | null;
};

type FirstProofDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skills: FirstProofSkillOption[];
  anchors: FirstProofAnchorOption[];
  onProofAdded?: () => void;
};

const EMPTY_FORM = {
  proofType: 'link',
  title: '',
  url: '',
  description: '',
  issuedDate: '',
  expiresDate: '',
  uploadedFileId: '',
  fileName: '',
};

function deriveProofTitleFromUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    const pathname = parsed.pathname.replace(/\/+$/, '');
    const lastSegment = pathname.split('/').filter(Boolean).pop();

    if (lastSegment) {
      const decoded = decodeURIComponent(lastSegment).replace(/[-_]+/g, ' ').trim();
      if (decoded.length > 0) return decoded.slice(0, 80);
    }

    return parsed.hostname || 'Proof link';
  } catch {
    return 'Proof link';
  }
}

export function FirstProofDialog({
  open,
  onOpenChange,
  skills = [],
  anchors = [],
  onProofAdded,
}: FirstProofDialogProps) {
  const { toast } = useToast();
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [selectedAnchorKey, setSelectedAnchorKey] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSelectedSkillId((current) => current || skills[0]?.id || '');
    setSelectedAnchorKey(
      (current) => current || (anchors[0] ? `${anchors[0].type}:${anchors[0].id}` : '')
    );
  }, [anchors, open, skills]);

  const selectedAnchor = useMemo(() => {
    if (!selectedAnchorKey) return null;
    const [type, id] = selectedAnchorKey.split(':');
    return anchors.find((anchor) => anchor.type === type && anchor.id === id) || null;
  }, [anchors, selectedAnchorKey]);

  const canSubmit =
    Boolean(selectedSkillId) &&
    Boolean(selectedAnchor) &&
    !uploading &&
    !submitting &&
    Boolean(form.title.trim() || form.url.trim() || form.uploadedFileId);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setUploadError(null);
    setFormError(null);
  };

  const handleFileSelected = async (file: File | null) => {
    if (!file) return;

    const validation = validateFile(file, 'document', { category: 'proof' });
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setForm((current) => ({ ...current, proofType: 'document', fileName: file.name }));

    try {
      const result = await uploadFile({
        file,
        type: 'document',
        category: 'proof',
      });

      if (!result.success || !result.uploadedFileId) {
        setUploadError(result.error || result.message || 'Upload failed');
        return;
      }

      setForm((current) => ({
        ...current,
        proofType: 'document',
        url: result.url || current.url,
        uploadedFileId: result.uploadedFileId || '',
        title:
          current.title.trim() || result.artifactDisplayName || result.fileName || file.name || '',
        fileName: result.artifactDisplayName || result.fileName || file.name,
      }));
    } catch (error) {
      console.error('First proof upload failed:', error);
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    setFormError(null);

    if (!selectedSkillId) {
      setFormError('Add or choose a skill before attaching proof.');
      return;
    }

    if (!selectedAnchor) {
      setFormError('Add or choose a real context before attaching proof.');
      return;
    }

    if (!form.title.trim() && !form.url.trim() && !form.uploadedFileId) {
      setFormError('Add a title, URL, or file before saving this proof.');
      return;
    }

    if (form.issuedDate && form.expiresDate) {
      const issuedAt = new Date(form.issuedDate).getTime();
      const expiresAt = new Date(form.expiresDate).getTime();
      if (Number.isFinite(issuedAt) && Number.isFinite(expiresAt) && expiresAt < issuedAt) {
        setFormError('Expiration date must be on or after issued date.');
        return;
      }
    }

    const payload = {
      proofType: form.proofType as 'link' | 'document',
      title: form.title.trim() || (form.url.trim() ? deriveProofTitleFromUrl(form.url.trim()) : ''),
      description: form.description.trim(),
      url: form.url.trim(),
      uploadedFileId: form.uploadedFileId || undefined,
      primaryAnchor: {
        type: selectedAnchor.type,
        id: selectedAnchor.id,
      },
      issuedDate: form.issuedDate || undefined,
      expiresDate: form.expiresDate || undefined,
      metadata: {
        sourceSurface: 'first_proof_dialog',
      },
    };

    setSubmitting(true);
    try {
      const response = await apiFetch(`/api/expertise/user-skills/${selectedSkillId}/proofs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({
          title: 'Proof added',
          description: 'Your first proof is now attached to a real context.',
        });
        resetForm();
        onProofAdded?.();
        onOpenChange(false);
        return;
      }

      const error = (await response.json()) as { error?: string; message?: string };
      setFormError(error.message || error.error || 'Failed to save proof. Please try again.');
    } catch (error) {
      console.error('First proof submit failed:', error);
      setFormError('Failed to save proof. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add your first proof</DialogTitle>
          <DialogDescription>
            Attach one proof link, upload one proof file, or include both when they describe the
            same work. Keep it tied to a skill and real context so it can become a Proof Pack.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="first-proof-skill">Skill or capability</Label>
              <select
                id="first-proof-skill"
                value={selectedSkillId}
                onChange={(event) => setSelectedSkillId(event.target.value)}
                className="mt-1 w-full rounded-md border border-proofound-stone bg-white px-3 py-2 text-sm"
              >
                {skills.length === 0 ? <option value="">No skills yet</option> : null}
                {skills.map((skill) => (
                  <option key={skill.id} value={skill.id}>
                    {skill.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="first-proof-anchor">Real context</Label>
              <select
                id="first-proof-anchor"
                value={selectedAnchorKey}
                onChange={(event) => setSelectedAnchorKey(event.target.value)}
                className="mt-1 w-full rounded-md border border-proofound-stone bg-white px-3 py-2 text-sm"
              >
                {anchors.length === 0 ? <option value="">No contexts yet</option> : null}
                {anchors.map((anchor) => (
                  <option key={`${anchor.type}:${anchor.id}`} value={`${anchor.type}:${anchor.id}`}>
                    {anchor.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedAnchor?.detail ? (
            <p className="rounded-md border border-proofound-stone/70 bg-japandi-bg/50 px-3 py-2 text-xs text-muted-foreground">
              {selectedAnchor.detail}
            </p>
          ) : null}

          <div>
            <Label htmlFor="first-proof-title">Proof title</Label>
            <Input
              id="first-proof-title"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              placeholder="What should this proof be called?"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="first-proof-url">Proof link</Label>
            <Input
              id="first-proof-url"
              type="url"
              value={form.url}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  proofType: 'link',
                  url: event.target.value,
                }))
              }
              placeholder="https://"
              className="mt-1"
            />
          </div>

          <div className="rounded-lg border border-dashed border-proofound-stone p-3">
            <Label htmlFor="first-proof-file" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload proof file
            </Label>
            <Input
              id="first-proof-file"
              type="file"
              accept={PROOF_FILE_ACCEPT_ATTRIBUTE}
              onChange={(event) => handleFileSelected(event.target.files?.[0] || null)}
              className="mt-2"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Accepted: {PROOF_ALLOWED_EXTENSIONS_LABEL}. Max size:{' '}
              {MAX_PROOF_UPLOAD_SIZE_BYTES / (1024 * 1024)}MB.
            </p>
            {uploading ? <p className="mt-2 text-xs text-muted-foreground">Uploading...</p> : null}
            {form.fileName && !uploading ? (
              <p className="mt-2 text-xs text-muted-foreground">Selected: {form.fileName}</p>
            ) : null}
            {uploadError ? (
              <p className="mt-2 text-xs text-proofound-terracotta">{uploadError}</p>
            ) : null}
          </div>

          <div>
            <Label htmlFor="first-proof-description">Evidence note</Label>
            <Textarea
              id="first-proof-description"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="Describe what this evidence shows and why it matters."
              rows={3}
              className="mt-1"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="first-proof-issued">Issued date</Label>
              <Input
                id="first-proof-issued"
                type="date"
                value={form.issuedDate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, issuedDate: event.target.value }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="first-proof-expires">Expiration date</Label>
              <Input
                id="first-proof-expires"
                type="date"
                value={form.expiresDate}
                min={form.issuedDate || undefined}
                onChange={(event) =>
                  setForm((current) => ({ ...current, expiresDate: event.target.value }))
                }
                className="mt-1"
              />
            </div>
          </div>

          {skills.length === 0 || anchors.length === 0 ? (
            <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Add at least one skill and one real context before saving proof. This keeps Proof
              Packs anchored instead of becoming loose uploads.
            </p>
          ) : null}

          {formError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="bg-proofound-forest text-white hover:bg-proofound-forest/90"
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {submitting ? 'Saving...' : 'Save first proof'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
