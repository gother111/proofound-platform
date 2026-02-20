'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useReducedMotion } from 'framer-motion';

interface FinalQuoteSectionProps {
  shouldReduceMotion?: boolean | null;
}

export function FinalQuoteSection({ shouldReduceMotion }: FinalQuoteSectionProps) {
  const framerReduce = useReducedMotion();
  const reduceMotion = !!shouldReduceMotion || framerReduce;
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 0]);

  const quote =
    "The future of work isn't about working more. It's about working with purpose, trust, and dignity.";
  const words = quote.split(' ');

  return (
    <section
      ref={ref}
      className="py-32 md:py-40 px-6 md:px-12 bg-background flex items-center justify-center relative overflow-hidden min-h-[60vh] scroll-mt-24"
    >
      {/* Parallax decorative watermark (non-text to avoid decorative contrast violations) */}
      {reduceMotion ? (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none"
          aria-hidden="true"
        >
          <div className="h-[26vw] w-[72vw] max-w-[1200px] rounded-full bg-japandi-charcoal/5 blur-2xl" />
        </div>
      ) : (
        <motion.div
          style={{ y, opacity: 0.05 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none"
          aria-hidden="true"
        >
          <div className="h-[26vw] w-[72vw] max-w-[1200px] rounded-full bg-japandi-charcoal blur-2xl" />
        </motion.div>
      )}

      <div className="max-w-6xl mx-auto text-center relative z-10">
        <blockquote className="font-display text-5xl md:text-7xl lg:text-8xl text-foreground leading-[1.1] italic tracking-tight text-balance">
          {words.map((word, i) => (
            <motion.span
              key={i}
              initial={reduceMotion ? false : { opacity: 0, y: 20, filter: 'blur(10px)' }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={reduceMotion ? undefined : { once: true, margin: '-100px' }}
              transition={{
                type: 'spring',
                stiffness: 100,
                damping: 20,
                delay: reduceMotion ? 0 : i * 0.05,
              }}
              className="inline-block mr-[0.25em]"
            >
              {word}
            </motion.span>
          ))}
        </blockquote>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scaleX: 0 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, scaleX: 1 }}
          viewport={reduceMotion ? undefined : { once: true }}
          transition={
            reduceMotion ? { duration: 0 } : { duration: 1, delay: 1, ease: [0.22, 1, 0.36, 1] }
          }
          className="mt-16 flex items-center justify-center gap-6"
        >
          <div className="h-px w-24 bg-japandi-terracotta" />
          <span className="text-foreground/60 font-medium tracking-[0.2em] uppercase text-sm font-sans">
            Proofound Manifesto
          </span>
          <div className="h-px w-24 bg-japandi-terracotta" />
        </motion.div>
      </div>
    </section>
  );
}
