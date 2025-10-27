'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  CheckCircle,
  ArrowRight,
  Heart,
  Clock,
  Eye,
  TrendingUp,
  FileText,
  DollarSign,
  RefreshCw,
  Layers,
  X,
  Smile,
  Award,
  Target,
  Lock,
  Sparkles,
  Star,
  Globe,
  Zap,
  Shield,
  Users,
  Minus,
  TrendingUp as TrendingUpIcon,
  Circle,
  Book,
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

  // Initialize GSAP animations
  useGSAPAnimations();

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('email');
    console.log('Signup:', { email, role: selectedRole });
    alert("Thank you for joining the waitlist! We'll be in touch soon.");
  };

  const scrollToSignup = () => {
    document.getElementById('signup')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-proofound-parchment relative overflow-x-hidden">
      <NetworkBackground />
      <ProgressBar />
      <Header />
      <StickyCTA />

      {/* Hero Section */}
      <section className="gsap-hero-section min-h-[85vh] flex items-center justify-center text-center px-4 md:px-12 pt-24 relative z-10">
        <div className="gsap-hero-content max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-['Crimson_Pro'] font-semibold text-proofound-forest mb-6">
            Proofound
          </h1>
          <h2 className="text-3xl md:text-5xl font-['Crimson_Pro'] text-proofound-forest mb-6">
            A credibility engineering platform for impactful connections
          </h2>
          <p className="text-lg md:text-xl text-proofound-charcoal/70 mb-8 max-w-3xl mx-auto">
            Unprecedented possibilities for work, business, and individual transformation. Backed by
            evidence, not vanity metrics.
          </p>
          <Button
            size="lg"
            onClick={scrollToSignup}
            className="text-lg px-8 py-6 bg-proofound-forest hover:bg-proofound-forest/90 text-white rounded-full"
          >
            Become a contributor
          </Button>
        </div>
      </section>

      {/* The Problem Section */}
      <section id="the-problem" className="gsap-problem-section px-4 md:px-12 py-16 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-['Crimson_Pro'] text-proofound-forest mb-4">
              The problems we solve
            </h2>
            <p className="text-lg text-proofound-charcoal/70">
              Today&apos;s connection and verification systems are broken.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Heart,
                text: 'Mental health toll of endless job searches and networking',
              },
              {
                icon: Clock,
                text: 'Wasted time on connection rituals and manual verification',
              },
              {
                icon: Eye,
                text: 'Bias, misalignment, and opacity in matching systems',
              },
              {
                icon: TrendingUp,
                text: 'Vanity metrics that obscure real impact',
              },
              {
                icon: FileText,
                text: "Outdated CVs and portfolios that don't tell the full story",
              },
              {
                icon: DollarSign,
                text: 'Profit-only capital disconnected from mission alignment',
              },
              {
                icon: X,
                text: 'AI anxiety and lack of transparency in algorithmic decisions',
              },
              {
                icon: Layers,
                text: 'No universal problem-solving framework for collaboration',
              },
              {
                icon: RefreshCw,
                text: 'Massive waste of time, talent, and resources',
              },
            ].map((problem, index) => (
              <Card
                key={index}
                className="gsap-problem-card p-6 bg-white/60 dark:bg-card/60 backdrop-blur-sm border border-proofound-stone dark:border-proofound-stone/20 hover:border-proofound-forest/30 hover:shadow-lg transition-all rounded-2xl"
              >
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-proofound-terracotta/10 flex items-center justify-center flex-shrink-0">
                    <problem.icon className="w-5 h-5 text-proofound-terracotta" />
                  </div>
                  <p className="text-proofound-charcoal dark:text-foreground">{problem.text}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="px-4 md:px-12 py-16 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-['Crimson_Pro'] text-proofound-forest mb-4">
              How Proofound works
            </h2>
            <p className="text-lg text-proofound-charcoal/70">
              A platform built on evidence, transparency, and dignity.
            </p>
          </div>
          <div className="overflow-x-auto pb-4 -mx-4 md:-mx-12">
            <div className="flex gap-8 px-4 md:px-12 min-w-max">
              {[
                {
                  icon: Smile,
                  title: 'AI-powered matching',
                  description:
                    'Evidence-based algorithms that connect you to aligned opportunities, not vanity metrics',
                },
                {
                  icon: Award,
                  title: 'Proof-based profiles',
                  description:
                    'Verified skills, impact stories, and credentials—all traceable and transparent',
                },
                {
                  icon: Target,
                  title: 'Transferable verification',
                  description:
                    'Once verified, your proofs travel with you across contexts and time',
                },
                {
                  icon: Lock,
                  title: 'Granular privacy controls',
                  description:
                    "You decide what's visible, to whom, and when - data dignity at every layer",
                },
                {
                  icon: Eye,
                  title: 'Decluttered UX',
                  description:
                    'Clean, Japandi-inspired design that respects your attention and mental space',
                },
                {
                  icon: Heart,
                  title: 'Mental health tools',
                  description:
                    'Built-in well-being support, not an afterthought - ikigai, safety planning, reflection',
                },
                {
                  icon: Circle,
                  title: 'Life & career planning',
                  description: 'Map your journey with purpose, not just the next job title',
                },
                {
                  icon: TrendingUpIcon,
                  title: 'Data democratization',
                  description:
                    'Your data, your insights—we give you the tools to understand and control it',
                },
                {
                  icon: Users,
                  title: 'Talent mobility',
                  description:
                    'Skills and evidence are portable, opening doors across sectors and geographies',
                },
                {
                  icon: Book,
                  title: 'Education & guidance',
                  description: 'Contextual learning pathways tailored to your goals and gaps',
                },
              ].map((feature, index) => (
                <Card
                  key={index}
                  className="min-w-[320px] flex-shrink-0 p-8 bg-white/60 backdrop-blur-sm border border-proofound-stone/10 hover:border-proofound-stone/30 hover:shadow-lg transition-all"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-proofound-forest to-brand-teal flex items-center justify-center mb-6">
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-['Crimson_Pro'] text-proofound-forest mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-proofound-charcoal/80">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
          <p className="text-center text-sm text-proofound-charcoal/50 mt-6">
            Scroll horizontally to explore all features →
          </p>
        </div>
      </section>

      {/* Principles Section */}
      <section
        id="principles"
        className="gsap-trustworthy-section px-4 md:px-12 py-16 relative z-10"
        style={{ background: 'linear-gradient(to bottom, transparent, rgba(122, 146, 120, 0.05))' }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-['Crimson_Pro'] text-proofound-forest mb-4">
              What makes it trustworthy
            </h2>
            <p className="text-lg text-proofound-charcoal/70">
              Principles that guide every decision we make.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Globe,
                title: "Eleanor Ostrom's commons principles",
                description: 'Governance designed for collective stewardship, not extraction',
              },
              {
                icon: Zap,
                title: 'Distributed systems mindset',
                description: 'Resilient, federated architecture that respects sovereignty',
              },
              {
                icon: Shield,
                title: 'Anti-bias guardrails',
                description: 'Auditable algorithms with continuous monitoring and transparency',
              },
              {
                icon: Heart,
                title: 'Steward-ownership ethos',
                description: 'We never monetize inequality—mission comes first',
              },
              {
                icon: Minus,
                title: 'Remove the excess',
                description: 'Minimalism in design, maximalism in meaning',
              },
              {
                icon: TrendingUp,
                title: 'Information quality drives decisions',
                description: 'Every choice backed by evidence, not assumptions',
              },
            ].map((principle, index) => (
              <Card
                key={index}
                className="gsap-principle-card p-8 bg-white/60 backdrop-blur-sm border border-proofound-stone/10 hover:border-proofound-stone/30 hover:shadow-lg transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-proofound-forest to-brand-teal flex items-center justify-center mb-6">
                  <principle.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl md:text-2xl font-['Crimson_Pro'] text-proofound-forest mb-3">
                  {principle.title}
                </h3>
                <p className="text-proofound-charcoal/80">{principle.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section id="roadmap" className="modules-section px-4 md:px-12 py-16 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-['Crimson_Pro'] text-proofound-forest mb-4">
              Show, don&apos;t tell
            </h2>
            <p className="text-lg text-proofound-charcoal/70">
              Explore the modules that power Proofound.
            </p>
          </div>
          <div className="overflow-x-auto pb-4 -mx-4 md:-mx-12 relative">
            {/* Timeline line */}
            <div className="absolute top-10 left-0 right-0 h-0.5 bg-gradient-to-r from-proofound-forest via-brand-teal to-brand-terracotta mx-12 hidden md:block" />
            <div className="flex gap-8 px-4 md:px-12 min-w-max">
              {[
                {
                  color: 'bg-proofound-forest',
                  badge: 'Live',
                  badgeColor: 'bg-proofound-forest/10 text-proofound-forest',
                  title: 'Verification v1.0',
                  description: 'Badges and proofs with transparent provenance',
                },
                {
                  color: 'bg-brand-teal',
                  badge: 'Live',
                  badgeColor: 'bg-proofound-forest/10 text-proofound-forest',
                  title: 'Clusters',
                  description: 'Network signals that reveal alignment without exposing identities',
                },
                {
                  color: 'bg-proofound-terracotta',
                  badge: 'Live',
                  badgeColor: 'bg-proofound-forest/10 text-proofound-forest',
                  title: 'Expertise Atlas',
                  description: 'Skills mapped to evidence and artifacts',
                },
                {
                  color: 'bg-brand-ochre',
                  badge: 'Live',
                  badgeColor: 'bg-proofound-forest/10 text-proofound-forest',
                  title: 'Zen Hub',
                  description: 'Ikigai planning, well-being tools, and mental health support',
                },
                {
                  color: 'bg-proofound-terracotta',
                  badge: 'Coming Soon',
                  badgeColor: 'bg-proofound-terracotta/10 text-proofound-terracotta',
                  title: 'Dev Hub',
                  description: 'Personalized learning pathways and partner benefits',
                },
                {
                  color: 'bg-brand-teal',
                  badge: 'Coming Soon',
                  badgeColor: 'bg-proofound-terracotta/10 text-proofound-terracotta',
                  title: 'Matching',
                  description: 'Evidence-based connections powered by transparent algorithms',
                },
                {
                  color: 'bg-proofound-forest',
                  badge: 'Coming Soon',
                  badgeColor: 'bg-proofound-terracotta/10 text-proofound-terracotta',
                  title: 'Opportunities & Projects',
                  description: 'Mission-aligned work connections',
                },
                {
                  color: 'bg-brand-teal',
                  badge: 'Coming Soon',
                  badgeColor: 'bg-proofound-terracotta/10 text-proofound-terracotta',
                  title: 'AI Cofounder',
                  description:
                    "A trustworthy companion designed to make doing business and driving projects like it's magic",
                },
                {
                  color: 'bg-brand-ochre',
                  badge: 'Coming Soon',
                  badgeColor: 'bg-proofound-terracotta/10 text-proofound-terracotta',
                  title: 'Governance Node',
                  description: 'Finally feel connected in real time to those who govern',
                },
              ].map((item, index) => (
                <div key={index} className="min-w-[320px] flex-shrink-0 relative">
                  <div
                    className={`timeline-dot w-10 h-10 rounded-full ${item.color} mx-auto mb-4 border-4 border-bg-base`}
                  />
                  <Card className="p-6 bg-white/60 backdrop-blur-sm border border-proofound-stone/10 hover:border-proofound-stone/30 hover:shadow-lg transition-all">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-4 ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                    <h3 className="text-xl md:text-2xl font-['Crimson_Pro'] text-proofound-forest mb-3">
                      {item.title}
                    </h3>
                    <p className="text-sm text-proofound-charcoal/80">{item.description}</p>
                  </Card>
                </div>
              ))}
            </div>
          </div>
          <p className="text-center text-sm text-proofound-charcoal/50 mt-6">
            Scroll horizontally to see the roadmap →
          </p>
        </div>
      </section>

      {/* For Whom Section */}
      <section id="for-whom" className="px-4 md:px-12 py-16 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-['Crimson_Pro'] text-proofound-forest mb-4">
              Built for you
            </h2>
            <p className="text-lg text-proofound-charcoal/70 mb-8">
              Whether you&apos;re an individual or an organization, Proofound empowers you.
            </p>
            <div className="inline-flex bg-white rounded-full p-1 border border-proofound-stone/10">
              <button
                onClick={() => setPersona('individual')}
                className={`px-8 py-3 rounded-full text-base font-medium transition-all ${
                  persona === 'individual'
                    ? 'bg-proofound-forest text-white'
                    : 'text-proofound-charcoal hover:bg-proofound-forest/5'
                }`}
              >
                Individuals
              </button>
              <button
                onClick={() => setPersona('organization')}
                className={`px-8 py-3 rounded-full text-base font-medium transition-all ${
                  persona === 'organization'
                    ? 'bg-proofound-forest text-white'
                    : 'text-proofound-charcoal hover:bg-proofound-forest/5'
                }`}
              >
                Organizations
              </button>
            </div>
          </div>
          <Card className="p-12 bg-white/60 backdrop-blur-sm border border-proofound-stone/10">
            <h3 className="text-2xl md:text-3xl font-['Crimson_Pro'] text-proofound-forest mb-6">
              {persona === 'individual' ? 'For Individuals' : 'For Organizations'}
            </h3>
            <div className="space-y-4 mb-8">
              {persona === 'individual'
                ? [
                    'Find mission-aligned opportunities without the mental health toll',
                    'Build a verified, portable profile that tells your real story',
                    'Access well-being tools and career planning support',
                  ].map((benefit, index) => (
                    <div key={index} className="flex gap-3 items-center">
                      <CheckCircle className="w-5 h-5 text-proofound-forest flex-shrink-0" />
                      <p className="text-proofound-charcoal">{benefit}</p>
                    </div>
                  ))
                : [
                    'Discover talent based on evidence and alignment, not resumes',
                    'Reduce bias in hiring and partnership decisions',
                    'Build trust with transparent verification and matching',
                  ].map((benefit, index) => (
                    <div key={index} className="flex gap-3 items-center">
                      <CheckCircle className="w-5 h-5 text-proofound-forest flex-shrink-0" />
                      <p className="text-proofound-charcoal">{benefit}</p>
                    </div>
                  ))}
            </div>
            <Button onClick={scrollToSignup} className="w-full text-lg py-6">
              {persona === 'individual' ? 'Join as an Individual' : 'Partner with Us'}
            </Button>
          </Card>
        </div>
      </section>

      {/* Why Now Section */}
      <section
        className="px-4 md:px-12 py-16 relative z-10"
        style={{
          background: 'linear-gradient(to bottom, transparent, rgba(198, 123, 92, 0.05))',
        }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-['Crimson_Pro'] text-proofound-forest mb-4">
              Why now
            </h2>
            <p className="text-lg text-proofound-charcoal/70">
              The timing has never been more critical.
            </p>
          </div>
          <div className="space-y-6">
            {[
              {
                title: 'AI and Technology advancements are shifting global paradigms',
                description: 'New tools demand new trust models and possibilities',
              },
              {
                title: 'Simplicity of faking and growing trust challenges',
                description: 'Misinformation and deepfakes erode credibility everywhere',
              },
              {
                title:
                  'Global mental health challenges grow as people question their immediate future and seek new transformation tools',
                description: 'Unprecedented uncertainty drives need for well-being infrastructure',
              },
              {
                title:
                  'Obsoletion of outdated CV and recruitment standards that become less and less efficient',
                description:
                  "Traditional credentials don't capture real capability or values alignment",
              },
              {
                title: 'Rapid globalization calls for coordination on an unprecedented scale',
                description:
                  'Cross-border collaboration requires new verification and trust systems',
              },
            ].map((reason, index) => (
              <Card
                key={index}
                className="reason-card p-6 bg-white/60 backdrop-blur-sm border border-proofound-stone/10 hover:border-proofound-stone/30 hover:shadow-lg transition-all"
              >
                <div className="flex gap-6 items-center">
                  <div className="reason-number w-12 h-12 rounded-full bg-gradient-to-br from-brand-terracotta to-brand-ochre flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-['Crimson_Pro'] text-proofound-forest mb-1">
                      {reason.title}
                    </h3>
                    <p className="text-sm text-proofound-charcoal/80">{reason.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Proof & Credibility Section */}
      <section className="px-4 md:px-12 py-16 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-['Crimson_Pro'] text-proofound-forest mb-4">
              Proof & credibility
            </h2>
            <p className="text-lg text-proofound-charcoal/70">
              How we ensure transparency and trust.
            </p>
          </div>
          <Card className="p-8 md:p-12 bg-white/60 backdrop-blur-sm border border-proofound-stone/10">
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-['Crimson_Pro'] text-proofound-forest mb-3">
                  How verification works
                </h3>
                <p className="text-proofound-charcoal/80 mb-3">
                  Every proof is traceable to its source. We use cryptographic signatures,
                  time-stamped evidence, and transparent provenance chains to ensure authenticity.
                </p>
                <a href="#" className="text-proofound-forest hover:underline">
                  See how this is verified →
                </a>
              </div>
              <div>
                <h3 className="text-2xl font-['Crimson_Pro'] text-proofound-forest mb-3">
                  Privacy stance
                </h3>
                <p className="text-proofound-charcoal/80 mb-3">
                  Granular privacy controls at every layer. You decide what&apos;s visible, to whom,
                  and when. We never sell your data or use it for purposes you haven&apos;t
                  explicitly consented to.
                </p>
                <a href="#" className="text-proofound-forest hover:underline">
                  What we keep private →
                </a>
              </div>
              <div>
                <h3 className="text-2xl font-['Crimson_Pro'] text-proofound-forest mb-3">
                  Audits in plain language
                </h3>
                <p className="text-proofound-charcoal/80">
                  Our anti-bias algorithms are continuously monitored and audited. We publish
                  transparency reports that anyone can understand—no technical jargon required.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Steward Ownership Section */}
      <section id="steward-ownership" className="px-4 md:px-12 py-16 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-['Crimson_Pro'] text-proofound-forest mb-4">
              Steward Ownership — Business Model of the Future
            </h2>
            <p className="text-lg text-proofound-charcoal/70">
              Steward ownership ensures that a company&apos;s purpose and independence are protected
              by giving control to stewards, not external shareholders.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Circle,
                title: 'Purpose Before Profit',
                description: "Mission is locked in; profits serve the company's long-term purpose.",
              },
              {
                icon: Users,
                title: 'Self-Governance',
                description:
                  'Control stays with active stewards who are committed to the mission, not to selling shares.',
              },
              {
                icon: Heart,
                title: 'Legacy Preservation',
                description:
                  "Ownership can't be sold; it's passed on to future stewards who uphold the same values.",
              },
            ].map((principle, index) => (
              <Card
                key={index}
                className="p-8 bg-white/60 backdrop-blur-sm border border-proofound-stone/10 hover:border-proofound-stone/30 hover:shadow-lg transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-proofound-forest to-brand-teal flex items-center justify-center mb-6">
                  <principle.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-['Crimson_Pro'] text-proofound-forest mb-3">
                  {principle.title}
                </h3>
                <p className="text-sm text-proofound-charcoal/80">{principle.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Products & Subscriptions Section */}
      <section className="px-4 md:px-12 py-16 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-['Crimson_Pro'] text-proofound-forest mb-4">
              Products & Subscriptions
            </h2>
            <p className="text-lg text-proofound-charcoal/70 mb-8 max-w-4xl mx-auto">
              Proofound pledges a lifelong commitment never to monetize by creating disparity or
              selling exposure. The core tools that fulfill our mission will always remain free for
              humans. Our purpose is to enable people to do more — paid tools exist only to create
              pure positive value at no one else&apos;s expense. We are fully transparent about
              profit distribution, a cornerstone of our Steward Ownership model.
            </p>
            <div className="inline-flex bg-white rounded-full p-1 border border-proofound-stone/10">
              <button
                onClick={() => setPricingType('individual')}
                className={`px-8 py-3 rounded-full text-base font-medium transition-all ${
                  pricingType === 'individual'
                    ? 'bg-proofound-forest text-white'
                    : 'text-proofound-charcoal hover:bg-proofound-forest/5'
                }`}
              >
                Individuals
              </button>
              <button
                onClick={() => setPricingType('organization')}
                className={`px-8 py-3 rounded-full text-base font-medium transition-all ${
                  pricingType === 'organization'
                    ? 'bg-proofound-forest text-white'
                    : 'text-proofound-charcoal hover:bg-proofound-forest/5'
                }`}
              >
                Organizations
              </button>
            </div>
          </div>
          <div
            className={`grid gap-6 ${pricingType === 'individual' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2'}`}
          >
            {pricingType === 'individual' ? (
              <>
                {[
                  {
                    icon: Smile,
                    title: 'Development Hub Subscription',
                    description: 'Access resources, templates, and guided learning paths.',
                    price: '€19',
                    period: '/month',
                    trial: '14 days free trial',
                  },
                  {
                    icon: Sparkles,
                    title: 'AI Co-Founder Tool',
                    description: 'Subscription + tokenized usage model for scalable assistance.',
                    price: '€39',
                    period: '/month',
                    trial: '7 days free trial',
                  },
                  {
                    icon: Heart,
                    title: 'Zen Hub Premium',
                    description: 'Extended well-being and productivity ecosystem.',
                    price: '€12',
                    period: '/month',
                    trial: '30 days free trial',
                  },
                  {
                    icon: Star,
                    title: 'Full Bundle Package',
                    description:
                      'All premium features: Development Hub, AI Co-Founder, and Zen Hub.',
                    price: '€59',
                    period: '/month',
                    trial: '30 days free trial',
                    highlight: true,
                    savings: 'Save €11/month',
                  },
                ].map((product, index) => (
                  <Card
                    key={index}
                    className={`p-8 bg-white/60 backdrop-blur-sm border transition-all relative ${
                      product.highlight
                        ? 'border-proofound-terracotta shadow-lg shadow-brand-terracotta/20'
                        : 'border-proofound-stone/10 hover:border-proofound-stone/30 hover:shadow-lg'
                    }`}
                  >
                    {product.highlight && (
                      <span className="absolute -top-3 -right-3 bg-proofound-terracotta text-white text-xs px-3 py-1 rounded-full shadow-lg">
                        Best Value
                      </span>
                    )}
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-proofound-forest to-brand-teal flex items-center justify-center mb-6">
                      <product.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-['Crimson_Pro'] text-proofound-forest mb-3">
                      {product.title}
                    </h3>
                    <p className="text-sm text-proofound-charcoal/80 mb-6">{product.description}</p>
                    <div className="text-3xl font-['Crimson_Pro'] text-proofound-forest mb-2">
                      {product.price}
                      <span className="text-sm text-proofound-charcoal/70">{product.period}</span>
                    </div>
                    {product.savings && (
                      <p className="text-sm text-proofound-terracotta font-medium mb-2">
                        {product.savings}
                      </p>
                    )}
                    <p className="text-sm text-proofound-charcoal/70 mb-6">{product.trial}</p>
                    <Button className="w-full">Start Free Trial</Button>
                  </Card>
                ))}
              </>
            ) : (
              <>
                {[
                  {
                    icon: Users,
                    title: 'Platform Subscription',
                    description: 'Access to organizational dashboards and verification tools.',
                  },
                  {
                    icon: Target,
                    title: 'Assignment Completion Fees',
                    description: 'Pay-per-mission or project delivery model.',
                  },
                  {
                    icon: Heart,
                    title: 'Zen Hub Enterprise',
                    description: 'Tailored well-being and collaboration environment.',
                  },
                  {
                    icon: TrendingUp,
                    title: 'Employee Development Hubs',
                    description: 'Empower internal growth with curated learning ecosystems.',
                  },
                ].map((product, index) => (
                  <Card
                    key={index}
                    className="p-8 bg-white/60 backdrop-blur-sm border border-proofound-stone/10 hover:border-proofound-stone/30 hover:shadow-lg transition-all"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-proofound-forest to-brand-teal flex items-center justify-center mb-6">
                      <product.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-['Crimson_Pro'] text-proofound-forest mb-3">
                      {product.title}
                    </h3>
                    <p className="text-sm text-proofound-charcoal/80 mb-6">{product.description}</p>
                    <div className="pt-6 border-t border-proofound-stone/10">
                      <p className="text-sm text-proofound-charcoal/70 text-center mb-4">
                        Custom pricing based on your needs
                      </p>
                      <Button variant="outline" className="w-full">
                        Contact for inquiries
                      </Button>
                    </div>
                  </Card>
                ))}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section id="signup" className="gsap-final-cta px-4 md:px-12 py-16 relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-6xl font-['Crimson_Pro'] text-proofound-forest mb-6">
              Join the founding cohort
            </h2>
            <p className="text-lg md:text-xl text-proofound-charcoal/70">
              Be part of building a credibility infrastructure that respects your dignity, protects
              your privacy, and amplifies your impact.
            </p>
          </div>
          <Card className="p-12 bg-white/60 backdrop-blur-sm border border-proofound-stone/10">
            <form onSubmit={handleSignup} className="space-y-6">
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                required
                className="w-full px-6 py-4 rounded-full border border-proofound-stone/20 bg-bg-base focus:outline-none focus:ring-2 focus:ring-brand-sage/40 focus:border-transparent text-base"
              />
              <div className="flex gap-4 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedRole('individual')}
                  className={`flex-1 min-w-[140px] px-6 py-4 rounded-full border text-base font-medium transition-all ${
                    selectedRole === 'individual'
                      ? 'bg-proofound-forest text-white border-proofound-stone'
                      : 'bg-transparent text-proofound-forest border-proofound-stone hover:bg-proofound-forest/5'
                  }`}
                >
                  Individual
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('organization')}
                  className={`flex-1 min-w-[140px] px-6 py-4 rounded-full border text-base font-medium transition-all ${
                    selectedRole === 'organization'
                      ? 'bg-proofound-forest text-white border-proofound-stone'
                      : 'bg-transparent text-proofound-forest border-proofound-stone hover:bg-proofound-forest/5'
                  }`}
                >
                  Organization
                </button>
              </div>
              <Button type="submit" size="lg" className="w-full text-lg py-6">
                Get Early Access
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <p className="text-center text-sm text-proofound-charcoal/50 mt-6">
                We respect your privacy. No spam, no data sold.{' '}
                <a href="#" className="underline">
                  Read our privacy stance
                </a>
                .
              </p>
            </form>
            <p className="text-center text-sm text-proofound-charcoal/70 mt-6">
              Organizations:{' '}
              <a href="#partner" className="underline hover:text-proofound-forest">
                Partner with us
              </a>{' '}
              • Learn more:{' '}
              <a href="#principles" className="underline hover:text-proofound-forest">
                Read the principles
              </a>
            </p>
          </Card>
        </div>
      </section>

      {/* Final Quote Animation Section */}
      <section className="final-quote-section px-4 md:px-12 py-16 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative min-h-[300px] flex items-center justify-center">
            <div className="space-y-4 text-4xl md:text-6xl font-['Crimson_Pro'] text-proofound-forest">
              <div className="quote-line-1">When work becomes</div>
              <div className="quote-line-2 flex items-center justify-center gap-4">
                <span className="word-proof font-bold">proof</span>
                <span className="word-middle">of who we</span>
              </div>
              <div className="quote-line-3 flex items-center justify-center gap-4">
                <span className="word-middle2">are — a deeper purpose is</span>
                <span className="word-found font-bold">found</span>
              </div>
              <div className="quote-merged absolute inset-0 flex items-center justify-center text-5xl md:text-7xl font-bold opacity-0 scale-90">
                Proofound
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="site-footer border-t border-proofound-stone/10 bg-white/50 backdrop-blur-xl px-4 md:px-12 py-20 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <CheckCircle className="w-8 h-8 text-proofound-forest" strokeWidth={2} />
                <span className="text-xl font-['Crimson_Pro'] text-proofound-forest">
                  Proofound
                </span>
              </div>
              <p className="text-sm text-proofound-charcoal/70 mb-6 leading-relaxed">
                Building multidimensional connections with evidence-based transparency.
              </p>
              <div className="text-sm text-proofound-charcoal/70 space-y-2">
                <p className="flex gap-2">
                  <span>📍</span>
                  <span>Stockholm, Sweden</span>
                </p>
                <p className="flex gap-2">
                  <span>✉️</span>
                  <a
                    href="mailto:hello@proofound.com"
                    className="hover:text-proofound-forest transition-colors"
                  >
                    hello@proofound.com
                  </a>
                </p>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-['Crimson_Pro'] text-proofound-forest mb-6">Platform</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link
                    href="#about"
                    className="text-proofound-charcoal/70 hover:text-proofound-forest transition-colors"
                  >
                    About Proofound
                  </Link>
                </li>
                <li>
                  <Link
                    href="#how-it-works"
                    className="text-proofound-charcoal/70 hover:text-proofound-forest transition-colors"
                  >
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link
                    href="#principles"
                    className="text-proofound-charcoal/70 hover:text-proofound-forest transition-colors"
                  >
                    Principles
                  </Link>
                </li>
                <li>
                  <Link
                    href="#faq"
                    className="text-proofound-charcoal/70 hover:text-proofound-forest transition-colors"
                  >
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-['Crimson_Pro'] text-proofound-forest mb-6">Resources</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link
                    href="#docs"
                    className="text-proofound-charcoal/70 hover:text-proofound-forest transition-colors"
                  >
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link
                    href="#blog"
                    className="text-proofound-charcoal/70 hover:text-proofound-forest transition-colors"
                  >
                    Blog & Insights
                  </Link>
                </li>
                <li>
                  <Link
                    href="#community"
                    className="text-proofound-charcoal/70 hover:text-proofound-forest transition-colors"
                  >
                    Community
                  </Link>
                </li>
                <li>
                  <Link
                    href="#support"
                    className="text-proofound-charcoal/70 hover:text-proofound-forest transition-colors"
                  >
                    Support
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-['Crimson_Pro'] text-proofound-forest mb-6">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link
                    href="#terms"
                    className="text-proofound-charcoal/70 hover:text-proofound-forest transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href="#privacy"
                    className="text-proofound-charcoal/70 hover:text-proofound-forest transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="#gdpr"
                    className="text-proofound-charcoal/70 hover:text-proofound-forest transition-colors"
                  >
                    Data Protection
                  </Link>
                </li>
                <li>
                  <Link
                    href="#accessibility"
                    className="text-proofound-charcoal/70 hover:text-proofound-forest transition-colors"
                  >
                    Accessibility
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-proofound-stone/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-proofound-charcoal/50">
            <p>© {new Date().getFullYear()} Proofound. All rights reserved.</p>
            <div className="flex items-center gap-4 flex-wrap justify-center">
              <span>Anti-bias certified</span>
              <span>•</span>
              <span>GDPR compliant</span>
              <span>•</span>
              <span>Steward-owned</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
