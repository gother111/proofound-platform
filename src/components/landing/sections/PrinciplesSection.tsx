'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Globe, Zap, Shield, Heart, Minimize, TrendingUp } from 'lucide-react';

interface PrinciplesSectionProps {
  shouldReduceMotion?: boolean | null;
}

export function PrinciplesSection({ shouldReduceMotion }: PrinciplesSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

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
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <section
      id="principles"
      ref={ref}
      className="py-32 px-6 md:px-12 relative bg-[#F7F6F1] overflow-hidden"
    >
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] bg-[#94A89A]/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-6xl font-serif text-[#2D3330] mb-6 tracking-tight">
            What makes it trustworthy
          </h2>
          <p className="text-xl md:text-2xl text-[#2D3330]/80 font-sans max-w-2xl mx-auto">
            Principles that guide every decision we make.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {principles.map((principle, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              whileHover={{ y: -8 }}
              className="bg-white/40 backdrop-blur-md rounded-[2rem] p-10 border border-white/40 hover:border-[#94A89A]/30 shadow-sm hover:shadow-xl transition-all duration-500 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#94A89A]/10 flex items-center justify-center mb-8 group-hover:bg-[#94A89A]/20 transition-colors duration-300">
                <principle.icon className="w-7 h-7 text-[#2D3330] stroke-[1.5]" />
              </div>
              <h3 className="text-2xl font-serif text-[#2D3330] mb-4 leading-tight">
                {principle.title}
              </h3>
              <p className="text-[#2D3330]/80 leading-relaxed font-sans text-lg">
                {principle.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
