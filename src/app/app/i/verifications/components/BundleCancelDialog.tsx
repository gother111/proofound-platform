'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, PackageMinus, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

import { apiFetch } from '@/lib/api/fetch';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { verificationStatusLabel } from '@/lib/copy/labels';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { CustomVerificationRelationship } from '@/lib/verification/custom-verification-labels';

type BundleItem = {
  id: string;
  artifact_type: 'skill' | 'experience' | 'education' | 'impact_story' | 'project' | 'volunteering';
  artifact_id: string;
  display_label: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
};

type BundleRequest = {
  id: string;
  verifier_email: string;
  verifier_relationship: CustomVerificationRelationship;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  items: BundleItem[];
};

type BundleResponse = {
  request: BundleRequest;
};

type CancelResponse = {
  removedSkillRequestIds?: string[];
  requestExpired?: boolean;
};

type BundleCancelDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string | null;
  onCanceled: (removedSkillRequestIds: string[]) => void;
};

function artifactLabel(type: BundleItem['artifact_type']) {
  switch (type) {
    case 'skill':
      return 'Skill';
    case 'experience':
      return 'Experience';
    case 'education':
      return 'Education';
    case 'impact_story':
      return 'Impact Story';
    case 'project':
      return 'Project';
    case 'volunteering':
      return 'Volunteering';
    default:
      return 'Artifact';
  }
}

export function BundleCancelDialog({
  open,
  onOpenChange,
  requestId,
  onCanceled,
}: BundleCancelDialogProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [bundleRequest, setBundleRequest] = useState<BundleRequest | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<Record<string, boolean>>({});
  const loadRequestTokenRef = useRef(0);

  const loadBundleRequest = useCallback(async () => {
    if (!open || !requestId) {
      setBundleRequest(null);
      setSelectedItemIds({});
      setLoadError(null);
      setLoading(false);
      return;
    }

    const loadToken = loadRequestTokenRef.current + 1;
    loadRequestTokenRef.current = loadToken;
    setLoading(true);
    setLoadError(null);

    try {
      const response = await apiFetch(`/api/verification/requests/bundles/${requestId}`, {
        method: 'GET',
      });

      const body = (await response.json()) as { error?: string } & BundleResponse;

      if (!response.ok) {
        throw new Error(body.error || 'Failed to load bundle details.');
      }

      if (loadRequestTokenRef.current !== loadToken) return;
      setBundleRequest(body.request);
      setSelectedItemIds({});
    } catch (error) {
      if (loadRequestTokenRef.current !== loadToken) return;
      dispatchClientErrorDiagnostic('verifications.bundle_cancel.details_load_failed', error);
      setBundleRequest(null);
      setLoadError('Bundle details could not load');
    } finally {
      if (loadRequestTokenRef.current === loadToken) {
        setLoading(false);
      }
    }
  }, [open, requestId]);

  useEffect(() => {
    if (!open || !requestId) {
      loadRequestTokenRef.current += 1;
    }
    void loadBundleRequest();
  }, [loadBundleRequest, open, requestId]);

  const pendingItems = useMemo(
    () => (bundleRequest?.items || []).filter((item) => item.status === 'pending'),
    [bundleRequest]
  );

  const selectedPendingIds = pendingItems
    .map((item) => item.id)
    .filter((id) => Boolean(selectedItemIds[id]));

  const toggleItem = (itemId: string, checked: boolean | 'indeterminate') => {
    setSelectedItemIds((prev) => ({
      ...prev,
      [itemId]: checked === true,
    }));
  };

  const handleCancelSelected = async () => {
    if (!requestId || selectedPendingIds.length === 0) {
      return;
    }

    setSaving(true);
    try {
      const response = await apiFetch(`/api/verification/requests/bundles/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cancel_selected',
          itemIds: selectedPendingIds,
        }),
      });

      const body = (await response.json()) as { error?: string } & CancelResponse;

      if (!response.ok) {
        toast.error(body.error || 'Failed to cancel selected artifacts.');
        return;
      }

      const removedSkillRequestIds = body.removedSkillRequestIds || [];
      onCanceled(removedSkillRequestIds);

      toast.success(
        body.requestExpired
          ? 'Selected artifacts canceled. The bundle has no pending artifacts left.'
          : 'Selected artifacts canceled.'
      );
      onOpenChange(false);
    } catch (error) {
      dispatchClientErrorDiagnostic('verifications.bundle_cancel.selected_cancel_failed', error);
      toast.error('Failed to cancel selected artifacts.');
    } finally {
      setSaving(false);
    }
  };

  const hasPendingItems = pendingItems.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageMinus className="h-5 w-5" />
            Manage Bundled Verification
          </DialogTitle>
          <DialogDescription>
            Select which pending artifacts to cancel from this bundled verification request.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading bundle details...
          </div>
        ) : loadError ? (
          <div
            className="rounded-lg border border-[#F5D6CD] bg-[#FFF0F0] p-4 text-sm text-[#8B4A36]"
            role="alert"
          >
            <p className="font-medium">{loadError}</p>
            <p className="mt-1 text-xs leading-5 text-[#8B4A36]/80">
              No verification request was canceled. Retry bundle details before choosing artifacts.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadBundleRequest()}
              className="mt-3 border-[#F5D6CD] bg-white text-[#8B4A36] hover:bg-[#FFF8F5]"
            >
              <RefreshCcw className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
              Retry bundle details
            </Button>
          </div>
        ) : !bundleRequest ? (
          <div className="rounded-md border p-3 text-sm text-muted-foreground">
            Bundle details are unavailable.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border bg-japandi-bg p-3 text-sm">
              <p>
                <span className="font-medium">Verifier:</span> {bundleRequest.verifier_email}
              </p>
              <p>
                <span className="font-medium">Status:</span>{' '}
                <span>{verificationStatusLabel(bundleRequest.status)}</span>
              </p>
            </div>

            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {bundleRequest.items.map((item) => {
                const isPending = item.status === 'pending';
                return (
                  <div key={item.id} className="flex items-start gap-3 rounded-md border p-3">
                    <Checkbox
                      checked={Boolean(selectedItemIds[item.id])}
                      disabled={!isPending || saving}
                      onCheckedChange={(checked) => toggleItem(item.id, checked)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-foreground truncate">
                          {item.display_label}
                        </p>
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                          {artifactLabel(item.artifact_type)}
                        </Badge>
                        <Badge
                          variant={isPending ? 'outline' : 'secondary'}
                          className="text-[10px] capitalize"
                        >
                          {verificationStatusLabel(item.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {!hasPendingItems && (
              <p className="text-sm text-muted-foreground">
                No pending artifacts are available to cancel in this bundle.
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Close
          </Button>
          <Button
            type="button"
            onClick={() => void handleCancelSelected()}
            disabled={
              saving ||
              loading ||
              Boolean(loadError) ||
              !bundleRequest ||
              selectedPendingIds.length === 0 ||
              !hasPendingItems
            }
            className="bg-proofound-terracotta text-white hover:bg-[#8B4A36]"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Canceling...
              </>
            ) : (
              `Cancel selected (${selectedPendingIds.length})`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
