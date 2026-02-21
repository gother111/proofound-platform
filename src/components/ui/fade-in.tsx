'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import React from 'react';

interface FadeInProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export const FadeIn = React.forwardRef<HTMLDivElement, FadeInProps>(
  ({ children, delay = 0, duration = 0.5, className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          duration,
          delay,
          ease: [0.22, 1, 0.36, 1], // Standard pleasant ease-out curve
        }}
        className={cn(className)}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
FadeIn.displayName = 'FadeIn';
