'use client';

import React, { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import CredentialVisualization from '@/components/landing/visuals/CredentialVisualization';
import OrganizationVisualization from '@/components/landing/visuals/OrganizationVisualization';

interface PersonasSectionProps {
  shouldReduceMotion?: boolean | null;
  onIndividualSignup?: () => void;
  onOrganizationSignup?: () => void;
}

export function PersonasSection({
  shouldReduceMotion,
  onIndividualSignup,
  onOrganizationSignup,
}: PersonasSectionProps) {
  const reduceMotion = Boolean(shouldReduceMotion);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const effectiveInView = reduceMotion ? true : isInView;
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
      image: '/images/individual-persona.jpg', // Placeholder
    },
    organization: {
      title: 'For Organizations',
      outcomes: [
        'Discover talent based on evidence and alignment, not resumes',
        'Reduce bias in hiring and partnership decisions',
        'Build trust with transparent verification and matching',
      ],
      cta: 'Join as an Organization',
      onAction: onOrganizationSignup,
      image: '/images/org-persona.jpg', // Placeholder
    },
  };

  const current = personas[activePersona];

  return (
    <section
      id="for-whom"
      ref={ref}
      className="py-32 px-6 md:px-12 relative bg-background overflow-hidden scroll-mt-24"
      data-testid="landing-personas-section"
    >
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-[60%] h-full bg-muted/30 -skew-x-12 translate-x-1/4 pointer-events-none blur-3xl" />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 30 }}
          animate={effectiveInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-serif text-foreground mb-6 tracking-tight">
            Built for you
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 font-sans">
            Whether you&apos;re an individual or an organization, Proofound empowers you.
          </p>

          {/* Persona Toggle */}
          <div className="inline-flex bg-card/50 backdrop-blur-sm rounded-full p-2 border border-border shadow-sm">
            <button
              onClick={() => setActivePersona('individual')}
              data-testid="landing-personas-toggle-individual"
              className={`px-10 py-4 rounded-full text-base font-medium transition-colors transition-shadow duration-300 ${
                activePersona === 'individual'
                  ? 'bg-proofound-charcoal text-white shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Individuals
            </button>
            <button
              onClick={() => setActivePersona('organization')}
              data-testid="landing-personas-toggle-organization"
              className={`px-10 py-4 rounded-full text-base font-medium transition-colors transition-shadow duration-300 ${
                activePersona === 'organization'
                  ? 'bg-proofound-charcoal text-white shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Organizations
            </button>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activePersona}
            initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -20, scale: 0.98 }}
            transition={
              reduceMotion ? { duration: 0 } : { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
            }
            className="bg-card/60 backdrop-blur-xl rounded-[3rem] p-8 md:p-16 border border-border shadow-2xl flex flex-col md:flex-row gap-16 items-center"
          >
            <div className="flex-1 space-y-10">
              <h3
                className="text-4xl md:text-5xl font-serif text-foreground"
                data-testid="landing-persona-title"
              >
                {current.title}
              </h3>

              <div className="space-y-6">
                {current.outcomes.map((outcome, idx) => (
                  <motion.div
                    key={idx}
                    initial={reduceMotion ? false : { opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={reduceMotion ? { duration: 0 } : { delay: idx * 0.1 + 0.2 }}
                    className="flex items-start gap-5"
                  >
                    <div className="w-6 h-6 rounded-full bg-extended-sage/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <CheckCircle2 className="w-4 h-4 text-foreground" aria-hidden="true" />
                    </div>
                    <p className="text-xl text-muted-foreground leading-relaxed font-sans">
                      {outcome}
                    </p>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduceMotion ? { duration: 0 } : { delay: 0.5 }}
              >
                <Button
                  size="lg"
                  onClick={current.onAction}
                  className="rounded-full px-10 py-8 text-lg shadow-lg hover:shadow-xl font-sans"
                >
                  {current.cta}
                  <ArrowRight className="ml-3 w-5 h-5" aria-hidden="true" />
                </Button>
              </motion.div>
            </div>

            {/* Visual Side - Persona-Specific Tile */}
            <div className="relative flex w-full flex-1 items-center justify-center overflow-hidden rounded-[2.5rem] border border-border bg-card/20 p-4 shadow-inner md:h-[500px] md:aspect-auto md:p-6">
              {activePersona === 'individual' ? (
                <CredentialVisualization shouldReduceMotion={reduceMotion} />
              ) : (
                <OrganizationVisualization shouldReduceMotion={reduceMotion} />
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
