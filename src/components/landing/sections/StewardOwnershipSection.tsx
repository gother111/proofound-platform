'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Target, Users, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StewardOwnershipSectionProps {
  shouldReduceMotion?: boolean | null;
}

export function StewardOwnershipSection({ shouldReduceMotion }: StewardOwnershipSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const reduceMotion = !!shouldReduceMotion;
  const effectiveInView = reduceMotion ? true : isInView;

  const principles = [
    {
      icon: Target,
      title: 'Purpose Before Profit',
      desc: "Mission is locked in; profits serve the company's long-term purpose.",
    },
    {
      icon: Users,
      title: 'Self-Governance',
      desc: 'Control stays with active stewards who are committed to the mission, not to selling shares.',
    },
    {
      icon: Heart,
      title: 'Legacy Preservation',
      desc: "Ownership can't be sold; it's passed on to future stewards who uphold the same values.",
    },
  ];

  return (
    <section
      id="steward-ownership"
      ref={ref}
      className="py-20 md:py-32 lg:py-40 px-6 md:px-12 relative bg-background scroll-mt-24"
    >
      {/* Background Decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-japandi-sage/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 30 }}
          animate={effectiveInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={
            reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 100, damping: 20 }
          }
          className="text-center mb-24"
        >
          <h2 className="text-4xl md:text-6xl font-display text-foreground mb-6 text-balance">
            Steward Ownership — <br />
            <span className="text-japandi-sage italic">The Business Model of the Future</span>
          </h2>
          <p className="text-xl text-foreground/70 max-w-3xl mx-auto leading-relaxed font-sans">
            Purpose and independence are permanently protected by giving control to active stewards,
            never to external shareholders.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {principles.map((principle, idx) => (
            <motion.div
              key={idx}
              initial={reduceMotion ? false : { opacity: 0, y: 30 }}
              animate={effectiveInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { type: 'spring', stiffness: 100, damping: 20, delay: idx * 0.15 }
              }
              className={cn(
                'group relative rounded-[2rem] p-10 bg-card/70 backdrop-blur-2xl border border-border',
                reduceMotion
                  ? ''
                  : 'hover:border-japandi-sage/30 transition-colors transition-shadow transition-transform duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(28,77,58,0.1)]'
              )}
            >
              <div
                className={cn(
                  'absolute inset-0 bg-gradient-to-br from-white/30 to-transparent opacity-0 rounded-[2rem]',
                  reduceMotion ? '' : 'group-hover:opacity-100 transition-opacity duration-500'
                )}
              />

              <div className="relative z-10 flex flex-col items-center text-center">
                <div
                  className={cn(
                    'w-20 h-20 rounded-full bg-background shadow-sm flex items-center justify-center mb-8 border border-japandi-sage/10',
                    reduceMotion ? '' : 'group-hover:scale-110 transition-transform duration-500'
                  )}
                >
                  <principle.icon className="w-8 h-8 text-japandi-sage" />
                </div>
                <h3
                  className={cn(
                    'text-2xl font-display text-foreground mb-4',
                    reduceMotion
                      ? ''
                      : 'group-hover:text-japandi-sage transition-colors duration-300'
                  )}
                >
                  {principle.title}
                </h3>
                <p className="text-foreground/70 leading-relaxed font-sans text-lg">
                  {principle.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
