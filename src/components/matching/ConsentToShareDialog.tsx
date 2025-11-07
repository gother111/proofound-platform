/**
 * Consent To Share Dialog Component
 *
 * Gets explicit consent from candidate before sharing profile with organization
 * Implements PRD transparency and privacy requirements
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { log } from '@/lib/log';

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

      log.info('match.consent.given', {
        matchId,
        organizationName,
      });

      toast({
        title: 'Consent given',
        description: `Your profile will be shared with ${organizationName}`,
      });

      onClose();
    } catch (error) {
      log.error('match.consent.failed', {
        matchId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Consent to Share Profile
          </DialogTitle>
          <DialogDescription>
            Review what information will be shared with {organizationName} for the {assignmentRole}{' '}
            role
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-6">
            {/* Privacy Notice */}
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
              <div className="flex gap-3">
                <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-blue-900 dark:text-blue-100">
                    Your Privacy is Protected
                  </p>
                  <p className="text-blue-800 dark:text-blue-200">
                    Only the information listed below will be shared with {organizationName}. You
                    control what they see through your visibility settings.
                  </p>
                </div>
              </div>
            </div>

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
              <h4 className="text-sm font-semibold mb-3">Visible Fields</h4>
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
                  <h4 className="text-sm font-semibold mb-3">Hidden Fields</h4>
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
                            <p className="text-xs text-gray-500">
                              This information will not be shared
                            </p>
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
                  <p className="font-semibold text-amber-900 dark:text-amber-100">
                    Important Notice
                  </p>
                  <ul className="space-y-1 text-amber-800 dark:text-amber-200 list-disc list-inside">
                    <li>Once shared, you cannot revoke access to this specific snapshot</li>
                    <li>
                      The organization may retain this information as part of their hiring process
                    </li>
                    <li>
                      You can update your visibility settings anytime to control future shares
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Consent Checkboxes */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-start gap-3">
            <Checkbox
              id="read-terms"
              checked={hasReadTerms}
              onCheckedChange={(checked) => setHasReadTerms(checked as boolean)}
            />
            <Label htmlFor="read-terms" className="text-sm font-normal cursor-pointer">
              I have reviewed the list of information that will be shared
            </Label>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="understands"
              checked={understands}
              onCheckedChange={(checked) => setUnderstands(checked as boolean)}
            />
            <Label htmlFor="understands" className="text-sm font-normal cursor-pointer">
              I understand that {organizationName} will see this information and I consent to
              sharing it for the purpose of the {assignmentRole} hiring process
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleConsent} disabled={!hasReadTerms || !understands || isSubmitting}>
            {isSubmitting ? 'Sharing...' : 'Give Consent & Share Profile'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
