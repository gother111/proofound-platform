/**
 * Typing Indicator Component
 *
 * Shows when the other person in a conversation is typing
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface TypingIndicatorProps {
  isTyping: boolean;
  displayName?: string;
}

export function TypingIndicator({ isTyping, displayName = 'Someone' }: TypingIndicatorProps) {
  if (!isTyping) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="flex items-center gap-2 px-4 py-2 text-xs text-[#6B6760]"
      >
        <div className="flex gap-1">
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-[#6B6760]"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: 0,
            }}
          />
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-[#6B6760]"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: 0.2,
            }}
          />
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-[#6B6760]"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: 0.4,
            }}
          />
        </div>
        <span>{displayName} is typing...</span>
      </motion.div>
    </AnimatePresence>
  );
}

