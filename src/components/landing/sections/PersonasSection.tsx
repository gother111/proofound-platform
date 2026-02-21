'use client';

import React, { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { MagneticButton } from '@/components/landing/MagneticButton';
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
  const [hoveredPanel, setHoveredPanel] = useState<'individual' | 'organization' | null>(null);

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
      id="personas"
      ref={ref}
      className="py-16 md:py-32 lg:py-40 px-6 md:px-12 relative bg-background overflow-hidden scroll-mt-24"
      data-testid="landing-personas-section"
    >
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-[60%] h-full bg-muted/30 -skew-x-12 translate-x-1/4 pointer-events-none blur-3xl" />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 30 }}
          animate={effectiveInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={
            reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 100, damping: 20 }
          }
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-foreground mb-6 tracking-tight text-balance">
            Built for you
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 font-sans">
            Whether you&apos;re an individual or an organization, Proofound empowers you.
          </p>

          {/* Mobile Segemented Tabs */}
          <div className="md:hidden inline-flex bg-card/50 backdrop-blur-sm rounded-full p-2 border border-border shadow-sm">
            <button
              onClick={() => setActivePersona('individual')}
              data-testid="landing-personas-toggle-individual"
              className={`px-6 py-3 rounded-full text-base font-medium transition-colors transition-shadow duration-300 ${
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
              className={`px-6 py-3 rounded-full text-base font-medium transition-colors transition-shadow duration-300 ${
                activePersona === 'organization'
                  ? 'bg-proofound-charcoal text-white shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Organizations
            </button>
          </div>
        </motion.div>

        {/* Mobile View Content */}
        <div className="md:hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePersona}
              initial={reduceMotion ? false : { opacity: 0, x: 20, filter: 'blur(5px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={reduceMotion ? undefined : { opacity: 0, x: -20, filter: 'blur(5px)' }}
              transition={
                reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 200, damping: 24 }
              }
              className="bg-card/60 backdrop-blur-xl rounded-[3rem] p-6 border border-border shadow-2xl flex flex-col gap-10 items-center"
            >
              <div className="flex-1 space-y-8 w-full">
                <h3
                  className="text-3xl font-serif text-foreground"
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
                      className="flex items-start gap-4"
                    >
                      <div className="w-6 h-6 rounded-full bg-extended-sage/20 flex items-center justify-center flex-shrink-0 mt-1">
                        <CheckCircle2 className="w-4 h-4 text-foreground" aria-hidden="true" />
                      </div>
                      <p className="text-lg text-muted-foreground leading-relaxed font-sans">
                        {outcome}
                      </p>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { delay: 0.5, type: 'spring', stiffness: 100, damping: 15 }
                  }
                >
                  <motion.div
                    whileTap={reduceMotion ? {} : { scale: 0.95 }}
                    className="inline-block w-full"
                  >
                    <MagneticButton
                      size="lg"
                      onClick={current.onAction}
                      className="rounded-full w-full py-7 text-lg shadow-lg font-sans group transition-all"
                    >
                      {current.cta}
                      <ArrowRight
                        className="ml-3 w-5 h-5 transition-transform"
                        aria-hidden="true"
                      />
                    </MagneticButton>
                  </motion.div>
                </motion.div>
              </div>

              {/* Visual Side - Persona-Specific Tile */}
              <div className="relative flex w-full flex-1 items-center justify-center overflow-hidden rounded-[2.5rem] border border-border bg-card/20 p-4 shadow-inner h-[300px]">
                {activePersona === 'individual' ? (
                  <CredentialVisualization shouldReduceMotion={reduceMotion} />
                ) : (
                  <OrganizationVisualization shouldReduceMotion={reduceMotion} />
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Desktop Uniform Cards (Elegant Alignment) */}
        <div className="hidden md:grid md:grid-cols-2 gap-6 lg:gap-8">
          {Object.entries(personas).map(([id, persona]) => {
            return (
              <div
                key={id}
                className="relative bg-card/60 backdrop-blur-xl rounded-[3rem] border border-border shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col group"
              >
                <div className="p-10 lg:p-12 flex flex-col h-full">
                  {/* Top Content: Title & Bullets */}
                  <div className="flex-none mb-10">
                    <h3 className="text-4xl lg:text-5xl font-serif text-foreground mb-8 text-balance">
                      {persona.title}
                    </h3>

                    <div className="space-y-6">
                      {persona.outcomes.map((outcome, idx) => (
                        <div key={idx} className="flex items-start gap-4">
                          <div className="w-6 h-6 rounded-full bg-extended-sage/20 flex items-center justify-center flex-shrink-0 mt-1">
                            <CheckCircle2 className="w-4 h-4 text-foreground" aria-hidden="true" />
                          </div>
                          <p className="text-lg text-muted-foreground leading-relaxed font-sans pr-4">
                            {outcome}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Middle: Elegant Visualization Block */}
                  <div className="flex-1 w-full relative mb-10 min-h-[240px] flex items-center justify-center">
                    <div className="absolute inset-0 bg-muted/30 rounded-[2.5rem] border border-border/60 shadow-inner overflow-hidden flex items-center justify-center transition-colors duration-500 group-hover:bg-muted/40">
                      <div className="w-full h-full flex items-center justify-center p-6 scale-95 origin-center transition-transform duration-700 ease-out group-hover:scale-100">
                        {id === 'individual' ? (
                          <CredentialVisualization shouldReduceMotion={reduceMotion} />
                        ) : (
                          <OrganizationVisualization shouldReduceMotion={reduceMotion} />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom: CTA Button */}
                  <div className="flex-none">
                    <MagneticButton
                      size="lg"
                      onClick={persona.onAction}
                      className="rounded-full px-8 py-7 text-lg shadow-lg hover:shadow-xl font-sans group-button transition-all w-fit"
                    >
                      {persona.cta}
                      <ArrowRight
                        className="ml-3 w-5 h-5 transition-transform group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </MagneticButton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
