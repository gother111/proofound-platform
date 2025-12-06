import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

type Props = {
  open: boolean;
  sessionId: string | null;
  onOpenChange: (value: boolean) => void;
  onSaved?: () => void;
};

export function InterviewReflectionDialog({ open, onOpenChange, sessionId, onSaved }: Props) {
  const [whatWentWell, setWhatWentWell] = useState('');
  const [areasToImprove, setAreasToImprove] = useState('');
  const [unexpectedQuestions, setUnexpectedQuestions] = useState('');
  const [keyLearnings, setKeyLearnings] = useState('');
  const [followUpActions, setFollowUpActions] = useState('');
  const [overallFeeling, setOverallFeeling] = useState<number>(3);
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setWhatWentWell('');
    setAreasToImprove('');
    setUnexpectedQuestions('');
    setKeyLearnings('');
    setFollowUpActions('');
    setOverallFeeling(3);
  };

  const handleSave = async () => {
    if (!sessionId) {
      toast.error('Select a prep session first');
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch('/api/interview-prep/reflections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          whatWentWell,
          areasToImprove,
          unexpectedQuestions,
          keyLearnings,
          followUpActions,
          overallFeeling,
        }),
      });
      if (!res.ok) throw new Error('Failed to save reflection');
      toast.success('Reflection saved');
      onSaved?.();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error('Could not save reflection');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Post-interview reflection</DialogTitle>
          <DialogDescription>
            Private notes to capture learnings and well-being signals. Not shared or used in
            matching.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label>What went well?</Label>
            <Textarea
              value={whatWentWell}
              onChange={(e) => setWhatWentWell(e.target.value)}
              placeholder="Moments you felt confident or got positive feedback."
            />
          </div>
          <div className="space-y-2">
            <Label>Areas to improve</Label>
            <Textarea
              value={areasToImprove}
              onChange={(e) => setAreasToImprove(e.target.value)}
              placeholder="Communication, pacing, stack depth—anything you want to refine."
            />
          </div>
          <div className="space-y-2">
            <Label>Unexpected questions</Label>
            <Textarea
              value={unexpectedQuestions}
              onChange={(e) => setUnexpectedQuestions(e.target.value)}
              placeholder="Capture surprises to practice later."
            />
          </div>
          <div className="space-y-2">
            <Label>Overall feeling (1-5)</Label>
            <Slider
              min={1}
              max={5}
              step={1}
              value={[overallFeeling]}
              onValueChange={(val) => setOverallFeeling(val[0] ?? 3)}
            />
          </div>
          <div className="space-y-2">
            <Label>Key learnings</Label>
            <Textarea
              value={keyLearnings}
              onChange={(e) => setKeyLearnings(e.target.value)}
              placeholder="Insights you want to keep."
            />
          </div>
          <div className="space-y-2">
            <Label>Follow-up actions</Label>
            <Textarea
              value={followUpActions}
              onChange={(e) => setFollowUpActions(e.target.value)}
              placeholder="Thank-you notes, links to share, next steps."
            />
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <p className="text-xs text-[#6B6760]">
            Stored privately. You can link well-being check-ins later.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-[#1C4D3A] text-white" disabled={isSaving}>
              Save reflection
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
