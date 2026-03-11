import { useState, useEffect, useMemo } from 'react';
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
import type { PurposeLinks } from '@/types/profile';
import { Eye, EyeOff, Users, Globe } from 'lucide-react';
import { normalizeLabels, normalizeLinks, toggleItem } from './purpose-links-utils';

interface MissionEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mission: string | null;
  missionLinks?: PurposeLinks;
  availableValues: string[];
  availableCauses: string[];
  visibility?: 'public' | 'network' | 'private';
  onSave: (
    mission: string,
    links: PurposeLinks,
    visibility?: 'public' | 'network' | 'private'
  ) => void;
}

export function MissionEditor({
  open,
  onOpenChange,
  mission,
  missionLinks,
  availableValues,
  availableCauses,
  visibility = 'public',
  onSave,
}: MissionEditorProps) {
  const [value, setValue] = useState(mission || '');
  const [visibilityLevel, setVisibilityLevel] = useState<'public' | 'network' | 'private'>(
    visibility
  );
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [selectedCauses, setSelectedCauses] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const normalizedAvailableValues = useMemo(
    () => normalizeLabels(availableValues),
    [availableValues]
  );
  const normalizedAvailableCauses = useMemo(
    () => normalizeLabels(availableCauses),
    [availableCauses]
  );

  useEffect(() => {
    if (open) {
      setValue(mission || '');
      setVisibilityLevel(visibility);
      const normalizedLinks = normalizeLinks(
        missionLinks,
        normalizedAvailableValues,
        normalizedAvailableCauses
      );
      setSelectedValues(normalizedLinks.values);
      setSelectedCauses(normalizedLinks.causes);
      setError(null);
    }
  }, [
    open,
    mission,
    visibility,
    missionLinks,
    normalizedAvailableValues,
    normalizedAvailableCauses,
  ]);

  const handleSave = () => {
    if (value.trim().length === 0) {
      setError('Mission statement cannot be empty');
      return;
    }

    if (value.length > 500) {
      setError('Mission statement must be 500 characters or less');
      return;
    }

    if (selectedValues.length === 0 || selectedCauses.length === 0) {
      setError('Select at least one linked value and one linked cause.');
      return;
    }

    onSave(
      value.trim(),
      {
        values: selectedValues,
        causes: selectedCauses,
      },
      visibilityLevel
    );
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
          </div>

          <div className="space-y-2" data-testid="mission-values-links">
            <Label>Linked Values</Label>
            {normalizedAvailableValues.length === 0 ? (
              <p className="text-xs text-muted-foreground">Add at least one value first.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {normalizedAvailableValues.map((option) => {
                  const selected = selectedValues.includes(option);
                  return (
                    <Button
                      key={option}
                      type="button"
                      size="sm"
                      variant={selected ? 'default' : 'outline'}
                      onClick={() => setSelectedValues((prev) => toggleItem(prev, option))}
                    >
                      {option}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-2" data-testid="mission-causes-links">
            <Label>Linked Causes</Label>
            {normalizedAvailableCauses.length === 0 ? (
              <p className="text-xs text-muted-foreground">Add at least one cause first.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {normalizedAvailableCauses.map((option) => {
                  const selected = selectedCauses.includes(option);
                  return (
                    <Button
                      key={option}
                      type="button"
                      size="sm"
                      variant={selected ? 'default' : 'outline'}
                      onClick={() => setSelectedCauses((prev) => toggleItem(prev, option))}
                    >
                      {option}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>

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

          {error && <p className="text-xs text-red-500">{error}</p>}
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
