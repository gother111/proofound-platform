'use client';

import React, { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Globe, Zap, Shield, Heart, Minimize, TrendingUp, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PrinciplesSectionProps {
  shouldReduceMotion?: boolean | null;
}

export function PrinciplesSection({ shouldReduceMotion }: PrinciplesSectionProps) {
  const reduceMotion = Boolean(shouldReduceMotion);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const effectiveInView = reduceMotion ? true : isInView;
  const [expandedIndex, setExpandedIndex] = useState<number>(0);

  const principles = [
    {
      icon: Globe,
      title: "Eleanor Ostrom's commons principles",
      desc: 'Governance designed for collective stewardship, not extraction',
    },
    {
      icon: Zap,
      title: 'Distributed systems mindset',
      desc: 'Resilient, federated architecture that respects sovereignty',
    },
    {
      icon: Shield,
      title: 'Anti-bias guardrails',
      desc: 'Auditable algorithms with continuous monitoring and transparency',
    },
    {
      icon: Heart,
      title: 'Steward-ownership ethos',
      desc: 'We never monetize inequality—mission comes first',
    },
    {
      icon: Minimize,
      title: 'Remove the excess',
      desc: 'Minimalism in design, maximalism in meaning',
    },
    {
      icon: TrendingUp,
      title: 'Information quality drives decisions',
      desc: 'Every choice backed by evidence, not assumptions',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 20,
      },
    },
    hover: {
      y: -8,
      scale: 1.02,
      transition: { type: 'spring', stiffness: 300, damping: 20 },
    },
  };

  return (
    <section
      id="principles"
      ref={ref}
      className="py-20 md:py-32 lg:py-40 px-6 md:px-12 relative bg-background overflow-hidden scroll-mt-24"
      data-testid="landing-principles-section"
    >
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] bg-extended-sage/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 30 }}
          animate={effectiveInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={
            reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 100, damping: 20 }
          }
          className="text-center mb-20 relative z-10"
        >
          <h2 className="text-5xl md:text-6xl font-serif text-foreground mb-6 tracking-tight text-balance">
            What makes it trustworthy
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground font-sans max-w-2xl mx-auto">
            Principles that guide every decision we make.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial={reduceMotion ? false : 'hidden'}
          animate={effectiveInView ? 'visible' : 'hidden'}
          className="flex flex-col gap-4 max-w-4xl mx-auto"
        >
          {principles.map((principle, idx) => {
            const isExpanded = expandedIndex === idx;
            return (
              <motion.div
                key={idx}
                variants={itemVariants}
                className={cn(
                  'bg-card/60 backdrop-blur-md rounded-[2rem] border overflow-hidden transition-colors duration-300',
                  isExpanded
                    ? 'border-extended-sage/50 shadow-xl shadow-extended-sage/10'
                    : 'border-border hover:border-extended-sage/30'
                )}
              >
                <button
                  onClick={() => setExpandedIndex(idx)}
                  aria-expanded={isExpanded}
                  aria-controls={`principle-content-${idx}`}
                  id={`principle-header-${idx}`}
                  className="w-full text-left px-6 py-6 md:px-10 md:py-8 flex items-center justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-extended-sage"
                >
                  <div className="flex items-center gap-4 md:gap-8">
                    <span className="text-lg md:text-2xl font-display text-muted-foreground/40 w-8 flex-shrink-0">
                      {(idx + 1).toString().padStart(2, '0')}
                    </span>
                    <h3
                      className={cn(
                        'text-2xl md:text-4xl font-serif text-foreground leading-tight transition-colors duration-300',
                        isExpanded ? 'text-extended-sage' : ''
                      )}
                    >
                      {principle.title}
                    </h3>
                  </div>
                  <motion.div
                    animate={reduceMotion ? false : { rotate: isExpanded ? 45 : 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ml-4 transition-colors duration-300',
                      isExpanded
                        ? 'bg-extended-sage text-white'
                        : 'bg-secondary text-foreground group-hover:bg-secondary/80'
                    )}
                  >
                    <Plus className="w-5 h-5" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      id={`principle-content-${idx}`}
                      role="region"
                      aria-labelledby={`principle-header-${idx}`}
                      initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                      animate={reduceMotion ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
                      exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                    >
                      <div className="px-6 pb-6 md:px-10 md:pb-10 pt-0 flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center ml-0 md:ml-16">
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-extended-sage/10 flex items-center justify-center flex-shrink-0">
                          <principle.icon
                            className="w-7 h-7 md:w-8 md:h-8 text-extended-sage stroke-[1.5]"
                            aria-hidden="true"
                          />
                        </div>
                        <p className="text-muted-foreground leading-relaxed font-sans text-lg md:text-xl">
                          {principle.desc}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
