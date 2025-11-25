'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Target, Users, Heart } from 'lucide-react';

interface StewardOwnershipSectionProps {
  shouldReduceMotion?: boolean | null;
}

export function StewardOwnershipSection({ shouldReduceMotion }: StewardOwnershipSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

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
    <section id="steward-ownership" ref={ref} className="py-32 px-6 md:px-12 relative">
      {/* Background Decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-japandi-sage/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-6xl font-display text-japandi-charcoal mb-6">
            Steward Ownership — <br />
            <span className="text-japandi-sage italic">Business Model of the Future</span>
          </h2>
          <p className="text-xl text-japandi-charcoal/70 max-w-3xl mx-auto leading-relaxed font-sans">
            Steward ownership ensures that a company&apos;s purpose and independence are protected
            by giving control to stewards, not external shareholders.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {principles.map((principle, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: idx * 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="group relative rounded-[2rem] p-10 bg-white/60 backdrop-blur-2xl border border-white/40 hover:border-japandi-sage/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(28,77,58,0.1)]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2rem]" />

              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 border border-japandi-sage/10">
                  <principle.icon className="w-8 h-8 text-japandi-sage" />
                </div>
                <h3 className="text-2xl font-display text-japandi-charcoal mb-4 group-hover:text-japandi-sage transition-colors duration-300">
                  {principle.title}
                </h3>
                <p className="text-japandi-charcoal/70 leading-relaxed font-sans text-lg">
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
