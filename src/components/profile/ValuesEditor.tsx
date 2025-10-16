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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Value } from '@/types/profile';
import {
  Heart,
  Sparkles,
  Users,
  Eye,
  Target,
  Shield,
  Leaf,
  Lightbulb,
  HandHeart,
  X,
} from 'lucide-react';

const ICON_OPTIONS = [
  { name: 'Heart', Icon: Heart },
  { name: 'Sparkles', Icon: Sparkles },
  { name: 'Users', Icon: Users },
  { name: 'Eye', Icon: Eye },
  { name: 'Target', Icon: Target },
  { name: 'Shield', Icon: Shield },
  { name: 'Leaf', Icon: Leaf },
  { name: 'Lightbulb', Icon: Lightbulb },
  { name: 'HandHeart', Icon: HandHeart },
];

interface ValuesEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  values: Value[];
  onSave: (values: Value[]) => void;
}

export function ValuesEditor({ open, onOpenChange, values, onSave }: ValuesEditorProps) {
  const [editedValues, setEditedValues] = useState<Value[]>([]);
  const [newValueLabel, setNewValueLabel] = useState('');
  const [newValueIcon, setNewValueIcon] = useState('Heart');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setEditedValues([...values]);
      setNewValueLabel('');
      setNewValueIcon('Heart');
      setError(null);
    }
  }, [open, values]);

  const handleAddValue = () => {
    if (!newValueLabel.trim()) {
      setError('Value label cannot be empty');
      return;
    }

    if (editedValues.length >= 8) {
      setError('Maximum of 8 values allowed');
      return;
    }

    const newValue: Value = {
      id: Date.now().toString(),
      icon: newValueIcon,
      label: newValueLabel.trim(),
      verified: false,
    };

    setEditedValues([...editedValues, newValue]);
    setNewValueLabel('');
    setNewValueIcon('Heart');
    setError(null);
  };

  const handleDeleteValue = (id: string) => {
    setEditedValues(editedValues.filter((v) => v.id !== id));
  };

  const handleSave = () => {
    if (editedValues.length === 0) {
      setError('Please add at least one value');
      return;
    }

    onSave(editedValues);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Core Values</DialogTitle>
          <DialogDescription>
            The principles that guide your decisions and actions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Existing Values */}
          {editedValues.length > 0 && (
            <div className="space-y-2">
              <Label>Your Values</Label>
              <div className="space-y-2">
                {editedValues.map((value) => {
                  const IconComponent =
                    ICON_OPTIONS.find((opt) => opt.name === value.icon)?.Icon || Heart;
                  return (
                    <div
                      key={value.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 group"
                    >
                      <IconComponent className="w-4 h-4 text-[#C67B5C] flex-shrink-0" />
                      <span className="flex-1 text-sm">{value.label}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteValue(value.id)}
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add New Value */}
          <div className="space-y-3 p-4 border-2 border-dashed rounded-lg">
            <Label>Add New Value</Label>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Input
                  value={newValueLabel}
                  onChange={(e) => setNewValueLabel(e.target.value)}
                  placeholder="e.g., Equity & Justice"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddValue();
                    }
                  }}
                />
              </div>
              <div>
                <Select value={newValueIcon} onValueChange={setNewValueIcon}>
                  <SelectTrigger>
                    <SelectValue placeholder="Icon" />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map(({ name, Icon: IconComp }) => (
                      <SelectItem key={name} value={name}>
                        <div className="flex items-center gap-2">
                          <IconComp className="w-4 h-4" />
                          <span>{name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddValue}
              className="w-full"
              disabled={editedValues.length >= 8}
            >
              Add Value
            </Button>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <p className="text-xs text-muted-foreground">{editedValues.length}/8 values added</p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save Values
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
