import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  FileText,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { apiFetch } from '@/lib/api/fetch';
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
import { proofTypeLabel } from '@/lib/copy/labels';
import { Textarea } from '@/components/ui/textarea';
import { getIndividualRecoveryActions } from '@/lib/ui/recovery-actions';
import { useAssistiveAiFlag } from '@/hooks/useAssistiveAiFlag';
import { useProofArtifactOcrBetaStatus } from '@/hooks/useProofArtifactOcrBetaStatus';

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

type ProofPackAssistantSuggestion = {
  suggestionId?: string | null;
  fallback?: boolean;
  missingContext: string[];
  suggestedRewrite: {
    title?: string | null;
    claimStatement?: string | null;
    ownershipStatement?: string | null;
    outcomeSummary?: string | null;
    timeframe?: string | null;
  };
  privacyFlags: string[];
  verificationSuggestions: string[];
  warnings: string[];
};

type AssistantState = {
  loading: boolean;
  error: string | null;
  suggestion: ProofPackAssistantSuggestion | null;
  draft: NonNullable<ProofPackAssistantSuggestion['suggestedRewrite']>;
  acceptedFields: Record<string, boolean>;
};

type ProofArtifactOcrDraftFields = {
  title?: string;
  summary?: string;
  evidenceSummary?: string;
  outcomesSummary?: string;
  ownershipStatement?: string;
};

type ProofArtifactOcrResult = {
  requestId: string;
  artifactId: string;
  status: 'completed';
  draftOnly: true;
  provider: string;
  pageCount: number;
  confidence: number;
  extractedTextPreview: string;
  privacyRiskWarnings: string[];
  suggestedProofPackFieldsDraft: ProofArtifactOcrDraftFields;
};

type OcrState = {
  consentOpen: boolean;
  consentAccepted: boolean;
  loading: boolean;
  applying: boolean;
  error: string | null;
  result: ProofArtifactOcrResult | null;
  privacyConfirmed: boolean;
  applied: boolean;
};

const ASSISTANT_FIELDS: Array<{
  key: keyof ProofPackAssistantSuggestion['suggestedRewrite'];
  label: string;
}> = [
  { key: 'title', label: 'Title' },
  { key: 'claimStatement', label: 'Claim' },
  { key: 'ownershipStatement', label: 'Ownership' },
  { key: 'outcomeSummary', label: 'Outcome' },
  { key: 'timeframe', label: 'Timeframe' },
];

function buildManualProofPackAssistantSuggestion(reason: string): ProofPackAssistantSuggestion {
  return {
    fallback: true,
    missingContext: [
      'Add one clear claim about what this proof shows.',
      'State your role or ownership in the work.',
      'Add the outcome or contribution this proof supports.',
      'Attach at least one public-safe evidence title or type.',
    ],
    suggestedRewrite: {},
    privacyFlags: [
      'Review private names, contact details, filenames, and private links before publishing.',
    ],
    verificationSuggestions: [
      'Ask a non-self verifier to confirm the specific claim, ownership, and outcome.',
    ],
    warnings: [reason],
  };
}

function resolveProofPackId(proof: Proof) {
  return proof.canonicalPackId || proof.canonical_pack_id || null;
}

function resolveProofArtifactId(proof: Proof) {
  return proof.canonicalArtifactId || proof.canonical_artifact_id || null;
}

function createOcrState(overrides: Partial<OcrState> = {}): OcrState {
  return {
    consentOpen: false,
    consentAccepted: false,
    loading: false,
    applying: false,
    error: null,
    result: null,
    privacyConfirmed: false,
    applied: false,
    ...overrides,
  };
}

function ocrUnavailableCopy(reason: string | null) {
  if (reason === 'disabled') {
    return 'OCR is currently disabled. Upload the proof document and add the relevant text manually.';
  }
  return 'OCR is temporarily unavailable. Upload the proof document and continue with manual Proof Pack editing.';
}

