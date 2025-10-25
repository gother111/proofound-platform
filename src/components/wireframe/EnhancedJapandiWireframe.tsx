'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useScroll, useTransform } from 'motion/react';
import { Button } from '@/components/ui/button';
import { NetworkBackground } from '@/components/landing/NetworkBackground';
import { ArrowRight, Download, Edit, Moon, Sparkles, Sun } from 'lucide-react';

interface EnhancedJapandiWireframeProps {
  onEdit?: () => void;
}

const PILLARS = [
  {
    title: 'Authentic identity',
    description: 'Proof-based profiles that foreground lived experience over vanity metrics.',
    accent: '#7A9278',
  },
  {
    title: 'Trust everywhere',
    description: 'Credibility primitives that travel across projects, orgs, and partnerships.',
    accent: '#C67B5C',
  },
  {
    title: 'Explainable growth',
    description: 'Transparent levels built on the Dreyfus model with calibrated evidence.',
    accent: '#5C8B89',
  },
];

const SOLUTION_POINTS = [
  'Six evergreen capability branches that keep teams aligned.',
  'Evidence-first tracking for self claims, peer signals, and verified artifacts.',
  'Bias-safe maturity scales mapped to SFIA, ESCO, and O*NET for interoperability.',
];

const AMBITION_ITEMS = [
  'Steward-owned network protocols for credibility data.',
  'Global registry of verified talent, missions, and civic missions.',
  'Shared governance playbooks for community-led ecosystems.',
  'Impact pledges with traceable, permissioned attestations.',
  'Artifactory of living proof for teams and organizations.',
  'Open APIs for researchers, policymakers, and trusted partners.',
];

const PAID_FEATURES = [
  {
    audience: 'Individuals',
    description: 'Transform your story into a dynamic portfolio with living proof.',
    bullets: [
      'Japandi landing page templates',
      'Credibility tiles for LinkedIn',
      'Atlas overview with favorite branches',
    ],
    cta: 'Create proof-first profile',
  },
  {
    audience: 'Organizations & Governments',
    description: 'Guide stewardship teams with proof-backed intelligence and controls.',
    bullets: [
      'Team capability heatmaps',
      'Risk & compliance guardrails',
      'Delegated permissions & audit trails',
    ],
    cta: 'Design your atlas workspace',
  },
];

export function EnhancedJapandiWireframe({ onEdit }: EnhancedJapandiWireframeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroTranslate = useTransform(scrollYProgress, [0, 0.2], [0, -80]);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    return () => document.documentElement.classList.remove('dark');
  }, [darkMode]);

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen overflow-x-hidden bg-[#F5F3EE] text-[#2C2A27] transition-colors duration-500 dark:bg-[#1F1A16] dark:text-[#E8E6DD]"
    >
      <NetworkBackground />
      <Toolbar
        onEdit={onEdit}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((prev) => !prev)}
      />
      <OrganicNav />
      <HeroSection opacity={heroOpacity} translateY={heroTranslate} />
      <PillarsSection />
      <WhyItMattersSection />
      <SolutionSection />
      <EvidenceLegend />
      <AmbitionSection />
      <PaidFeaturesSection />
      <InspirationSection />
      <FooterSection />
    </div>
  );
}

function Toolbar({
  onEdit,
  darkMode,
  onToggleDarkMode,
}: {
  onEdit?: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}) {
  return (
    <div className="fixed right-6 top-20 z-[110] flex gap-3">
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="outline"
          size="icon"
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={onToggleDarkMode}
          className="h-10 w-10 rounded-full border-border/60 bg-card/80 backdrop-blur-xl shadow-lg"
        >
          {darkMode ? (
            <Sun className="h-4 w-4 text-[#D49860]" />
          ) : (
            <Moon className="h-4 w-4 text-[#4A5943]" />
          )}
        </Button>
      </motion.div>

      {onEdit && (
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            onClick={onEdit}
            className="rounded-full border-border/60 bg-card/80 px-4 backdrop-blur-xl shadow-lg"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </motion.div>
      )}

      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button className="rounded-full bg-[#7A9278]/90 px-5 backdrop-blur-xl shadow-lg transition-colors duration-200 hover:bg-[#7A9278] dark:bg-[#5A8F6F]/90 dark:hover:bg-[#D4784F]">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </motion.div>
    </div>
  );
}

