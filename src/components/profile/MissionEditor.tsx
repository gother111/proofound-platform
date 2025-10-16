import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface MissionEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mission: string | null;
  onSave: (mission: string) => void;
}

export function MissionEditor({ open, onOpenChange, mission, onSave }: MissionEditorProps) {
  const [value, setValue] = useState(mission || '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValue(mission || '');
      setError(null);
    }
  }, [open, mission]);

  const handleSave = () => {
    if (value.trim().length === 0) {
      setError('Mission statement cannot be empty');
      return;
    }

    if (value.length > 500) {
      setError('Mission statement must be 500 characters or less');
      return;
    }

    onSave(value.trim());
    onOpenChange(false);
  };

  const charsLeft = 500 - value.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Your Mission</DialogTitle>
          <DialogDescription>
            What drives your work? Share the change you want to create in the world.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="mission">Mission Statement</Label>
              <span
                className={`text-xs ${
                  charsLeft < 0
                    ? 'text-red-500'
                    : charsLeft < 50
                      ? 'text-yellow-600'
                      : 'text-muted-foreground'
                }`}
              >
                {charsLeft} characters left
              </span>
            </div>
            <textarea
              id="mission"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Example: To create accessible pathways for underrepresented communities to participate in the green economy, ensuring climate solutions are equitable and inclusive."
              className={`flex min-h-[150px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                error ? 'border-red-500' : ''
              }`}
              maxLength={500}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>

          <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground">
            <p className="font-medium mb-1">💡 Tip:</p>
            <p>
              Your mission should be clear and inspiring. Focus on the impact you want to create,
              not just what you do.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save Mission
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
