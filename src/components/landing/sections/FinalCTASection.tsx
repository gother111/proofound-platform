'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface FinalCTASectionProps {
  onGetStarted?: () => void;
}

export function FinalCTASection({ onGetStarted }: FinalCTASectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section
      ref={ref}
      className="py-40 px-6 md:px-12 relative bg-japandi-charcoal text-white overflow-hidden flex items-center justify-center min-h-[80vh]"
    >
      {/* Background Decoration */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/noise.png')] opacity-30 mix-blend-overlay" />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            rotate: [0, 10, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-1/2 -left-1/2 w-[150%] h-[150%] bg-gradient-to-br from-japandi-sage/40 to-transparent rounded-full blur-[150px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
            rotate: [0, -15, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute -bottom-1/2 -right-1/2 w-[150%] h-[150%] bg-gradient-to-tl from-japandi-terracotta/40 to-transparent rounded-full blur-[150px]"
        />
      </div>

      <div className="max-w-5xl mx-auto text-center relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="text-6xl md:text-8xl lg:text-9xl font-display mb-12 leading-[0.9] tracking-tight"
        >
          Ready to build <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-japandi-sage to-white">
            trust that lasts?
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="text-xl md:text-2xl text-white/60 mb-16 max-w-2xl mx-auto font-sans leading-relaxed"
        >
          Join the movement towards a more transparent, equitable, and meaningful professional
          world.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <Button
            size="lg"
            onClick={onGetStarted}
            className="bg-white text-japandi-charcoal hover:bg-white/90 text-xl px-16 py-10 rounded-full shadow-[0_0_50px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_80px_-10px_rgba(255,255,255,0.5)] transition-all duration-500 hover:scale-105 group font-sans relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-3">
              Join Founding Cohort
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
