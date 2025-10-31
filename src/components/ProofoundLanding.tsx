'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform, useInView, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { NetworkBackground } from '@/components/NetworkBackground';
import { Logo } from '@/components/brand/Logo';
import {
  Menu,
  X,
  Check,
  ArrowRight,
  Shield,
  Users,
  Zap,
  Heart,
  Globe,
  Lock,
  TrendingUp,
  Eye,
  CheckCircle2,
  Clock as ClockIcon,
  FileText as FileTextIcon,
  DollarSign as DollarSignIcon,
  Bot as BotIcon,
  Puzzle as PuzzleIcon,
  Recycle as RecycleIcon,
  Minimize as MinimizeIcon,
  Sparkles,
  Network,
  Map,
  Brain,
  Key,
  Compass,
  BookOpen,
  Target,
  Lightbulb,
  Award,
  Crown,
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface ProofoundLandingProps {
  onGetStarted?: () => void;
  onIndividualSignup?: () => void;
  onOrganizationSignup?: () => void;
}

export function ProofoundLanding({
  onGetStarted,
  onIndividualSignup,
  onOrganizationSignup,
}: ProofoundLandingProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showStickyProgress, setShowStickyProgress] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Default navigation handlers using Next.js router
  const handleGetStarted = () => {
    if (onGetStarted) {
      onGetStarted();
    } else {
      router.push('/signup');
    }
  };

  const handleIndividualSignup = () => {
    if (onIndividualSignup) {
      onIndividualSignup();
    } else {
      router.push('/signup');
    }
  };

  const handleOrganizationSignup = () => {
    if (onOrganizationSignup) {
      onOrganizationSignup();
    } else {
      router.push('/signup');
    }
  };

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Track scroll position for sticky CTA
  useEffect(() => {
    const handleScroll = () => {
      const scrollPercent =
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      setShowStickyProgress(scrollPercent > 60);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // GSAP ScrollTrigger animations
  useEffect(() => {
    if (shouldReduceMotion) return;

    // Refresh ScrollTrigger after a short delay to ensure DOM is ready
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);

    // Hero section animations
    gsap.to('.gsap-hero-content', {
      scrollTrigger: {
        trigger: '.gsap-hero-section',
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
      },
      scale: 0.8,
      opacity: 0.3,
      y: -100,
    });

    // Note: Problem cards and principle cards animations removed to prevent
    // conflicts with Framer Motion animations. These sections now use
    // Motion animations exclusively for better compatibility and smoother scrolling.

    // Final CTA scale effect
    gsap.fromTo(
      '.gsap-final-cta',
      { scale: 0.9, opacity: 0 },
      {
        scrollTrigger: {
          trigger: '.gsap-final-cta',
          start: 'top 80%',
          end: 'top 40%',
          scrub: 1,
        },
        scale: 1,
        opacity: 1,
      }
    );

    return () => {
      clearTimeout(timer);
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [shouldReduceMotion]);

  return (
    <div ref={containerRef} className="relative bg-[#F7F6F1] dark:bg-[#1a1a1a] overflow-hidden">
      {/* Network Background */}
      <NetworkBackground />

      {/* Minimal Header */}
      <MinimalHeader menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

      {/* Progress Indicator */}
      <ProgressIndicator scrollYProgress={scrollYProgress} />

      {/* Sticky Mini CTA (after 60% scroll) */}
      {showStickyProgress && <StickyMiniCTA onGetStarted={handleGetStarted} />}

      {/* Section 1: Hero - The Promise */}
      <HeroSection onGetStarted={handleGetStarted} shouldReduceMotion={shouldReduceMotion} />

      {/* Section 2: The Problem - Pains we solve */}
      <ProblemSection shouldReduceMotion={shouldReduceMotion} />

      {/* Section 3: Our Answer - How Proofound works */}
      <OurAnswerSection shouldReduceMotion={shouldReduceMotion} />

      {/* Section 4: What makes it trustworthy - Guiding principles */}
      <TrustworthySection shouldReduceMotion={shouldReduceMotion} />

      {/* Section 5: Show, don't tell - Teasers of modules */}
      <ModuleTeasersSection shouldReduceMotion={shouldReduceMotion} />

      {/* Section 6: For whom - Personas & outcomes */}
      <PersonasSection
        shouldReduceMotion={shouldReduceMotion}
        onIndividualSignup={handleIndividualSignup}
        onOrganizationSignup={handleOrganizationSignup}
      />

      {/* Section 7: Why now - Timing & context */}
      <WhyNowSection shouldReduceMotion={shouldReduceMotion} />

      {/* Section 8: Proof & credibility */}
      <ProofSection shouldReduceMotion={shouldReduceMotion} />

      {/* Section 9: Steward Ownership */}
      <StewardOwnershipSection shouldReduceMotion={shouldReduceMotion} />

      {/* Section 10: Products & Subscriptions */}
      <ProductsSubscriptionsSection shouldReduceMotion={shouldReduceMotion} />

      {/* Section 11: Final pitch + Big CTA */}
      <FinalCTASection onGetStarted={handleGetStarted} shouldReduceMotion={shouldReduceMotion} />

      {/* Section 12: Final Quote Animation */}
      <FinalQuoteSection shouldReduceMotion={shouldReduceMotion} />

      {/* Footer */}
      <FooterSection />
    </div>
  );
}

// Minimal Header with Burger Menu
function MinimalHeader({
  menuOpen,
  setMenuOpen,
}: {
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50 px-6 md:px-12 py-6"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <motion.div className="flex items-center gap-2" whileHover={{ scale: 1.02 }}>
          <Logo size="sm" />
          <span className="text-xl font-['Crimson_Pro'] text-[#1C4D3A] dark:text-[#D4C4A8]">
            Proofound
          </span>
        </motion.div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-10 h-10 rounded-full bg-[#1C4D3A]/5 dark:bg-[#D4C4A8]/10 flex items-center justify-center hover:bg-[#1C4D3A]/10 dark:hover:bg-[#D4C4A8]/20 transition-colors"
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <X className="w-5 h-5 text-[#1C4D3A] dark:text-[#D4C4A8]" />
          ) : (
            <Menu className="w-5 h-5 text-[#1C4D3A] dark:text-[#D4C4A8]" />
          )}
        </button>
      </div>

      {/* Menu Overlay */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute top-full left-0 right-0 mt-4 mx-6 md:mx-12 bg-white/95 dark:bg-[#2a2a2a]/95 backdrop-blur-xl rounded-3xl border border-[#1C4D3A]/10 dark:border-[#D4C4A8]/10 p-8 shadow-2xl"
        >
          <nav className="flex flex-col items-center space-y-4">
            {['The Problem', 'How It Works', 'Principles', 'For Whom'].map((item, idx) => (
              <motion.a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="text-lg text-[#2D3330] dark:text-[#D4C4A8] hover:text-[#1C4D3A] dark:hover:text-white transition-colors text-center"
                onClick={() => setMenuOpen(false)}
              >
                {item}
              </motion.a>
            ))}

            {/* Login Button */}
            <motion.a
              href="/login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-4 px-8 py-3 rounded-full bg-[#1C4D3A] hover:bg-[#2D5D4A] text-white transition-colors text-center"
              onClick={() => setMenuOpen(false)}
            >
              Login
            </motion.a>
          </nav>
        </motion.div>
      )}
    </motion.header>
  );
}

// Progress Indicator
function ProgressIndicator({ scrollYProgress }: { scrollYProgress: any }) {
  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-50 bg-transparent">
      <motion.div
        className="h-full bg-gradient-to-r from-[#1C4D3A] via-[#5C8B89] to-[#C76B4A]"
        style={{ scaleX: scrollYProgress, transformOrigin: '0%' }}
      />
    </div>
  );
}

// Sticky Mini CTA
function StickyMiniCTA({ onGetStarted }: { onGetStarted?: () => void }) {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-6 right-6 z-40"
    >
      <Button
        onClick={onGetStarted}
        className="rounded-full px-6 py-6 bg-[#1C4D3A] hover:bg-[#2D5D4A] text-white shadow-2xl"
      >
        Join the Waitlist
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </motion.div>
  );
}

// Section 1: Hero - The Promise
function HeroSection({
  onGetStarted,
  shouldReduceMotion,
}: {
  onGetStarted?: () => void;
  shouldReduceMotion: boolean | null;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section
      ref={ref}
      className="gsap-hero-section min-h-[85vh] flex items-center justify-center px-6 md:px-12 pt-24 pb-16 relative"
    >
      <div className="gsap-hero-content relative z-10 max-w-4xl mx-auto text-center space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-6"
        >
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-['Crimson_Pro'] text-[#1C4D3A] dark:text-[#D4C4A8]">
            Proofound
          </h1>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-['Crimson_Pro'] text-[#1C4D3A] dark:text-[#D4C4A8] leading-tight">
            A credibility engineering platform for impactful connections
          </h2>
          <p className="text-lg md:text-xl text-[#2D3330]/70 dark:text-[#D4C4A8]/70 max-w-2xl mx-auto">
            Unprecedented possibilities for work, business, and individual transformation. Backed by
            evidence, not vanity metrics.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <Button
            onClick={onGetStarted}
            size="lg"
            className="rounded-full px-8 py-6 text-lg bg-[#1C4D3A] hover:bg-[#2D5D4A] text-white"
          >
            Become a contributor
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

// Section 2: The Problem - Pains we solve
function ProblemSection({ shouldReduceMotion }: { shouldReduceMotion: boolean | null }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const problems = [
    { icon: Heart, text: 'Mental health toll of endless job searches and networking' },
    { icon: Clock, text: 'Wasted time on connection rituals and manual verification' },
    { icon: Eye, text: 'Bias, misalignment, and opacity in matching systems' },
    { icon: TrendingUp, text: 'Vanity metrics that obscure real impact' },
    { icon: FileText, text: "Outdated CVs and portfolios that don't tell the full story" },
    { icon: DollarSign, text: 'Profit-only capital disconnected from mission alignment' },
    { icon: Bot, text: 'AI anxiety and lack of transparency in algorithmic decisions' },
    { icon: Puzzle, text: 'No universal problem-solving framework for collaboration' },
    { icon: Recycle, text: 'Massive waste of time, talent, and resources' },
  ];

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const headerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <section
      id="the-problem"
      ref={ref}
      className="gsap-problem-section flex items-center px-6 md:px-12 py-16 md:py-20 relative"
    >
      <div className="max-w-6xl mx-auto w-full">
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={headerVariants}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-10 md:mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-['Crimson_Pro'] text-[#1C4D3A] dark:text-[#D4C4A8] mb-3">
            The problems we solve
          </h2>
          <p className="text-lg text-[#2D3330]/70 dark:text-[#D4C4A8]/70">
            Today&apos;s connection and verification systems are broken.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {problems.map((problem, idx) => (
            <motion.div
              key={idx}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              variants={cardVariants}
              transition={{ duration: 0.6, delay: idx * 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="gsap-problem-card flex gap-4 p-6 bg-white/60 dark:bg-[#2a2a2a]/60 backdrop-blur-sm rounded-2xl border border-[#1C4D3A]/10 dark:border-[#D4C4A8]/10"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#C76B4A]/10 dark:bg-[#D4784F]/10 flex items-center justify-center">
                <problem.icon className="w-5 h-5 text-[#C76B4A] dark:text-[#D4784F]" />
              </div>
              <p className="text-[#2D3330] dark:text-[#D4C4A8]">{problem.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Section 3: Our Answer - How Proofound works
function OurAnswerSection({ shouldReduceMotion }: { shouldReduceMotion: boolean | null }) {
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
      className="px-6 md:px-12 py-16 md:py-20 relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-10 md:mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-['Crimson_Pro'] text-[#1C4D3A] dark:text-[#D4C4A8] mb-3">
            How Proofound works
          </h2>
          <p className="text-lg text-[#2D3330]/70 dark:text-[#D4C4A8]/70">
            A platform built on evidence, transparency, and dignity.
          </p>
        </motion.div>

        {/* Horizontal Carousel with Edge Masking */}
        <div className="relative -mx-6 md:-mx-12">
          {/* Left gradient fade */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#F7F6F1] dark:from-[#1a1a1a] to-transparent z-10 pointer-events-none" />

          {/* Right gradient fade */}
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#F7F6F1] dark:from-[#1a1a1a] to-transparent z-10 pointer-events-none" />

          <div ref={scrollRef} className="overflow-x-auto scrollbar-hide pb-4 px-6 md:px-12">
            <div className="flex gap-6 min-w-max">
              {features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.6, delay: idx * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  className="w-72 bg-white dark:bg-[#2a2a2a] rounded-3xl p-8 border border-[#1C4D3A]/10 dark:border-[#D4C4A8]/10 hover:border-[#1C4D3A]/30 dark:hover:border-[#D4C4A8]/30 transition-all shadow-lg hover:shadow-xl flex-shrink-0"
                >
                  <div className="flex flex-col h-full space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1C4D3A] to-[#5C8B89] flex items-center justify-center">
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-['Crimson_Pro'] text-[#1C4D3A] dark:text-[#D4C4A8]">
                      {feature.title}
                    </h3>
                    <p className="text-[#2D3330]/70 dark:text-[#D4C4A8]/70 flex-1">
                      {feature.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-[#2D3330]/50 dark:text-[#D4C4A8]/50 mt-6">
          Scroll horizontally to explore all features →
        </p>
      </div>
    </section>
  );
}

// Section 4: What makes it trustworthy - Guiding principles
function TrustworthySection({ shouldReduceMotion }: { shouldReduceMotion: boolean | null }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

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

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 },
  };

  const headerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <section
      id="principles"
      ref={ref}
      className="gsap-trustworthy-section flex items-center px-6 md:px-12 py-16 md:py-20 relative bg-gradient-to-b from-transparent to-[#1C4D3A]/5 dark:to-[#1C4D3A]/10"
    >
      <div className="max-w-6xl mx-auto w-full">
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={headerVariants}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-10 md:mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-['Crimson_Pro'] text-[#1C4D3A] dark:text-[#D4C4A8] mb-3">
            What makes it trustworthy
          </h2>
          <p className="text-lg text-[#2D3330]/70 dark:text-[#D4C4A8]/70">
            Principles that guide every decision we make.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {principles.map((principle, idx) => (
            <motion.div
              key={idx}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              variants={cardVariants}
              transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.02, y: -4 }}
              className="gsap-principle-card bg-white dark:bg-[#2a2a2a] rounded-3xl p-8 border border-[#1C4D3A]/10 dark:border-[#D4C4A8]/10 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1C4D3A] to-[#5C8B89] flex items-center justify-center mb-6">
                <principle.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-['Crimson_Pro'] text-[#1C4D3A] dark:text-[#D4C4A8] mb-3">
                {principle.title}
              </h3>
              <p className="text-[#2D3330]/70 dark:text-[#D4C4A8]/70">{principle.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Section 5: Show, don't tell - Teasers of modules
function ModuleTeasersSection({ shouldReduceMotion }: { shouldReduceMotion: boolean | null }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const modules = [
    {
      title: 'Verification v1.0',
      desc: 'Badges and proofs with transparent provenance',
      status: 'live',
      color: '#7A9278',
    },
    {
      title: 'Clusters',
      desc: 'Network signals that reveal alignment without exposing identities',
      status: 'live',
      color: '#5C8B89',
    },
    {
      title: 'Expertise Atlas',
      desc: 'Skills mapped to evidence and artifacts',
      status: 'live',
      color: '#C76B4A',
    },
    {
      title: 'Zen Hub',
      desc: 'Ikigai planning, well-being tools, and mental health support',
      status: 'live',
      color: '#D4A574',
    },
    {
      title: 'Dev Hub',
      desc: 'Personalized learning pathways and partner benefits',
      status: 'coming-soon',
      color: '#C76B4A',
    },
    {
      title: 'Matching',
      desc: 'Evidence-based connections powered by transparent algorithms',
      status: 'coming-soon',
      color: '#5C8B89',
    },
    {
      title: 'Opportunities & Projects',
      desc: 'Mission-aligned work connections',
      status: 'coming-soon',
      color: '#7A9278',
    },
    {
      title: 'AI Cofounder',
      desc: "A trustworthy companion designed to make doing business and driving projects like it's magic",
      status: 'coming-soon',
      color: '#5C8B89',
    },
    {
      title: 'Governance Node',
      desc: 'Finally feel connected in real time to those who govern',
      status: 'coming-soon',
      color: '#D4A574',
    },
  ];

  return (
    <section
      ref={ref}
      className="gsap-modules-section px-6 md:px-12 py-16 md:py-20 relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-10 md:mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-['Crimson_Pro'] text-[#1C4D3A] dark:text-[#D4C4A8] mb-3">
            Show, don&apos;t tell
          </h2>
          <p className="text-lg text-[#2D3330]/70 dark:text-[#D4C4A8]/70">
            Explore the modules that power Proofound.
          </p>
        </motion.div>

        {/* Horizontal Timeline with Edge Masking */}
        <div className="relative -mx-6 md:-mx-12">
          {/* Left gradient fade */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#F7F6F1] dark:from-[#1a1a1a] to-transparent z-20 pointer-events-none" />

          {/* Right gradient fade */}
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#F7F6F1] dark:from-[#1a1a1a] to-transparent z-20 pointer-events-none" />

          <div className="relative overflow-x-auto scrollbar-hide pb-8 px-6 md:px-12">
            {/* Timeline Line */}
            <div
              className="absolute top-20 left-0 right-0 h-0.5 bg-gradient-to-r from-[#7A9278] via-[#5C8B89] to-[#C76B4A]"
              style={{ width: `${modules.length * 280}px` }}
            />

            <div className="flex gap-8 min-w-max">
              {modules.map((module, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.6, delay: idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="relative flex flex-col items-center w-64"
                >
                  {/* Timeline Dot */}
                  <div
                    className="w-10 h-10 rounded-full border-4 border-[#F7F6F1] dark:border-[#1a1a1a] z-10 mb-4"
                    style={{ backgroundColor: module.color }}
                  />

                  {/* Module Card */}
                  <div className="bg-white dark:bg-[#2a2a2a] rounded-2xl p-6 border border-[#1C4D3A]/10 dark:border-[#D4C4A8]/10 hover:border-[#1C4D3A]/30 dark:hover:border-[#D4C4A8]/30 transition-all shadow-lg hover:shadow-xl w-full">
                    <div className="flex items-center justify-between mb-3">
                      {module.status === 'coming-soon' ? (
                        <span className="px-3 py-1 rounded-full bg-[#C76B4A]/10 dark:bg-[#D4784F]/10 text-xs text-[#C76B4A] dark:text-[#D4784F]">
                          Coming Soon
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-[#7A9278]/10 dark:bg-[#6FAAA0]/10 text-xs text-[#7A9278] dark:text-[#6FAAA0]">
                          Live
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-['Crimson_Pro'] text-[#1C4D3A] dark:text-[#D4C4A8] mb-2">
                      {module.title}
                    </h3>
                    <p className="text-sm text-[#2D3330]/70 dark:text-[#D4C4A8]/70">
                      {module.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-[#2D3330]/50 dark:text-[#D4C4A8]/50 mt-6">
          Scroll horizontally to see the roadmap →
        </p>
      </div>
    </section>
  );
}

// Section 6: For whom - Personas & outcomes
function PersonasSection({
  shouldReduceMotion,
  onIndividualSignup,
  onOrganizationSignup,
}: {
  shouldReduceMotion: boolean | null;
  onIndividualSignup?: () => void;
  onOrganizationSignup?: () => void;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const [activePersona, setActivePersona] = useState<'individual' | 'organization'>('individual');

  const personas = {
    individual: {
      title: 'For Individuals',
      outcomes: [
        'Find mission-aligned opportunities without the mental health toll',
        'Build a verified, portable profile that tells your real story',
        'Access well-being tools and career planning support',
      ],
      cta: 'Join as an Individual',
      onAction: onIndividualSignup,
    },
    organization: {
      title: 'For Organizations',
      outcomes: [
        'Discover talent based on evidence and alignment, not resumes',
        'Reduce bias in hiring and partnership decisions',
        'Build trust with transparent verification and matching',
      ],
      cta: 'Partner with Us',
      onAction: onOrganizationSignup,
    },
  };

  const current = personas[activePersona];

  return (
    <section
      id="for-whom"
      ref={ref}
      className="flex items-center px-6 md:px-12 py-16 md:py-20 relative"
    >
      <div className="max-w-5xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl md:text-5xl font-['Crimson_Pro'] text-[#1C4D3A] dark:text-[#D4C4A8] mb-3">
            Built for you
          </h2>
          <p className="text-lg text-[#2D3330]/70 dark:text-[#D4C4A8]/70 mb-8">
            Whether you&apos;re an individual or an organization, Proofound empowers you.
          </p>

          {/* Persona Toggle */}
          <div className="inline-flex bg-white dark:bg-[#2a2a2a] rounded-full p-1 border border-[#1C4D3A]/10 dark:border-[#D4C4A8]/10">
            <button
              onClick={() => setActivePersona('individual')}
              className={`px-8 py-3 rounded-full transition-all ${
                activePersona === 'individual'
                  ? 'bg-[#1C4D3A] text-white'
                  : 'text-[#2D3330] dark:text-[#D4C4A8]'
              }`}
            >
              Individuals
            </button>
            <button
              onClick={() => setActivePersona('organization')}
              className={`px-8 py-3 rounded-full transition-all ${
                activePersona === 'organization'
                  ? 'bg-[#1C4D3A] text-white'
                  : 'text-[#2D3330] dark:text-[#D4C4A8]'
              }`}
            >
              Organizations
            </button>
          </div>
        </motion.div>

        <motion.div
          key={activePersona}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white dark:bg-[#2a2a2a] rounded-3xl p-12 border border-[#1C4D3A]/10 dark:border-[#D4C4A8]/10"
        >
          <h3 className="text-2xl font-['Crimson_Pro'] text-[#1C4D3A] dark:text-[#D4C4A8] mb-8">
            {current.title}
          </h3>

          <div className="space-y-4 mb-8">
            {current.outcomes.map((outcome, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#7A9278] dark:text-[#6FAAA0] flex-shrink-0 mt-1" />
                <p className="text-[#2D3330] dark:text-[#D4C4A8]">{outcome}</p>
              </div>
            ))}
          </div>

          <Button
            size="lg"
            onClick={current.onAction}
            className="w-full rounded-full bg-[#1C4D3A] hover:bg-[#2D5D4A] text-white"
          >
            {current.cta}
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

// Section 7: Why now - Timing & context
function WhyNowSection({ shouldReduceMotion }: { shouldReduceMotion: boolean | null }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const reasons = [
    {
      label: 'AI and Technology advancements are shifting global paradigms',
      desc: 'New tools demand new trust models and possibilities',
    },
    {
      label: 'Simplicity of faking and growing trust challenges',
      desc: 'Misinformation and deepfakes erode credibility everywhere',
    },
    {
      label:
        'Global mental health challenges grow as people question their immediate future and seek new transformation tools',
      desc: 'Unprecedented uncertainty drives need for well-being infrastructure',
    },
    {
      label:
        'Obsoletion of outdated CV and recruitment standards that become less and less efficient',
      desc: "Traditional credentials don't capture real capability or values alignment",
    },
    {
      label: 'Rapid globalization calls for coordination on an unprecedented scale',
      desc: 'Cross-border collaboration requires new verification and trust systems',
    },
  ];

  return (
    <section
      ref={ref}
      className="flex items-center px-6 md:px-12 py-16 md:py-20 relative bg-gradient-to-b from-transparent to-[#C76B4A]/5 dark:to-[#C76B4A]/10"
    >
      <div className="max-w-4xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-10 md:mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-['Crimson_Pro'] text-[#1C4D3A] dark:text-[#D4C4A8] mb-3">
            Why now
          </h2>
          <p className="text-lg text-[#2D3330]/70 dark:text-[#D4C4A8]/70">
            The timing has never been more critical.
          </p>
        </motion.div>

        <div className="space-y-6">
          {reasons.map((reason, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
              transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-6 bg-white/80 dark:bg-[#2a2a2a]/80 backdrop-blur-sm rounded-2xl p-6 border border-[#1C4D3A]/10 dark:border-[#D4C4A8]/10"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C76B4A] to-[#D4A574] flex items-center justify-center flex-shrink-0">
                <span className="text-white text-lg">{idx + 1}</span>
              </div>
              <div>
                <h3 className="text-xl font-['Crimson_Pro'] text-[#1C4D3A] dark:text-[#D4C4A8] mb-1">
                  {reason.label}
                </h3>
                <p className="text-[#2D3330]/70 dark:text-[#D4C4A8]/70">{reason.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Section 8: Proof & credibility
function ProofSection({ shouldReduceMotion }: { shouldReduceMotion: boolean | null }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section ref={ref} className="flex items-center px-6 md:px-12 py-16 md:py-20 relative">
      <div className="max-w-5xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-10 md:mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-['Crimson_Pro'] text-[#1C4D3A] dark:text-[#D4C4A8] mb-3">
            Proof & credibility
          </h2>
          <p className="text-lg text-[#2D3330]/70 dark:text-[#D4C4A8]/70">
            How we ensure transparency and trust.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white dark:bg-[#2a2a2a] rounded-3xl p-12 border border-[#1C4D3A]/10 dark:border-[#D4C4A8]/10 space-y-8"
        >
          <div>
            <h3 className="text-xl font-['Crimson_Pro'] text-[#1C4D3A] dark:text-[#D4C4A8] mb-4">
              How verification works
            </h3>
            <p className="text-[#2D3330]/70 dark:text-[#D4C4A8]/70 mb-4">
              Every proof is traceable to its source. We use cryptographic signatures, time-stamped
              evidence, and transparent provenance chains to ensure authenticity.
            </p>
            <button
              type="button"
              className="text-[#1C4D3A] dark:text-[#6FAAA0] underline hover:no-underline"
            >
              See how this is verified →
            </button>
          </div>

          <div className="border-t border-[#1C4D3A]/10 dark:border-[#D4C4A8]/10 pt-8">
            <h3 className="text-xl font-['Crimson_Pro'] text-[#1C4D3A] dark:text-[#D4C4A8] mb-4">
              Privacy stance
            </h3>
            <p className="text-[#2D3330]/70 dark:text-[#D4C4A8]/70 mb-4">
              Granular privacy controls at every layer. You decide what&apos;s visible, to whom, and
              when. We never sell your data or use it for purposes you haven&apos;t explicitly
              consented to.
            </p>
            <button
              type="button"
              className="text-[#1C4D3A] dark:text-[#6FAAA0] underline hover:no-underline"
            >
              What we keep private →
            </button>
          </div>

          <div className="border-t border-[#1C4D3A]/10 dark:border-[#D4C4A8]/10 pt-8">
            <h3 className="text-xl font-['Crimson_Pro'] text-[#1C4D3A] dark:text-[#D4C4A8] mb-4">
              Audits in plain language
            </h3>
            <p className="text-[#2D3330]/70 dark:text-[#D4C4A8]/70">
              Our anti-bias algorithms are continuously monitored and audited. We publish
              transparency reports that anyone can understand—no technical jargon required.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Section 9: Steward Ownership - Business Model of the Future
function StewardOwnershipSection({ shouldReduceMotion }: { shouldReduceMotion: boolean | null }) {
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
    <section
      id="steward-ownership"
      ref={ref}
      className="flex items-center px-6 md:px-12 py-16 md:py-20 relative bg-gradient-to-b from-transparent to-[#7A9278]/5 dark:to-[#7A9278]/10"
    >
      <div className="max-w-6xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-10 md:mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-['Crimson_Pro'] text-[#1C4D3A] dark:text-[#D4C4A8] mb-4">
            Steward Ownership — Business Model of the Future
          </h2>
          <p className="text-lg text-[#2D3330]/70 dark:text-[#D4C4A8]/70 max-w-3xl mx-auto">
            Steward ownership ensures that a company&apos;s purpose and independence are protected
            by giving control to stewards, not external shareholders.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {principles.map((principle, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white dark:bg-[#2a2a2a] rounded-3xl p-8 border border-[#1C4D3A]/10 dark:border-[#D4C4A8]/10 hover:border-[#1C4D3A]/30 dark:hover:border-[#D4C4A8]/30 transition-all shadow-lg hover:shadow-xl"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7A9278] to-[#5C8B89] flex items-center justify-center mb-6">
                <principle.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-['Crimson_Pro'] text-[#1C4D3A] dark:text-[#D4C4A8] mb-3">
                {principle.title}
              </h3>
              <p className="text-[#2D3330]/70 dark:text-[#D4C4A8]/70">{principle.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Section 10: Products & Subscriptions
function ProductsSubscriptionsSection({
  shouldReduceMotion,
}: {
  shouldReduceMotion: boolean | null;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const [viewMode, setViewMode] = useState<'individual' | 'organization'>('individual');

  // Track billing cycle for each product individually
  const [productBillingCycles, setProductBillingCycles] = useState<{
    [key: number]: 'monthly' | 'annual';
  }>({
    0: 'monthly',
    1: 'monthly',
    2: 'monthly',
    3: 'monthly',
  });

  const toggleBillingCycle = (index: number) => {
    setProductBillingCycles((prev) => ({
      ...prev,
      [index]: prev[index] === 'monthly' ? 'annual' : 'monthly',
    }));
  };

  const individualProducts = [
    {
      icon: Sparkles,
      title: 'Development Hub Subscription',
      desc: 'Access resources, templates, and guided learning paths.',
      priceMonthly: 19,
      priceAnnual: 15,
      freeTrial: '14 days',
    },
    {
      icon: Bot,
      title: 'AI Co-Founder Tool',
      desc: 'Subscription + tokenized usage model for scalable assistance.',
      priceMonthly: 39,
      priceAnnual: 31,
      freeTrial: '7 days',
    },
    {
      icon: Heart,
      title: 'Zen Hub Premium',
      desc: 'Extended well-being and productivity ecosystem.',
      priceMonthly: 12,
      priceAnnual: 10,
      freeTrial: '30 days',
    },
    {
      icon: Crown,
      title: 'Full Bundle Package',
      desc: 'All premium features: Development Hub, AI Co-Founder, and Zen Hub.',
      priceMonthly: 59,
      priceAnnual: 47,
      freeTrial: '30 days',
      highlight: true,
      savings: 'Save €11/month',
    },
  ];

  const organizationProducts = [
    {
      icon: Network,
      title: 'Platform Subscription',
      desc: 'Access to organizational dashboards and verification tools.',
    },
    {
      icon: Target,
      title: 'Assignment Completion Fees',
      desc: 'Pay-per-mission or project delivery model.',
    },
    {
      icon: Heart,
      title: 'Zen Hub Enterprise',
      desc: 'Tailored well-being and collaboration environment.',
    },
    {
      icon: TrendingUp,
      title: 'Employee Development Hubs',
      desc: 'Empower internal growth with curated learning ecosystems.',
    },
  ];

  const products = viewMode === 'individual' ? individualProducts : organizationProducts;

  return (
    <section ref={ref} className="px-6 md:px-12 py-16 md:py-20 relative">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-10 md:mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-['Crimson_Pro'] text-[#1C4D3A] dark:text-[#D4C4A8] mb-4">
            Products & Subscriptions
          </h2>
          <p className="text-base md:text-lg text-[#2D3330]/70 dark:text-[#D4C4A8]/70 max-w-4xl mx-auto mb-8">
            Proofound pledges a lifelong commitment never to monetize by creating disparity or
            selling exposure. The core tools that fulfill our mission will always remain free for
            humans. Our purpose is to enable people to do more — paid tools exist only to create
            pure positive value at no one else&apos;s expense. We are fully transparent about profit
            distribution, a cornerstone of our Steward Ownership model.
          </p>

          {/* Toggle Switch */}
          <div className="inline-flex bg-white dark:bg-[#2a2a2a] rounded-full p-1 border border-[#1C4D3A]/10 dark:border-[#D4C4A8]/10">
            <button
              onClick={() => setViewMode('individual')}
              className={`px-6 py-2 rounded-full transition-all ${
                viewMode === 'individual'
                  ? 'bg-[#1C4D3A] text-white'
                  : 'text-[#2D3330] dark:text-[#D4C4A8] hover:bg-[#1C4D3A]/5'
              }`}
            >
              Individuals
            </button>
            <button
              onClick={() => setViewMode('organization')}
              className={`px-6 py-2 rounded-full transition-all ${
                viewMode === 'organization'
                  ? 'bg-[#1C4D3A] text-white'
                  : 'text-[#2D3330] dark:text-[#D4C4A8] hover:bg-[#1C4D3A]/5'
              }`}
            >
              Organizations
            </button>
          </div>
        </motion.div>

        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className={`grid ${viewMode === 'organization' ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-4'} gap-6`}
        >
          {products.map((product, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4 }}
              className={`bg-white dark:bg-[#2a2a2a] rounded-3xl p-8 border transition-all shadow-lg hover:shadow-xl flex flex-col relative ${
                'highlight' in product && product.highlight
                  ? 'border-[#C76B4A] dark:border-[#C76B4A] ring-2 ring-[#C76B4A]/20'
                  : 'border-[#1C4D3A]/10 dark:border-[#D4C4A8]/10 hover:border-[#1C4D3A]/30 dark:hover:border-[#D4C4A8]/30'
              }`}
            >
              {/* Highlight Badge for Bundle */}
              {'highlight' in product && product.highlight && (
                <div className="absolute -top-3 -right-3 bg-[#C76B4A] text-white text-xs px-3 py-1 rounded-full shadow-lg">
                  Best Value
                </div>
              )}

              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1C4D3A] to-[#5C8B89] flex items-center justify-center mb-6">
                <product.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-['Crimson_Pro'] text-[#1C4D3A] dark:text-[#D4C4A8] mb-3">
                {product.title}
              </h3>
              <p className="text-[#2D3330]/70 dark:text-[#D4C4A8]/70 mb-6 flex-1">{product.desc}</p>

              {/* Pricing Section */}
              {viewMode === 'individual' && 'priceMonthly' in product ? (
                <div className="mt-auto">
                  {/* Individual Billing Toggle for this product */}
                  <div className="flex bg-white dark:bg-[#2a2a2a] rounded-full p-1 border border-[#1C4D3A]/10 dark:border-[#D4C4A8]/10 mb-4">
                    <button
                      onClick={() => toggleBillingCycle(idx)}
                      className={`flex-1 px-3 py-1.5 rounded-full text-xs transition-all ${
                        productBillingCycles[idx] === 'monthly'
                          ? 'bg-[#1C4D3A] text-white'
                          : 'text-[#2D3330] dark:text-[#D4C4A8] hover:bg-[#1C4D3A]/5'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => toggleBillingCycle(idx)}
                      className={`flex-1 px-3 py-1.5 rounded-full text-xs transition-all ${
                        productBillingCycles[idx] === 'annual'
                          ? 'bg-[#1C4D3A] text-white'
                          : 'text-[#2D3330] dark:text-[#D4C4A8] hover:bg-[#1C4D3A]/5'
                      }`}
                    >
                      Annual
                    </button>
                  </div>

                  {/* Savings indicator for bundle - fixed height to prevent jumping */}
                  <div className="h-8 mb-3">
                    {'savings' in product &&
                      product.savings &&
                      productBillingCycles[idx] === 'monthly' && (
                        <p className="text-sm text-[#C76B4A] dark:text-[#C76B4A] font-medium">
                          {product.savings}
                        </p>
                      )}
                  </div>

                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-3xl font-['Crimson_Pro'] text-[#1C4D3A] dark:text-[#D4C4A8]">
                      €
                      {productBillingCycles[idx] === 'monthly'
                        ? product.priceMonthly
                        : product.priceAnnual}
                    </span>
                    <span className="text-sm text-[#2D3330]/70 dark:text-[#D4C4A8]/70">/month</span>
                  </div>

                  {/* Fixed height for billing details to prevent jumping */}
                  <div className="h-5 mb-3">
                    {productBillingCycles[idx] === 'annual' && (
                      <p className="text-xs text-[#7A9278] dark:text-[#6FAAA0]">
                        Billed annually at €{product.priceAnnual * 12}
                      </p>
                    )}
                  </div>

                  <p className="text-sm text-[#2D3330]/70 dark:text-[#D4C4A8]/70 mb-4">
                    {product.freeTrial} free trial
                  </p>
                  <Button
                    size="sm"
                    className="w-full rounded-full bg-[#1C4D3A] hover:bg-[#2D5D4A] text-white"
                  >
                    Start Free Trial
                  </Button>
                </div>
              ) : (
                <div className="mt-auto pt-4 border-t border-[#1C4D3A]/10 dark:border-[#D4C4A8]/10">
                  <p className="text-sm text-[#2D3330]/70 dark:text-[#D4C4A8]/70 text-center mb-3">
                    Custom pricing based on your needs
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full rounded-full border-[#1C4D3A] dark:border-[#D4C4A8] text-[#1C4D3A] dark:text-[#D4C4A8] hover:bg-[#1C4D3A] hover:text-white dark:hover:bg-[#D4C4A8] dark:hover:text-[#1a1a1a]"
                  >
                    Contact for inquiries
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// Section 11: Final pitch + Big CTA
function FinalCTASection({
  onGetStarted,
  shouldReduceMotion,
}: {
  onGetStarted?: () => void;
  shouldReduceMotion: boolean | null;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'individual' | 'organization' | ''>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle waitlist submission
    console.log('Waitlist submission:', { email, role });
    onGetStarted?.();
  };

  return (
    <section
      ref={ref}
      className="flex items-center px-6 md:px-12 py-16 md:py-20 relative overflow-hidden"
    >
      <div className="gsap-final-cta relative z-10 max-w-3xl mx-auto w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-6 mb-10"
        >
          <h2 className="text-4xl md:text-6xl font-['Crimson_Pro'] text-[#1C4D3A] dark:text-[#D4C4A8] leading-tight">
            Join the founding cohort
          </h2>
          <p className="text-xl text-[#2D3330]/70 dark:text-[#D4C4A8]/70 max-w-2xl mx-auto">
            Be part of building a credibility infrastructure that respects your dignity, protects
            your privacy, and amplifies your impact.
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          onSubmit={handleSubmit}
          className="bg-white dark:bg-[#2a2a2a] rounded-3xl p-8 md:p-12 border border-[#1C4D3A]/10 dark:border-[#D4C4A8]/10 shadow-2xl space-y-6"
        >
          <div className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full px-6 py-4 rounded-full border border-[#1C4D3A]/20 dark:border-[#D4C4A8]/20 bg-[#F7F6F1] dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#1C4D3A]/30 dark:focus:ring-[#6FAAA0]/30 text-[#2D3330] dark:text-[#D4C4A8] placeholder:text-[#2D3330]/50 dark:placeholder:text-[#D4C4A8]/50"
            />

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setRole('individual')}
                className={`flex-1 px-6 py-3 rounded-full border transition-all ${
                  role === 'individual'
                    ? 'border-[#1C4D3A] bg-[#1C4D3A]/5 dark:bg-[#6FAAA0]/10 text-[#1C4D3A] dark:text-[#6FAAA0]'
                    : 'border-[#1C4D3A]/20 dark:border-[#D4C4A8]/20 text-[#2D3330]/70 dark:text-[#D4C4A8]/70'
                }`}
              >
                Individual
              </button>
              <button
                type="button"
                onClick={() => setRole('organization')}
                className={`flex-1 px-6 py-3 rounded-full border transition-all ${
                  role === 'organization'
                    ? 'border-[#1C4D3A] bg-[#1C4D3A]/5 dark:bg-[#6FAAA0]/10 text-[#1C4D3A] dark:text-[#6FAAA0]'
                    : 'border-[#1C4D3A]/20 dark:border-[#D4C4A8]/20 text-[#2D3330]/70 dark:text-[#D4C4A8]/70'
                }`}
              >
                Organization
              </button>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full rounded-full py-6 text-lg bg-[#1C4D3A] hover:bg-[#2D5D4A] text-white"
          >
            Get Early Access
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          <p className="text-sm text-[#2D3330]/50 dark:text-[#D4C4A8]/50">
            We respect your privacy. No spam, no data sold.{' '}
            <a href="#privacy" className="underline hover:no-underline">
              Read our privacy stance
            </a>
            .
          </p>
        </motion.form>

        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-8 text-sm text-[#2D3330]/50 dark:text-[#D4C4A8]/50"
        >
          Organizations:{' '}
          <a
            href="#partner"
            className="text-[#1C4D3A] dark:text-[#6FAAA0] underline hover:no-underline"
          >
            Partner with us
          </a>{' '}
          • Learn more:{' '}
          <a
            href="#principles"
            className="text-[#1C4D3A] dark:text-[#6FAAA0] underline hover:no-underline ml-1"
          >
            Read the principles
          </a>
        </motion.p>
      </div>
    </section>
  );
}

// Section 12: Final Quote Animation
function FinalQuoteSection({ shouldReduceMotion }: { shouldReduceMotion: boolean | null }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Fade out the intro line
  const opacity1 = useTransform(scrollYProgress, [0, 0.3, 0.4, 0.6], [1, 1, 1, 0]);
  // Fade out the middle words
  const opacity2 = useTransform(scrollYProgress, [0, 0.3, 0.4, 0.6], [1, 1, 0, 0]);
  const opacity3 = useTransform(scrollYProgress, [0, 0.3, 0.4, 0.6], [1, 1, 0, 0]);

  // Merge animation for Proofound appearing
  const mergeProgress = useTransform(scrollYProgress, [0.5, 0.8], [0, 1]);

  // Movement for proof and found as they merge together
  const proofX = useTransform(scrollYProgress, [0.4, 0.6], [0, 40]);
  const foundX = useTransform(scrollYProgress, [0.4, 0.6], [0, -40]);

  // Opacity for proof and found - they fade out completely as they merge
  const proofFoundOpacity = useTransform(scrollYProgress, [0.4, 0.6], [1, 0]);

  return (
    <section
      ref={ref}
      className="min-h-[70vh] flex items-center justify-center px-6 md:px-12 py-24 relative overflow-hidden"
    >
      <div className="max-w-5xl mx-auto text-center">
        <div className="relative">
          {/* Initial Quote */}
          <div className="text-4xl md:text-6xl lg:text-7xl font-['Crimson_Pro'] text-[#1C4D3A] dark:text-[#D4C4A8] leading-tight space-y-4">
            <motion.div style={{ opacity: shouldReduceMotion ? 1 : opacity1 }}>
              When work becomes
            </motion.div>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <motion.span
                style={{
                  opacity: shouldReduceMotion ? 1 : proofFoundOpacity,
                  x: shouldReduceMotion ? 0 : proofX,
                }}
                className="font-bold"
              >
                proof
              </motion.span>
              <motion.span style={{ opacity: shouldReduceMotion ? 1 : opacity2 }}>
                of who we
              </motion.span>
              <motion.span style={{ opacity: shouldReduceMotion ? 1 : opacity3 }}>
                are — a deeper purpose is
              </motion.span>
              <motion.span
                style={{
                  opacity: shouldReduceMotion ? 1 : proofFoundOpacity,
                  x: shouldReduceMotion ? 0 : foundX,
                }}
                className="font-bold"
              >
                found
              </motion.span>
            </div>
          </div>

          {/* Merged "Proofound" appears as others fade */}
          <motion.div
            style={{
              opacity: shouldReduceMotion ? 0 : mergeProgress,
              textShadow:
                '0 0 60px rgba(28, 77, 58, 0.6), 0 0 90px rgba(28, 77, 58, 0.4), 0 4px 20px rgba(28, 77, 58, 0.8)',
              filter: 'brightness(1.3) contrast(1.2)',
            }}
            className="absolute inset-0 flex items-center justify-center text-5xl md:text-7xl lg:text-9xl font-['Crimson_Pro'] text-[#1C4D3A] dark:text-[#D4C4A8] font-bold"
          >
            Proofound
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Footer
function FooterSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const footerLinks = {
    platform: [
      { label: 'About Proofound', href: '#about' },
      { label: 'How It Works', href: '#how-it-works' },
      { label: 'Principles', href: '#principles' },
      { label: 'FAQ', href: '#faq' },
    ],
    resources: [
      { label: 'Documentation', href: '#docs' },
      { label: 'Blog & Insights', href: '#blog' },
      { label: 'Community', href: '#community' },
      { label: 'Support', href: '#support' },
    ],
    legal: [
      { label: 'Terms of Service', href: '#terms' },
      { label: 'Privacy Policy', href: '#privacy' },
      { label: 'Data Protection', href: '#gdpr' },
      { label: 'Accessibility', href: '#accessibility' },
    ],
  };

  return (
    <motion.footer
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 1 }}
      className="border-t border-[#1C4D3A]/10 dark:border-[#D4C4A8]/10 bg-white/50 dark:bg-[#2a2a2a]/50 backdrop-blur-xl"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-20 pb-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-2 mb-6">
              <Logo size="md" />
              <span className="text-xl font-['Crimson_Pro'] text-[#1C4D3A] dark:text-[#D4C4A8]">
                Proofound
              </span>
            </div>
            <p className="text-sm text-[#2D3330]/70 dark:text-[#D4C4A8]/70 mb-6 leading-relaxed">
              Building multidimensional connections with evidence-based transparency.
            </p>
            <div className="space-y-2 text-sm text-[#2D3330]/70 dark:text-[#D4C4A8]/70">
              <p className="flex items-center gap-2">
                <span>📍</span>
                <span>Stockholm, Sweden</span>
              </p>
              <p className="flex items-center gap-2">
                <span>✉️</span>
                <a
                  href="mailto:hello@proofound.com"
                  className="hover:text-[#1C4D3A] dark:hover:text-[#6FAAA0] transition-colors"
                >
                  hello@proofound.com
                </a>
              </p>
            </div>
          </motion.div>

          {/* Platform Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.2 }}
          >
            <h4 className="mb-6 font-['Crimson_Pro'] text-[#1C4D3A] dark:text-[#D4C4A8]">
              Platform
            </h4>
            <ul className="space-y-3">
              {footerLinks.platform.map((link, idx) => (
                <li key={idx}>
                  <a
                    href={link.href}
                    className="text-sm text-[#2D3330]/70 dark:text-[#D4C4A8]/70 hover:text-[#1C4D3A] dark:hover:text-[#6FAAA0] transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Resources Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.3 }}
          >
            <h4 className="mb-6 font-['Crimson_Pro'] text-[#1C4D3A] dark:text-[#D4C4A8]">
              Resources
            </h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link, idx) => (
                <li key={idx}>
                  <a
                    href={link.href}
                    className="text-sm text-[#2D3330]/70 dark:text-[#D4C4A8]/70 hover:text-[#1C4D3A] dark:hover:text-[#6FAAA0] transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Legal Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.4 }}
          >
            <h4 className="mb-6 font-['Crimson_Pro'] text-[#1C4D3A] dark:text-[#D4C4A8]">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link, idx) => (
                <li key={idx}>
                  <a
                    href={link.href}
                    className="text-sm text-[#2D3330]/70 dark:text-[#D4C4A8]/70 hover:text-[#1C4D3A] dark:hover:text-[#6FAAA0] transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#1C4D3A]/10 dark:border-[#D4C4A8]/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-[#2D3330]/50 dark:text-[#D4C4A8]/50"
          >
            © 2025 Proofound. All rights reserved.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-center gap-6 text-sm text-[#2D3330]/50 dark:text-[#D4C4A8]/50"
          >
            <span>Anti-bias certified</span>
            <span>•</span>
            <span>GDPR compliant</span>
            <span>•</span>
            <span>Steward-owned</span>
          </motion.div>
        </div>
      </div>
    </motion.footer>
  );
}

// Helper icon components
function Clock({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function FileText({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function DollarSign({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function Bot({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

function Puzzle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
      />
    </svg>
  );
}

function Recycle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

function Minimize({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
    </svg>
  );
}
