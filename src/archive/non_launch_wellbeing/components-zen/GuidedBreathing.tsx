'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Square, RefreshCw } from 'lucide-react';

type BreathingPhase = 'inhale' | 'hold-in' | 'exhale' | 'hold-out';

const PHASE_CONFIG = {
  inhale: { duration: 4000, label: 'Breathe In', scale: 1.5 },
  'hold-in': { duration: 4000, label: 'Hold', scale: 1.5 },
  exhale: { duration: 4000, label: 'Breathe Out', scale: 1.0 },
  'hold-out': { duration: 4000, label: 'Hold', scale: 1.0 },
};

export function GuidedBreathing() {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<BreathingPhase>('inhale');
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes default
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const phaseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (phaseTimeoutRef.current) clearTimeout(phaseTimeoutRef.current);
    };
  }, []);

  const startSession = () => {
    setIsActive(true);
    setTimeLeft(120);
    runPhase('inhale');

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          stopSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopSession = () => {
    setIsActive(false);
    setPhase('inhale');
    if (timerRef.current) clearInterval(timerRef.current);
    if (phaseTimeoutRef.current) clearTimeout(phaseTimeoutRef.current);
  };

  const runPhase = (currentPhase: BreathingPhase) => {
    setPhase(currentPhase);
    const config = PHASE_CONFIG[currentPhase];

    let nextPhase: BreathingPhase;
    switch (currentPhase) {
      case 'inhale':
        nextPhase = 'hold-in';
        break;
      case 'hold-in':
        nextPhase = 'exhale';
        break;
      case 'exhale':
        nextPhase = 'hold-out';
        break;
      case 'hold-out':
        nextPhase = 'inhale';
        break;
    }

    phaseTimeoutRef.current = setTimeout(() => {
      if (isActive) {
        // Only continue if still active
        runPhase(nextPhase);
      }
    }, config.duration);
  };

  // Re-run phase logic if active changes to true (handled by startSession)
  // But we need to ensure the loop stops if isActive becomes false externally
  useEffect(() => {
    if (!isActive) {
      if (phaseTimeoutRef.current) clearTimeout(phaseTimeoutRef.current);
    }
  }, [isActive]);

  const config = PHASE_CONFIG[phase];

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="flex flex-col items-center justify-center p-8 text-center border-none bg-gradient-to-br from-[#EEF1EA] to-[#F7F6F1] dark:from-[#2F2823] dark:to-[#2A2520]">
      <div className="relative mb-8 flex h-64 w-64 items-center justify-center">
        {/* Breathing Circle */}
        <div
          className="absolute rounded-full bg-[#7A9278]/20 transition-all [transition-duration:4000ms] ease-in-out"
          style={{
            width: isActive ? '100%' : '60%',
            height: isActive ? '100%' : '60%',
            transform: `scale(${isActive ? config.scale : 1})`,
            opacity: phase === 'hold-in' || phase === 'hold-out' ? 0.8 : 0.6,
          }}
        />
        <div
          className="absolute rounded-full bg-proofound-forest shadow-lg transition-all [transition-duration:4000ms] ease-in-out flex items-center justify-center"
          style={{
            width: '40%',
            height: '40%',
            transform: `scale(${isActive ? config.scale : 1})`,
          }}
        >
          {isActive && (
            <span className="text-white font-medium animate-in fade-in">{config.label}</span>
          )}
        </div>

        {/* Static Ring */}
        <div className="absolute h-full w-full rounded-full border-2 border-dashed border-[#7A9278]/30" />
      </div>

      <div className="space-y-4">
        <div className="text-2xl font-serif font-medium text-foreground dark:text-[#E8E6DD]">
          {isActive ? formatTime(timeLeft) : 'Box Breathing'}
        </div>

        {!isActive && (
          <p className="text-sm text-muted-foreground dark:text-[#C9C2B8] max-w-xs mx-auto">
            4-4-4-4 pattern to calm the nervous system. Follow the circle's rhythm.
          </p>
        )}

        <div className="flex gap-2 justify-center">
          {!isActive ? (
            <Button
              onClick={startSession}
              size="lg"
              className="bg-proofound-forest hover:bg-proofound-forest/90 text-white min-w-[140px]"
            >
              <Play className="mr-2 h-4 w-4" /> Start
            </Button>
          ) : (
            <Button onClick={stopSession} variant="outline" size="lg" className="min-w-[140px]">
              <Square className="mr-2 h-4 w-4 fill-current" /> Stop
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
