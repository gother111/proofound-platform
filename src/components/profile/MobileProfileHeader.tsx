'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface MobileProfileHeaderProps {
  name: string;
  avatarUrl?: string | null;
  tagline?: string | null;
}

export function MobileProfileHeader({ name, avatarUrl, tagline }: MobileProfileHeaderProps) {
  const { scrollY } = useScroll();

  // Fade in the header after scrolling past the hero section (approx 200px)
  const headerOpacity = useTransform(scrollY, [150, 250], [0, 1]);
  const headerY = useTransform(scrollY, [150, 250], [-20, 0]);

  return (
    <motion.div
      style={{ opacity: headerOpacity, y: headerY }}
      className="fixed top-14 left-0 right-0 z-40 lg:hidden px-4 py-3 bg-white/70 dark:bg-stone-900/60 backdrop-blur-md border-b border-black/5 dark:border-white/5 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <Avatar className="w-10 h-10 border border-black/5 dark:border-white/10">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={name} className="object-cover" />}
          <AvatarFallback className="bg-extended-sage/20 text-extended-sage text-sm font-medium">
            {name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h2 className="font-display font-semibold text-sm truncate text-proofound-charcoal dark:text-foreground">
            {name}
          </h2>
          {tagline && <p className="text-xs text-muted-foreground truncate">{tagline}</p>}
        </div>
      </div>
    </motion.div>
  );
}
