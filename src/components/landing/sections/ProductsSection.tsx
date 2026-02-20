'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProductsSectionProps {
  shouldReduceMotion?: boolean | null;
  onIndividualSignup?: () => void;
  onOrganizationSignup?: () => void;
}

export function ProductsSection({
  shouldReduceMotion,
  onIndividualSignup,
  onOrganizationSignup,
}: ProductsSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const reduceMotion = !!shouldReduceMotion;
  const effectiveInView = reduceMotion ? true : isInView;

  const plans = [
    {
      title: 'Individual',
      price: 'Free',
      period: 'forever',
      desc: 'For professionals seeking verified growth and meaningful connections.',
      features: [
        'Verified profile & portfolio',
        'AI-powered matching',
        'Mental health & reflection tools',
        'Portable credentials',
      ],
      cta: 'Join as an Individual',
      onAction: onIndividualSignup,
      highlight: false,
    },
    {
      title: 'Organization',
      price: 'Custom',
      period: 'per seat',
      desc: 'For companies building trust-based teams and hiring with precision.',
      features: [
        'Advanced talent discovery',
        'Bias-free screening tools',
        'Team alignment analytics',
        'Dedicated support',
      ],
      cta: 'Join as an Organization',
      onAction: onOrganizationSignup,
      highlight: true,
    },
  ];

  return (
    <section
      id="products"
      ref={ref}
      className="py-20 md:py-32 lg:py-40 px-6 md:px-12 relative overflow-hidden bg-background scroll-mt-24"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-japandi-stone/30 rounded-full blur-[120px] opacity-50" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 30 }}
          animate={effectiveInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-6xl font-display text-foreground mb-6 text-balance">
            Products & Subscriptions
          </h2>
          <p className="text-xl text-foreground/60 font-sans max-w-2xl mx-auto">
            Simple, transparent pricing for everyone.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto items-center">
          {plans.map((plan, idx) => (
            <motion.div
              key={idx}
              initial={reduceMotion ? false : { opacity: 0, y: 30 }}
              animate={effectiveInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { type: 'spring', stiffness: 100, damping: 20, delay: idx * 0.15 }
              }
              className={cn(
                'relative rounded-[2.5rem] p-10 md:p-12 group',
                plan.highlight
                  ? 'bg-japandi-charcoal text-white shadow-2xl shadow-japandi-charcoal/20 scale-105 z-10'
                  : 'bg-card/70 backdrop-blur-xl border border-border',
                reduceMotion
                  ? ''
                  : plan.highlight
                    ? 'transition-transform duration-500'
                    : 'hover:bg-card transition-colors transition-shadow duration-500 hover:shadow-lg'
              )}
            >
              {plan.highlight && (
                <motion.div
                  initial={{ backgroundPosition: '200% 0' }}
                  animate={{ backgroundPosition: '-200% 0' }}
                  transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
                  style={{ backgroundSize: '200% auto' }}
                  className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-proofound-terracotta via-[#f0855f] to-extended-clay text-white text-xs font-bold px-6 py-2 rounded-full shadow-lg flex items-center gap-2 whitespace-nowrap z-20"
                >
                  <Sparkles className="w-3 h-3" /> POPULAR
                </motion.div>
              )}

              <div className="flex flex-col h-full gap-4 relative z-10">
                {/* Bento Compartment 1: Header */}
                <div
                  className={cn(
                    'rounded-3xl p-8 flex flex-col',
                    plan.highlight ? 'bg-white/5' : 'bg-black/5 dark:bg-white/5'
                  )}
                >
                  <h3
                    className={`text-3xl font-display mb-4 ${plan.highlight ? 'text-white' : 'text-foreground'}`}
                  >
                    {plan.title}
                  </h3>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span
                      className={`text-5xl md:text-6xl font-bold font-display ${
                        plan.highlight ? 'text-white' : 'text-foreground'
                      }`}
                    >
                      {plan.price}
                    </span>
                    <span
                      className={`text-lg font-sans ${plan.highlight ? 'text-white/60' : 'text-foreground/40'}`}
                    >
                      / {plan.period}
                    </span>
                  </div>
                  <p
                    className={`text-lg leading-relaxed font-sans ${
                      plan.highlight ? 'text-white/70' : 'text-foreground/60'
                    }`}
                  >
                    {plan.desc}
                  </p>
                </div>

                {/* Bento Compartment 2: Features */}
                <div
                  className={cn(
                    'rounded-3xl p-8 flex-grow flex flex-col justify-center',
                    plan.highlight ? 'bg-white/5' : 'bg-black/5 dark:bg-white/5'
                  )}
                >
                  <ul className="space-y-5">
                    {plan.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-4">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                            plan.highlight
                              ? 'bg-japandi-terracotta text-white'
                              : 'bg-japandi-sage/20 text-japandi-sage'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <span
                          className={`font-sans text-lg ${plan.highlight ? 'text-white/80' : 'text-foreground/70'}`}
                        >
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bento Compartment 3: CTA */}
                <div
                  className={cn(
                    'rounded-3xl p-4',
                    plan.highlight ? 'bg-white/5' : 'bg-black/5 dark:bg-white/5'
                  )}
                >
                  <Button
                    onClick={plan.onAction}
                    className={cn(
                      'w-full py-8 rounded-2xl text-lg font-medium font-sans transition-all duration-300',
                      reduceMotion ? '' : 'hover:scale-[1.02] active:scale-[0.98]',
                      plan.highlight
                        ? 'bg-white text-foreground hover:bg-white/90 shadow-[0_0_30px_-10px_rgba(255,255,255,0.3)]'
                        : 'bg-japandi-charcoal text-white hover:bg-japandi-charcoal/90 hover:shadow-xl'
                    )}
                  >
                    {plan.cta}
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
