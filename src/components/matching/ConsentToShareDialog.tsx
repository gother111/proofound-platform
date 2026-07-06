/**
 * Consent To Share Dialog Component
 *
 * Gets explicit consent from candidate before sharing profile with organization
 * Implements PRD transparency and privacy requirements
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { useResponsiveModalMode } from '@/hooks/use-responsive-modal-mode';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ConsentExplainer } from '@/components/workflow/ConsentExplainer';

interface ConsentToShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  organizationName: string;
  assignmentRole: string;
  visibleFields: {
    field: string;
    label: string;
    value: string | string[];
    isRedacted: boolean;
  }[];
  onConsent: (matchId: string) => Promise<void>;
}

export function ConsentToShareDialog({
  isOpen,
  onClose,
  matchId,
  organizationName,
  assignmentRole,
  visibleFields,
  onConsent,
}: ConsentToShareDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [understands, setUnderstands] = useState(false);
  const { toast } = useToast();
  const isDesktop = useResponsiveModalMode(isOpen);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setHasReadTerms(false);
      setUnderstands(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleConsent = async () => {
    if (!hasReadTerms || !understands) {
      toast({
        title: 'Please confirm all checkboxes',
        description: 'You must read and understand what will be shared',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      await onConsent(matchId);

      console.log('Consent given for match:', matchId);

      toast({
        title: 'Consent given',
        description: `Your profile will be shared with ${organizationName}`,
      });

      onClose();
    } catch (error) {
      console.error('Failed to record consent:', error);
      toast({
        title: 'Failed to record consent',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibleFieldsCount = visibleFields.filter((f) => !f.isRedacted).length;
  const redactedFieldsCount = visibleFields.filter((f) => f.isRedacted).length;
  const nowVisibleItems = visibleFields
    .filter((field) => !field.isRedacted)
    .map((field) => field.label);
  const hiddenFieldItems = visibleFields
    .filter((field) => field.isRedacted)
    .map((field) => field.label);
  const hiddenUntilInterviewItems = Array.from(
    new Set([
      ...hiddenFieldItems,
      'Direct contact details',
      'Scheduling links and meeting logistics',
      'Any identity-bearing details you have not chosen to share',
    ])
  );

  const renderModalContentHeader = () => (
    <div className="px-4 md:px-0">
      <DialogHeader className="md:px-0 text-left">
        <DialogTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          Consent to Share Profile
        </DialogTitle>
        <DialogDescription>
          Review what information will be shared with {organizationName} for the {assignmentRole}{' '}
          role
        </DialogDescription>
      </DialogHeader>
    </div>
  );

  const renderModalContentBody = () => (
    <div className="space-y-6 px-4 md:px-0">
      <ConsentExplainer
        nowVisible={
          nowVisibleItems.length > 0
            ? nowVisibleItems
            : ['Only the role-specific proof-backed fields listed below']
        }
        hiddenUntilLater={hiddenUntilInterviewItems}
        whyThisRequestExists={`This share lets ${organizationName} review your proof-backed profile for the ${assignmentRole} role and decide whether to continue the hiring flow. It does not auto-reveal contact details or weaken blind review on future requests.`}
        privacyNote={`Only the fields listed in this snapshot are shared with ${organizationName} right now.`}
      />

      {/* Visible Fields Summary */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Information to be Shared</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>
              {visibleFieldsCount} field{visibleFieldsCount !== 1 ? 's' : ''} visible
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <EyeOff className="h-4 w-4" />
            <span>
              {redactedFieldsCount} field{redactedFieldsCount !== 1 ? 's' : ''} hidden
            </span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Detailed Field List */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Visible Fields In This Snapshot</h4>
        <div className="space-y-2">
          {visibleFields
            .filter((f) => !f.isRedacted)
            .map((field, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
              >
                <Eye className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{field.label}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {Array.isArray(field.value) ? field.value.join(', ') : field.value}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>

      {redactedFieldsCount > 0 && (
        <>
          <Separator />
          <div>
            <h4 className="text-sm font-semibold mb-3">Still Hidden</h4>
            <div className="space-y-2">
              {visibleFields
                .filter((f) => f.isRedacted)
                .map((field, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
                  >
                    <EyeOff className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {field.label}
                      </p>
                      <p className="text-xs text-gray-500">This information will not be shared</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}

      <Separator />

      {/* Warning Notice */}
      <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-amber-900 dark:text-amber-100">Important Notice</p>
            <ul className="space-y-1 text-amber-800 dark:text-amber-200 list-disc list-inside">
              <li>Once shared, you cannot revoke access to this specific snapshot</li>
              <li>The organization may retain this information as part of their hiring process</li>
              <li>You can update your visibility settings anytime to control future shares</li>
              <li>Public portfolio publication does not expand what this organization sees here</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderConsentControls = () => (
    <div className="px-4 md:px-0 pb-4 md:pb-0">
      <div className="space-y-3 pt-4 border-t mb-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="read-terms"
            checked={hasReadTerms}
            onCheckedChange={(checked) => setHasReadTerms(checked as boolean)}
          />
          <Label
            htmlFor="read-terms"
            className="text-sm font-normal cursor-pointer leading-relaxed"
          >
            I have reviewed the list of information that will be shared
          </Label>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="understands"
            checked={understands}
            onCheckedChange={(checked) => setUnderstands(checked as boolean)}
          />
          <Label
            htmlFor="understands"
            className="text-sm font-normal cursor-pointer leading-relaxed"
          >
            I understand that {organizationName} will see this information and I consent to sharing
            it for the purpose of the {assignmentRole} hiring process
          </Label>
        </div>
      </div>

      <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          onClick={handleConsent}
          disabled={!hasReadTerms || !understands || isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? 'Sharing...' : 'Give Consent & Share Profile'}
        </Button>
      </DialogFooter>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          {renderModalContentHeader()}
          <ScrollArea className="max-h-[50vh] pr-4 mt-4">{renderModalContentBody()}</ScrollArea>
          {renderConsentControls()}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-2xl overflow-y-auto max-h-[90vh] pb-6 flex flex-col gap-4 mt-4">
          {renderModalContentHeader()}
          {renderModalContentBody()}
          {renderConsentControls()}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
