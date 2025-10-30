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
  type: 'project' | 'certification' | 'media' | 'reference';
  url?: string;
  title?: string;
  date?: string;
  notes?: string;
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
  const [showAddProof, setShowAddProof] = useState(false);
  const [newProof, setNewProof] = useState({
    type: 'project' as 'project' | 'certification' | 'media' | 'reference',
    url: '',
    title: '',
    date: '',
    notes: '',
  });

  // Load skill data when opened
  useEffect(() => {
    if (skill && open) {
      setLevel(skill.level || 2);
      setLastUsedDate(
        skill.last_used_at
          ? new Date(skill.last_used_at).toISOString().split('T')[0]
          : ''
      );
      setRelevance(skill.relevance || 'current');
      // TODO: Load actual proofs from API
      setProofs([]);
    }
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

  const handleAddProof = () => {
    // TODO: Implement proof addition API
    const proof: Proof = {
      id: `proof-${Date.now()}`,
      ...newProof,
    };
    setProofs([...proofs, proof]);
    setNewProof({
      type: 'project',
      url: '',
      title: '',
      date: '',
      notes: '',
    });
    setShowAddProof(false);
  };

  const handleDeleteProof = (proofId: string) => {
    // TODO: Implement proof deletion API
    setProofs(proofs.filter((p) => p.id !== proofId));
  };

  const handleRequestVerification = () => {
    // TODO: Implement verification request flow
    alert('Verification request feature coming soon!');
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
                onValueChange={(val) => setLevel(parseInt(val))}
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
                        value={newProof.type}
                        onChange={(e) =>
                          setNewProof({
                            ...newProof,
                            type: e.target.value as any,
                          })
                        }
                        className="mt-1 w-full px-3 py-2 border border-[#E5E3DA] rounded-md"
                      >
                        <option value="project">Project</option>
                        <option value="certification">Certification</option>
                        <option value="media">Media</option>
                        <option value="reference">Reference</option>
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
                        Date
                      </Label>
                      <Input
                        id="proof-date"
                        type="date"
                        value={newProof.date}
                        onChange={(e) =>
                          setNewProof({ ...newProof, date: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="proof-notes" className="text-[#2D3330]">
                        Notes
                      </Label>
                      <Textarea
                        id="proof-notes"
                        placeholder="Describe this proof..."
                        value={newProof.notes}
                        onChange={(e) =>
                          setNewProof({ ...newProof, notes: e.target.value })
                        }
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleAddProof}
                        disabled={!newProof.title}
                        className="bg-[#4A5943] text-white hover:bg-[#3C4936]"
                      >
                        Add Proof
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
              {proofs.length === 0 ? (
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
                            <Badge variant="outline" className="text-xs">
                              {proof.type}
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
                          {proof.notes && (
                            <p className="text-sm text-[#6B6760] mt-1">{proof.notes}</p>
                          )}
                          {proof.date && (
                            <p className="text-xs text-[#6B6760] mt-1">
                              Date: {new Date(proof.date).toLocaleDateString()}
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
                  onClick={handleRequestVerification}
                  className="border-[#4A5943] text-[#4A5943] hover:bg-[#EEF1EA]"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Request Verification
                </Button>
              </div>

              <Card className="p-4 border-[#E5E3DA]">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-[#C76B4A]" />
                  <div>
                    <p className="text-sm font-medium text-[#2D3330]">
                      Not Verified
                    </p>
                    <p className="text-xs text-[#6B6760]">
                      Request verification to increase credibility
                    </p>
                  </div>
                </div>
              </Card>
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

