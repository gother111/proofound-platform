'use client';

import { useState, useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  ArrowRight,
  Heart,
  Clock,
  Eye,
  TrendingUp,
  FileText,
  DollarSign,
  Bot,
  Puzzle,
  Recycle,
  Sparkles,
  Award,
  Key,
  Lock,
  Compass,
  BookOpen,
  Network,
  Globe,
  Zap,
  Shield,
  Minimize,
  Target,
  Users,
  Crown,
} from 'lucide-react';
import { NetworkBackground } from '@/components/landing/NetworkBackground';
import { Header } from '@/components/landing/Header';
import { ProgressBar } from '@/components/landing/ProgressBar';
import { StickyCTA } from '@/components/landing/StickyCTA';
import { useGSAPAnimations } from '@/lib/gsap-animations';

type Persona = 'individual' | 'organization';
type PricingType = 'individual' | 'organization';

export default function LandingPage() {
  const [persona, setPersona] = useState<Persona>('individual');
  const [pricingType, setPricingType] = useState<PricingType>('individual');
  const [selectedRole, setSelectedRole] = useState<Persona | ''>('');
  const [email, setEmail] = useState('');

  // Individual billing toggles for each product
  const [productBillingCycles, setProductBillingCycles] = useState<{
    [key: number]: 'monthly' | 'annual';
  }>({
    0: 'monthly',
    1: 'monthly',
    2: 'monthly',
    3: 'monthly',
  });

  const shouldReduceMotion = useReducedMotion();

  // Initialize GSAP animations
  useGSAPAnimations();

  const toggleBillingCycle = (index: number) => {
    setProductBillingCycles((prev) => ({
      ...prev,
      [index]: prev[index] === 'monthly' ? 'annual' : 'monthly',
    }));
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Signup:', { email, role: selectedRole });
    alert("Thank you for joining the waitlist! We'll be in touch soon.");
  };

  const scrollToSignup = () => {
    document.getElementById('signup')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F7F6F1] dark:bg-[#1a1a1a] relative overflow-x-hidden">
      <NetworkBackground />
      <ProgressBar />
      <Header />
      <StickyCTA />

      {/* Hero Section */}
      <HeroSection scrollToSignup={scrollToSignup} shouldReduceMotion={shouldReduceMotion} />

      {/* Problem Section */}
      <ProblemSection shouldReduceMotion={shouldReduceMotion} />

      {/* How It Works Section */}
      <HowItWorksSection shouldReduceMotion={shouldReduceMotion} />

      {/* Principles Section */}
      <PrinciplesSection shouldReduceMotion={shouldReduceMotion} />

      {/* Module Teasers Section */}
      <ModuleTeasersSection shouldReduceMotion={shouldReduceMotion} />

      {/* Personas Section */}
      <PersonasSection
        persona={persona}
        setPersona={setPersona}
        scrollToSignup={scrollToSignup}
        shouldReduceMotion={shouldReduceMotion}
      />

      {/* Why Now Section */}
      <WhyNowSection shouldReduceMotion={shouldReduceMotion} />

      {/* Proof & Credibility Section */}
      <ProofSection shouldReduceMotion={shouldReduceMotion} />

      {/* Steward Ownership Section */}
      <StewardOwnershipSection shouldReduceMotion={shouldReduceMotion} />

      {/* Products & Subscriptions Section */}
      <ProductsSubscriptionsSection
        pricingType={pricingType}
        setPricingType={setPricingType}
        productBillingCycles={productBillingCycles}
        toggleBillingCycle={toggleBillingCycle}
        shouldReduceMotion={shouldReduceMotion}
      />

      {/* Final CTA Section */}
      <FinalCTASection
        email={email}
        setEmail={setEmail}
        selectedRole={selectedRole}
        setSelectedRole={setSelectedRole}
        handleSignup={handleSignup}
        shouldReduceMotion={shouldReduceMotion}
      />

      {/* Final Quote Animation Section */}
      <FinalQuoteSection shouldReduceMotion={shouldReduceMotion} />

      {/* Footer */}
      <FooterSection shouldReduceMotion={shouldReduceMotion} />
    </div>
  );
}

