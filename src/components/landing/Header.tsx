'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

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
          </Link>
        </motion.div>

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button
              className="w-10 h-10 rounded-full bg-proofound-forest/5 dark:bg-[#D4C4A8]/10 flex items-center justify-center hover:bg-proofound-forest/10 dark:hover:bg-[#D4C4A8]/20 transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5 text-proofound-forest dark:text-[#D4C4A8]" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="h-[80vh] rounded-t-3xl border-t border-proofound-forest/10 dark:border-[#D4C4A8]/10 bg-white/95 dark:bg-[#2a2a2a]/95 backdrop-blur-xl px-8 pt-12 pb-8"
          >
            <nav className="flex flex-col space-y-6">
              {['The Problem', 'How It Works', 'Principles', 'For Whom', 'Roadmap'].map(
                (item, idx) => (
                  <motion.a
                    key={item}
                    href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="block text-2xl font-medium text-foreground dark:text-[#D4C4A8] hover:text-proofound-forest dark:hover:text-white transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    {item}
                  </motion.a>
                )
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </motion.header>
  );
}
