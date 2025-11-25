'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
      cta: 'Join Now',
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
      cta: 'Contact Sales',
      onAction: onOrganizationSignup,
      highlight: true,
    },
  ];

  return (
    <section id="products" ref={ref} className="py-32 px-6 md:px-12 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-japandi-stone/30 rounded-full blur-[120px] opacity-50" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-6xl font-display text-japandi-charcoal mb-6">
            Products & Subscriptions
          </h2>
          <p className="text-xl text-japandi-charcoal/60 font-sans max-w-2xl mx-auto">
            Simple, transparent pricing for everyone.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto items-center">
          {plans.map((plan, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: idx * 0.15, ease: [0.22, 1, 0.36, 1] }}
              className={`relative rounded-[2.5rem] p-10 md:p-12 transition-all duration-500 group ${
                plan.highlight
                  ? 'bg-japandi-charcoal text-white shadow-2xl shadow-japandi-charcoal/20 scale-105 z-10'
                  : 'bg-white/60 backdrop-blur-xl border border-white/40 hover:bg-white/80 hover:shadow-lg'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-japandi-terracotta to-[#D68C6D] text-white text-xs font-bold px-6 py-2 rounded-full shadow-lg flex items-center gap-2">
                  <Sparkles className="w-3 h-3" /> POPULAR
                </div>
              )}

              <div className="mb-10">
                <h3
                  className={`text-3xl font-display mb-4 ${plan.highlight ? 'text-white' : 'text-japandi-charcoal'}`}
                >
                  {plan.title}
                </h3>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-5xl md:text-6xl font-bold font-display">{plan.price}</span>
                  <span
                    className={`text-lg font-sans ${plan.highlight ? 'text-white/60' : 'text-japandi-charcoal/40'}`}
                  >
                    / {plan.period}
                  </span>
                </div>
                <p
                  className={`text-lg leading-relaxed font-sans ${
                    plan.highlight ? 'text-white/70' : 'text-japandi-charcoal/60'
                  }`}
                >
                  {plan.desc}
                </p>
              </div>

              <ul className="space-y-5 mb-12">
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
                      className={`font-sans text-lg ${plan.highlight ? 'text-white/80' : 'text-japandi-charcoal/70'}`}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={plan.onAction}
                className={`w-full py-8 rounded-full text-lg font-medium transition-all duration-300 font-sans ${
                  plan.highlight
                    ? 'bg-white text-japandi-charcoal hover:bg-white/90 hover:scale-[1.02] shadow-xl'
                    : 'bg-japandi-charcoal text-white hover:bg-japandi-charcoal/90 hover:scale-[1.02] shadow-lg'
                }`}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
