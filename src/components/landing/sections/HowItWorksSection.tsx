'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Sparkles,
  Award,
  Key,
  Lock,
  Eye,
  Heart,
  Compass,
  TrendingUp,
  Network,
  BookOpen,
} from 'lucide-react';

interface HowItWorksSectionProps {
  shouldReduceMotion?: boolean | null;
}

export function HowItWorksSection({ shouldReduceMotion }: HowItWorksSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const scrollRef = useRef<HTMLDivElement>(null);

  const features = [
    {
      icon: Sparkles,
      title: 'AI-powered matching',
      desc: 'Evidence-based algorithms that connect you to aligned opportunities, not vanity metrics',
    },
    {
      icon: Award,
      title: 'Proof-based profiles',
      desc: 'Verified skills, impact stories, and credentials—all traceable and transparent',
    },
    {
      icon: Key,
      title: 'Transferable verification',
      desc: 'Once verified, your proofs travel with you across contexts and time',
    },
    {
      icon: Lock,
      title: 'Granular privacy controls',
      desc: "You decide what's visible, to whom, and when—data dignity at every layer",
    },
    {
      icon: Eye,
      title: 'Decluttered UX',
      desc: 'Clean, Japandi-inspired design that respects your attention and mental space',
    },
    {
      icon: Heart,
      title: 'Mental health tools',
      desc: 'Built-in well-being support, not an afterthought—ikigai, safety planning, reflection',
    },
    {
      icon: Compass,
      title: 'Life & career planning',
      desc: 'Map your journey with purpose, not just the next job title',
    },
    {
      icon: TrendingUp,
      title: 'Data democratization',
      desc: 'Your data, your insights—we give you the tools to understand and control it',
    },
    {
      icon: Network,
      title: 'Talent mobility',
      desc: 'Skills and evidence are portable, opening doors across sectors and geographies',
    },
    {
      icon: BookOpen,
      title: 'Education & guidance',
      desc: 'Contextual learning pathways tailored to your goals and gaps',
    },
  ];

  return (
    <section
      id="how-it-works"
      ref={ref}
      className="py-32 px-6 md:px-12 relative overflow-hidden bg-[#F7F6F1]"
    >
      {/* Organic Background Shapes - Matching Mockup */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Left Sage Green Blob */}
        <div className="absolute top-[15%] left-[-15%] w-[60vw] h-[70vw] bg-[#94A89A] rounded-[40%] opacity-90 blur-2xl transform -rotate-12" />
        {/* Right Terracotta Blob */}
        <div className="absolute top-[5%] right-[-15%] w-[60vw] h-[80vw] bg-[#C17F59] rounded-[45%] opacity-90 blur-2xl transform rotate-12" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-6xl font-display text-[#2D3330] mb-6 tracking-tight">
            How Proofound works
          </h2>
          <p className="text-xl md:text-2xl text-[#2D3330]/80 font-sans">
            A platform built on evidence, transparency, and dignity.
          </p>
        </motion.div>

        {/* Horizontal Carousel */}
        <div className="relative -mx-6 md:-mx-12">
          <div
            ref={scrollRef}
            role="region"
            aria-label="Proofound features carousel"
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
            className="overflow-x-auto scrollbar-hide pb-12 px-6 md:px-12 snap-x snap-mandatory focus:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2 focus-visible:ring-offset-[#F7F6F1]"
          >
            <div className="flex gap-8 min-w-max">
              {features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ duration: 0.8, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="snap-center w-[340px] h-[420px] bg-white/30 backdrop-blur-xl border border-white/40 rounded-[2rem] p-10 flex flex-col justify-between shadow-xl hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group"
                >
                  <div className="space-y-8">
                    <feature.icon className="w-12 h-12 text-[#2D3330] stroke-[1.5]" />
                    <h3 className="text-3xl font-display text-[#2D3330] leading-tight">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-lg text-[#2D3330]/90 font-sans leading-relaxed">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-4">
          <p className="text-[#2D3330]/60 flex items-center gap-2 font-medium">
            Scroll horizontally to explore all features <span className="text-xl">→</span>
          </p>
        </div>
      </div>
    </section>
  );
}
