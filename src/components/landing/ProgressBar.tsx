'use client';

import { useRef } from 'react';
import { motion, useScroll } from 'framer-motion';

export function ProgressBar() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  return (
    <div ref={containerRef} className="fixed top-0 left-0 right-0 h-1 z-50 bg-transparent">
      <motion.div
        className="h-full bg-gradient-to-r from-[#1C4D3A] via-[#5C8B89] to-[#C76B4A]"
        style={{ scaleX: scrollYProgress, transformOrigin: '0%' }}
      />
    </div>
  );
}