function recordAssistantEvent(
  suggestionId: string | null | undefined,
  eventType: 'accepted' | 'edited' | 'dismissed',
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
      fields: [{ field, edited, applied: eventType === 'accepted' }],
      metadata: { uiSurface: 'proof_pack_assistant' },
    }),
  }).catch(() => undefined);
}

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
  const assistiveAiEnabled = useAssistiveAiFlag();
  const proofArtifactOcrStatus = useProofArtifactOcrBetaStatus();
  const [assistantByPackId, setAssistantByPackId] = useState<Record<string, AssistantState>>({});
  const [ocrByArtifactId, setOcrByArtifactId] = useState<Record<string, OcrState>>({});

  const requestAssistant = async (proofPackId: string) => {
    setAssistantByPackId((current) => ({
      ...current,
      [proofPackId]: {
        loading: true,
        error: null,
        suggestion: current[proofPackId]?.suggestion ?? null,
        draft: current[proofPackId]?.draft ?? {},
        acceptedFields: current[proofPackId]?.acceptedFields ?? {},
      },
    }));

    try {
      const response = await apiFetch('/api/ai/proof-pack/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proofPackId,
          idempotencyKey:
            typeof crypto !== 'undefined' && 'randomUUID' in crypto
              ? crypto.randomUUID()
              : `${proofPackId}:${Date.now()}`,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
          message?: string;
          fallbackAvailable?: boolean;
        };
        if (payload.fallbackAvailable) {
          const suggestion = buildManualProofPackAssistantSuggestion(
            'AI suggestions are temporarily unavailable; manual editing still works.'
          );
          setAssistantByPackId((current) => ({
            ...current,
            [proofPackId]: {
              loading: false,
              error: null,
              suggestion,
              draft: suggestion.suggestedRewrite,
              acceptedFields: {},
            },
          }));
          return;
        }
        throw new Error(payload.message || payload.error || 'Suggestion failed.');
      }

      const suggestion = (await response.json()) as ProofPackAssistantSuggestion;
      setAssistantByPackId((current) => ({
        ...current,
        [proofPackId]: {
          loading: false,
          error: null,
          suggestion,
          draft: suggestion.suggestedRewrite || {},
          acceptedFields: {},
        },
      }));
    } catch (error) {
      setAssistantByPackId((current) => ({
        ...current,
        [proofPackId]: {
          loading: false,
          error: error instanceof Error ? error.message : 'Suggestion failed.',
          suggestion: current[proofPackId]?.suggestion ?? null,
          draft: current[proofPackId]?.draft ?? {},
          acceptedFields: current[proofPackId]?.acceptedFields ?? {},
        },
      }));
    }
  };

  const updateAssistantDraft = (
    proofPackId: string,
    field: keyof ProofPackAssistantSuggestion['suggestedRewrite'],
    value: string
  ) => {
    setAssistantByPackId((current) => ({
      ...current,
      [proofPackId]: {
        ...(current[proofPackId] ?? {
          loading: false,
          error: null,
          suggestion: null,
          draft: {},
          acceptedFields: {},
        }),
        draft: {
          ...(current[proofPackId]?.draft ?? {}),
          [field]: value,
        },
        acceptedFields: {
          ...(current[proofPackId]?.acceptedFields ?? {}),
          [field]: false,
        },
      },
    }));
  };

  const recordAssistantEdit = (
    proofPackId: string,
    field: keyof ProofPackAssistantSuggestion['suggestedRewrite']
  ) => {
    const current = assistantByPackId[proofPackId];
    if (!current?.suggestion?.suggestionId) return;
    if ((current.draft?.[field] || '') === (current.suggestion.suggestedRewrite?.[field] || '')) {
      return;
    }
    recordAssistantEvent(current.suggestion.suggestionId, 'edited', field, true);
  };

  const acceptAssistantField = (
    proofPackId: string,
    field: keyof ProofPackAssistantSuggestion['suggestedRewrite']
  ) => {
    setAssistantByPackId((current) => ({
      ...current,
      [proofPackId]: {
        ...(current[proofPackId] ?? {
          loading: false,
          error: null,
          suggestion: null,
          draft: {},
          acceptedFields: {},
        }),
        acceptedFields: {
          ...(current[proofPackId]?.acceptedFields ?? {}),
          [field]: true,
        },
      },
    }));
    const current = assistantByPackId[proofPackId];
    recordAssistantEvent(
      current?.suggestion?.suggestionId,
      'accepted',
      field,
      (current?.draft?.[field] || '') !== (current?.suggestion?.suggestedRewrite?.[field] || '')
    );
  };

  const dismissAssistant = (proofPackId: string) => {
    recordAssistantEvent(
      assistantByPackId[proofPackId]?.suggestion?.suggestionId,
      'dismissed',
      'assistant'
    );
    setAssistantByPackId((current) => {
      const next = { ...current };
      delete next[proofPackId];
      return next;
    });
  };

  const updateOcrState = (artifactId: string, patch: Partial<OcrState>) => {
    setOcrByArtifactId((current) => ({
      ...current,
      [artifactId]: createOcrState({
        ...(current[artifactId] ?? {}),
        ...patch,
      }),
    }));
  };

  const requestProofArtifactOcr = async (artifactId: string) => {
    const current = ocrByArtifactId[artifactId];
    if (!current?.consentAccepted) {
      updateOcrState(artifactId, {
        consentOpen: true,
        error: 'Review and confirm the OCR consent before extraction.',
      });
      return;
    }

    updateOcrState(artifactId, {
      loading: true,
      error: null,
      applied: false,
    });

    try {
      const response = await apiFetch(`/api/proof-artifacts/${artifactId}/text-extraction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consentToProcess: true }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || 'OCR is unavailable. Continue with manual editing.');
      }

      const result = (await response.json()) as ProofArtifactOcrResult;
      updateOcrState(artifactId, {
        loading: false,
        error: null,
        result,
        consentOpen: false,
        privacyConfirmed: false,
      });
    } catch (error) {
      updateOcrState(artifactId, {
        loading: false,
        error: error instanceof Error ? error.message : 'OCR is unavailable.',
      });
    }
  };

  const applyProofArtifactOcrDraft = async (
    artifactId: string,
    proofPackId: string,
    result: ProofArtifactOcrResult
  ) => {
    const current = ocrByArtifactId[artifactId];
    if (!current?.privacyConfirmed) {
      updateOcrState(artifactId, {
        error: 'Confirm the privacy warning before copying OCR text into a Proof Pack draft.',
      });
      return;
    }

    updateOcrState(artifactId, {
      applying: true,
      error: null,
    });

    try {
      const response = await apiFetch(`/api/proof-artifacts/${artifactId}/text-extraction/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proofPackId,
          sourceExtractionRequestId: result.requestId,
          selectedFields: result.suggestedProofPackFieldsDraft,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || 'Selected OCR draft text could not be copied.');
      }

      updateOcrState(artifactId, {
        applying: false,
        applied: true,
      });
    } catch (error) {
      updateOcrState(artifactId, {
        applying: false,
        error:
          error instanceof Error ? error.message : 'Selected OCR draft text could not be copied.',
      });
    }
  };

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
            No proofs added yet. Add your first proof so future confirmations stay attached to
            evidence.
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
                const proofPackId = resolveProofPackId(proof);
                const proofArtifactId = resolveProofArtifactId(proof);
                const assistant = proofPackId ? assistantByPackId[proofPackId] : null;
                const ocr = proofArtifactId ? ocrByArtifactId[proofArtifactId] : null;
                const canShowOcr =
                  proofArtifactOcrStatus.visible &&
                  proof.proof_type === 'document' &&
                  Boolean(proof.file_path) &&
                  Boolean(proofArtifactId) &&
                  Boolean(proofPackId);
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
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs capitalize">
                            {proofTypeLabel(proof.proof_type)}
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
                        {proofPackId && assistiveAiEnabled && (
                          <div className="mt-3 space-y-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => requestAssistant(proofPackId)}
                              disabled={assistant?.loading}
                              className="border-proofound-forest text-proofound-forest hover:bg-proofound-forest/5"
                            >
                              {assistant?.loading ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Sparkles className="h-4 w-4 mr-2" />
                              )}
                              Improve this proof
                            </Button>
                            <p className="text-xs text-muted-foreground">
                              AI suggestions are drafts. They do not verify, score, rank, or
                              evaluate anyone.
                            </p>
                          </div>
                        )}
                        {canShowOcr && proofArtifactId && proofPackId && (
                          <div className="mt-3 rounded-lg border border-proofound-stone bg-white p-3">
                            {!proofArtifactOcrStatus.available ? (
                              <div className="flex gap-2 text-sm text-muted-foreground">
                                <FileSearch className="mt-0.5 h-4 w-4 text-proofound-forest" />
                                <p>
                                  {ocrUnavailableCopy(proofArtifactOcrStatus.unavailableReason)}
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      updateOcrState(proofArtifactId, {
                                        consentOpen: true,
                                        error: null,
                                      })
                                    }
                                    disabled={ocr?.loading}
                                    className="border-proofound-forest text-proofound-forest hover:bg-proofound-forest/5"
                                  >
                                    {ocr?.loading ? (
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                      <FileSearch className="h-4 w-4 mr-2" />
                                    )}
                                    Extract text from this proof document
                                  </Button>
                                  <span className="text-xs text-muted-foreground">
                                    Optional beta. Draft text only.
                                  </span>
                                </div>

                                {ocr?.consentOpen && !ocr.result && (
                                  <div className="rounded-md border border-proofound-stone bg-japandi-bg/60 p-3">
                                    <p className="text-sm font-medium text-foreground">
                                      Consent before OCR
                                    </p>
                                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                                      <li>
                                        This document will be processed by Google Cloud Document AI.
                                      </li>
                                      <li>OCR is optional.</li>
                                      <li>Extracted text is a draft.</li>
                                      <li>Nothing is published automatically.</li>
                                      <li>Nothing is verified automatically.</li>
                                      <li>Nothing is used for ranking, scoring, or matching.</li>
                                      <li>You can delete or discard extracted text.</li>
                                    </ul>
                                    <label className="mt-3 flex items-start gap-2 text-xs text-foreground">
                                      <input
                                        type="checkbox"
                                        checked={ocr.consentAccepted}
                                        onChange={(event) =>
                                          updateOcrState(proofArtifactId, {
                                            consentAccepted: event.target.checked,
                                            error: null,
                                          })
                                        }
                                        className="mt-0.5"
                                      />
                                      I consent to process this proof document for optional OCR.
                                    </label>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => requestProofArtifactOcr(proofArtifactId)}
                                        disabled={!ocr.consentAccepted || ocr.loading}
                                        className="bg-proofound-forest text-white hover:bg-proofound-forest/90"
                                      >
                                        {ocr.loading && (
                                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        )}
                                        Run OCR
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          updateOcrState(proofArtifactId, {
                                            consentOpen: false,
                                            consentAccepted: false,
                                            error: null,
                                          })
                                        }
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                {ocr?.error && (
                                  <p className="rounded-md border border-[#F5D6CD] bg-[#FFF0F0] px-3 py-2 text-sm text-[#8B4A36]">
                                    {ocr.error}
                                  </p>
                                )}

                                {ocr?.result && (
                                  <div className="rounded-md border border-proofound-stone bg-japandi-bg/60 p-3">
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <p className="text-sm font-medium text-foreground">
                                          Extracted text preview
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          Draft only. Review and edit before keeping anything.
                                        </p>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          updateOcrState(proofArtifactId, createOcrState())
                                        }
                                      >
                                        <X className="h-4 w-4 mr-1" />
                                        Discard
                                      </Button>
                                    </div>
                                    <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-md border border-proofound-stone bg-white p-3 text-xs text-foreground">
                                      {ocr.result.extractedTextPreview}
                                    </pre>
                                    <div className="mt-3 rounded-md border border-[#F5D6CD] bg-[#FFF8F5] p-3">
                                      <div className="flex items-start gap-2">
                                        <AlertTriangle className="mt-0.5 h-4 w-4 text-[#8B4A36]" />
                                        <div>
                                          <p className="text-xs font-medium text-[#8B4A36]">
                                            Privacy warnings
                                          </p>
                                          <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-[#8B4A36]">
                                            {ocr.result.privacyRiskWarnings.map((warning) => (
                                              <li key={warning}>{warning}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      </div>
                                    </div>
                                    <label className="mt-3 flex items-start gap-2 text-xs text-foreground">
                                      <input
                                        type="checkbox"
                                        checked={ocr.privacyConfirmed}
                                        onChange={(event) =>
                                          updateOcrState(proofArtifactId, {
                                            privacyConfirmed: event.target.checked,
                                            error: null,
                                          })
                                        }
                                        className="mt-0.5"
                                      />
                                      I reviewed the privacy warnings and want to copy selected
                                      draft text into this Proof Pack draft.
                                    </label>
                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          applyProofArtifactOcrDraft(
                                            proofArtifactId,
                                            proofPackId,
                                            ocr.result as ProofArtifactOcrResult
                                          )
                                        }
                                        disabled={!ocr.privacyConfirmed || ocr.applying}
                                      >
                                        {ocr.applying ? (
                                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                          <ClipboardCheck className="h-4 w-4 mr-2" />
                                        )}
                                        Copy to Proof Pack draft
                                      </Button>
                                      {ocr.applied && (
                                        <span className="inline-flex items-center gap-1 text-xs text-proofound-forest">
                                          <CheckCircle2 className="h-4 w-4" />
                                          Copied to draft only
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
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

                    {assistant?.error && (
                      <p className="rounded-md border border-[#F5D6CD] bg-[#FFF0F0] px-3 py-2 text-sm text-[#8B4A36]">
                        {assistant.error}
                      </p>
                    )}

                    {assistant?.suggestion && proofPackId && (
                      <div className="rounded-lg border border-proofound-stone bg-japandi-bg/50 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {assistant.suggestion.fallback
                                ? 'Manual clarity checklist'
                                : 'Draft assistance'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Review, edit, accept individual fields, or dismiss. Nothing is saved
                              automatically.
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => dismissAssistant(proofPackId)}
                          >
                            Dismiss
                          </Button>
                        </div>

                        <div className="mt-3 space-y-3">
                          {ASSISTANT_FIELDS.map(({ key, label }) => {
                            const value = assistant.draft[key] ?? '';
                            if (!value && !assistant.suggestion?.suggestedRewrite?.[key]) {
                              return null;
                            }
                            return (
                              <div key={key} className="space-y-1">
                                <Label htmlFor={`${proofPackId}-${key}`}>{label}</Label>
                                <Textarea
                                  id={`${proofPackId}-${key}`}
                                  value={value}
                                  onChange={(event) =>
                                    updateAssistantDraft(proofPackId, key, event.target.value)
                                  }
                                  onBlur={() => recordAssistantEdit(proofPackId, key)}
                                  rows={key === 'title' || key === 'timeframe' ? 2 : 3}
                                  className="bg-white"
                                />
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => acceptAssistantField(proofPackId, key)}
                                  >
                                    Accept {label.toLowerCase()}
                                  </Button>
                                  {assistant.acceptedFields[key] && (
                                    <span className="text-xs text-proofound-forest">Accepted</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {assistant.suggestion.missingContext.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-medium text-foreground">Missing context</p>
                            <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                              {assistant.suggestion.missingContext.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {assistant.suggestion.privacyFlags.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-medium text-foreground">Privacy flags</p>
                            <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                              {assistant.suggestion.privacyFlags.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {assistant.suggestion.verificationSuggestions.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-medium text-foreground">
                              Verification suggestions
                            </p>
                            <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                              {assistant.suggestion.verificationSuggestions.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {assistant.suggestion.warnings.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-medium text-foreground">Warnings</p>
                            <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                              {assistant.suggestion.warnings.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
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
