'use client';

import React, { useRef, useState } from 'react';
import { HTMLMotionProps, motion, useSpring } from 'framer-motion';
import { cn } from '@/lib/utils';

interface HoverTiltProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}

export function HoverTilt({ children, className, intensity = 5, ...props }: HoverTiltProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const springConfig = { stiffness: 300, damping: 30, mass: 0.5 };
  const x = useSpring(0, springConfig);
  const y = useSpring(0, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rotateX = ((e.clientY - centerY) / (rect.height / 2)) * -intensity;
    const rotateY = ((e.clientX - centerX) / (rect.width / 2)) * intensity;

    x.set(rotateX);
    y.set(rotateY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      style={{
        rotateX: isHovered ? x : 0,
        rotateY: isHovered ? y : 0,
        transformStyle: 'preserve-3d',
      }}
      className={cn('perspective-1000', className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
