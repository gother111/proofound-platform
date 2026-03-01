import { CheckCircle2, Loader2, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import type { VerificationDraft, VerificationRequest } from './types';

type VerificationSectionProps = {
  verificationRequests: VerificationRequest[];
  loadingVerifications: boolean;
  showRequestVerification: boolean;
  setShowRequestVerification: (open: boolean) => void;
  newVerificationRequest: VerificationDraft;
  setNewVerificationRequest: (request: VerificationDraft) => void;
  requestingVerification: boolean;
  deletingVerificationId: string | null;
  onRequestVerification: () => void;
  onDeleteVerificationRequest: (request: VerificationRequest) => void;
};

export function VerificationSection({
  verificationRequests,
  loadingVerifications,
  showRequestVerification,
  setShowRequestVerification,
  newVerificationRequest,
  setNewVerificationRequest,
  requestingVerification,
  deletingVerificationId,
  onRequestVerification,
  onDeleteVerificationRequest,
}: VerificationSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-medium text-foreground">Verification</h3>
          <p className="text-sm text-muted-foreground">
            Request verification from peers or managers
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowRequestVerification(!showRequestVerification)}
          className="border-proofound-forest text-proofound-forest hover:bg-proofound-forest/5"
        >
          <CheckCircle2 className="h-4 w-4 mr-1" />
          Request Verification
        </Button>
      </div>

      {showRequestVerification && (
        <Card className="p-4 mb-4 border-proofound-stone">
          <div className="space-y-3">
            <div>
              <Label htmlFor="verifier-email" className="text-foreground">
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
              <Label htmlFor="verifier-source" className="text-foreground">
                Relationship
              </Label>
              <select
                id="verifier-source"
                value={newVerificationRequest.verifierSource}
                onChange={(e) =>
                  setNewVerificationRequest({
                    ...newVerificationRequest,
                    verifierSource: e.target.value as VerificationDraft['verifierSource'],
                  })
                }
                className="mt-1 w-full px-3 py-2 border border-proofound-stone rounded-md"
              >
                <option value="peer">Peer / Colleague</option>
                <option value="manager">Manager / Supervisor</option>
                <option value="external">External / Client</option>
              </select>
            </div>
            <div>
              <Label htmlFor="verification-message" className="text-foreground">
                Message (Optional)
              </Label>
              <Textarea
                id="verification-message"
                placeholder="Add context for the verifier..."
                value={newVerificationRequest.message}
                onChange={(e) =>
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
                onClick={onRequestVerification}
                disabled={!newVerificationRequest.verifierEmail || requestingVerification}
                className="bg-proofound-forest text-white hover:bg-proofound-forest/90"
              >
                {requestingVerification ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Request'
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowRequestVerification(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {loadingVerifications ? (
        <div className="flex items-center justify-center gap-2 py-6 border border-dashed border-proofound-stone rounded-lg">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading verification requests...</p>
        </div>
      ) : verificationRequests.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-proofound-stone rounded-lg">
          <CheckCircle2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No verification requests yet. Request verification to boost credibility.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {verificationRequests.map((request) => (
            <Card key={request.id} className="p-3 border-proofound-stone">
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
                  <p className="text-sm text-foreground font-medium">{request.verifier_email}</p>
                  {request.message && (
                    <p className="text-sm text-muted-foreground mt-1">{request.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Requested: {new Date(request.created_at).toLocaleDateString()}
                  </p>
                  {request.responded_at && (
                    <p className="text-xs text-muted-foreground">
                      Responded: {new Date(request.responded_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {request.status === 'pending' && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteVerificationRequest(request)}
                    disabled={deletingVerificationId === request.id}
                    aria-label={`Delete verification request for ${request.verifier_email}`}
                    className="text-proofound-terracotta hover:text-[#8B4A36] hover:bg-[#FFF0F0]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
