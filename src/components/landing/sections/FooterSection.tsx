'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Twitter, Linkedin, Github, Mail, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FooterSectionProps {
  shouldReduceMotion?: boolean | null;
}

export function FooterSection({ shouldReduceMotion }: FooterSectionProps) {
  const reduceMotion = !!shouldReduceMotion;
  const currentYear = new Date().getFullYear();

  const links = {
    platform: [
      { label: 'How it Works', href: '#how-it-works' },
      { label: 'Principles', href: '#principles' },
      { label: 'For Individuals', href: '#personas' },
      { label: 'For Organizations', href: '#personas' },
    ],
    company: [
      { label: 'About Us', href: '/about' },
      { label: 'Manifesto', href: '/manifesto' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact' },
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
      {/* Watermark */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[20%] pointer-events-none select-none opacity-[0.02] whitespace-nowrap">
        <span className="text-[30vw] font-display font-bold text-white leading-none tracking-tighter">
          Proofound
        </span>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid md:grid-cols-12 gap-12 mb-24">
          <div className="md:col-span-5 space-y-8">
            <Link href="/" className="inline-block" aria-label="Proofound home">
              <Image
                src="/logo.png"
                alt="Proofound"
                width={120}
                height={48}
                className="h-12 w-auto brightness-0 invert opacity-90"
              />
            </Link>
            <p className="text-white/60 leading-relaxed font-sans text-lg max-w-md">
              Credibility engineering for a world that needs trust more than ever. We build the
              infrastructure for verifiable professional reputation.
            </p>
            <div className="flex gap-4 pt-4">
              {[
                { icon: Twitter, href: '#', label: 'Twitter' },
                { icon: Linkedin, href: '#', label: 'LinkedIn' },
                { icon: Github, href: '#', label: 'GitHub' },
                { icon: Mail, href: 'mailto:hello@proofound.io', label: 'Email' },
              ].map((social, idx) => (
                <motion.a
                  key={idx}
                  href={social.href}
                  aria-label={social.label}
                  title={social.label}
                  whileHover={reduceMotion ? undefined : { scale: 1.15, rotate: [-5, 5, 0] }}
                  whileTap={reduceMotion ? undefined : { scale: 0.95 }}
                  className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white hover:text-foreground transition-colors duration-300 group"
                >
                  <span className="sr-only">{social.label}</span>
                  <social.icon className="w-5 h-5" aria-hidden="true" />
                </motion.a>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 md:col-start-7">
            <h4 className="text-lg font-display mb-8 text-white">Platform</h4>
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
            <h4 className="text-lg font-display mb-8 text-white">Company</h4>
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
            <h4 className="text-lg font-display mb-8 text-white">Legal</h4>
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

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-white/30 text-sm font-sans">
            &copy; {currentYear} Proofound Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-2 h-2 rounded-full bg-green-500',
                  reduceMotion ? '' : 'animate-pulse'
                )}
              />
              <span className="text-white/40 text-sm font-sans">All Systems Operational</span>
            </div>
            <p className="text-white/30 text-sm font-sans text-center leading-snug">
              Designed with
              <br />
              <span className="text-japandi-terracotta">♥</span>
              <br />
              in Stockholm
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
