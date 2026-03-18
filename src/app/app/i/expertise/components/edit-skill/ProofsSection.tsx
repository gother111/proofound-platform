import { FileText, Loader2, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  MAX_PROOFS_PER_SKILL,
  MAX_PROOF_UPLOAD_SIZE_BYTES,
  PROOF_ALLOWED_EXTENSIONS_LABEL,
  PROOF_FILE_ACCEPT_ATTRIBUTE,
} from '@/lib/proofs/constants';
import { Textarea } from '@/components/ui/textarea';
import { getIndividualRecoveryActions } from '@/lib/ui/recovery-actions';

import type { Proof, ProofDraft } from './types';

type ProofsSectionProps = {
  proofs: Proof[];
  loadingProofs: boolean;
  showAddProof: boolean;
  setShowAddProof: (open: boolean) => void;
  newProof: ProofDraft;
  setNewProof: (proof: ProofDraft) => void;
  addingProof: boolean;
  proofUploading: boolean;
  proofUploadError: string | null;
  proofUploadName: string;
  onProofFileSelected: (file: File | null) => void;
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
  proofUploading,
  proofUploadError,
  proofUploadName,
  onProofFileSelected,
  onAddProof,
  onDeleteProof,
}: ProofsSectionProps) {
  const router = useRouter();
  const recoveryActions = getIndividualRecoveryActions('proofs-empty');
  const isProofLimitReached = proofs.length >= MAX_PROOFS_PER_SKILL;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-medium text-foreground">Proofs</h3>
          <p className="text-sm text-muted-foreground">
            Add evidence to strengthen credibility ({proofs.length}/{MAX_PROOFS_PER_SKILL})
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (isProofLimitReached) return;
            setShowAddProof(!showAddProof);
          }}
          disabled={isProofLimitReached}
          className="border-proofound-forest text-proofound-forest hover:bg-proofound-forest/5"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Proof
        </Button>
      </div>
      {isProofLimitReached && (
        <p className="text-xs text-muted-foreground mb-3">
          You have reached the maximum of {MAX_PROOFS_PER_SKILL} proofs for this skill.
        </p>
      )}

      {showAddProof && !isProofLimitReached && (
        <Card className="p-4 mb-4 border-proofound-stone">
          <div className="space-y-3">
            <div>
              <Label htmlFor="proof-type" className="text-foreground">
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
                className="mt-1 w-full px-3 py-2 border border-proofound-stone rounded-md"
              >
                <option value="project">Project</option>
                <option value="certification">Certification</option>
                <option value="media">Media</option>
                <option value="reference">Reference</option>
                <option value="link">Link</option>
                <option value="document">Document</option>
              </select>
            </div>
            <div>
              <Label htmlFor="proof-title" className="text-foreground">
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
              <p className="text-xs text-muted-foreground mt-1">
                Provide a title or URL. If title is empty, we will derive one from the URL.
              </p>
            </div>
            <div>
              <Label htmlFor="proof-url" className="text-foreground">
                URL {newProof.proofType === 'document' ? '(Optional)' : ''}
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
            {newProof.proofType === 'document' && (
              <div>
                <Label htmlFor="proof-file" className="text-foreground">
                  Upload Document
                </Label>
                <Input
                  id="proof-file"
                  type="file"
                  accept={PROOF_FILE_ACCEPT_ATTRIBUTE}
                  onChange={(event) => onProofFileSelected(event.target.files?.[0] || null)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Accepted: {PROOF_ALLOWED_EXTENSIONS_LABEL}. Max size:{' '}
                  {MAX_PROOF_UPLOAD_SIZE_BYTES / (1024 * 1024)}MB.
                </p>
                {proofUploading && (
                  <p className="text-xs text-muted-foreground mt-1">Uploading document...</p>
                )}
                {proofUploadName && !proofUploading && (
                  <p className="text-xs text-muted-foreground mt-1">Uploaded: {proofUploadName}</p>
                )}
                {proofUploadError && (
                  <p className="text-xs text-proofound-terracotta mt-1">{proofUploadError}</p>
                )}
              </div>
            )}
            <div>
              <Label htmlFor="proof-date" className="text-foreground">
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
              <Label htmlFor="proof-expires-date" className="text-foreground">
                Expiration Date (Optional)
              </Label>
              <Input
                id="proof-expires-date"
                type="date"
                value={newProof.expiresDate}
                min={newProof.issuedDate || undefined}
                onChange={(e) => setNewProof({ ...newProof, expiresDate: e.target.value })}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty for proofs that do not expire.
              </p>
            </div>
            <div>
              <Label htmlFor="proof-description" className="text-foreground">
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
                disabled={
                  (!newProof.title.trim() && !newProof.url.trim() && !newProof.filePath.trim()) ||
                  addingProof ||
                  proofUploading ||
                  isProofLimitReached
                }
                className="bg-proofound-forest text-white hover:bg-proofound-forest/90"
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
        <div className="flex items-center justify-center gap-2 py-6 border border-dashed border-proofound-stone rounded-lg">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading proofs...</p>
        </div>
      ) : proofs.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-proofound-stone rounded-lg">
          <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No proofs added yet. Add your first proof to boost credibility.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-2 text-left">
            {recoveryActions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => {
                  if (action.id === 'add-proof') {
                    setShowAddProof(true);
                    return;
                  }
                  router.push(action.actionUrl);
                }}
                className="rounded-lg border border-proofound-stone bg-white px-3 py-2 hover:border-proofound-forest hover:bg-japandi-bg"
              >
                <p className="text-sm font-medium text-foreground">{action.title}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {proofs.map((proof) => (
            <Card key={proof.id} className="p-3 border-proofound-stone">
              {(() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const expiresDate = proof.expires_date ? new Date(proof.expires_date) : null;
                if (expiresDate) {
                  expiresDate.setHours(0, 0, 0, 0);
                }
                const isExpired = Boolean(
                  expiresDate && Number.isFinite(expiresDate.getTime()) && expiresDate < today
                );

                return (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs capitalize">
                          {proof.proof_type}
                        </Badge>
                        <h4 className="font-medium text-foreground">{proof.title}</h4>
                        {isExpired && (
                          <Badge className="bg-[#FFF0F0] text-[#8B4A36] border border-[#F5D6CD]">
                            Expired
                          </Badge>
                        )}
                      </div>
                      {proof.url && (
                        <a
                          href={proof.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-proofound-forest hover:underline"
                        >
                          {proof.url}
                        </a>
                      )}
                      {proof.file_path && (
                        <p className="text-xs text-muted-foreground mt-1">Document attached</p>
                      )}
                      {proof.description && (
                        <p className="text-sm text-muted-foreground mt-1">{proof.description}</p>
                      )}
                      {proof.issued_date && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Issued: {new Date(proof.issued_date).toLocaleDateString()}
                        </p>
                      )}
                      {proof.expires_date && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Expires: {new Date(proof.expires_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteProof(proof.id)}
                      aria-label={`Remove proof ${proof.title}`}
                      className="text-proofound-terracotta hover:text-[#8B4A36] hover:bg-[#FFF0F0]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })()}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
