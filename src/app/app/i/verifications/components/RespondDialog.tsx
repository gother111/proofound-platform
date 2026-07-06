'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api/fetch';
import { dispatchClientDiagnostic, dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';
import {
  HumanObservedAttestationFields,
  buildHumanObservedAttestationPayload,
  createDefaultHumanObservedAttestationForm,
  type HumanObservedAttestationFormValue,
} from '@/components/verification/HumanObservedAttestationFields';

interface RespondDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: any;
  action: 'accept' | 'decline';
  onComplete: (updatedRequest: any) => void;
  getSkillName: (request: any) => string;
  getBreadcrumb: (request: any) => string;
  getRequesterName: (request: any) => string;
  getCompetencyLabel: (level: number) => string;
}

const VERIFICATION_RESPONSE_RETRY_MESSAGE =
  'Verification response could not be sent. Your response is still here; please try again.';
const VERIFICATION_RESPONSE_ERROR_MESSAGES = new Map([
  [
    'Unauthorized',
    'Please sign in again before responding to this verification request. Your response is still here.',
  ],
  ['Invalid JSON body', VERIFICATION_RESPONSE_RETRY_MESSAGE],
  ['Verification request not found', 'This verification request is no longer available.'],
  [
    'Not authorized to respond to this verification request',
    'You are not authorized to respond to this verification request.',
  ],
  [
    'This attestation request is missing its bounded skill scope.',
    'This attestation request is missing its bounded skill scope.',
  ],
  ['Validation failed', 'Review the required attestation details before submitting.'],
  [
    'Structured attestations marked accept must use verdict yes or partly.',
    'Structured attestations marked accept must use verdict yes or partly.',
  ],
  [
    'Structured attestations marked decline must use verdict no.',
    'Structured attestations marked decline must use verdict no.',
  ],
  ['Failed to update verification request', VERIFICATION_RESPONSE_RETRY_MESSAGE],
  ['Internal server error', VERIFICATION_RESPONSE_RETRY_MESSAGE],
]);

function getResponseStatus(response: Response) {
  return typeof response.status === 'number' ? response.status : 'unknown';
}

function verificationResponseErrorMessage(message: string, status: number | 'unknown' = 'unknown') {
  if (/^This verification request has already been \w+/.test(message)) {
    return message;
  }

  const safeMessage = VERIFICATION_RESPONSE_ERROR_MESSAGES.get(message);
  if (safeMessage) {
    return safeMessage;
  }

  dispatchClientDiagnostic('verifications.respond.returned_error', {
    status,
    hasReturnedError: true,
  });
  return VERIFICATION_RESPONSE_RETRY_MESSAGE;
}

