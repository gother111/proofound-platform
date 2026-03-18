'use client';

import React from 'react';
import Link from 'next/link';
import { Mail } from 'lucide-react';

interface FooterSectionProps {
  shouldReduceMotion?: boolean | null;
}

export function FooterSection({ shouldReduceMotion }: FooterSectionProps) {
  const currentYear = new Date().getFullYear();

  const links = {
    platform: [
      { label: 'How it Works', href: '#how-it-works' },
      { label: 'For Organizations', href: '#personas' },
      { label: 'Trust & Privacy', href: '#proof' },
      { label: 'Get Started', href: '/signup' },
    ],
    company: [
      { label: 'About Us', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Support', href: '/support' },
    ],
    legal: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
    ],
  };

  return (
    <footer
      className="bg-japandi-charcoal text-white pt-32 pb-12 px-6 md:px-12 border-t border-white/5 relative overflow-hidden"
      data-testid="landing-footer-section"
    >
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[20%] pointer-events-none select-none opacity-[0.02] whitespace-nowrap">
        <span className="text-[30vw] font-display font-bold text-white leading-none tracking-tighter">
          Proofound
        </span>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid md:grid-cols-12 gap-12 mb-24">
          <div className="md:col-span-5 space-y-8">
            <Link href="/" className="inline-block" aria-label="Proofound home">
              <img
                src="/logo.png"
                alt="Proofound"
                width={120}
                height={48}
                loading="eager"
                decoding="async"
                className="h-12 w-auto brightness-0 invert opacity-90"
              />
            </Link>
            <p className="text-white/60 leading-relaxed font-sans text-lg max-w-md">
              Proof-backed review for a hiring corridor that starts with Proof Packs, stays blind by
              default, and moves into identity-bearing reveal only with candidate consent.
            </p>
            <a
              href="mailto:hello@proofound.io"
              aria-label="Email"
              title="Email"
              className="inline-flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white/80 transition-colors duration-300 hover:bg-white hover:text-foreground"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              hello@proofound.io
            </a>
          </div>

          <div className="md:col-span-2 md:col-start-7">
            <h3 className="text-lg font-display mb-8 text-white">Platform</h3>
            <ul className="space-y-4 font-sans">
              {links.platform.map((link, idx) => (
                <li key={idx}>
                  <Link
                    href={link.href}
                    className="text-white/50 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <span className="relative overflow-hidden">
                      <span className="inline-block transition-transform duration-300 group-hover:-translate-y-full">
                        {link.label}
                      </span>
                      <span className="absolute top-0 left-0 inline-block transition-transform duration-300 translate-y-full group-hover:translate-y-0">
                        {link.label}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <h3 className="text-lg font-display mb-8 text-white">Company</h3>
            <ul className="space-y-4 font-sans">
              {links.company.map((link, idx) => (
                <li key={idx}>
                  <Link
                    href={link.href}
                    className="text-white/50 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <span className="relative overflow-hidden">
                      <span className="inline-block transition-transform duration-300 group-hover:-translate-y-full">
                        {link.label}
                      </span>
                      <span className="absolute top-0 left-0 inline-block transition-transform duration-300 translate-y-full group-hover:translate-y-0">
                        {link.label}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <h3 className="text-lg font-display mb-8 text-white">Legal</h3>
            <ul className="space-y-4 font-sans">
              {links.legal.map((link, idx) => (
                <li key={idx}>
                  <Link
                    href={link.href}
                    className="text-white/50 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <span className="relative overflow-hidden">
                      <span className="inline-block transition-transform duration-300 group-hover:-translate-y-full">
                        {link.label}
                      </span>
                      <span className="absolute top-0 left-0 inline-block transition-transform duration-300 translate-y-full group-hover:translate-y-0">
                        {link.label}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-6 border-t border-white/10 pt-8 md:flex-row">
          <p className="text-white/30 text-sm font-sans">
            &copy; {currentYear} Proofound Inc. All rights reserved.
          </p>
          <p className="text-center text-sm leading-snug text-white/30 font-sans">Stockholm</p>
        </div>
      </div>
    </footer>
  );
}
