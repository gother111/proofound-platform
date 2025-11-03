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

interface VisionEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vision: string | null;
  onSave: (vision: string) => void;
}

export function VisionEditor({ open, onOpenChange, vision, onSave }: VisionEditorProps) {
  const [value, setValue] = useState(vision || '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValue(vision || '');
      setError(null);
    }
  }, [open, vision]);

  const handleSave = () => {
    if (value.trim().length === 0) {
      setError('Vision statement cannot be empty');
      return;
    }

    // PRD requirement: Vision ≤300 chars recommended
    if (value.length > 300) {
      setError('Vision statement should be 300 characters or less (PRD requirement)');
      return;
    }

    onSave(value.trim());
    onOpenChange(false);
  };

  const charsLeft = 300 - value.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Your Vision</DialogTitle>
          <DialogDescription>
            Where do you see yourself or your work in the future? Describe your long-term
            aspirations and the impact you want to achieve.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="vision">Vision Statement</Label>
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
              id="vision"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Example: To be a recognized leader in sustainable technology, empowering communities worldwide to build resilient, carbon-neutral futures through innovation and collaboration."
              className={`flex min-h-[150px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                error ? 'border-red-500' : ''
              }`}
              maxLength={300}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>

          <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground">
            <p className="font-medium mb-1">💡 Tip:</p>
            <p>
              Your vision should paint a picture of the future you want to create. Be aspirational
              but authentic. Keep it under 300 characters for maximum impact.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save Vision
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
