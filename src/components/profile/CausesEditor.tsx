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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

const SUGGESTED_CAUSES = [
  'Climate Justice',
  'Economic Equity',
  'Education Access',
  'Clean Energy',
  'Social Innovation',
  'Mental Health',
  'Food Security',
  'Racial Justice',
  'Gender Equality',
  'Youth Empowerment',
];

interface CausesEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  causes: string[];
  onSave: (causes: string[]) => void;
}

export function CausesEditor({ open, onOpenChange, causes, onSave }: CausesEditorProps) {
  const [editedCauses, setEditedCauses] = useState<string[]>([]);
  const [newCause, setNewCause] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setEditedCauses([...causes]);
      setNewCause('');
      setError(null);
    }
  }, [open, causes]);

  const handleAddCause = (cause: string) => {
    const trimmedCause = cause.trim();

    if (!trimmedCause) {
      setError('Cause cannot be empty');
      return;
    }

    if (editedCauses.includes(trimmedCause)) {
      setError('Cause already added');
      return;
    }

    setEditedCauses([...editedCauses, trimmedCause]);
    setNewCause('');
    setError(null);
  };

  const handleAddCustomCause = () => {
    handleAddCause(newCause);
  };

  const handleDeleteCause = (cause: string) => {
    setEditedCauses(editedCauses.filter((c) => c !== cause));
  };

  const handleSave = () => {
    if (editedCauses.length === 0) {
      setError('Please add at least one cause');
      return;
    }

    onSave(editedCauses);
    onOpenChange(false);
  };

  const availableSuggestions = SUGGESTED_CAUSES.filter((cause) => !editedCauses.includes(cause));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Causes I Support</DialogTitle>
          <DialogDescription>
            The issues and movements you&apos;re passionate about.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Causes */}
          {editedCauses.length > 0 && (
            <div className="space-y-2">
              <Label>Your Causes</Label>
              <div className="flex flex-wrap gap-2">
                {editedCauses.map((cause) => (
                  <Badge
                    key={cause}
                    variant="outline"
                    className="px-3 py-1.5 text-sm group"
                    style={{
                      backgroundColor: 'rgba(92, 139, 137, 0.1)',
                      borderColor: 'rgba(92, 139, 137, 0.3)',
                      color: 'rgb(92, 139, 137)',
                    }}
                  >
                    {cause}
                    <button
                      type="button"
                      onClick={() => handleDeleteCause(cause)}
                      className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Add Custom Cause */}
          <div className="space-y-2">
            <Label htmlFor="new-cause">Add Custom Cause</Label>
            <div className="flex gap-2">
              <Input
                id="new-cause"
                value={newCause}
                onChange={(e) => setNewCause(e.target.value)}
                placeholder="e.g., Ocean Conservation"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomCause();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleAddCustomCause}>
                Add
              </Button>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>

          {/* Suggested Causes */}
          {availableSuggestions.length > 0 && (
            <div className="space-y-2">
              <Label>Quick Add (suggested)</Label>
              <div className="flex flex-wrap gap-2">
                {availableSuggestions.map((cause) => (
                  <Button
                    key={cause}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddCause(cause)}
                    className="rounded-full text-xs"
                  >
                    + {cause}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save Causes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
