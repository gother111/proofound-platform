'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
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
import { cn } from '@/lib/utils';

interface HowItWorksSectionProps {
  shouldReduceMotion?: boolean | null;
}

export function HowItWorksSection({ shouldReduceMotion }: HowItWorksSectionProps) {
  const reduceMotion = Boolean(shouldReduceMotion);
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  const effectiveInView = reduceMotion ? true : isInView;
  const [activeStep, setActiveStep] = useState(0);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const blob1Y = useTransform(scrollYProgress, [0, 1], ['-15%', '15%']);
  const blob2Y = useTransform(scrollYProgress, [0, 1], ['15%', '-15%']);

  const features = [
    {
      icon: Sparkles,
      title: 'Public proof portfolio',
      desc: 'Publish a clean, shareable portfolio URL on day 1 with evidence and trust signals in one place',
    },
    {
      icon: Award,
      title: 'Matching as a second step',
      desc: 'After your portfolio is live, discover aligned opportunities and collaborators without relying on vanity metrics',
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

  useEffect(() => {
    // Set up an Intersection Observer to track which feature card is currently most centered in the viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number((entry.target as HTMLElement).dataset.index);
            if (!isNaN(index)) {
              setActiveStep(index);
            }
          }
        });
      },
      {
        rootMargin: '-40% 0px -40% 0px', // Trigger when card hits the middle 20% of the screen
        threshold: 0,
      }
    );

    const cards = document.querySelectorAll('.step-card');
    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="how-it-works"
      ref={ref}
      className="py-16 md:py-32 lg:py-40 px-6 md:px-12 relative bg-background scroll-mt-24"
    >
      {/* Organic Background Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          style={{ y: reduceMotion ? 0 : blob1Y }}
          className="absolute top-[15%] left-[-15%] w-[60vw] h-[70vw] bg-extended-sage rounded-[40%] opacity-30 blur-3xl transform -rotate-12"
        />
        <motion.div
          style={{ y: reduceMotion ? 0 : blob2Y }}
          className="absolute top-[5%] right-[-15%] w-[60vw] h-[80vw] bg-proofound-terracotta rounded-[45%] opacity-20 blur-3xl transform rotate-12"
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:grid md:grid-cols-12 gap-12 md:gap-24">
          {/* Left Column: Sticky Narrative & Progress */}
          <div className="md:col-span-5 relative">
            <div className="md:sticky md:top-40 md:h-[calc(100vh-20rem)] flex flex-col justify-start pt-12">
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 30 }}
                animate={effectiveInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={
                  reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 100, damping: 20 }
                }
              >
                <h2 className="text-5xl md:text-6xl font-display text-foreground mb-6 tracking-tight text-balance">
                  How Proofound works
                </h2>
                <p className="text-xl md:text-2xl text-muted-foreground font-sans text-balance mb-12">
                  Start by publishing your proof portfolio, then expand into matching and growth
                  workflows.
                </p>

                {/* Progress Indicator (Desktop only) */}
                <div className="hidden md:flex flex-col gap-4 relative pl-5 border-l-2 border-border/50">
                  <motion.div
                    className="absolute left-[-2px] top-0 w-[2px] bg-proofound-forest transition-all duration-500 ease-out origin-top"
                    style={{ height: `${((activeStep + 1) / features.length) * 100}%` }}
                  />
                  {features.map((f, i) => (
                    <button
                      key={i}
                      type="button"
                      tabIndex={-1}
                      onClick={() => {
                        document
                          .querySelector(`[data-index="${i}"]`)
                          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      className={cn(
                        'text-left text-sm font-medium transition-all duration-300',
                        activeStep === i
                          ? 'text-foreground translate-x-1'
                          : 'text-muted-foreground hover:text-foreground/80 hover:translate-x-0.5'
                      )}
                    >
                      {f.title}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Right Column: Scrolling Cards */}
          <div className="md:col-span-7 flex flex-col gap-8 md:gap-24 pb-12 md:pb-32">
            {features.map((feature, idx) => (
              <div
                key={idx}
                data-index={idx}
                className={cn(
                  'step-card group bg-card/60 backdrop-blur-xl border border-border rounded-[2rem] p-6 md:p-10 lg:p-12 shadow-xl md:transition-all md:duration-700',
                  activeStep === idx
                    ? 'md:opacity-100 md:scale-100'
                    : 'md:opacity-30 md:scale-[0.98]'
                )}
              >
                <div className="space-y-6">
                  <div className="w-16 h-16 rounded-2xl bg-muted/50 flex flex-shrink-0 items-center justify-center">
                    <feature.icon className="w-8 h-8 text-foreground stroke-[1.5]" />
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-display text-foreground leading-tight mb-4">
                      {feature.title}
                    </h3>
                    <p className="text-lg text-foreground/90 font-sans leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
