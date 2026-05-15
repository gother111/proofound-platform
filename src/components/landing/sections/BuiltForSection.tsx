'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { MagneticButton } from '@/components/landing/MagneticButton';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BuiltForSectionProps {
  shouldReduceMotion?: boolean | null;
  onIndividualSignup?: () => void;
  onOrganizationSignup?: () => void;
}

export function BuiltForSection({
  shouldReduceMotion,
  onIndividualSignup,
  onOrganizationSignup,
}: BuiltForSectionProps) {
  const reduceMotion = Boolean(shouldReduceMotion);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const effectiveInView = reduceMotion ? true : isInView;

  const audiences = [
    {
      id: 'individual',
      title: 'For Individuals',
      description: 'Own your professional narrative and let your evidence speak for itself.',
      benefits: [
        'Build a verified Public Page in minutes',
        'Aggregate evidence, signals, and outcomes',
        'Get matched based on proven capability, not resume keywords',
      ],
      cta: 'Create your portfolio',
      onAction: onIndividualSignup,
      baseColor: 'bg-proofound-terracotta/5 border-proofound-terracotta/20',
      titleColor: 'text-proofound-terracotta',
      iconColor: 'bg-proofound-terracotta/20 text-proofound-terracotta',
    },
    {
      id: 'organization',
      title: 'For Organizations',
      description: 'Hire and collaborate based on validated proof and true mission alignment.',
      benefits: [
        'Discover talent with verified capabilities',
        'Reduce bias with evidence-based matching',
        'Streamline hiring without sifting through CV noise',
      ],
      cta: 'Find aligned talent',
      onAction: onOrganizationSignup,
      baseColor:
        'bg-proofound-forest/5 border-proofound-forest/20 dark:bg-proofound-parchment/5 dark:border-proofound-parchment/20',
      titleColor: 'text-proofound-forest dark:text-proofound-parchment',
      iconColor:
        'bg-proofound-forest/20 text-proofound-forest dark:bg-proofound-parchment/20 dark:text-proofound-parchment',
    },
  ];

  return (
    <section
      id="built-for"
      ref={ref}
      className="py-16 md:py-24 px-6 md:px-12 relative bg-background scroll-mt-24"
    >
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={effectiveInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16 max-w-2xl mx-auto"
        >
          <h2 className="text-3xl md:text-5xl font-display text-foreground mb-6 tracking-tight text-balance">
            Built for you
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground font-sans">
            Whether you&apos;re an individual showcasing work, or an organization finding talent,
            Proofound is built around verifiable proof.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {audiences.map((audience, idx) => (
            <motion.div
              key={audience.id}
              initial={reduceMotion ? false : { opacity: 0, y: 30 }}
              animate={effectiveInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 0.8, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }
              }
              className={cn(
                'rounded-3xl border p-8 md:p-12 flex flex-col h-full',
                audience.baseColor
              )}
            >
              <h3 className={cn('text-3xl font-serif mb-4', audience.titleColor)}>
                {audience.title}
              </h3>
              <p className="text-lg text-foreground/80 font-sans mb-10 leading-relaxed">
                {audience.description}
              </p>

              <div className="space-y-6 flex-grow mb-12">
                {audience.benefits.map((benefit, bIdx) => (
                  <div key={bIdx} className="flex items-start gap-4">
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                        audience.iconColor
                      )}
                    >
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <p className="text-lg text-foreground font-medium pr-4 leading-snug">
                      {benefit}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-4">
                <MagneticButton
                  size="lg"
                  onClick={audience.onAction}
                  className="rounded-full shadow-lg hover:shadow-xl font-sans group transition-all w-full flex items-center justify-center py-6 text-lg"
                >
                  <span className="mr-2">{audience.cta}</span>
                  <ArrowRight
                    className="w-5 h-5 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </MagneticButton>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