export function RespondDialog({
  open,
  onOpenChange,
  request,
  action,
  onComplete,
  getSkillName,
  getBreadcrumb,
  getRequesterName,
  getCompetencyLabel,
}: RespondDialogProps) {
  const [responseMessage, setResponseMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attestationForm, setAttestationForm] = useState<HumanObservedAttestationFormValue>(
    createDefaultHumanObservedAttestationForm()
  );

  const isAttestationRequest = request?.requestKind === 'human_observed_attestation';

  const resolveAttestationPayload = () => {
    if (!isAttestationRequest) {
      return undefined;
    }

    return buildHumanObservedAttestationPayload({
      form: {
        ...attestationForm,
        verdict: action === 'decline' ? 'no' : attestationForm.verdict,
      },
      skillIds: request?.attestationRequest?.skillIds || [request?.subjectId].filter(Boolean),
    });
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    setAttestationForm(
      createDefaultHumanObservedAttestationForm(
        isAttestationRequest ? request?.verifierRelationship || request?.verifierSource || '' : ''
      )
    );
    setResponseMessage('');
    setError(null);
  }, [isAttestationRequest, open, request]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await apiFetch(`/api/verification/requests/skill/${request.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          responseMessage: responseMessage.trim() || undefined,
          attestation: resolveAttestationPayload(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onComplete(data.request);
        setResponseMessage('');
      } else {
        const errorData = await response.json().catch(() => null);
        setError(
          typeof errorData.error === 'string'
            ? verificationResponseErrorMessage(errorData.error, getResponseStatus(response))
            : VERIFICATION_RESPONSE_RETRY_MESSAGE
        );
      }
    } catch (err) {
      dispatchClientErrorDiagnostic('verifications.respond.submit_failed', err);
      setError(VERIFICATION_RESPONSE_RETRY_MESSAGE);
    } finally {
      setIsSubmitting(false);
    }
  };

  const skillName = getSkillName(request);
  const breadcrumb = getBreadcrumb(request);
  const requesterName = getRequesterName(request);
  const competencyLevel = request.skills?.competency_level;
  const proofLabel = request?.proofLabel || request?.canonicalPackTitle || skillName;
  const claimSummary = request?.claimSummary || 'Confirm this skill claim from direct observation.';
  const confirmationOutcome =
    request?.confirmationOutcome ||
    'This request records a bounded confirmation linked to the underlying proof.';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" style={{ backgroundColor: '#FDFCFA' }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: '#2D3330' }}>
            {action === 'accept' ? (
              <>
                <CheckCircle2 className="w-5 h-5" style={{ color: '#10B981' }} />
                Confirm observation
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5" style={{ color: '#EF4444' }} />
                Decline observation
              </>
            )}
          </DialogTitle>
          <DialogDescription style={{ color: '#6B7470' }}>
            {action === 'accept'
              ? `You are about to confirm ${requesterName}'s proof-backed claim.`
              : `You are declining to confirm ${requesterName}'s proof-backed claim.`}
          </DialogDescription>
        </DialogHeader>

        <div
          className="p-4 rounded-lg border"
          style={{ borderColor: 'rgba(232, 230, 221, 0.6)', backgroundColor: '#F7F6F1' }}
        >
          <h4 className="font-semibold text-sm mb-2" style={{ color: '#2D3330' }}>
            Proof scope
          </h4>
          <div className="space-y-1">
            <p className="text-sm" style={{ color: '#2D3330' }}>
              <span className="font-medium">Proof:</span> {proofLabel}
            </p>
            <p className="text-sm" style={{ color: '#2D3330' }}>
              <span className="font-medium">Claim:</span> {claimSummary}
            </p>
            {breadcrumb && (
              <p className="text-xs" style={{ color: '#6B7470' }}>
                {breadcrumb}
              </p>
            )}
            <p className="text-xs" style={{ color: '#6B7470' }}>
              If confirmed: {confirmationOutcome}
            </p>
            {competencyLevel && (
              <p className="text-sm" style={{ color: '#2D3330' }}>
                <span className="font-medium">Competency:</span>{' '}
                {getCompetencyLabel(competencyLevel)}
              </p>
            )}
          </div>
        </div>

        {request.message && (
          <div className="p-4 rounded border" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
            <h4 className="font-semibold text-sm mb-2" style={{ color: '#2D3330' }}>
              Request note
            </h4>
            <p className="text-sm" style={{ color: '#2D3330' }}>
              &ldquo;{request.message}&rdquo;
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="response-message" style={{ color: '#2D3330' }}>
            Add a message (optional)
          </Label>
          <Textarea
            id="response-message"
            value={responseMessage}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setResponseMessage(e.target.value)
            }
            placeholder={
              action === 'accept'
                ? 'Optionally add context about what you observed...'
                : 'Optionally explain why you cannot confirm this claim...'
            }
            rows={3}
            disabled={isSubmitting}
            className="resize-none"
          />
        </div>

        {isAttestationRequest && (
          <HumanObservedAttestationFields
            value={attestationForm}
            onChange={setAttestationForm}
            skillLabels={request?.attestationRequest?.skillLabels || [skillName]}
            disabled={isSubmitting}
          />
        )}

        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 p-3 rounded bg-red-50 border border-red-200"
          >
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{
              backgroundColor: action === 'accept' ? '#1C4D3A' : '#EF4444',
              color: '#F7F6F1',
            }}
            className="hover:opacity-90"
          >
            {isSubmitting ? (
              'Submitting...'
            ) : action === 'accept' ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Confirm observation
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 mr-1" />
                Confirm decline
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
