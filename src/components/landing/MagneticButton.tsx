'use client';

import React, { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MagneticButtonProps extends ButtonProps {
  children: React.ReactNode;
  magneticStrength?: number;
}

export const MagneticButton = React.forwardRef<HTMLButtonElement, MagneticButtonProps>(
  ({ children, className, magneticStrength = 0.2, ...props }, ref) => {
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const shouldReduceMotion = useReducedMotion();

    const handleMouseMove = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (shouldReduceMotion) return;

      const element = buttonRef.current;
      if (!element) return;

      const { left, top, width, height } = element.getBoundingClientRect();
      const x = (event.clientX - (left + width / 2)) * magneticStrength;
      const y = (event.clientY - (top + height / 2)) * magneticStrength;

      setPosition({ x, y });
    };

    const handleMouseLeave = () => {
      setPosition({ x: 0, y: 0 });
    };

    return (
      <motion.div
        animate={shouldReduceMotion ? { x: 0, y: 0 } : { x: position.x, y: position.y }}
        transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
        className="inline-block"
      >
        <Button
          ref={(node) => {
            buttonRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={cn('group transition-all duration-300 shadow-md hover:shadow-xl', className)}
          {...props}
        >
          {children}
        </Button>
      </motion.div>
    );
  }
);

MagneticButton.displayName = 'MagneticButton';
