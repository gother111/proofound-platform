import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type DeleteSkillDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deleting: boolean;
  skillName: string;
  onDelete: () => void;
};

export function DeleteSkillDialog({
  open,
  onOpenChange,
  deleting,
  skillName,
  onDelete,
}: DeleteSkillDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">Delete Skill?</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            This will permanently remove <strong>{skillName}</strong> and all its proofs from your
            Expertise Atlas. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            onClick={onDelete}
            disabled={deleting}
            className="flex-1 bg-proofound-terracotta text-white hover:bg-[#8B4A36]"
          >
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
