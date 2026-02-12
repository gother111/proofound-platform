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
      className="py-40 px-6 md:px-12 bg-background flex items-center justify-center relative overflow-hidden min-h-[60vh] scroll-mt-24"
    >
      {/* Parallax Watermark */}
      {reduceMotion ? (
        <div className="absolute top-1/2 left-1/2 h-[55vw] w-[55vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-proofound-forest/10 blur-3xl pointer-events-none" />
      ) : (
        <motion.div
          style={{ y, opacity }}
          className="absolute top-1/2 left-1/2 h-[55vw] w-[55vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-proofound-forest/10 blur-3xl pointer-events-none"
        />
      )}

      <div className="max-w-6xl mx-auto text-center relative z-10">
        <blockquote className="font-display text-5xl md:text-7xl lg:text-8xl text-japandi-charcoal leading-[1.1] italic tracking-tight">
          {words.map((word, i) => (
            <motion.span
              key={i}
              initial={reduceMotion ? false : { opacity: 0, y: 20, filter: 'blur(10px)' }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={reduceMotion ? undefined : { once: true, margin: '-100px' }}
              transition={{
                duration: reduceMotion ? 0 : 0.8,
                delay: reduceMotion ? 0 : i * 0.05,
                ease: [0.22, 1, 0.36, 1],
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
          <span className="text-japandi-charcoal/60 font-medium tracking-[0.2em] uppercase text-sm font-sans">
            Proofound Manifesto
          </span>
          <div className="h-px w-24 bg-japandi-terracotta" />
        </motion.div>
      </div>
    </section>
  );
}
