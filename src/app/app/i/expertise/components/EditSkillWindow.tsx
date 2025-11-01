'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const LEVEL_LABELS = [
  { value: 1, label: 'Novice', description: 'Learning the basics' },
  { value: 2, label: 'Competent', description: 'Can work independently' },
  { value: 3, label: 'Proficient', description: 'Experienced practitioner' },
  { value: 4, label: 'Advanced', description: 'Deep expertise' },
  { value: 5, label: 'Expert', description: 'Recognized authority' },
];

interface Proof {
  id: string;
  proof_type: 'project' | 'certification' | 'media' | 'reference' | 'link';
  title: string;
  description?: string;
  url?: string;
  issued_date?: string;
  created_at?: string;
}

interface EditSkillWindowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skill: any | null;
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
  const [level, setLevel] = useState(2);
  const [lastUsedDate, setLastUsedDate] = useState('');
  const [relevance, setRelevance] = useState<'current' | 'emerging' | 'obsolete'>('current');
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Proofs management
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [loadingProofs, setLoadingProofs] = useState(false);
  const [showAddProof, setShowAddProof] = useState(false);
  const [addingProof, setAddingProof] = useState(false);
  const [newProof, setNewProof] = useState({
    proofType: 'project' as 'project' | 'certification' | 'media' | 'reference' | 'link',
    title: '',
    description: '',
    url: '',
    issuedDate: '',
  });

  // Verification management
  const [verificationRequests, setVerificationRequests] = useState<any[]>([]);
  const [loadingVerifications, setLoadingVerifications] = useState(false);
  const [showRequestVerification, setShowRequestVerification] = useState(false);
  const [requestingVerification, setRequestingVerification] = useState(false);
  const [newVerificationRequest, setNewVerificationRequest] = useState({
    verifierEmail: '',
    verifierSource: 'peer' as 'peer' | 'manager' | 'external',
    message: '',
  });

  // Load skill data and proofs when opened
  useEffect(() => {
    const loadData = async () => {
      if (skill && open) {
        setLevel(skill.level || 2);
        setLastUsedDate(
          skill.last_used_at
            ? new Date(skill.last_used_at).toISOString().split('T')[0]
            : ''
        );
        setRelevance(skill.relevance || 'current');
        
        // Load proofs from API
        setLoadingProofs(true);
        try {
          const response = await fetch(`/api/expertise/user-skills/${skill.id}/proofs`);
          if (response.ok) {
            const data = await response.json();
            setProofs(data.proofs || []);
          }
        } catch (error) {
          console.error('Error loading proofs:', error);
        } finally {
          setLoadingProofs(false);
        }

        // Load verification requests from API
        setLoadingVerifications(true);
        try {
          const verifyResponse = await fetch(`/api/expertise/user-skills/${skill.id}/verification-request`);
          if (verifyResponse.ok) {
            const verifyData = await verifyResponse.json();
            setVerificationRequests(verifyData.requests || []);
          }
        } catch (error) {
          console.error('Error loading verification requests:', error);
        } finally {
          setLoadingVerifications(false);
        }
      }
    };
    
    loadData();
  }, [skill, open]);

  const handleSave = async () => {
    if (!skill) return;

    setSaving(true);
    try {
      const payload = {
        level,
        last_used_at: lastUsedDate || new Date().toISOString(),
        relevance,
      };

      const response = await fetch(`/api/expertise/user-skills/${skill.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        onSkillUpdated();
        onOpenChange(false);
      } else {
        const error = await response.json();
        console.error('Error updating skill:', error);
        alert(error.error || 'Failed to update skill. Please try again.');
      }
    } catch (error) {
      console.error('Error updating skill:', error);
      alert('Failed to update skill. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!skill) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/expertise/user-skills/${skill.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onSkillDeleted();
        onOpenChange(false);
        setShowDeleteConfirm(false);
      } else {
        const error = await response.json();
        console.error('Error deleting skill:', error);
        alert(error.error || 'Failed to delete skill. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting skill:', error);
      alert('Failed to delete skill. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleAddProof = async () => {
    if (!skill || !newProof.title) return;
    
    setAddingProof(true);
    try {
      const response = await fetch(`/api/expertise/user-skills/${skill.id}/proofs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProof),
      });
      
      if (response.ok) {
        const data = await response.json();
        setProofs([...proofs, data.proof]);
        setNewProof({
          proofType: 'project',
          title: '',
          description: '',
          url: '',
          issuedDate: '',
        });
        setShowAddProof(false);
      } else {
        const error = await response.json();
        console.error('Error adding proof:', error);
        alert(error.error || 'Failed to add proof. Please try again.');
      }
    } catch (error) {
      console.error('Error adding proof:', error);
      alert('Failed to add proof. Please try again.');
    } finally {
      setAddingProof(false);
    }
  };

  const handleDeleteProof = async (proofId: string) => {
    if (!skill) return;
    
    try {
      const response = await fetch(`/api/expertise/user-skills/${skill.id}/proofs/${proofId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setProofs(proofs.filter((p) => p.id !== proofId));
      } else {
        const error = await response.json();
        console.error('Error deleting proof:', error);
        alert(error.error || 'Failed to delete proof. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting proof:', error);
      alert('Failed to delete proof. Please try again.');
    }
  };

  const handleRequestVerification = async () => {
    if (!skill || !newVerificationRequest.verifierEmail) return;
    
    setRequestingVerification(true);
    try {
      const response = await fetch(`/api/expertise/user-skills/${skill.id}/verification-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVerificationRequest),
      });
      
      if (response.ok) {
        const data = await response.json();
        setVerificationRequests([data.request, ...verificationRequests]);
        setNewVerificationRequest({
          verifierEmail: '',
          verifierSource: 'peer',
          message: '',
        });
        setShowRequestVerification(false);
      } else {
        const error = await response.json();
        console.error('Error requesting verification:', error);
        alert(error.error || 'Failed to request verification. Please try again.');
      }
    } catch (error) {
      console.error('Error requesting verification:', error);
      alert('Failed to request verification. Please try again.');
    } finally {
      setRequestingVerification(false);
    }
  };

  if (!skill) return null;

  const skillName = skill.taxonomy?.name_i18n?.en || skill.custom_skill_name || 'Unknown Skill';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-[#2D3330]">
              Edit Skill
            </DialogTitle>
            <DialogDescription className="text-[#6B6760]">
              Update your skill details, add proofs, and request verification.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Skill Name (Read-only) */}
            <div>
              <Label className="text-[#2D3330] font-medium">Skill</Label>
              <div className="mt-2 p-3 bg-[#F7F6F1] rounded-md border border-[#E5E3DA]">
                <p className="font-medium text-[#2D3330]">{skillName}</p>
                {skill.taxonomy?.tags && skill.taxonomy.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {skill.taxonomy.tags.map((tag: string) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-xs bg-white"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Proficiency Level */}
            <div>
              <Label className="text-[#2D3330] mb-3 block font-medium">
                Proficiency Level
              </Label>
              <RadioGroup
                value={level.toString()}
                onValueChange={(val: string) => setLevel(parseInt(val))}
              >
                {LEVEL_LABELS.map((lvl) => (
                  <div
                    key={lvl.value}
                    className="flex items-center space-x-3 mb-2 p-3 rounded-lg border border-[#E5E3DA] hover:bg-[#F7F6F1] transition-colors"
                  >
                    <RadioGroupItem value={lvl.value.toString()} id={`edit-level-${lvl.value}`} />
                    <Label htmlFor={`edit-level-${lvl.value}`} className="flex-1 cursor-pointer">
                      <div className="font-medium text-[#2D3330]">{lvl.label}</div>
                      <div className="text-sm text-[#6B6760]">{lvl.description}</div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Last Used */}
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
              <p className="text-xs text-[#6B6760] mt-1">
                When did you last use this skill?
              </p>
            </div>

            {/* Relevance */}
            <div>
              <Label className="text-[#2D3330] mb-3 block font-medium">Relevance</Label>
              <RadioGroup
                value={relevance}
                onValueChange={(val: any) => setRelevance(val)}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <RadioGroupItem value="current" id="edit-relevance-current" />
                  <Label htmlFor="edit-relevance-current" className="cursor-pointer">
                    <Badge variant="outline" className="bg-[#EEF1EA] text-[#4A5943] border-[#7A9278]">
                      Current
                    </Badge>
                    <span className="ml-2 text-sm text-[#6B6760]">
                      Widely used today
                    </span>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 mb-2">
                  <RadioGroupItem value="emerging" id="edit-relevance-emerging" />
                  <Label htmlFor="edit-relevance-emerging" className="cursor-pointer">
                    <Badge variant="outline" className="bg-[#E8F3F8] text-[#3E5C73] border-[#6B9AB8]">
                      Emerging
                    </Badge>
                    <span className="ml-2 text-sm text-[#6B6760]">
                      Growing in demand
                    </span>
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="obsolete" id="edit-relevance-obsolete" />
                  <Label htmlFor="edit-relevance-obsolete" className="cursor-pointer">
                    <Badge variant="outline" className="bg-[#FFF0F0] text-[#8B4A36] border-[#C76B4A]">
                      Obsolete
                    </Badge>
                    <span className="ml-2 text-sm text-[#6B6760]">
                      Declining use
                    </span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            {/* Proofs Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-medium text-[#2D3330]">Proofs</h3>
                  <p className="text-sm text-[#6B6760]">
                    Add evidence to strengthen credibility
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddProof(!showAddProof)}
                  className="border-[#4A5943] text-[#4A5943] hover:bg-[#EEF1EA]"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Proof
                </Button>
              </div>

              {/* Add Proof Form */}
              {showAddProof && (
                <Card className="p-4 mb-4 border-[#E5E3DA]">
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="proof-type" className="text-[#2D3330]">
                        Type
                      </Label>
                      <select
                        id="proof-type"
                        value={newProof.proofType}
                        onChange={(e) =>
                          setNewProof({
                            ...newProof,
                            proofType: e.target.value as any,
                          })
                        }
                        className="mt-1 w-full px-3 py-2 border border-[#E5E3DA] rounded-md"
                      >
                        <option value="project">Project</option>
                        <option value="certification">Certification</option>
                        <option value="media">Media</option>
                        <option value="reference">Reference</option>
                        <option value="link">Link</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="proof-title" className="text-[#2D3330]">
                        Title
                      </Label>
                      <Input
                        id="proof-title"
                        type="text"
                        placeholder="e.g., React App for Client X"
                        value={newProof.title}
                        onChange={(e) =>
                          setNewProof({ ...newProof, title: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="proof-url" className="text-[#2D3330]">
                        URL (Optional)
                      </Label>
                      <Input
                        id="proof-url"
                        type="url"
                        placeholder="https://..."
                        value={newProof.url}
                        onChange={(e) =>
                          setNewProof({ ...newProof, url: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="proof-date" className="text-[#2D3330]">
                        Issued Date (Optional)
                      </Label>
                      <Input
                        id="proof-date"
                        type="date"
                        value={newProof.issuedDate}
                        onChange={(e) =>
                          setNewProof({ ...newProof, issuedDate: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="proof-description" className="text-[#2D3330]">
                        Description (Optional)
                      </Label>
                      <Textarea
                        id="proof-description"
                        placeholder="Describe this proof..."
                        value={newProof.description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setNewProof({ ...newProof, description: e.target.value })
                        }
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleAddProof}
                        disabled={!newProof.title || addingProof}
                        className="bg-[#4A5943] text-white hover:bg-[#3C4936]"
                      >
                        {addingProof ? 'Adding...' : 'Add Proof'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowAddProof(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Proofs List */}
              {loadingProofs ? (
                <div className="text-center py-6 border border-dashed border-[#E5E3DA] rounded-lg">
                  <p className="text-sm text-[#6B6760]">Loading proofs...</p>
                </div>
              ) : proofs.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-[#E5E3DA] rounded-lg">
                  <FileText className="h-8 w-8 text-[#6B6760] mx-auto mb-2" />
                  <p className="text-sm text-[#6B6760]">
                    No proofs added yet. Add your first proof to boost credibility.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {proofs.map((proof) => (
                    <Card key={proof.id} className="p-3 border-[#E5E3DA]">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs capitalize">
                              {proof.proof_type}
                            </Badge>
                            <h4 className="font-medium text-[#2D3330]">{proof.title}</h4>
                          </div>
                          {proof.url && (
                            <a
                              href={proof.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-[#4A5943] hover:underline"
                            >
                              {proof.url}
                            </a>
                          )}
                          {proof.description && (
                            <p className="text-sm text-[#6B6760] mt-1">{proof.description}</p>
                          )}
                          {proof.issued_date && (
                            <p className="text-xs text-[#6B6760] mt-1">
                              Issued: {new Date(proof.issued_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteProof(proof.id)}
                          className="text-[#C76B4A] hover:text-[#8B4A36] hover:bg-[#FFF0F0]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Verification Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-medium text-[#2D3330]">Verification</h3>
                  <p className="text-sm text-[#6B6760]">
                    Request verification from peers or managers
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRequestVerification(!showRequestVerification)}
                  className="border-[#4A5943] text-[#4A5943] hover:bg-[#EEF1EA]"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Request Verification
                </Button>
              </div>

              {/* Request Verification Form */}
              {showRequestVerification && (
                <Card className="p-4 mb-4 border-[#E5E3DA]">
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="verifier-email" className="text-[#2D3330]">
                        Verifier Email
                      </Label>
                      <Input
                        id="verifier-email"
                        type="email"
                        placeholder="colleague@example.com"
                        value={newVerificationRequest.verifierEmail}
                        onChange={(e) =>
                          setNewVerificationRequest({
                            ...newVerificationRequest,
                            verifierEmail: e.target.value,
                          })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="verifier-source" className="text-[#2D3330]">
                        Relationship
                      </Label>
                      <select
                        id="verifier-source"
                        value={newVerificationRequest.verifierSource}
                        onChange={(e) =>
                          setNewVerificationRequest({
                            ...newVerificationRequest,
                            verifierSource: e.target.value as any,
                          })
                        }
                        className="mt-1 w-full px-3 py-2 border border-[#E5E3DA] rounded-md"
                      >
                        <option value="peer">Peer / Colleague</option>
                        <option value="manager">Manager / Supervisor</option>
                        <option value="external">External / Client</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="verification-message" className="text-[#2D3330]">
                        Message (Optional)
                      </Label>
                      <Textarea
                        id="verification-message"
                        placeholder="Add context for the verifier..."
                        value={newVerificationRequest.message}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setNewVerificationRequest({
                            ...newVerificationRequest,
                            message: e.target.value,
                          })
                        }
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleRequestVerification}
                        disabled={!newVerificationRequest.verifierEmail || requestingVerification}
                        className="bg-[#4A5943] text-white hover:bg-[#3C4936]"
                      >
                        {requestingVerification ? 'Sending...' : 'Send Request'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowRequestVerification(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Verification Requests List */}
              {loadingVerifications ? (
                <div className="text-center py-6 border border-dashed border-[#E5E3DA] rounded-lg">
                  <p className="text-sm text-[#6B6760]">Loading verification requests...</p>
                </div>
              ) : verificationRequests.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-[#E5E3DA] rounded-lg">
                  <CheckCircle2 className="h-8 w-8 text-[#6B6760] mx-auto mb-2" />
                  <p className="text-sm text-[#6B6760]">
                    No verification requests yet. Request verification to boost credibility.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {verificationRequests.map((request) => (
                    <Card key={request.id} className="p-3 border-[#E5E3DA]">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant={
                                request.status === 'accepted'
                                  ? 'default'
                                  : request.status === 'declined'
                                  ? 'destructive'
                                  : 'outline'
                              }
                              className="text-xs capitalize"
                            >
                              {request.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs capitalize">
                              {request.verifier_source}
                            </Badge>
                          </div>
                          <p className="text-sm text-[#2D3330] font-medium">
                            {request.verifier_email}
                          </p>
                          {request.message && (
                            <p className="text-sm text-[#6B6760] mt-1">{request.message}</p>
                          )}
                          <p className="text-xs text-[#6B6760] mt-1">
                            Requested: {new Date(request.created_at).toLocaleDateString()}
                          </p>
                          {request.responded_at && (
                            <p className="text-xs text-[#6B6760]">
                              Responded: {new Date(request.responded_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Action Buttons */}
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
                  className="bg-[#4A5943] text-white hover:bg-[#3C4936]"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-[#2D3330]">
              Delete Skill?
            </DialogTitle>
            <DialogDescription className="text-[#6B6760]">
              This will permanently remove <strong>{skillName}</strong> and all its proofs
              from your Expertise Atlas. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1"
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 bg-[#C76B4A] text-white hover:bg-[#8B4A36]"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

