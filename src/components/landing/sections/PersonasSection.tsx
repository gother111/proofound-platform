'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
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

  const personas = [
    {
      key: 'organization',
      title: 'For Organizations',
      outcomes: [
        'Publish a clear organization trust page before inviting anyone into review',
        'Create one structured assignment that explains the work and the bar',
        'Review proof-backed summaries that give stronger signal than CVs',
        'Keep review blind by default and ask for reveal only when there is real interest',
        'Move into identity-bearing reveal only with candidate consent',
      ],
      cta: 'Join as an Organization',
      onAction: onOrganizationSignup,
      visual: <OrganizationVisualization shouldReduceMotion={reduceMotion} />,
    },
    {
      key: 'individual',
      title: 'For Individuals',
      outcomes: [
        'Start with add proof, not complete your profile',
        'Structure work into a Proof Pack and publish a public proof portfolio on day one',
        'Share stronger signal than CV bullets without giving up review-stage privacy',
        'See that portfolio-ready is easy while intro-eligible requires stronger proof and trust',
        'Choose when identity-bearing reveal is allowed',
      ],
      cta: 'Join as an Individual',
      onAction: onIndividualSignup,
      visual: <CredentialVisualization shouldReduceMotion={reduceMotion} />,
    },
  ];

  return (
    <section
      id="personas"
      ref={ref}
      className="py-16 md:py-32 lg:py-40 px-6 md:px-12 relative bg-background overflow-hidden scroll-mt-24"
      data-testid="landing-personas-section"
    >
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
            One corridor, clear value on both sides
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 font-sans">
            Employer value comes early, but the entry action still starts with proof.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
          {personas.map((persona, idx) => {
            return (
              <motion.div
                key={persona.key}
                initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                animate={effectiveInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { duration: 0.65, delay: idx * 0.08, ease: [0.22, 1, 0.36, 1] }
                }
                className="relative bg-card/60 backdrop-blur-xl rounded-[3rem] border border-border shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col group"
              >
                <div className="p-10 lg:p-12 flex flex-col h-full">
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

                  <div className="flex-1 w-full relative mb-10 min-h-[240px] flex items-center justify-center">
                    <div className="absolute inset-0 bg-muted/30 rounded-[2.5rem] border border-border/60 shadow-inner overflow-hidden flex items-center justify-center transition-colors duration-500 group-hover:bg-muted/40">
                      <div className="w-full h-full flex items-center justify-center p-6 scale-95 origin-center transition-transform duration-700 ease-out group-hover:scale-100">
                        {persona.visual}
                      </div>
                    </div>
                  </div>

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
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
