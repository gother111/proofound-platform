'use client';

import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Heart, CheckCircle2, AlertCircle, Zap, Sparkles } from 'lucide-react';
import { useMood } from './MoodResponsiveContainer';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api/fetch';
import { zenCheckInConfig, zenPractices, type RiskState } from '@/data/zen';

export function QuickCheckIn() {
  const { setMood } = useMood();
  const [stress, setStress] = useState(3); // 1-5
  const [control, setControl] = useState(3); // 1-5
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justCheckedIn, setJustCheckedIn] = useState(false);

  const stressLabel = zenCheckInConfig.stressScale.find((s) => s.score === stress);
  const controlLabel = zenCheckInConfig.controlScale.find((c) => c.score === control);

  const derivedMood: RiskState =
    stress >= 4 ? 'support' : stress === 3 ? 'focus' : ('calm' as RiskState);

  const microPractice =
    zenPractices.find(
      (p) => p.isMicro && p.recommendedFor?.includes(derivedMood)
    ) || zenPractices.find((p) => p.isMicro);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Save to backend
      const response = await apiFetch('/api/wellbeing/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stressLevel: stress,
          controlLevel: control,
        }),
      });

      if (!response.ok) throw new Error('Failed to save');

      // Update mood based on stress
      if (stress >= 4) setMood('support');
      else if (stress === 3) setMood('focus');
      else setMood('calm');

      setJustCheckedIn(true);
      toast.success('Check-in recorded', {
        description: 'Your wellness state has been updated.',
      });

      // Reset view after 3 seconds
      setTimeout(() => setJustCheckedIn(false), 5000);
    } catch (error) {
      console.error('Check-in failed', error);
      toast.error('Failed to save check-in');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (justCheckedIn) {
    return (
      <Card className="border-none bg-[#7A9278]/10 p-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#7A9278] text-white shadow-lg">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="text-2xl font-serif font-medium text-[#1C4D3A] dark:text-[#E2EDD9]">
          Check-in received
        </h3>
        <p className="mt-2 text-[#6B6760] dark:text-[#C9C2B8]">
          Take a deep breath. We've adjusted your space to match your needs.
        </p>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden border-none bg-white/60 p-6 shadow-sm backdrop-blur-sm dark:bg-[#2F2823]/60 lg:p-8">
      {/* Decorative background gradient */}
      <div
        className="absolute inset-0 opacity-30 transition-colors duration-700 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${
            stress > 3 ? '#FECDD3' : stress === 3 ? '#FEF3C7' : '#D1FAE5'
          }, transparent 70%)`,
        }}
      />

      <div className="relative z-10">
        <h2 className="mb-6 text-center font-serif text-3xl text-[#2D3330] dark:text-[#E8E6DD]">
          How are you feeling right now?
        </h2>
        <p className="mb-4 text-center text-sm text-muted-foreground">
          {zenCheckInConfig.privacyBanner}
        </p>

        <div className="mx-auto max-w-2xl space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between">
              <label
                htmlFor="stress-slider"
                className="text-sm font-medium text-[#6B6760] dark:text-[#C9C2B8]"
              >
                Stress Level
              </label>
              <span
                className={`text-sm font-medium ${
                  stress > 3 ? 'text-rose-600' : stress === 3 ? 'text-amber-600' : 'text-[#1C4D3A]'
                }`}
              >
                {stressLabel?.label || 'Moderate'}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Zap className="h-4 w-4 text-[#6B6760]" />
              <Slider
                id="stress-slider"
                value={[stress]}
                onValueChange={(v) => setStress(v[0])}
                min={1}
                max={5}
                step={1}
                className="flex-1 cursor-pointer"
              />
              <AlertCircle className="h-4 w-4 text-[#6B6760]" />
            </div>
            {stressLabel?.description && (
              <p className="text-xs text-muted-foreground">{stressLabel.description}</p>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between">
              <label
                htmlFor="control-slider"
                className="text-sm font-medium text-[#6B6760] dark:text-[#C9C2B8]"
              >
                Sense of Control
              </label>
              <span className="text-sm font-medium text-[#1C4D3A] dark:text-[#E2EDD9]">
                {controlLabel?.label || 'Moderate'}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-1 w-1 rounded-full bg-[#6B6760]" />
              <Slider
                id="control-slider"
                value={[control]}
                onValueChange={(v) => setControl(v[0])}
                min={1}
                max={5}
                step={1}
                className="flex-1 cursor-pointer"
              />
              <div className="h-3 w-3 rounded-full bg-[#6B6760]" />
            </div>
            {controlLabel?.description && (
              <p className="text-xs text-muted-foreground">{controlLabel.description}</p>
            )}
          </div>

          {microPractice && (
            <Card className="border bg-white/80 dark:bg-[#2F2823]/60 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-[#7A9278]" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#2D3330] dark:text-[#E8E6DD]">
                    {zenCheckInConfig.quickPracticePrompt}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Suggested: {microPractice.title} · {microPractice.duration}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-[#1C4D3A] px-0"
                    onClick={() => toast.success(`Started ${microPractice.title}`)}
                  >
                    Start now
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <div className="flex justify-center pt-4">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              size="lg"
              className={`min-w-[200px] transition-colors duration-500 ${
                stress > 3
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : stress === 3
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-[#1C4D3A] hover:bg-[#163E2F]'
              } text-white shadow-md hover:shadow-lg`}
            >
              {isSubmitting ? 'Saving...' : 'Log Check-in'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
