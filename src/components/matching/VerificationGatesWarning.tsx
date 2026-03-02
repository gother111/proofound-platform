/**
 * Verification Gates Warning Component
 *
 * Shows warning when user tries to introduce but hasn't met verification requirements
 * Provides links to complete missing verifications
 *
 * PRD Requirement: Part 5 F7 - Verification Gates
 */

'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useResponsiveModalMode } from '@/hooks/use-responsive-modal-mode';
import { AlertCircle, CheckCircle, Shield, ExternalLink } from 'lucide-react';
import { getGateDescription, getGateActionLink } from '@/lib/verification/gates-utils';
import type { VerificationGate, VerificationStatus } from '@/lib/verification/gates-utils';

interface VerificationGatesWarningProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unmetGates: VerificationGate[];
  userVerifications: VerificationStatus[];
  assignmentTitle?: string;
  onComplete?: () => void;
}

export function VerificationGatesWarning({
  open,
  onOpenChange,
  unmetGates,
  userVerifications,
  assignmentTitle = 'this role',
  onComplete,
}: VerificationGatesWarningProps) {
  const handleCompleteVerification = (gateType: string) => {
    const link = getGateActionLink(gateType as any);
    window.open(link, '_blank');
  };

  const isDesktop = useResponsiveModalMode(open);

  const renderModalContentHeader = () => (
    <div className="px-4 md:px-0">
      <DialogHeader className="md:px-0 text-left">
        <DialogTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-600" />
          Verification Required
        </DialogTitle>
        <DialogDescription>
          This organization requires additional verification before you can introduce yourself.
        </DialogDescription>
      </DialogHeader>
    </div>
  );

  const renderModalContentBody = () => (
    <div className="space-y-4 py-4 px-4 md:px-0">
      {/* Unmet Gates */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">
          Required Verifications ({unmetGates.length})
        </h4>
        <div className="space-y-2">
          {unmetGates.map((gate, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 border-2 border-amber-200 bg-amber-50 rounded-lg"
            >
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900">
                  {getGateDescription(gate.type)}
                </p>
                {gate.description && (
                  <p className="text-xs text-amber-700 mt-1">{gate.description}</p>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCompleteVerification(gate.type)}
                className="flex-shrink-0"
              >
                <ExternalLink className="w-3 h-3 mr-1.5" />
                Complete
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Completed Verifications */}
      {userVerifications.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">
            Completed Verifications ({userVerifications.length})
          </h4>
          <div className="space-y-2">
            {userVerifications.map((verification, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 border border-green-200 bg-green-50 rounded-lg"
              >
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900">
                    {getGateDescription(verification.type)}
                  </p>
                  {verification.verifiedAt && (
                    <p className="text-xs text-green-700 mt-1">
                      Verified {verification.verifiedAt.toLocaleDateString()}
                    </p>
                  )}
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Verified
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Why is this required?</AlertTitle>
        <AlertDescription className="text-sm">
          Organizations can require specific verifications to ensure candidate authenticity and
          quality. Once you complete the required verifications, you'll be able to express interest
          in {assignmentTitle}.
        </AlertDescription>
      </Alert>
    </div>
  );

  const renderModalFooter = () => (
    <div className="px-4 md:px-0 pb-4 md:pb-0">
      <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
        <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
          Cancel
        </Button>
        <Button
          onClick={() => {
            if (unmetGates.length > 0) {
              handleCompleteVerification(unmetGates[0].type);
            }
          }}
          className="bg-proofound-forest text-white w-full sm:w-auto"
        >
          Complete Verifications
        </Button>
      </DialogFooter>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          {renderModalContentHeader()}
          {renderModalContentBody()}
          {renderModalFooter()}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-2xl overflow-y-auto max-h-[90vh] pb-6 flex flex-col mt-4">
          {renderModalContentHeader()}
          {renderModalContentBody()}
          {renderModalFooter()}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

/**
 * Inline Verification Gates Indicator
 * Shows verification requirements on match cards
 */
export function VerificationGatesIndicator({
  gatesCount,
  onClick,
}: {
  gatesCount: number;
  onClick?: () => void;
}) {
  if (gatesCount === 0) return null;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors"
    >
      <Shield className="w-4 h-4 text-amber-600" />
      <span className="text-xs font-medium text-amber-900">
        {gatesCount} verification{gatesCount > 1 ? 's' : ''} required
      </span>
    </button>
  );
}
