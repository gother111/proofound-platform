'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Menu } from 'lucide-react';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 md:px-12 py-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105">
          <div className="w-7 h-7">
            <CheckCircle className="w-7 h-7 text-brand-sage" strokeWidth={2} />
          </div>
          <span className="text-xl font-display text-brand-sage">Proofound</span>
        </Link>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-10 h-10 rounded-full bg-brand-sage/5 hover:bg-brand-sage/10 flex items-center justify-center transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5 text-brand-sage" />
        </button>
      </div>

      {/* Menu Overlay */}
      {menuOpen && (
        <div className="absolute top-full left-6 right-6 md:left-12 md:right-12 mt-4 bg-white/95 backdrop-blur-xl rounded-3xl border border-brand-sage/10 p-8 shadow-2xl">
          <nav className="flex flex-col gap-4">
            <a
              href="#the-problem"
              onClick={() => setMenuOpen(false)}
              className="text-lg text-fg-base hover:text-brand-sage transition-colors"
            >
              The Problem
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMenuOpen(false)}
              className="text-lg text-fg-base hover:text-brand-sage transition-colors"
            >
              How It Works
            </a>
            <a
              href="#principles"
              onClick={() => setMenuOpen(false)}
              className="text-lg text-fg-base hover:text-brand-sage transition-colors"
            >
              Principles
            </a>
            <a
              href="#for-whom"
              onClick={() => setMenuOpen(false)}
              className="text-lg text-fg-base hover:text-brand-sage transition-colors"
            >
              For Whom
            </a>
            <a
              href="#roadmap"
              onClick={() => setMenuOpen(false)}
              className="text-lg text-fg-base hover:text-brand-sage transition-colors"
            >
              Roadmap
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
