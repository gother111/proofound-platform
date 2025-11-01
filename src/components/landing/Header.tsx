'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50 px-6 md:px-12 py-6"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <motion.div whileHover={{ scale: 1.02 }}>
          <Link href="/" className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="text-xl font-['Crimson_Pro'] text-[#1C4D3A] dark:text-[#D4C4A8]">
              Proofound
            </span>
          </Link>
        </motion.div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-10 h-10 rounded-full bg-[#1C4D3A]/5 dark:bg-[#D4C4A8]/10 flex items-center justify-center hover:bg-[#1C4D3A]/10 dark:hover:bg-[#D4C4A8]/20 transition-colors"
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <X className="w-5 h-5 text-[#1C4D3A] dark:text-[#D4C4A8]" />
          ) : (
            <Menu className="w-5 h-5 text-[#1C4D3A] dark:text-[#D4C4A8]" />
          )}
        </button>
      </div>

      {/* Menu Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-full left-0 right-0 mt-4 mx-6 md:mx-12 bg-white/95 dark:bg-[#2a2a2a]/95 backdrop-blur-xl rounded-3xl border border-[#1C4D3A]/10 dark:border-[#D4C4A8]/10 p-8 shadow-2xl"
          >
            <nav className="space-y-4">
              {['The Problem', 'How It Works', 'Principles', 'For Whom', 'Roadmap'].map(
                (item, idx) => (
                  <motion.a
                    key={item}
                    href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="block text-lg text-[#2D3330] dark:text-[#D4C4A8] hover:text-[#1C4D3A] dark:hover:text-white transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    {item}
                  </motion.a>
                )
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