function OrganicNav() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 200);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: visible ? 0 : -100, opacity: visible ? 1 : 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 18 }}
      className="fixed left-1/2 top-8 z-40 w-full max-w-2xl -translate-x-1/2"
    >
      <div className="relative rounded-full border border-white/30 bg-white/70 px-10 py-4 shadow-lg backdrop-blur-xl dark:border-white/5 dark:bg-[#2B241F]/80">
        <div className="flex items-center justify-between gap-6 text-xs font-medium uppercase tracking-[0.3em] text-[#2C2A27]/60 dark:text-[#E8E6DD]/60">
          <span>Proofound</span>
          <div className="hidden items-center gap-4 md:flex">
            <span>About</span>
            <span>Features</span>
            <span>Pricing</span>
            <span>Resources</span>
          </div>
          <span>Credibility Platform</span>
        </div>
      </div>
    </motion.div>
  );
}

function HeroSection({
  opacity,
  translateY,
}: {
  opacity: ReturnType<typeof useTransform>;
  translateY: ReturnType<typeof useTransform>;
}) {
  return (
    <motion.section
      style={{ opacity, y: translateY }}
      className="relative flex min-h-screen items-center justify-center px-6 py-28"
    >
      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center gap-10 text-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="rounded-full border border-[#4A5943]/20 px-6 py-3 text-xs uppercase tracking-[0.3em] text-[#4A5943] dark:border-[#D4C4A8]/20 dark:text-[#D4C4A8]"
        >
          Living Network Wireframe
        </motion.div>
        <h1 className="text-5xl font-medium tracking-tight sm:text-6xl md:text-7xl">
          Credibility you can trust. Connections that matter.
        </h1>
        <p className="max-w-3xl text-lg text-[#2C2A27]/70 dark:text-[#E8E6DD]/70">
          Proofound brings proof-first collaboration to individuals, organizations, and governments
          with a living network visualization, explainable capability layers, and evidence-led
          matching.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Button className="h-auto rounded-full bg-[#4A5943] px-8 py-4 text-lg text-white shadow-lg transition hover:bg-[#4A5943]/90 dark:bg-[#D4C4A8] dark:text-[#1A1D2E] dark:hover:bg-[#D4784F]">
            Get early access
          </Button>
          <Button
            variant="outline"
            className="h-auto rounded-full border-[#2C2A27]/20 px-8 py-4 text-lg dark:border-white/20"
          >
            Watch walkthrough
          </Button>
        </div>
      </div>
    </motion.section>
  );
}

function PillarsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-150px' });

  return (
    <section ref={ref} className="relative z-10 px-6 py-24">
      <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
        {PILLARS.map((pillar, index) => (
          <motion.div
            key={pillar.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 30 }}
            transition={{ delay: index * 0.1, duration: 0.6 }}
            className="rounded-[2rem] border border-white/50 bg-white/70 p-8 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-[#2B241F]/80"
          >
            <div
              className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${pillar.accent}1A` }}
            >
              <Sparkles className="h-5 w-5" style={{ color: pillar.accent }} />
            </div>
            <h3 className="mb-3 text-xl font-semibold">{pillar.title}</h3>
            <p className="text-sm leading-relaxed text-[#2C2A27]/70 dark:text-[#E8E6DD]/70">
              {pillar.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function WhyItMattersSection() {
  return (
    <section className="relative z-10 px-6 py-24">
      <div className="mx-auto max-w-5xl rounded-[2.5rem] border border-[#7A9278]/30 bg-gradient-to-br from-[#7A9278]/10 via-[#C67B5C]/10 to-[#5C8B89]/10 p-10 backdrop-blur-xl dark:border-[#D4C4A8]/20 dark:from-[#4A5F52]/20 dark:via-[#D4784F]/15 dark:to-[#6FAAA0]/15">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-semibold">Why it matters</h2>
            <p className="mt-2 max-w-xl text-sm text-[#2C2A27]/70 dark:text-[#E8E6DD]/70">
              The Atlas unlocks promotion readiness, bias-aware talent mobility, and trusted partner
              collaboration by grounding every signal in verifiable, explainable evidence.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <LegendBadge color="#1C4D3A" label="Promotion readiness" />
            <LegendBadge color="#C76B4A" label="Internal mobility" />
            <LegendBadge color="#5F8C6F" label="Partner trust" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {PILLARS.map((pillar) => (
            <div
              key={pillar.title}
              className="rounded-2xl border border-white/60 bg-white/80 p-6 backdrop-blur dark:border-white/10 dark:bg-[#241F1B]/80"
            >
              <h4 className="mb-2 text-lg font-semibold">{pillar.title}</h4>
              <p className="text-sm text-[#2C2A27]/70 dark:text-[#E8E6DD]/70">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LegendBadge({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/40 bg-white/70 px-4 py-2 text-xs tracking-wide backdrop-blur dark:border-white/10 dark:bg-[#1F1A16]/70">
      <span className="inline-flex h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </div>
  );
}

function SolutionSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-150px' });

  return (
    <section ref={ref} className="relative z-10 px-6 py-24">
      <div className="mx-auto flex max-w-5xl flex-col gap-12 md:flex-row">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: inView ? 1 : 0, x: inView ? 0 : -40 }}
          transition={{ duration: 0.6 }}
          className="flex-1 space-y-4"
        >
          <h2 className="text-3xl font-semibold">Proof-first solution</h2>
          <p className="text-sm text-[#2C2A27]/70 dark:text-[#E8E6DD]/70">
            The Proofound Atlas is a credibility engine that blends narrative, structured data, and
            peer evidence into a living wireframe. Teams can zoom between individuals,
            organizations, and civic initiatives with consistent primitives.
          </p>
          <div className="space-y-3 text-sm">
            {SOLUTION_POINTS.map((point) => (
              <div key={point} className="flex gap-3">
                <span className="mt-1 text-[#C67B5C]">●</span>
                <span className="text-[#2C2A27]/75 dark:text-[#E8E6DD]/75">{point}</span>
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            className="mt-6 rounded-full border-[#2C2A27]/20 px-6 dark:border-white/20"
          >
            See the taxonomy map
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 60 }}
          transition={{ duration: 0.7 }}
          className="flex-1 rounded-[2rem] border border-white/50 bg-white/90 p-8 shadow-xl backdrop-blur dark:border-white/10 dark:bg-[#27221D]/85"
        >
          <div className="mb-6 flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-[#4A5943] dark:text-[#D4C4A8]">
            <span>Living Atlas</span>
          </div>
          <div className="grid gap-4 text-sm">
            <div className="rounded-2xl border border-[#7A9278]/30 bg-[#7A9278]/10 p-4 dark:border-[#5A8F6F]/30 dark:bg-[#5A8F6F]/15">
              <h4 className="mb-1 text-lg font-semibold text-[#4A5943] dark:text-[#D4C4A8]">
                Individual atlas view
              </h4>
              <p className="text-[#2C2A27]/70 dark:text-[#E8E6DD]/70">
                Narrative, quantitative signals, and living artifacts woven into explainable
                branches.
              </p>
            </div>
            <div className="rounded-2xl border border-[#C67B5C]/30 bg-[#C67B5C]/10 p-4 dark:border-[#D4784F]/30 dark:bg-[#D4784F]/15">
              <h4 className="mb-1 text-lg font-semibold text-[#8B4A31] dark:text-[#FFD0BE]">
                Organization atlas view
              </h4>
              <p className="text-[#2C2A27]/70 dark:text-[#E8E6DD]/70">
                Capability heatmaps, maturity dials, and evidence coverage across governance,
                delivery, and stewardship.
              </p>
            </div>
            <div className="rounded-2xl border border-[#5C8B89]/30 bg-[#5C8B89]/10 p-4 dark:border-[#6FAAA0]/30 dark:bg-[#6FAAA0]/15">
              <h4 className="mb-1 text-lg font-semibold text-[#3A6361] dark:text-[#C8F0EA]">
                Government lattice view
              </h4>
              <p className="text-[#2C2A27]/70 dark:text-[#E8E6DD]/70">
                Policy, civic missions, and oversight workflows linked through auditable,
                proof-bearing connections.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function EvidenceLegend() {
  const evidence = [
    'Self-claim',
    'Peer',
    'Artifact',
    'Assessment',
    'Certification',
    'Impact',
    'External',
  ];

  return (
    <section className="relative z-10 px-6 pb-24">
      <div className="mx-auto flex max-w-4xl flex-wrap gap-3 rounded-full border border-white/40 bg-white/80 px-6 py-4 text-xs tracking-wide backdrop-blur dark:border-white/10 dark:bg-[#241F1B]/80 dark:text-[#E8E6DD]">
        <span className="text-[#2C2A27]/60 dark:text-[#E8E6DD]/50">Evidence types:</span>
        {evidence.map((type) => (
          <span
            key={type}
            className="rounded-full border border-[#2C2A27]/10 bg-white/70 px-3 py-1 dark:border-white/15 dark:bg-[#1F1A16]/70"
          >
            {type}
          </span>
        ))}
      </div>
    </section>
  );
}

function AmbitionSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-150px' });

  return (
    <section ref={ref} className="relative z-10 px-6 py-24">
      <div className="mx-auto max-w-5xl rounded-[2.5rem] border border-white/60 bg-white/85 p-10 shadow-xl backdrop-blur dark:border-white/10 dark:bg-[#251F1B]/85">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-semibold">Ambition & pledges</h2>
          <p className="mt-2 text-sm text-[#2C2A27]/70 dark:text-[#E8E6DD]/70">
            Stewardship commitments that anchor Proofound as the credibility commons.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {AMBITION_ITEMS.map((item, idx) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 20 }}
              transition={{ delay: idx * 0.05, duration: 0.4 }}
              className="rounded-2xl border border-[#2C2A27]/10 bg-white/80 p-5 text-sm leading-relaxed dark:border-white/10 dark:bg-[#1F1A16]/80"
            >
              {item}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PaidFeaturesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-150px' });

  return (
    <section ref={ref} className="relative z-10 px-6 py-24">
      <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
        {PAID_FEATURES.map((feature, index) => (
          <motion.div
            key={feature.audience}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 40 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className="rounded-[2.5rem] border border-[#2C2A27]/10 bg-white/90 p-10 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-[#241F1B]/90"
          >
            <span className="mb-3 inline-flex rounded-full border border-[#2C2A27]/10 bg-[#F2EFE9] px-4 py-1 text-xs tracking-[0.2em] text-[#4A5943] dark:border-white/10 dark:bg-[#2E2722] dark:text-[#D4C4A8]">
              {feature.audience}
            </span>
            <h3 className="mb-3 text-2xl font-semibold">{feature.description}</h3>
            <ul className="mb-6 space-y-2 text-sm text-[#2C2A27]/70 dark:text-[#E8E6DD]/70">
              {feature.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-3">
                  <ArrowRight className="mt-1 h-4 w-4 text-[#C67B5C]" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
            <Button className="h-auto rounded-full bg-[#4A5943] px-6 py-3 text-sm text-white transition hover:bg-[#4A5943]/90 dark:bg-[#D4C4A8] dark:text-[#1A1D2E] dark:hover:bg-[#D4784F]">
              {feature.cta}
            </Button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function InspirationSection() {
  return (
    <section className="relative z-10 px-6 py-32">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 text-center">
        <motion.div
          animate={{ rotate: [0, 360], scale: [1, 1.05, 1] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          className="flex h-24 w-24 items-center justify-center rounded-full border border-[#7A9278]/30 bg-[#7A9278]/10 shadow-lg dark:border-[#5A8F6F]/20 dark:bg-[#5A8F6F]/10"
        >
          <Sparkles className="h-9 w-9 text-[#7A9278] dark:text-[#D4C4A8]" />
        </motion.div>
        <h2 className="text-4xl font-semibold">Built for credibility engineers.</h2>
        <p className="max-w-2xl text-base text-[#2C2A27]/70 dark:text-[#E8E6DD]/70">
          Proofound prototypes the future of trust infrastructure. From Japandi landing pages to zen
          operational hubs, every surface is a living wireframe you can ship.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button className="h-auto rounded-full bg-[#4A5943] px-7 py-3 text-base text-white hover:bg-[#4A5943]/90 dark:bg-[#D4C4A8] dark:text-[#1A1D2E] dark:hover:bg-[#D4784F]">
            Explore the wireframe routes
          </Button>
          <Button
            variant="outline"
            className="h-auto rounded-full border-[#2C2A27]/20 px-7 py-3 text-base dark:border-white/20"
          >
            Download the atlas deck
          </Button>
        </div>
      </div>
    </section>
  );
}

function FooterSection() {
  return (
    <footer className="relative z-10 mt-16 border-t border-[#2C2A27]/10 bg-white/90 px-6 py-16 backdrop-blur dark:border-white/10 dark:bg-[#1C1713]/90">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <h3 className="text-xl font-semibold">Proofound</h3>
          <p className="max-w-md text-sm text-[#2C2A27]/70 dark:text-[#E8E6DD]/70">
            Credibility engineering for individuals, organizations, and governments.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-sm text-[#2C2A27]/60 dark:text-[#E8E6DD]/60 md:text-right">
          <span>feedback@proofound.com</span>
          <span>Paired design + development wireframe</span>
        </div>
      </div>
    </footer>
  );
}
