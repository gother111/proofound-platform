'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface HowItWorksSectionProps {
  shouldReduceMotion?: boolean | null;
}

export function HowItWorksSection({ shouldReduceMotion }: HowItWorksSectionProps) {
  const reduceMotion = Boolean(shouldReduceMotion);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const effectiveInView = reduceMotion ? true : isInView;
  const scrollRef = useRef<HTMLDivElement>(null);
  const carouselDescId = useId();
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      const left = el.scrollLeft;
      const epsilon = 2;
      setCanScrollLeft(left > epsilon);
      setCanScrollRight(left < max - epsilon);
    };

    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  const scrollByCard = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const delta = dir === 'left' ? -360 : 360;
    el.scrollBy({ left: delta, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

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
      className="py-32 px-6 md:px-12 relative overflow-hidden bg-background scroll-mt-24"
    >
      {/* Organic Background Shapes - Matching Mockup */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Left Sage Green Blob */}
        <div className="absolute top-[15%] left-[-15%] w-[60vw] h-[70vw] bg-extended-sage rounded-[40%] opacity-30 blur-2xl transform -rotate-12" />
        {/* Right Terracotta Blob */}
        <div className="absolute top-[5%] right-[-15%] w-[60vw] h-[80vw] bg-proofound-terracotta rounded-[45%] opacity-25 blur-2xl transform rotate-12" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 30 }}
          animate={effectiveInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-6xl font-display text-foreground mb-6 tracking-tight">
            How Proofound works
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground font-sans">
            A platform built on evidence, transparency, and dignity.
          </p>
        </motion.div>

        {/* Horizontal Carousel */}
        <div className="relative -mx-6 md:-mx-12">
          <p id={carouselDescId} className="sr-only">
            Horizontally scrollable list of Proofound features. Use the left and right arrow
            buttons, swipe, or trackpad horizontal scroll to explore.
          </p>

          <div
            ref={scrollRef}
            role="region"
            aria-label="Proofound features carousel"
            aria-describedby={carouselDescId}
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
            className="overflow-x-auto scrollbar-hide pb-12 px-6 md:px-12 snap-x snap-mandatory focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <div className="flex gap-8 min-w-max">
              {features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={reduceMotion ? false : { opacity: 0, y: 30 }}
                  animate={effectiveInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { duration: 0.8, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }
                  }
                  className="snap-center w-[340px] h-[420px] bg-card/50 backdrop-blur-xl border border-border rounded-[2rem] p-10 flex flex-col justify-between shadow-xl hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02] transition-colors transition-shadow transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group"
                >
                  <div className="space-y-8">
                    <feature.icon
                      className="w-12 h-12 text-foreground stroke-[1.5]"
                      aria-hidden="true"
                    />
                    <h3 className="text-3xl font-display text-foreground leading-tight">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-lg text-foreground/90 font-sans leading-relaxed">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Edge fades to suggest overflow */}
          <div
            aria-hidden="true"
            className={[
              'pointer-events-none absolute inset-y-0 left-0 w-12 md:w-16',
              'bg-gradient-to-r from-background via-background/80 to-transparent',
              canScrollLeft ? 'opacity-100' : 'opacity-0',
              'transition-opacity duration-300',
            ].join(' ')}
          />
          <div
            aria-hidden="true"
            className={[
              'pointer-events-none absolute inset-y-0 right-0 w-12 md:w-16',
              'bg-gradient-to-l from-background via-background/80 to-transparent',
              canScrollRight ? 'opacity-100' : 'opacity-0',
              'transition-opacity duration-300',
            ].join(' ')}
          />

          {/* Arrow controls (visual affordance, no written instruction) */}
          {canScrollLeft ? (
            <button
              type="button"
              aria-label="Scroll features left"
              onClick={() => scrollByCard('left')}
              className={[
                'absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20',
                'w-11 h-11 rounded-full',
                'bg-card/80 backdrop-blur-md border border-border shadow-lg',
                'flex items-center justify-center',
                'hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                reduceMotion ? '' : 'transition-transform duration-200 hover:scale-105',
              ].join(' ')}
            >
              <ChevronLeft className="w-5 h-5 text-foreground" aria-hidden="true" />
            </button>
          ) : null}

          {canScrollRight ? (
            <button
              type="button"
              aria-label="Scroll features right"
              onClick={() => scrollByCard('right')}
              className={[
                'absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20',
                'w-11 h-11 rounded-full',
                'bg-card/80 backdrop-blur-md border border-border shadow-lg',
                'flex items-center justify-center',
                'hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                reduceMotion ? '' : 'transition-transform duration-200 hover:scale-105',
              ].join(' ')}
            >
              <ChevronRight className="w-5 h-5 text-foreground" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
