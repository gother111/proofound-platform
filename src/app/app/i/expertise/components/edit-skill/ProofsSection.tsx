import { FileText, Loader2, Plus, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import type { Proof, ProofDraft } from './types';

type ProofsSectionProps = {
  proofs: Proof[];
  loadingProofs: boolean;
  showAddProof: boolean;
  setShowAddProof: (open: boolean) => void;
  newProof: ProofDraft;
  setNewProof: (proof: ProofDraft) => void;
  addingProof: boolean;
  onAddProof: () => void;
  onDeleteProof: (proofId: string) => void;
};

export function ProofsSection({
  proofs,
  loadingProofs,
  showAddProof,
  setShowAddProof,
  newProof,
  setNewProof,
  addingProof,
  onAddProof,
  onDeleteProof,
}: ProofsSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-medium text-[#2D3330]">Proofs</h3>
          <p className="text-sm text-[#6B6760]">Add evidence to strengthen credibility</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddProof(!showAddProof)}
          className="border-[#1C4D3A] text-[#1C4D3A] hover:bg-[#EEF1EA]"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Proof
        </Button>
      </div>

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
                    proofType: e.target.value as ProofDraft['proofType'],
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
                onChange={(e) => setNewProof({ ...newProof, title: e.target.value })}
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
                onChange={(e) => setNewProof({ ...newProof, url: e.target.value })}
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
                onChange={(e) => setNewProof({ ...newProof, issuedDate: e.target.value })}
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
                onChange={(e) => setNewProof({ ...newProof, description: e.target.value })}
                rows={3}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={onAddProof}
                disabled={!newProof.title || addingProof}
                className="bg-[#1C4D3A] text-white hover:bg-[#2D5F4A]"
              >
                {addingProof ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Proof'
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowAddProof(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {loadingProofs ? (
        <div className="flex items-center justify-center gap-2 py-6 border border-dashed border-[#E5E3DA] rounded-lg">
          <Loader2 className="h-5 w-5 animate-spin text-[#6B6760]" />
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
                      className="text-sm text-[#1C4D3A] hover:underline"
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
                  onClick={() => onDeleteProof(proof.id)}
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
  );
}
