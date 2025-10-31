'use client';

import { useState } from 'react';
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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/expertise/verification/${request.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          responseMessage: responseMessage.trim() || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onComplete(data.request);
        setResponseMessage('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to respond to verification request');
      }
    } catch (err) {
      console.error('Error responding to verification:', err);
      setError('Failed to respond to verification request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const skillName = getSkillName(request);
  const breadcrumb = getBreadcrumb(request);
  const requesterName = getRequesterName(request);
  const competencyLevel = request.skills?.competency_level;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" style={{ backgroundColor: '#FDFCFA' }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: '#2D3330' }}>
            {action === 'accept' ? (
              <>
                <CheckCircle2 className="w-5 h-5" style={{ color: '#10B981' }} />
                Accept Verification
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5" style={{ color: '#EF4444' }} />
                Decline Verification
              </>
            )}
          </DialogTitle>
          <DialogDescription style={{ color: '#6B7470' }}>
            {action === 'accept'
              ? `You are about to verify ${requesterName}'s skill.`
              : `You are declining to verify ${requesterName}'s skill.`}
          </DialogDescription>
        </DialogHeader>

        {/* Skill Details */}
        <div className="p-4 rounded-lg border" style={{ borderColor: 'rgba(232, 230, 221, 0.6)', backgroundColor: '#F7F6F1' }}>
          <h4 className="font-semibold text-sm mb-2" style={{ color: '#2D3330' }}>
            Skill Details
          </h4>
          <div className="space-y-1">
            <p className="text-sm" style={{ color: '#2D3330' }}>
              <span className="font-medium">Skill:</span> {skillName}
            </p>
            {breadcrumb && (
              <p className="text-xs" style={{ color: '#6B7470' }}>
                {breadcrumb}
              </p>
            )}
            {competencyLevel && (
              <p className="text-sm" style={{ color: '#2D3330' }}>
                <span className="font-medium">Competency:</span> {getCompetencyLabel(competencyLevel)}
              </p>
            )}
          </div>
        </div>

        {/* Original Message */}
        {request.message && (
          <div className="p-4 rounded border" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
            <h4 className="font-semibold text-sm mb-2" style={{ color: '#2D3330' }}>
              Their Message
            </h4>
            <p className="text-sm" style={{ color: '#2D3330' }}>
              &ldquo;{request.message}&rdquo;
            </p>
          </div>
        )}

        {/* Response Message */}
        <div className="space-y-2">
          <Label htmlFor="response-message" style={{ color: '#2D3330' }}>
            Add a message (optional)
          </Label>
          <Textarea
            id="response-message"
            value={responseMessage}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setResponseMessage(e.target.value)}
            placeholder={
              action === 'accept'
                ? "Add a congratulatory message or feedback..."
                : "Optionally explain why you're declining..."
            }
            rows={3}
            disabled={isSubmitting}
            className="resize-none"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded bg-red-50 border border-red-200">
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
                Confirm Accept
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 mr-1" />
                Confirm Decline
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

