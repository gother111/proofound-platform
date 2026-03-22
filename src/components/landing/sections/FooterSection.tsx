'use client';

import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';

interface FooterSectionProps {
  shouldReduceMotion?: boolean;
}

export function FooterSection({ shouldReduceMotion = false }: FooterSectionProps) {
  return (
    <footer className="w-full bg-card border-t border-border py-16 relative z-10">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center md:items-start justify-between gap-12">
        <div className="flex flex-col items-center md:items-start gap-4">
          <Link href="/" aria-label="Proofound home" className="mb-2">
            <Logo size="sm" />
          </Link>
          <p className="text-sm text-muted-foreground max-w-xs text-center md:text-left">
            An upstream hiring credibility layer. <br />
            Hire through proof, not profile theater.
          </p>
          <div className="text-sm text-muted-foreground/60 mt-4">
            © {new Date().getFullYear()} Proofound, Inc.
          </div>
        </div>

        <nav className="flex flex-wrap items-center justify-center md:justify-end gap-x-8 gap-y-4">
          <Link
            href="/about"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Contact
          </Link>
          <Link
            href="/support"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Support
          </Link>
          <Link
            href="/privacy"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Terms
          </Link>
          <Link
            href="/login"
            className="text-sm text-foreground font-medium hover:text-proofound-terracotta transition-colors"
          >
            Sign in
          </Link>
        </nav>
      </div>
    </footer>
  );
}
