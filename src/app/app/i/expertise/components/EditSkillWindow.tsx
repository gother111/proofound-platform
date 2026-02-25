'use client';

import { useEffect, useState } from 'react';
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

type SkillRecord = {
  id: string;
  level?: number;
  last_used_at?: string;
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

interface EditSkillWindowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skill: SkillRecord | null;
  onSkillUpdated: () => void;
  onSkillDeleted: () => void;
}

export function EditSkillWindow({
  open,
  onOpenChange,
  skill,
  onSkillUpdated,
  onSkillDeleted,
}: EditSkillWindowProps) {
  const { toast } = useToast();

  const [level, setLevel] = useState(2);
  const [lastUsedDate, setLastUsedDate] = useState('');
  const [relevance, setRelevance] = useState<'current' | 'emerging' | 'obsolete'>('current');
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
    issuedDate: '',
  });

  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [loadingVerifications, setLoadingVerifications] = useState(false);
  const [showRequestVerification, setShowRequestVerification] = useState(false);
  const [requestingVerification, setRequestingVerification] = useState(false);
  const [newVerificationRequest, setNewVerificationRequest] = useState<VerificationDraft>({
    verifierEmail: '',
    verifierSource: 'peer',
    message: '',
  });

  useEffect(() => {
    const loadData = async () => {
      if (!skill || !open) {
        return;
      }

      setLevel(skill.level || 2);
      setLastUsedDate(
        skill.last_used_at ? new Date(skill.last_used_at).toISOString().split('T')[0] : ''
      );
      setRelevance(skill.relevance || 'current');

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
          `/api/expertise/user-skills/${skill.id}/verification-request`
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
        last_used_at: lastUsedDate || new Date().toISOString(),
        relevance,
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

    if (!hasTitle && !hasUrl) {
      toast({
        title: 'Missing proof details',
        description: 'Add a title or a URL before submitting a proof.',
        variant: 'destructive',
      });
      return;
    }

    const payload: ProofDraft = {
      ...newProof,
      title: hasTitle ? newProof.title.trim() : deriveProofTitleFromUrl(newProof.url.trim()),
      description: newProof.description?.trim() || '',
      url: newProof.url?.trim() || '',
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
          issuedDate: '',
        });
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
    if (!newVerificationRequest.verifierEmail) {
      return;
    }

    setRequestingVerification(true);
    try {
      const response = await apiFetch(
        `/api/expertise/user-skills/${skill.id}/verification-request`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newVerificationRequest),
        }
      );

      if (response.ok) {
        const data = (await response.json()) as { request: VerificationRequest };
        setVerificationRequests((current) => [data.request, ...current]);
        toast({
          title: '✉️ Verification Request Sent',
          description: `An email has been sent to ${newVerificationRequest.verifierEmail}.`,
        });
        setNewVerificationRequest({
          verifierEmail: '',
          verifierSource: 'peer',
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-[#2D3330]">Edit Skill</DialogTitle>
            <DialogDescription className="text-[#6B6760]">
              Update your skill details, add proofs, and request verification.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div>
              <Label className="text-[#2D3330] font-medium">Skill</Label>
              <div className="mt-2 p-3 bg-[#F7F6F1] rounded-md border border-[#E5E3DA]">
                <p className="font-medium text-[#2D3330]">{skillName}</p>
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
              <Label className="text-[#2D3330] mb-3 block font-medium">Proficiency Level</Label>
              <RadioGroup
                value={level.toString()}
                onValueChange={(val: string) => setLevel(parseInt(val, 10))}
              >
                {LEVEL_LABELS.map((entry) => (
                  <div
                    key={entry.value}
                    className="flex items-center space-x-3 mb-2 p-3 rounded-lg border border-[#E5E3DA] hover:bg-[#F7F6F1] transition-colors"
                  >
                    <RadioGroupItem
                      value={entry.value.toString()}
                      id={`edit-level-${entry.value}`}
                    />
                    <Label htmlFor={`edit-level-${entry.value}`} className="flex-1 cursor-pointer">
                      <div className="font-medium text-[#2D3330]">{entry.label}</div>
                      <div className="text-sm text-[#6B6760]">{entry.description}</div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="edit-last-used" className="text-[#2D3330] font-medium">
                Last Used
              </Label>
              <Input
                id="edit-last-used"
                type="date"
                value={lastUsedDate}
                onChange={(e) => setLastUsedDate(e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-[#6B6760] mt-1">When did you last use this skill?</p>
            </div>

            <div>
              <Label className="text-[#2D3330] mb-3 block font-medium">Relevance</Label>
              <RadioGroup
                value={relevance}
                onValueChange={(value) =>
                  setRelevance(value as 'current' | 'emerging' | 'obsolete')
                }
              >
                <div className="flex items-center space-x-3 mb-2">
                  <RadioGroupItem value="current" id="edit-relevance-current" />
                  <Label htmlFor="edit-relevance-current" className="cursor-pointer">
                    <Badge
                      variant="outline"
                      className="bg-[#EEF1EA] text-[#1C4D3A] border-[#7A9278]"
                    >
                      Current
                    </Badge>
                    <span className="ml-2 text-sm text-[#6B6760]">Widely used today</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 mb-2">
                  <RadioGroupItem value="emerging" id="edit-relevance-emerging" />
                  <Label htmlFor="edit-relevance-emerging" className="cursor-pointer">
                    <Badge
                      variant="outline"
                      className="bg-[#E8F3F8] text-[#3E5C73] border-[#6B9AB8]"
                    >
                      Emerging
                    </Badge>
                    <span className="ml-2 text-sm text-[#6B6760]">Growing in demand</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="obsolete" id="edit-relevance-obsolete" />
                  <Label htmlFor="edit-relevance-obsolete" className="cursor-pointer">
                    <Badge
                      variant="outline"
                      className="bg-[#FFF0F0] text-[#8B4A36] border-[#C76B4A]"
                    >
                      Obsolete
                    </Badge>
                    <span className="ml-2 text-sm text-[#6B6760]">Declining use</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            <ProofsSection
              proofs={proofs}
              loadingProofs={loadingProofs}
              showAddProof={showAddProof}
              setShowAddProof={setShowAddProof}
              newProof={newProof}
              setNewProof={setNewProof}
              addingProof={addingProof}
              onAddProof={handleAddProof}
              onDeleteProof={handleDeleteProof}
            />

            <Separator />

            <VerificationSection
              verificationRequests={verificationRequests}
              loadingVerifications={loadingVerifications}
              showRequestVerification={showRequestVerification}
              setShowRequestVerification={setShowRequestVerification}
              newVerificationRequest={newVerificationRequest}
              setNewVerificationRequest={setNewVerificationRequest}
              requestingVerification={requestingVerification}
              onRequestVerification={handleRequestVerification}
            />

            <Separator />

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                className="border-[#C76B4A] text-[#C76B4A] hover:bg-[#FFF0F0]"
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
                  className="bg-[#1C4D3A] text-white hover:bg-[#2D5F4A]"
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
