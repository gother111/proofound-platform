'use client';

import { motion } from 'motion/react';
import type { BranchType } from './types';

interface BranchChipProps {
  type: BranchType;
  label: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}

const ICONS: Record<BranchType, string> = {
  universal: '◆',
  functional: '●',
  tools: '▲',
  languages: '■',
  methods: '◇',
  domain: '▼',
};

export function BranchChip({ type, label, selected, disabled = false, onClick }: BranchChipProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative w-full rounded-xl border px-4 py-3 text-left transition-all ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:shadow-sm'
      } ${
        selected
          ? 'border-[#1C4D3A] bg-[#1C4D3A] text-white dark:border-[#4A5F52] dark:bg-[#2D4A3F] dark:text-[#E8E6DD]'
          : 'border-[#E8E6DD] bg-white text-[#2D3330] hover:bg-[#F7F6F1] dark:border-[#4A4540] dark:bg-[#3A3530] dark:text-[#E8E6DD] dark:hover:bg-[#413B36]'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={`text-lg ${selected ? 'opacity-100' : 'opacity-60'}`}>{ICONS[type]}</span>
        <span className="text-sm font-medium">{label}</span>
      </div>
      {selected && (
        <motion.div
          layoutId="branch-chip"
          className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#C76B4A] dark:bg-[#D88B6A]"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
    </button>
  );
}
