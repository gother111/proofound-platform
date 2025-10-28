'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface CustomizeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface WidgetState {
  goals: boolean;
  tasks: boolean;
  projects: boolean;
  matching: boolean;
  impact: boolean;
  explore: boolean;
}

const STORAGE_KEY = 'proofound-dashboard-widgets';

const widgetOptions = [
  { id: 'goals', label: 'Goals', description: 'Track your objectives and progress' },
  { id: 'tasks', label: 'Tasks & Verifications', description: 'Pending actions and verifications' },
  { id: 'projects', label: 'Projects', description: 'Your active projects' },
  { id: 'matching', label: 'Matches', description: 'Suggested matches and connections' },
  { id: 'impact', label: 'Impact Snapshot', description: 'Your impact metrics' },
  { id: 'explore', label: 'Explore', description: 'Discover new opportunities' },
];

export function CustomizeModal({ open, onOpenChange }: CustomizeModalProps) {
  const { toast } = useToast();
  const [widgets, setWidgets] = useState<WidgetState>({
    goals: true,
    tasks: true,
    projects: true,
    matching: true,
    impact: true,
    explore: true,
  });

  // Load saved preferences from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          setWidgets(JSON.parse(saved));
        } catch (error) {
          console.error('Failed to load dashboard preferences:', error);
        }
      }
    }
  }, []);

  const handleSave = () => {
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
    }

    toast({
      title: 'Dashboard customization saved',
      description: 'Your preferences have been updated.',
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Customize Your Dashboard</DialogTitle>
          <DialogDescription>
            Select which widgets you want to see on your dashboard
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            {widgetOptions.map((widget) => (
              <div
                key={widget.id}
                className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  id={widget.id}
                  checked={widgets[widget.id as keyof WidgetState]}
                  onCheckedChange={(checked) =>
                    setWidgets({ ...widgets, [widget.id]: checked as boolean })
                  }
                />
                <div className="flex-1 space-y-1">
                  <Label htmlFor={widget.id} className="text-sm font-medium cursor-pointer">
                    {widget.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{widget.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} style={{ backgroundColor: '#1C4D3A', color: '#F7F6F1' }}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
