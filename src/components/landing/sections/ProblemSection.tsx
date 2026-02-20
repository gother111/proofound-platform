'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Heart,
  Clock,
  Eye,
  TrendingUp,
  FileText,
  DollarSign,
  Bot,
  Puzzle,
  Recycle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProblemSectionProps {
  shouldReduceMotion?: boolean | null;
}

export function ProblemSection({ shouldReduceMotion }: ProblemSectionProps) {
  const reduceMotion = Boolean(shouldReduceMotion);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const effectiveInView = reduceMotion ? true : isInView;

  const problems = [
    { icon: Heart, text: 'The endless toll of networking and job hunting' },
    { icon: Clock, text: 'Wasted hours on manual verification rituals' },
    { icon: Eye, text: 'Opaque, biased, and misaligned matching' },
    { icon: TrendingUp, text: 'Vanity metrics obscuring real impact' },
    { icon: FileText, text: 'Outdated CVs missing the full story' },
    { icon: DollarSign, text: 'Capital disconnected from true mission' },
    { icon: Bot, text: 'Anxiety from opaque algorithmic decisions' },
    { icon: Puzzle, text: 'Fragmented frameworks for collaboration' },
    { icon: Recycle, text: 'Wasted talent, time, and resources' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 20,
      },
    },
    hover: {
      y: -8,
      scale: 1.03,
      transition: { type: 'spring', stiffness: 300, damping: 20 },
    },
  };

  return (
    <section
      id="the-problem"
      ref={ref}
      className="py-20 md:py-32 lg:py-40 px-6 md:px-12 relative overflow-hidden bg-background scroll-mt-24"
    >
      {/* Organic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[-5%] w-[40vw] h-[40vw] bg-proofound-terracotta/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[10%] right-[-5%] w-[40vw] h-[40vw] bg-extended-sage/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 30 }}
          animate={effectiveInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-6xl font-serif text-foreground mb-6 tracking-tight text-balance">
            The problems we solve
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto font-sans leading-relaxed">
            Today&apos;s connection and verification systems are broken.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial={reduceMotion ? false : 'hidden'}
          animate={effectiveInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-fr"
        >
          {problems.map((problem, idx) => {
            const isFeatured = idx === 0;
            return (
              <motion.div
                key={idx}
                variants={itemVariants}
                whileHover={reduceMotion ? undefined : 'hover'}
                className={cn(
                  'bg-card/60 dark:bg-card/20 backdrop-blur-md border border-border p-8 rounded-3xl flex flex-col group hover:shadow-lg hover:shadow-proofound-terracotta/5 transition-colors transition-shadow duration-300 h-full',
                  isFeatured ? 'md:col-span-2 lg:row-span-2 justify-between gap-12' : 'gap-6'
                )}
              >
                <motion.div
                  variants={{
                    hover: reduceMotion
                      ? {}
                      : {
                          y: -5,
                          scale: 1.1,
                          rotate: [-2, 2, 0],
                          transition: { type: 'spring', stiffness: 400, damping: 10 },
                        },
                  }}
                  className={cn(
                    'rounded-2xl bg-proofound-terracotta/10 flex items-center justify-center flex-shrink-0 group-hover:bg-proofound-terracotta/20 transition-colors duration-300',
                    isFeatured ? 'w-20 h-20' : 'w-14 h-14'
                  )}
                >
                  <problem.icon
                    className={cn(
                      'text-proofound-terracotta',
                      isFeatured ? 'w-10 h-10' : 'w-7 h-7'
                    )}
                    strokeWidth={1.5}
                  />
                </motion.div>
                <p
                  className={cn(
                    'text-foreground leading-relaxed font-sans font-medium',
                    isFeatured ? 'text-2xl md:text-3xl max-w-sm' : 'text-lg'
                  )}
                >
                  {problem.text}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
