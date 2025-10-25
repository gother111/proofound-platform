'use client';

import { motion } from 'motion/react';

type Mode = 'individual' | 'organization';

interface ModeSwitcherProps {
  mode: Mode;
  onChange: (mode: Mode) => void;
}

export function ModeSwitcher({ mode, onChange }: ModeSwitcherProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-[#2D3330]/10 bg-[#E8E6DD] p-1 dark:border-[#E8E6DD]/10 dark:bg-[#3A3530]">
      <ModeButton active={mode === 'individual'} onClick={() => onChange('individual')}>
        Individual
      </ModeButton>
      <ModeButton active={mode === 'organization'} onClick={() => onChange('organization')}>
        Organization
      </ModeButton>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="relative rounded-lg px-6 py-2 text-sm transition-colors duration-200"
    >
      {active && (
        <motion.div
          layoutId="mode-switch"
          className="absolute inset-0 rounded-lg bg-white shadow-sm dark:bg-[#2A2520]"
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        />
      )}
      <span
        className={`relative z-10 ${active ? 'text-[#1C4D3A] dark:text-[#B8A588]' : 'text-[#2D3330]/60 dark:text-[#E8E6DD]/60'}`}
      >
        {children}
      </span>
    </button>
  );
}
