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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, EyeOff, Users, Globe } from 'lucide-react';

interface VisionEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vision: string | null;
  visibility?: 'public' | 'network' | 'private';
  onSave: (vision: string, visibility?: 'public' | 'network' | 'private') => void;
}

export function VisionEditor({
  open,
  onOpenChange,
  vision,
  visibility = 'network',
  onSave,
}: VisionEditorProps) {
  const [value, setValue] = useState(vision || '');
  const [visibilityLevel, setVisibilityLevel] = useState<'public' | 'network' | 'private'>(
    visibility
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValue(vision || '');
      setVisibilityLevel(visibility);
      setError(null);
    }
  }, [open, vision, visibility]);

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

    onSave(value.trim(), visibilityLevel);
    onOpenChange(false);
  };

  const getVisibilityIcon = (level: string) => {
    switch (level) {
      case 'public':
        return <Globe className="w-4 h-4" />;
      case 'network':
        return <Users className="w-4 h-4" />;
      case 'private':
        return <EyeOff className="w-4 h-4" />;
      default:
        return <Eye className="w-4 h-4" />;
    }
  };

  const getVisibilityDescription = (level: string) => {
    switch (level) {
      case 'public':
        return 'Visible to everyone on the platform';
      case 'network':
        return 'Visible to your connections and potential matches';
      case 'private':
        return 'Only visible to you';
      default:
        return '';
    }
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

          {/* Visibility Control */}
          <div className="space-y-2">
            <Label htmlFor="visibility">Who can see this?</Label>
            <Select
              value={visibilityLevel}
              onValueChange={(value: 'public' | 'network' | 'private') => setVisibilityLevel(value)}
            >
              <SelectTrigger id="visibility" className="w-full">
                <div className="flex items-center gap-2">
                  {getVisibilityIcon(visibilityLevel)}
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <div className="flex flex-col">
                      <span className="font-medium">Public</span>
                      <span className="text-xs text-muted-foreground">
                        Everyone on the platform
                      </span>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="network">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <div className="flex flex-col">
                      <span className="font-medium">Network</span>
                      <span className="text-xs text-muted-foreground">Connections & matches</span>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <EyeOff className="w-4 h-4" />
                    <div className="flex flex-col">
                      <span className="font-medium">Private</span>
                      <span className="text-xs text-muted-foreground">Only visible to you</span>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {getVisibilityDescription(visibilityLevel)}
            </p>
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
