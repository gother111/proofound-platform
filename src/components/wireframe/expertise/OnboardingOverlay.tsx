'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Upload,
  Link2,
  Mic,
  FileText,
  Sparkles,
} from 'lucide-react';

type OnboardingOverlayProps = {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
};

const SUGGESTIONS = [
  { id: 'strategy', label: 'Strategic Thinking', branch: 'Universal' },
  { id: 'analysis', label: 'Data Analysis', branch: 'Functional' },
  { id: 'figma', label: 'Figma', branch: 'Tools' },
];

export function OnboardingOverlay({ open, onClose, onComplete }: OnboardingOverlayProps) {
  const [step, setStep] = useState(1);
  const [roleTitle, setRoleTitle] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const next = () => {
    if (step < 3) {
      setStep((current) => current + 1);
    } else {
      onComplete();
    }
  };

  const back = () => {
    if (step > 1) setStep((current) => current - 1);
  };

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl overflow-hidden border-[#E8E6DD] bg-white p-0 dark:border-[#4A4540] dark:bg-[#3A3530]">
        <ProgressBar value={(step / 3) * 100} />
        <div className="p-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <StepContainer key="step1">
                <StepHeader
                  title="Import from CV or LinkedIn"
                  icon={<FileText className="h-6 w-6 text-[#1C4D3A] dark:text-[#B8D4C6]" />}
                  accent="bg-[#1C4D3A]/10 dark:bg-[#4A5F52]/30"
                  step={1}
                />
                <p className="text-sm text-[#2D3330]/80 dark:text-[#E8E6DD]/80">
                  We can extract capabilities from existing documents to jump-start your atlas.
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <UploadCard
                    icon={<Upload className="h-8 w-8" />}
                    title="Upload CV"
                    subtitle="PDF or DOCX"
                  />
                  <UploadCard
                    icon={<Link2 className="h-8 w-8" />}
                    title="LinkedIn Profile"
                    subtitle="Connect account"
                  />
                </div>
                <button
                  onClick={next}
                  className="text-sm text-[#1C4D3A] hover:underline dark:text-[#B8D4C6]"
                >
                  Skip this step
                </button>
              </StepContainer>
            )}

            {step === 2 && (
              <StepContainer key="step2">
                <StepHeader
                  title="Suggested capabilities"
                  icon={<Sparkles className="h-6 w-6 text-[#C76B4A] dark:text-[#D88B6A]" />}
                  accent="bg-[#C76B4A]/10 dark:bg-[#D88B6A]/20"
                  step={2}
                />
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="role-input"
                      className="mb-2 block text-sm font-medium text-[#2D3330] dark:text-[#E8E6DD]"
                    >
                      What&apos;s your current role?
                    </label>
                    <Input
                      id="role-input"
                      value={roleTitle}
                      onChange={(event) => setRoleTitle(event.target.value)}
                      placeholder="e.g., Product Designer, Software Engineer"
                      className="border-[#E8E6DD] bg-white dark:border-[#4A4540] dark:bg-[#343430]"
                    />
                  </div>
                  <div className="space-y-2">
                    {SUGGESTIONS.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => toggle(item.id)}
                        className={`flex w-full items-center justify-between rounded-xl border-2 p-4 text-left transition ${
                          selected.includes(item.id)
                            ? 'border-[#1C4D3A] bg-[#1C4D3A]/5 dark:border-[#B8D4C6] dark:bg-[#4A5F52]/20'
                            : 'border-[#E8E6DD] hover:border-[#1C4D3A] dark:border-[#4A4540] dark:hover:border-[#B8D4C6]'
                        }`}
                      >
                        <div>
                          <p className="text-sm text-[#2D3330] dark:text-[#E8E6DD]">{item.label}</p>
                          <p className="text-xs text-[#2D3330]/60 dark:text-[#E8E6DD]/60">
                            {item.branch} branch
                          </p>
                        </div>
                        {selected.includes(item.id) && (
                          <Check className="h-5 w-5 text-[#1C4D3A] dark:text-[#B8D4C6]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </StepContainer>
            )}

            {step === 3 && (
              <StepContainer key="step3">
                <StepHeader
                  title="Add your first proof"
                  icon={<Upload className="h-6 w-6 text-[#5F8C6F] dark:text-[#7A9C8A]" />}
                  accent="bg-[#5F8C6F]/10 dark:bg-[#7A9C8A]/20"
                  step={3}
                />
                <p className="text-sm text-[#2D3330]/80 dark:text-[#E8E6DD]/80">
                  Choose how you&apos;d like to add evidence—upload files, record a voice note, or
                  request a review.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <ActionCard icon={<Upload className="h-6 w-6" />} label="Upload file" />
                  <ActionCard icon={<Link2 className="h-6 w-6" />} label="Add link" />
                  <ActionCard icon={<Mic className="h-6 w-6" />} label="Voice note" />
                  <ActionCard icon={<FileText className="h-6 w-6" />} label="Request review" />
                </div>
                <div className="rounded-xl border border-[#5F8C6F]/20 bg-[#5F8C6F]/10 p-4 text-sm text-[#2D3330] dark:border-[#7A9C8A]/30 dark:bg-[#7A9C8A]/20 dark:text-[#E8E6DD]">
                  <strong>Readiness preview:</strong> Completing this step unlocks the Level 4 Proof
                  badge (3 verified capabilities at Proficient+).
                </div>
              </StepContainer>
            )}
          </AnimatePresence>

          <footer className="mt-8 flex items-center justify-between border-t border-[#E8E6DD] pt-6 dark:border-[#4A4540]">
            <Button variant="ghost" onClick={back} disabled={step === 1} className="gap-2">
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
            <ProgressDots active={step} />
            <Button
              onClick={next}
              className="gap-2 bg-[#1C4D3A] text-white hover:bg-[#2D5F4A] dark:bg-[#4A5F52] dark:hover:bg-[#5A6F62]"
            >
              {step === 3 ? 'Complete' : 'Next'}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </footer>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1 bg-[#E8E6DD] dark:bg-[#4A4540]">
      <motion.div
        className="h-full bg-[#1C4D3A] dark:bg-[#B8D4C6]"
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
      />
    </div>
  );
}

function StepContainer({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
      className="space-y-6"
    >
      {children}
    </motion.div>
  );
}

function StepHeader({
  title,
  icon,
  accent,
  step,
}: {
  title: string;
  icon: React.ReactNode;
  accent: string;
  step: number;
}) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${accent}`}>
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-semibold text-[#2D3330] dark:text-[#E8E6DD]">{title}</h2>
        <p className="text-xs text-[#2D3330]/70 dark:text-[#E8E6DD]/70">Step {step} of 3</p>
      </div>
    </div>
  );
}

function UploadCard({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button className="rounded-2xl border-2 border-dashed border-[#E8E6DD] p-6 text-center transition hover:border-[#1C4D3A] hover:bg-[#F7F6F1] dark:border-[#4A4540] dark:hover:border-[#B8D4C6] dark:hover:bg-[#343430]">
      <div className="mb-3 flex items-center justify-center text-[#2D3330]/60 dark:text-[#E8E6DD]/60">
        {icon}
      </div>
      <p className="text-sm text-[#2D3330] dark:text-[#E8E6DD]">{title}</p>
      <p className="text-xs text-[#2D3330]/60 dark:text-[#E8E6DD]/60">{subtitle}</p>
    </button>
  );
}

function ActionCard({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="rounded-xl border border-[#E8E6DD] p-4 text-sm transition hover:border-[#1C4D3A] hover:bg-[#F7F6F1] dark:border-[#4A4540] dark:hover:border-[#B8D4C6] dark:hover:bg-[#343430]">
      <div className="mb-2 text-[#2D3330]/60 dark:text-[#E8E6DD]/60">{icon}</div>
      {label}
    </button>
  );
}

function ProgressDots({ active }: { active: number }) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3].map((index) => (
        <div
          key={index}
          className={`h-2 rounded-full transition-all ${
            index === active
              ? 'w-6 bg-[#1C4D3A] dark:bg-[#B8D4C6]'
              : index < active
                ? 'w-2 bg-[#1C4D3A]/40 dark:bg-[#B8D4C6]/40'
                : 'w-2 bg-[#E8E6DD] dark:bg-[#4A4540]'
          }`}
        />
      ))}
    </div>
  );
}
