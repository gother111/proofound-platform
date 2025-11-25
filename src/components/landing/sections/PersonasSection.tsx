'use client';

import React, { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight } from 'lucide-react';

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
      image: '/images/individual-persona.jpg', // Placeholder
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
      image: '/images/org-persona.jpg', // Placeholder
    },
  };

  const current = personas[activePersona];

  return (
    <section
      id="for-whom"
      ref={ref}
      className="py-32 px-6 md:px-12 relative bg-[#F7F6F1] overflow-hidden"
    >
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-[60%] h-full bg-[#E8E6DE]/30 -skew-x-12 translate-x-1/4 pointer-events-none blur-3xl" />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-serif text-[#2D3330] mb-6 tracking-tight">
            Built for you
          </h2>
          <p className="text-xl md:text-2xl text-[#2D3330]/80 mb-12 font-sans">
            Whether you&apos;re an individual or an organization, Proofound empowers you.
          </p>

          {/* Persona Toggle */}
          <div className="inline-flex bg-white/50 backdrop-blur-sm rounded-full p-2 border border-white/60 shadow-sm">
            <button
              onClick={() => setActivePersona('individual')}
              className={`px-10 py-4 rounded-full text-base font-medium transition-all duration-300 ${
                activePersona === 'individual'
                  ? 'bg-[#2D3330] text-white shadow-md'
                  : 'text-[#2D3330]/60 hover:text-[#2D3330]'
              }`}
            >
              Individuals
            </button>
            <button
              onClick={() => setActivePersona('organization')}
              className={`px-10 py-4 rounded-full text-base font-medium transition-all duration-300 ${
                activePersona === 'organization'
                  ? 'bg-[#2D3330] text-white shadow-md'
                  : 'text-[#2D3330]/60 hover:text-[#2D3330]'
              }`}
            >
              Organizations
            </button>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activePersona}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white/40 backdrop-blur-xl rounded-[3rem] p-8 md:p-16 border border-white/50 shadow-2xl flex flex-col md:flex-row gap-16 items-center"
          >
            <div className="flex-1 space-y-10">
              <h3 className="text-4xl md:text-5xl font-serif text-[#2D3330]">{current.title}</h3>

              <div className="space-y-6">
                {current.outcomes.map((outcome, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 + 0.2 }}
                    className="flex items-start gap-5"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#94A89A]/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <CheckCircle2 className="w-4 h-4 text-[#2D3330]" />
                    </div>
                    <p className="text-xl text-[#2D3330]/80 leading-relaxed font-sans">{outcome}</p>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  size="lg"
                  onClick={current.onAction}
                  className="rounded-full px-10 py-8 text-lg bg-[#C17F59] hover:bg-[#A66A47] text-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  {current.cta}
                  <ArrowRight className="ml-3 w-5 h-5" />
                </Button>
              </motion.div>
            </div>

            {/* Visual Side - Abstract Representation */}
            <div className="flex-1 w-full aspect-square md:aspect-auto md:h-[500px] relative bg-white/20 rounded-[2.5rem] overflow-hidden shadow-inner border border-white/30 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-[#94A89A]/10 to-[#C17F59]/10" />
              {/* Animated Circles */}
              <motion.div
                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                className="w-64 h-64 bg-[#94A89A]/20 rounded-full blur-3xl absolute top-1/4 left-1/4 mix-blend-multiply"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, -5, 0] }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                className="w-80 h-80 bg-[#C17F59]/20 rounded-full blur-3xl absolute bottom-1/4 right-1/4 mix-blend-multiply"
              />

              <div className="relative z-10 text-center p-12 backdrop-blur-sm bg-white/10 rounded-3xl border border-white/20 shadow-lg max-w-xs">
                <p className="font-serif text-3xl text-[#2D3330] italic leading-tight">
                  {activePersona === 'individual' ? 'Your journey, verified.' : 'Trust at scale.'}
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
