'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';

type ProfileContextDeleteDialogProps = {
  contextKind: string;
  itemLabel: string;
  open: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
};

export function ProfileContextDeleteDialog({
  contextKind,
  itemLabel,
  open,
  onConfirm,
  onOpenChange,
}: ProfileContextDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete {contextKind}?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <span className="block">
              This will remove <span className="font-medium text-foreground">{itemLabel}</span> from
              your editable profile context.
            </span>
            <span className="block">
              Your Proof Packs, verification records, and privacy settings are not changed by this
              confirmation.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep context</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onConfirm}
          >
            Delete context
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