// Hero Section
function HeroSection({
  scrollToSignup,
  shouldReduceMotion,
}: {
  scrollToSignup: () => void;
  shouldReduceMotion: boolean | null;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });

  return (
    <section
      ref={ref}
      className="gsap-hero-section min-h-[85vh] flex items-center justify-center text-center px-4 md:px-12 pt-24 relative z-10"
    >
      <div className="gsap-hero-content max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 30 }}
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
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <Button
            onClick={scrollToSignup}
            size="lg"
            className="mt-8 rounded-full px-8 py-6 text-lg bg-[#1C4D3A] hover:bg-[#2D5D4A] text-white"
          >
            Become a contributor
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

// Problem Section
function ProblemSection({ shouldReduceMotion }: { shouldReduceMotion: boolean | null }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });

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

  return (
    <section
      id="the-problem"
      ref={ref}
      className="gsap-problem-section px-4 md:px-12 py-16 md:py-20 relative z-10"
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 30 }}
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
              transition={{ duration: 0.6, delay: idx * 0.05, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card className="gsap-problem-card flex gap-4 p-6 bg-white/60 dark:bg-[#2a2a2a]/60 backdrop-blur-sm rounded-2xl border border-[#1C4D3A]/10 dark:border-[#D4C4A8]/10 hover:border-[#1C4D3A]/30 dark:hover:border-[#D4C4A8]/30 transition-all">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#C76B4A]/10 dark:bg-[#D4784F]/10 flex items-center justify-center">
                  <problem.icon className="w-5 h-5 text-[#C76B4A] dark:text-[#D4784F]" />
                </div>
                <p className="text-[#2D3330] dark:text-[#D4C4A8]">{problem.text}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// How It Works Section
function HowItWorksSection({ shouldReduceMotion }: { shouldReduceMotion: boolean | null }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.2 });
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
      className="px-4 md:px-12 py-16 md:py-20 relative z-10 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 30 }}
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
        <div className="relative -mx-4 md:-mx-12">
          {/* Left gradient fade */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#F7F6F1] dark:from-[#1a1a1a] to-transparent z-10 pointer-events-none" />

          {/* Right gradient fade */}
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#F7F6F1] dark:from-[#1a1a1a] to-transparent z-10 pointer-events-none" />

          <div ref={scrollRef} className="overflow-x-auto scrollbar-hide pb-4 px-4 md:px-12">
            <div className="flex gap-6 min-w-max">
              {features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
                  transition={{ duration: 0.6, delay: idx * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -4 }}
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

// Principles Section
function PrinciplesSection({ shouldReduceMotion }: { shouldReduceMotion: boolean | null }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });

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

  return (
    <section
      id="principles"
      ref={ref}
      className="gsap-trustworthy-section px-4 md:px-12 py-16 md:py-20 relative z-10 bg-gradient-to-b from-transparent to-[#1C4D3A]/5 dark:to-[#1C4D3A]/10"
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 30 }}
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
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{
                opacity: isInView ? 1 : 0,
                y: isInView ? 0 : 20,
                scale: isInView ? 1 : 0.95,
              }}
              transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.02, y: -4 }}
            >
              <Card className="gsap-principle-card bg-white dark:bg-[#2a2a2a] rounded-3xl p-8 border border-[#1C4D3A]/10 dark:border-[#D4C4A8]/10 shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1C4D3A] to-[#5C8B89] flex items-center justify-center mb-6">
                  <principle.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-['Crimson_Pro'] text-[#1C4D3A] dark:text-[#D4C4A8] mb-3">
                  {principle.title}
                </h3>
                <p className="text-[#2D3330]/70 dark:text-[#D4C4A8]/70">{principle.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Module Teasers Section with Timeline
function ModuleTeasersSection({ shouldReduceMotion }: { shouldReduceMotion: boolean | null }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.2 });

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
      id="roadmap"
      ref={ref}
      className="modules-section px-4 md:px-12 py-16 md:py-20 relative z-10 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 30 }}
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
        <div className="relative -mx-4 md:-mx-12">
          {/* Left gradient fade */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#F7F6F1] dark:from-[#1a1a1a] to-transparent z-20 pointer-events-none" />

          {/* Right gradient fade */}
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#F7F6F1] dark:from-[#1a1a1a] to-transparent z-20 pointer-events-none" />

          <div className="relative overflow-x-auto scrollbar-hide pb-8 px-4 md:px-12">
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
                  animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
                  transition={{ duration: 0.6, delay: idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="relative flex flex-col items-center w-64"
                >
                  {/* Timeline Dot */}
                  <div
                    className="timeline-dot w-10 h-10 rounded-full border-4 border-[#F7F6F1] dark:border-[#1a1a1a] z-10 mb-4"
                    style={{ backgroundColor: module.color }}
                  />

                  {/* Module Card */}
                  <Card className="bg-white dark:bg-[#2a2a2a] rounded-2xl p-6 border border-[#1C4D3A]/10 dark:border-[#D4C4A8]/10 hover:border-[#1C4D3A]/30 dark:hover:border-[#D4C4A8]/30 transition-all shadow-lg hover:shadow-xl w-full">
                    <div className="flex items-center justify-between mb-3">
                      {module.status === 'coming-soon' ? (
                        <Badge
                          variant="secondary"
                          className="px-3 py-1 rounded-full bg-[#C76B4A]/10 dark:bg-[#D4784F]/10 text-xs text-[#C76B4A] dark:text-[#D4784F]"
                        >
                          Coming Soon
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="px-3 py-1 rounded-full bg-[#7A9278]/10 dark:bg-[#6FAAA0]/10 text-xs text-[#7A9278] dark:text-[#6FAAA0]"
                        >
                          Live
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-xl font-['Crimson_Pro'] text-[#1C4D3A] dark:text-[#D4C4A8] mb-2">
                      {module.title}
                    </h3>
                    <p className="text-sm text-[#2D3330]/70 dark:text-[#D4C4A8]/70">
                      {module.desc}
                    </p>
                  </Card>
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

// Personas Section
function PersonasSection({
  persona,
  setPersona,
  scrollToSignup,
  shouldReduceMotion,
}: {
  persona: Persona;
  setPersona: (p: Persona) => void;
  scrollToSignup: () => void;
  shouldReduceMotion: boolean | null;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });

  const personas = {
    individual: {
      title: 'For Individuals',
      outcomes: [
        'Find mission-aligned opportunities without the mental health toll',
        'Build a verified, portable profile that tells your real story',
        'Access well-being tools and career planning support',
      ],
      cta: 'Join as an Individual',
    },
    organization: {
      title: 'For Organizations',
      outcomes: [
        'Discover talent based on evidence and alignment, not resumes',
        'Reduce bias in hiring and partnership decisions',
        'Build trust with transparent verification and matching',
      ],
      cta: 'Partner with Us',
    },
  };

  const current = personas[persona];

  return (
    <section id="for-whom" ref={ref} className="px-4 md:px-12 py-16 md:py-20 relative z-10">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 30 }}
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
              onClick={() => setPersona('individual')}
              className={`px-8 py-3 rounded-full transition-all ${
                persona === 'individual'
                  ? 'bg-[#1C4D3A] text-white'
                  : 'text-[#2D3330] dark:text-[#D4C4A8]'
              }`}
            >
              Individuals
            </button>
            <button
              onClick={() => setPersona('organization')}
              className={`px-8 py-3 rounded-full transition-all ${
                persona === 'organization'
                  ? 'bg-[#1C4D3A] text-white'
                  : 'text-[#2D3330] dark:text-[#D4C4A8]'
              }`}
            >
              Organizations
            </button>
          </div>
        </motion.div>

        <motion.div
          key={persona}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card className="p-12 bg-white dark:bg-[#2a2a2a] rounded-3xl border border-[#1C4D3A]/10 dark:border-[#D4C4A8]/10">
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
              onClick={scrollToSignup}
              className="w-full rounded-full bg-[#1C4D3A] hover:bg-[#2D5D4A] text-white py-6"
            >
              {current.cta}
            </Button>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

// Why Now Section
function WhyNowSection({ shouldReduceMotion }: { shouldReduceMotion: boolean | null }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });

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
      className="px-4 md:px-12 py-16 md:py-20 relative z-10 bg-gradient-to-b from-transparent to-[#C76B4A]/5 dark:to-[#C76B4A]/10"
    >
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 30 }}
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
              animate={{ opacity: isInView ? 1 : 0, x: isInView ? 0 : -20 }}
              transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card className="reason-card flex items-center gap-6 p-6 bg-white/80 dark:bg-[#2a2a2a]/80 backdrop-blur-sm rounded-2xl border border-[#1C4D3A]/10 dark:border-[#D4C4A8]/10 hover:border-[#1C4D3A]/30 dark:hover:border-[#D4C4A8]/30 transition-all">
                <div className="reason-number w-12 h-12 rounded-full bg-gradient-to-br from-[#C76B4A] to-[#D4A574] flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {idx + 1}
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-['Crimson_Pro'] text-[#1C4D3A] dark:text-[#D4C4A8] mb-1">
                    {reason.label}
                  </h3>
                  <p className="text-sm text-[#2D3330]/80 dark:text-[#D4C4A8]/80">{reason.desc}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Proof & Credibility Section
function ProofSection({ shouldReduceMotion }: { shouldReduceMotion: boolean | null }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });

  return (
    <section ref={ref} className="px-4 md:px-12 py-16 md:py-20 relative z-10">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 30 }}
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
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card className="p-8 md:p-12 bg-white dark:bg-[#2a2a2a] rounded-3xl border border-[#1C4D3A]/10 dark:border-[#D4C4A8]/10 space-y-8">
            <div>
              <h3 className="text-xl font-['Crimson_Pro'] text-[#1C4D3A] dark:text-[#D4C4A8] mb-4">
                How verification works
              </h3>
              <p className="text-[#2D3330]/70 dark:text-[#D4C4A8]/70 mb-4">
                Every proof is traceable to its source. We use cryptographic signatures,
                time-stamped evidence, and transparent provenance chains to ensure authenticity.
              </p>
              <button className="text-[#1C4D3A] dark:text-[#6FAAA0] underline hover:no-underline">
                See how this is verified →
              </button>
            </div>

            <div className="border-t border-[#1C4D3A]/10 dark:border-[#D4C4A8]/10 pt-8">
              <h3 className="text-xl font-['Crimson_Pro'] text-[#1C4D3A] dark:text-[#D4C4A8] mb-4">
                Privacy stance
              </h3>
              <p className="text-[#2D3330]/70 dark:text-[#D4C4A8]/70 mb-4">
                Granular privacy controls at every layer. You decide what&apos;s visible, to whom,
                and when. We never sell your data or use it for purposes you haven&apos;t explicitly
                consented to.
              </p>
              <button className="text-[#1C4D3A] dark:text-[#6FAAA0] underline hover:no-underline">
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
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

// Steward Ownership Section
function StewardOwnershipSection({ shouldReduceMotion }: { shouldReduceMotion: boolean | null }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });

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
      className="px-4 md:px-12 py-16 md:py-20 relative z-10 bg-gradient-to-b from-transparent to-[#7A9278]/5 dark:to-[#7A9278]/10"
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 30 }}
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
              animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
              transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card className="bg-white dark:bg-[#2a2a2a] rounded-3xl p-8 border border-[#1C4D3A]/10 dark:border-[#D4C4A8]/10 hover:border-[#1C4D3A]/30 dark:hover:border-[#D4C4A8]/30 transition-all shadow-lg hover:shadow-xl">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7A9278] to-[#5C8B89] flex items-center justify-center mb-6">
                  <principle.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-['Crimson_Pro'] text-[#1C4D3A] dark:text-[#D4C4A8] mb-3">
                  {principle.title}
                </h3>
                <p className="text-[#2D3330]/70 dark:text-[#D4C4A8]/70">{principle.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Products & Subscriptions Section
function ProductsSubscriptionsSection({
  pricingType,
  setPricingType,
  productBillingCycles,
  toggleBillingCycle,
  shouldReduceMotion,
}: {
  pricingType: PricingType;
  setPricingType: (p: PricingType) => void;
  productBillingCycles: { [key: number]: 'monthly' | 'annual' };
  toggleBillingCycle: (index: number) => void;
  shouldReduceMotion: boolean | null;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });

  type IndividualProduct = {
    icon: typeof Sparkles | typeof Bot | typeof Heart | typeof Crown;
    title: string;
    desc: string;
    priceMonthly: number;
    priceAnnual: number;
    freeTrial: string;
    highlight?: boolean;
    savings?: string;
  };

  type OrganizationProduct = {
    icon: typeof Network | typeof Target | typeof Heart | typeof TrendingUp;
    title: string;
    desc: string;
  };

  const individualProducts: IndividualProduct[] = [
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

  const organizationProducts: OrganizationProduct[] = [
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

  const products = pricingType === 'individual' ? individualProducts : organizationProducts;

  return (
    <section ref={ref} className="px-4 md:px-12 py-16 md:py-20 relative z-10">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 30 }}
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
              onClick={() => setPricingType('individual')}
              className={`px-6 py-2 rounded-full transition-all ${
                pricingType === 'individual'
                  ? 'bg-[#1C4D3A] text-white'
                  : 'text-[#2D3330] dark:text-[#D4C4A8] hover:bg-[#1C4D3A]/5'
              }`}
            >
              Individuals
            </button>
            <button
              onClick={() => setPricingType('organization')}
              className={`px-6 py-2 rounded-full transition-all ${
                pricingType === 'organization'
                  ? 'bg-[#1C4D3A] text-white'
                  : 'text-[#2D3330] dark:text-[#D4C4A8] hover:bg-[#1C4D3A]/5'
              }`}
            >
              Organizations
            </button>
          </div>
        </motion.div>

        {pricingType === 'individual' ? (
          <motion.div
            key="individual"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {individualProducts.map((product, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
                transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4 }}
              >
                <Card
                  className={`bg-white dark:bg-[#2a2a2a] rounded-3xl p-8 border transition-all shadow-lg hover:shadow-xl flex flex-col relative ${
                    product.highlight
                      ? 'border-[#C76B4A] dark:border-[#C76B4A] ring-2 ring-[#C76B4A]/20'
                      : 'border-[#1C4D3A]/10 dark:border-[#D4C4A8]/10 hover:border-[#1C4D3A]/30 dark:hover:border-[#D4C4A8]/30'
                  }`}
                >
                  {product.highlight && (
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
                  <p className="text-[#2D3330]/70 dark:text-[#D4C4A8]/70 mb-6 flex-1">
                    {product.desc}
                  </p>

                  <div className="mt-auto">
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

                    <div className="h-8 mb-3">
                      {product.savings && productBillingCycles[idx] === 'monthly' && (
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
                      <span className="text-sm text-[#2D3330]/70 dark:text-[#D4C4A8]/70">
                        /month
                      </span>
                    </div>

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
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="organization"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="grid md:grid-cols-2 gap-6"
          >
            {organizationProducts.map((product, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
                transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4 }}
              >
                <Card className="bg-white dark:bg-[#2a2a2a] rounded-3xl p-8 border border-[#1C4D3A]/10 dark:border-[#D4C4A8]/10 hover:border-[#1C4D3A]/30 dark:hover:border-[#D4C4A8]/30 transition-all shadow-lg hover:shadow-xl flex flex-col">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1C4D3A] to-[#5C8B89] flex items-center justify-center mb-6">
                    <product.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-['Crimson_Pro'] text-[#1C4D3A] dark:text-[#D4C4A8] mb-3">
                    {product.title}
                  </h3>
                  <p className="text-[#2D3330]/70 dark:text-[#D4C4A8]/70 mb-6 flex-1">
                    {product.desc}
                  </p>

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
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}

// Final CTA Section
function FinalCTASection({
  email,
  setEmail,
  selectedRole,
  setSelectedRole,
  handleSignup,
  shouldReduceMotion,
}: {
  email: string;
  setEmail: (e: string) => void;
  selectedRole: Persona | '';
  setSelectedRole: (r: Persona | '') => void;
  handleSignup: (e: React.FormEvent) => void;
  shouldReduceMotion: boolean | null;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.4 });

  return (
    <section
      id="signup"
      ref={ref}
      className="px-4 md:px-12 py-16 md:py-20 relative z-10 overflow-hidden"
    >
      <div className="gsap-final-cta relative z-10 max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 40 }}
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
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          onSubmit={handleSignup}
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
                onClick={() => setSelectedRole('individual')}
                className={`flex-1 px-6 py-3 rounded-full border transition-all ${
                  selectedRole === 'individual'
                    ? 'border-[#1C4D3A] bg-[#1C4D3A]/5 dark:bg-[#6FAAA0]/10 text-[#1C4D3A] dark:text-[#6FAAA0]'
                    : 'border-[#1C4D3A]/20 dark:border-[#D4C4A8]/20 text-[#2D3330]/70 dark:text-[#D4C4A8]/70'
                }`}
              >
                Individual
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('organization')}
                className={`flex-1 px-6 py-3 rounded-full border transition-all ${
                  selectedRole === 'organization'
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
          animate={{ opacity: isInView ? 1 : 0 }}
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

// Final Quote Animation Section
function FinalQuoteSection({ shouldReduceMotion }: { shouldReduceMotion: boolean | null }) {
  return (
    <section className="final-quote-section min-h-[70vh] flex items-center justify-center px-4 md:px-12 py-24 relative z-10 overflow-hidden">
      <div className="max-w-5xl mx-auto text-center">
        <div className="relative">
          {/* Initial Quote */}
          <div className="text-4xl md:text-6xl lg:text-7xl font-['Crimson_Pro'] text-[#1C4D3A] dark:text-[#D4C4A8] leading-tight space-y-4">
            <div className="quote-line-1">When work becomes</div>
            <div className="quote-line-2 flex items-center justify-center gap-4 flex-wrap">
              <span className="word-proof font-bold">proof</span>
              <span className="word-middle">of who we</span>
            </div>
            <div className="quote-line-3 flex items-center justify-center gap-4 flex-wrap">
              <span className="word-middle2">are — a deeper purpose is</span>
              <span className="word-found font-bold">found</span>
            </div>
          </div>

          {/* Merged "Proofound" appears as others fade */}
          <div className="quote-merged absolute inset-0 flex items-center justify-center text-5xl md:text-7xl lg:text-9xl font-['Crimson_Pro'] text-[#1C4D3A] dark:text-[#D4C4A8] font-bold opacity-0 scale-90">
            Proofound
          </div>
        </div>
      </div>
    </section>
  );
}

// Footer Section
function FooterSection({ shouldReduceMotion }: { shouldReduceMotion: boolean | null }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });

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
      animate={{ opacity: isInView ? 1 : 0 }}
      transition={{ duration: 1 }}
      className="site-footer border-t border-[#1C4D3A]/10 dark:border-[#D4C4A8]/10 bg-white/50 dark:bg-[#2a2a2a]/50 backdrop-blur-xl relative z-10"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-12 pt-20 pb-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle2
                className="w-8 h-8 text-[#1C4D3A] dark:text-[#D4C4A8]"
                strokeWidth={2}
              />
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
            animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
            transition={{ delay: 0.2 }}
          >
            <h4 className="mb-6 font-['Crimson_Pro'] text-[#1C4D3A] dark:text-[#D4C4A8]">
              Platform
            </h4>
            <ul className="space-y-3">
              {footerLinks.platform.map((link, idx) => (
                <li key={idx}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#2D3330]/70 dark:text-[#D4C4A8]/70 hover:text-[#1C4D3A] dark:hover:text-[#6FAAA0] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Resources Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
            transition={{ delay: 0.3 }}
          >
            <h4 className="mb-6 font-['Crimson_Pro'] text-[#1C4D3A] dark:text-[#D4C4A8]">
              Resources
            </h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link, idx) => (
                <li key={idx}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#2D3330]/70 dark:text-[#D4C4A8]/70 hover:text-[#1C4D3A] dark:hover:text-[#6FAAA0] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Legal Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
            transition={{ delay: 0.4 }}
          >
            <h4 className="mb-6 font-['Crimson_Pro'] text-[#1C4D3A] dark:text-[#D4C4A8]">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link, idx) => (
                <li key={idx}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#2D3330]/70 dark:text-[#D4C4A8]/70 hover:text-[#1C4D3A] dark:hover:text-[#6FAAA0] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#1C4D3A]/10 dark:border-[#D4C4A8]/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: isInView ? 1 : 0 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-[#2D3330]/50 dark:text-[#D4C4A8]/50"
          >
            © {new Date().getFullYear()} Proofound. All rights reserved.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isInView ? 1 : 0 }}
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
