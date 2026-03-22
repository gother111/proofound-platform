'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { PropsWithChildren } from 'react';

interface SectionRevealProps extends PropsWithChildren {
  className?: string;
}

export function SectionReveal({ children, className }: SectionRevealProps) {
  const shouldReduceMotion = useReducedMotion() ?? false;

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
