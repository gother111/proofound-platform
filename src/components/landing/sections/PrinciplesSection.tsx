'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Globe, Zap, Shield, Heart, Minimize, TrendingUp } from 'lucide-react';

interface PrinciplesSectionProps {
  shouldReduceMotion?: boolean | null;
}

export function PrinciplesSection({ shouldReduceMotion }: PrinciplesSectionProps) {
  const reduceMotion = Boolean(shouldReduceMotion);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const effectiveInView = reduceMotion ? true : isInView;

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
        duration: reduceMotion ? 0 : 0.6,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <section
      id="principles"
      ref={ref}
      className="py-32 px-6 md:px-12 relative bg-background overflow-hidden scroll-mt-24"
    >
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] bg-extended-sage/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 30 }}
          animate={effectiveInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-6xl font-serif text-foreground mb-6 tracking-tight">
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
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {principles.map((principle, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              whileHover={reduceMotion ? undefined : { y: -8 }}
              className="bg-card/60 backdrop-blur-md rounded-[2rem] p-10 border border-border hover:border-extended-sage/30 shadow-sm hover:shadow-xl transition-colors transition-shadow transition-transform duration-500 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-extended-sage/10 flex items-center justify-center mb-8 group-hover:bg-extended-sage/20 transition-colors duration-300">
                <principle.icon
                  className="w-7 h-7 text-foreground stroke-[1.5]"
                  aria-hidden="true"
                />
              </div>
              <h3 className="text-2xl font-serif text-foreground mb-4 leading-tight">
                {principle.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed font-sans text-lg">
                {principle.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
