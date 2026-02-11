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

interface ProblemSectionProps {
  shouldReduceMotion?: boolean | null;
}

export function ProblemSection({ shouldReduceMotion }: ProblemSectionProps) {
  const reduceMotion = Boolean(shouldReduceMotion);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const effectiveInView = reduceMotion ? true : isInView;

  const problems = [
    { icon: Heart, text: 'Mental health toll of endless job searches and networking' },
    { icon: Clock, text: 'Wasted time on connection rituals and manual verification' },
    { icon: Eye, text: 'Bias, misalignment, and opacity in matching systems' },
    { icon: TrendingUp, text: 'Vanity metrics that obscure real impact' },
    { icon: FileText, text: "Outdated CVs and portfolios that don't tell the full story" },
    { icon: DollarSign, text: 'Profit-only capital disconnected from mission alignment' },
    { icon: Bot, text: 'AI anxiety and lack of transparency in algorithmic decisions' },
    { icon: Puzzle, text: 'No universal problem-solving framework for collaboration' },
    { icon: Recycle, text: 'Massive waste of time, talent, and resources' },
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
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reduceMotion ? 0 : 0.8,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <section
      id="the-problem"
      ref={ref}
      className="py-24 px-6 md:px-12 relative overflow-hidden bg-background scroll-mt-24"
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
          <h2 className="text-5xl md:text-6xl font-serif text-foreground mb-6 tracking-tight">
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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {problems.map((problem, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              whileHover={
                reduceMotion
                  ? undefined
                  : {
                      y: -5,
                      scale: 1.02,
                      transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
                    }
              }
              className="bg-card/60 dark:bg-card/20 backdrop-blur-md border border-border p-8 rounded-3xl flex flex-col gap-6 group hover:shadow-lg hover:shadow-proofound-terracotta/5 transition-colors transition-shadow transition-transform duration-300 h-full"
            >
              <div className="w-14 h-14 rounded-2xl bg-proofound-terracotta/10 flex items-center justify-center flex-shrink-0 group-hover:bg-proofound-terracotta/20 transition-colors duration-300">
                <problem.icon className="w-7 h-7 text-proofound-terracotta" strokeWidth={1.5} />
              </div>
              <p className="text-lg text-foreground leading-relaxed font-sans font-medium">
                {problem.text}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
